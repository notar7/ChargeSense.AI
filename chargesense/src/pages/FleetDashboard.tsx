import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Truck, AlertTriangle, CheckCircle, Zap, Search, Activity, MapPin, BatteryCharging } from 'lucide-react';
import { api, type Vehicle } from '../services/api';

const CITY_COORDINATES: { [key: string]: [number, number] } = {
  "Mumbai":    [19.076, 72.877],
  "Delhi":     [28.679, 77.213],
  "Chennai":   [13.082, 80.270],
  "Kolkata":   [22.572, 88.363],
  "Pune":      [18.520, 73.856],
  "Bangalore": [12.971, 77.594],
  "Hyderabad": [17.385, 78.486],
  "Ahmedabad": [23.022, 72.571],
  "Jaipur":    [26.912, 75.787],
  "Surat":     [21.170, 72.831]
};

export default function FleetDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [degradationHistory, setDegradationHistory] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [showOnlyCritical, setShowOnlyCritical] = useState(false);
  const [tableFilter, setTableFilter] = useState<'alerts' | 'all'>('alerts');
  
  // Real-time ticking counter values
  const [co2Saved, setCo2Saved] = useState(0);

  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<{ [id: string]: L.CircleMarker }>({});

  // 1. Initial Data Fetch
  useEffect(() => {
    async function loadInitialData() {
      try {
        const overviewData = await api.getFleetOverview();
        setOverview(overviewData);
        setCo2Saved(overviewData.co2_saved);

        const vehiclesList = await api.getFleetVehicles();
        setVehicles(vehiclesList);
        setFilteredVehicles(vehiclesList);

        if (vehiclesList.length > 0) {
          // Select Mumbai or first critical vehicle as default
          const defaultVehicle = vehiclesList.find(v => v.status === 'Critical') || vehiclesList[0];
          setSelectedVehicle(defaultVehicle);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Real-Time CO2 Counter Tick (Increments by 0.000405 tonnes every 100ms)
  useEffect(() => {
    if (co2Saved === 0) return;
    const timer = setInterval(() => {
      setCo2Saved((prev) => prev + 0.000405);
    }, 100);
    return () => clearInterval(timer);
  }, [co2Saved]);

  // 3. Fetch Single Vehicle Detail on selection
  useEffect(() => {
    if (!selectedVehicle) return;

    async function loadVehicleDetails() {
      setChartLoading(true);
      try {
        const detail = await api.getVehicleDetail(selectedVehicle.id);
        setDegradationHistory(detail.degradation_history);
      } catch (err) {
        console.error(`Error loading details for vehicle ${selectedVehicle.id}:`, err);
      } finally {
        setChartLoading(false);
      }
    }
    loadVehicleDetails();
  }, [selectedVehicle]);

  // 4. Initialize Map when loading is complete and DOM container exists
  useEffect(() => {
    if (loading) return;

    if (!mapRef.current) {
      const mapContainer = document.getElementById('fleet-map');
      if (!mapContainer) return;

      const indiaBounds = L.latLngBounds([5.0, 65.0], [38.0, 98.0]);

      const map = L.map('fleet-map', {
        center: [22.0, 78.0],
        zoom: 4.8,
        minZoom: 4.5,
        maxZoom: 12,
        maxBounds: indiaBounds,
        maxBoundsViscosity: 1.0,
        zoomControl: true,
      });

      // CartoDB Dark Matter map tile setup for a premium sci-fi telemetry aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
      }).addTo(map);

      mapRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, [loading]);

  // 5. Redraw Map Markers when vehicles list or filters change
  useEffect(() => {
    if (loading) return;
    if (!markersGroupRef.current || !mapRef.current) return;
    
    // Clear old markers and references
    markersGroupRef.current.clearLayers();
    markerRefs.current = {};

    filteredVehicles.forEach((vehicle) => {
      const markerColor = 
        vehicle.color === 'green' ? '#10B981' : 
        vehicle.color === 'yellow' ? '#F59E0B' : '#EF4444';

      const isSelected = selectedVehicle && selectedVehicle.id === vehicle.id;

      const marker = L.circleMarker([vehicle.lat, vehicle.lng], {
        radius: isSelected ? 9 : 4.5,
        fillColor: markerColor,
        color: isSelected ? '#06B6D4' : '#ffffff', // Cyan border for selected marker
        weight: isSelected ? 2.5 : 1.0,
        opacity: isSelected ? 1.0 : 0.75,
        fillOpacity: isSelected ? 1.0 : 0.8,
      });

      // Tooltip HTML with custom styles
      marker.bindTooltip(
        `<div class="font-sans text-xs p-1">
          <strong class="text-slate-900">${vehicle.id}</strong><br/>
          <span class="text-slate-500 font-medium">Model: ${vehicle.brand} ${vehicle.model}</span><br/>
          <span class="text-slate-500 font-medium">SOH: </span><strong class="${vehicle.color === 'red' ? 'text-red-600' : vehicle.color === 'yellow' ? 'text-amber-600' : 'text-emerald-600'} font-mono">${vehicle.soh}%</strong><br/>
          <span class="text-slate-500 font-medium">Location: ${vehicle.city}</span>
        </div>`,
        { direction: 'top', offset: [0, -5], opacity: 0.95 }
      );

      marker.on('click', () => {
        setSelectedVehicle(vehicle);
        // Focus camera on selected vehicle
        mapRef.current?.setView([vehicle.lat, vehicle.lng], 8.5, { animate: true });
      });

      markersGroupRef.current?.addLayer(marker);
      markerRefs.current[vehicle.id] = marker;
    });
  }, [filteredVehicles, loading, selectedVehicle]);

  // 6. Search and Filter Handler
  useEffect(() => {
    let result = vehicles;

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        v => v.id.toLowerCase().includes(query) || 
             v.model.toLowerCase().includes(query) ||
             v.brand.toLowerCase().includes(query)
      );
    }

    if (cityFilter !== 'All') {
      result = result.filter(v => v.city === cityFilter);
    }

    if (showOnlyCritical) {
      result = result.filter(v => v.status === 'Critical');
    }

    setFilteredVehicles(result);
  }, [searchTerm, cityFilter, showOnlyCritical, vehicles]);

  // 6.5 Auto-select default vehicle when filteredVehicles list updates
  useEffect(() => {
    if (filteredVehicles.length > 0) {
      const isStillPresent = filteredVehicles.some(v => v.id === selectedVehicle?.id);
      if (!isStillPresent) {
        const newDefault = filteredVehicles.find(v => v.status === 'Critical') || filteredVehicles[0];
        setSelectedVehicle(newDefault);
      }
    } else {
      setSelectedVehicle(null);
    }
  }, [filteredVehicles]);

  // 7. Auto Zoom map when city selection changes
  useEffect(() => {
    if (loading || !mapRef.current) return;

    if (cityFilter === 'All') {
      // Zoom out to national view
      mapRef.current.setView([22.0, 78.0], 4.8, { animate: true });
    } else {
      const coords = CITY_COORDINATES[cityFilter];
      if (coords) {
        // Zoom in to the selected city's coordinate cluster
        mapRef.current.setView(coords, 8.5, { animate: true });
      }
    }
  }, [cityFilter, loading]);

  // Centering camera helper
  const handleFocusOnMap = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    if (mapRef.current) {
      mapRef.current.setView([vehicle.lat, vehicle.lng], 9.5, { animate: true });
      // Scroll smoothly to map container
      document.getElementById('fleet-map')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getTableVehicles = () => {
    if (tableFilter === 'alerts') {
      const alerts = filteredVehicles.filter(v => v.status === 'Critical' || v.status === 'Attention');
      return alerts.sort((a, b) => {
        if (a.status === 'Critical' && b.status !== 'Critical') return -1;
        if (a.status !== 'Critical' && b.status === 'Critical') return 1;
        return a.soh - b.soh;
      });
    } else {
      return [...filteredVehicles].sort((a, b) => {
        const rank = (status: string) => status === 'Critical' ? 0 : status === 'Attention' ? 1 : 2;
        if (rank(a.status) !== rank(b.status)) {
          return rank(a.status) - rank(b.status);
        }
        return a.soh - b.soh;
      });
    }
  };

  // 8. Auto Fit Map to Critical Vehicles when showOnlyCritical is activated
  useEffect(() => {
    if (loading || !mapRef.current || !showOnlyCritical) return;

    if (filteredVehicles.length > 0) {
      const bounds = L.latLngBounds(filteredVehicles.map(v => [v.lat, v.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 9.5 });
    }
  }, [showOnlyCritical, loading]);

  const uniqueCities = Array.from(new Set(vehicles.map(v => v.city))).sort();

  // Dynamic calculations for KPIs based on filtered vehicles
  const displayFleetSize = filteredVehicles.length;
  
  const displayAvgSoh = filteredVehicles.length > 0
    ? parseFloat((filteredVehicles.reduce((sum, v) => sum + v.soh, 0) / filteredVehicles.length).toFixed(1))
    : 81.3;

  const displayAlertsCount = filteredVehicles.filter(v => v.status === 'Critical').length;

  const displayCo2Saved = vehicles.length > 0
    ? co2Saved * (filteredVehicles.length / vehicles.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-slate-500 font-mono text-sm">
        <Activity className="animate-spin h-5 w-5 mr-3 text-cyan-600" />
        LOADING SECURE TELEMETRY FEEDS...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
            Fleet Intelligence Dashboard
          </h1>
          <p className="text-[0.65rem] text-slate-500 font-mono tracking-widest mt-1 uppercase">
            500 Active Assets | Predictive ML Engine Connected
          </p>
        </div>
        
        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search EV ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 w-44 md:w-56"
            />
          </div>
          
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="All">All Cities</option>
            {uniqueCities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 KPI Cards in Light Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="light-card p-5 relative overflow-hidden">
          <span className="text-[0.6rem] font-bold text-slate-500 font-mono tracking-widest uppercase mb-1 block">ACTIVE FLEET SIZE</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{displayFleetSize}</span>
            <span className="text-xs font-semibold text-emerald-600 font-mono">| {((displayFleetSize / 500) * 100).toFixed(0)}% of Fleet</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[0.7rem] font-semibold text-slate-500 border-t border-slate-100 pt-3">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            {cityFilter === 'All' ? 'ALL REGIONS OPERATIONAL' : `${cityFilter.toUpperCase()} FLEET ACTIVE`}
          </div>
        </div>

        <div className="light-card p-5 relative overflow-hidden">
          <span className="text-[0.6rem] font-bold text-slate-500 font-mono tracking-widest uppercase mb-1 block">AVG BATTERY SOH</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{displayAvgSoh}%</span>
            <span className="text-xs font-semibold text-cyan-600 font-mono">OPTIMAL</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-200/50">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-500" 
              style={{ width: `${displayAvgSoh}%` }}
            />
          </div>
        </div>

        <div 
          onClick={() => {
            setShowOnlyCritical(!showOnlyCritical);
            // Reset search term when toggling to avoid empty results
            if (!showOnlyCritical) setSearchTerm('');
          }}
          className={`light-card p-5 relative overflow-hidden cursor-pointer transition-all duration-200 border ${
            showOnlyCritical 
              ? 'bg-red-50/80 border-red-300 shadow-sm shadow-red-100 ring-2 ring-red-500/10' 
              : 'hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <span className="text-[0.6rem] font-bold text-slate-500 font-mono tracking-widest uppercase mb-1 block">ALERT VECTORS</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-600 font-mono">{displayAlertsCount}</span>
            <span className="text-xs font-semibold text-red-500/80 font-mono">
              {showOnlyCritical ? 'FILTER ON' : 'CRITICAL'}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[0.7rem] font-semibold text-red-600 border-t border-slate-100 pt-3">
            <AlertTriangle className={`h-4 w-4 text-red-500 ${showOnlyCritical ? 'animate-bounce' : 'animate-pulse'}`} />
            {showOnlyCritical ? 'CLICK TO RESET FILTER' : 'CLICK TO FILTER CRITICAL MAP VECTORS'}
          </div>
        </div>

        <div className="light-card p-5 relative overflow-hidden">
          <span className="text-[0.6rem] font-bold text-slate-500 font-mono tracking-widest uppercase mb-1 block">CARBON MITIGATION</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{displayCo2Saved.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">CO₂ TONNES</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[0.7rem] font-semibold text-emerald-600 border-t border-slate-100 pt-3">
            <Zap className="h-4 w-4 text-emerald-500" />
            REAL-TIME ACCRUAL
          </div>
        </div>
      </div>

      {/* Grid Content: Leaflet Map (Left) and ML Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Leaflet Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-600" />
              India EV Telemetry Map
            </h3>
            <span className="text-[0.65rem] font-mono text-slate-500">
              Filtered: {displayFleetSize} / 500
            </span>
          </div>

          {/* Map Container */}
          <div className="light-card overflow-hidden h-[420px] relative z-0">
            <div id="fleet-map" className="w-full h-full" />
            
            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-xl shadow-lg flex flex-col gap-2 pointer-events-none">
              <span className="text-[0.6rem] font-bold text-slate-500 font-mono tracking-wider uppercase border-b border-slate-100 pb-1 block">
                BATTERY STATE (SOH)
              </span>
              <div className="flex flex-col gap-1.5 font-mono text-[0.6rem] text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] inline-block border border-white" />
                  <span>ACTIVE (&gt;= 80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] inline-block border border-white" />
                  <span>ATTENTION (65% - 80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444] inline-block border border-white" />
                  <span>CRITICAL (&lt; 65%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Battery Detail Curve (5 cols) */}
        <div className="lg:col-span-5 light-card p-5 flex flex-col justify-between min-h-[420px]">
          {selectedVehicle ? (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
                  <div>
                    <span className="text-[0.65rem] font-bold text-cyan-600 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" />
                      BATTERY SOH PATHWAY
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <select
                        value={selectedVehicle.id}
                        onChange={(e) => {
                          const vehicle = vehicles.find(v => v.id === e.target.value);
                          if (vehicle) setSelectedVehicle(vehicle);
                        }}
                        className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-xs font-bold font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-sm"
                      >
                        {filteredVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.id} ({v.city})
                          </option>
                        ))}
                      </select>
                      <span className="text-xs font-bold text-slate-900 font-mono">Stats</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[0.6rem] text-slate-400 block uppercase">MODEL</span>
                    <span className="text-xs font-bold text-slate-700">{selectedVehicle.model}</span>
                  </div>
                </div>

                {/* Quick parameters */}
                <div className="grid grid-cols-3 gap-3 mb-6 font-mono text-center">
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <span className="text-[0.55rem] text-slate-400 block uppercase">CYCLES</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedVehicle.cycle}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <span className="text-[0.55rem] text-slate-400 block uppercase">SOH</span>
                    <span className={`text-xs font-bold mt-0.5 block ${selectedVehicle.color === 'red' ? 'text-red-500' : selectedVehicle.color === 'yellow' ? 'text-amber-500' : 'text-emerald-500'}`}>{selectedVehicle.soh}%</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <span className="text-[0.55rem] text-slate-400 block uppercase">REPLACEMENT</span>
                    <span className="text-xs font-bold text-cyan-600 mt-0.5 block">{selectedVehicle.rul_days} Days</span>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[180px] w-full text-xs relative">
                  {chartLoading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-xl">
                      <Activity className="animate-spin h-5 w-5 text-cyan-600" />
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={degradationHistory.map(pt => ({
                        cycle: pt.cycle,
                        actualSoh: pt.type === 'actual' ? pt.soh : null,
                        predictedSoh: pt.type === 'predicted' || (pt.type === 'actual' && pt.cycle === selectedVehicle?.cycle) ? pt.soh : null
                      }))} 
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSohLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284C7" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#0284C7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="cycle" stroke="#94A3B8" tickLine={false} fontFamily="JetBrains Mono" />
                      <YAxis domain={[50, 100]} stroke="#94A3B8" tickLine={false} fontFamily="JetBrains Mono" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderRadius: '8px' }}
                        labelStyle={{ color: '#0F172A', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }}
                        itemStyle={{ fontFamily: 'JetBrains Mono' }}
                      />
                      <ReferenceLine 
                        y={65} 
                        stroke="#EF4444" 
                        strokeWidth={1.5}
                        strokeDasharray="3 3" 
                        label={{ value: "REPLACEMENT LIMIT (65%)", fill: "#EF4444", fontSize: 7, fontFamily: "JetBrains Mono", position: "insideBottomLeft", offset: 10 }}
                      />
                      <Area type="monotone" dataKey="actualSoh" stroke="#0284C7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSohLight)" name="Actual SOH (%)" />
                      <Line type="monotone" dataKey="predictedSoh" stroke="#EF4444" strokeWidth={2.5} strokeDasharray="4 4" dot={false} name="Predicted SOH (%)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-4 text-center">
                <span className="text-[0.55rem] text-slate-400 font-mono tracking-wider uppercase">
                  *Curve fitted via scikit-learn on B0005 battery baseline
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs font-mono">
              SELECT A VEHICLE FROM THE MAP
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Alerts & Telemetry list */}
      <div className="light-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 gap-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BatteryCharging className="h-4.5 w-4.5 text-amber-500" />
            {tableFilter === 'alerts' ? 'ML Failure Risk Vectors (Attention & Critical States)' : 'Operational Fleet Telemetry'}
          </h3>
          
          {/* Table Toggle controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTableFilter('alerts')}
              className={`px-3 py-1 rounded-lg font-mono text-[0.65rem] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                tableFilter === 'alerts'
                  ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Risk Alerts
            </button>
            <button
              onClick={() => setTableFilter('all')}
              className={`px-3 py-1 rounded-lg font-mono text-[0.65rem] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                tableFilter === 'all'
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              All Assets ({filteredVehicles.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
          <table className="w-full text-left text-xs font-medium text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-mono text-[0.65rem] uppercase">
                <th className="py-2.5 px-3">Vehicle ID</th>
                <th className="py-2.5 px-3">Manufacturer</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3 font-mono">Cycles</th>
                <th className="py-2.5 px-3 font-mono">SOH (%)</th>
                <th className="py-2.5 px-3 font-mono">RUL (Days)</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3 text-right">Telemetry Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {getTableVehicles().map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-bold font-mono text-slate-900">{v.id}</td>
                  <td className="py-3 px-3">{v.brand}</td>
                  <td className="py-3 px-3">{v.type}</td>
                  <td className="py-3 px-3">{v.city}</td>
                  <td className="py-3 px-3 font-mono">{v.cycle}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{v.soh}%</td>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-600">{v.rul_days} Days</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase font-mono tracking-wider ${
                      v.status === 'Critical' 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : v.status === 'Attention'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleFocusOnMap(v)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-cyan-600 hover:text-white border border-slate-200 text-slate-600 font-mono text-[0.6rem] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Locate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
