const API_BASE_URL = 'http://localhost:8000/api';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  payload_kg: number;
  range_km: number;
  battery_kwh: number;
  price_lakh: number;
  type: string;
  city: string;
  lat: number;
  lng: number;
  cycle: number;
  soh: number;
  rul_days: number;
  status: string;
  color: string;
}

export interface FleetOverview {
  total_vehicles: number;
  avg_soh: number;
  alerts_count: number;
  co2_saved: number;
}

export interface VehicleDetail {
  vehicle: Vehicle;
  degradation_history: {
    cycle: number;
    soh: number;
    type: 'actual' | 'predicted';
  }[];
}

export interface SupplyChainRisk {
  prices: {
    [key: string]: {
      price: number;
      unit: string;
      change: string;
      risk: string;
      source: string;
      history: number[];
    };
  };
  supplier_countries: {
    country: string;
    mineral: string;
    share: string;
    risk: string;
  }[];
}

export interface EVRecommendation {
  brand: string;
  model: string;
  type: string;
  payload_capacity_kg: number;
  range_km: number;
  battery_kwh: number;
  price_lakh: number;
  range_fit_pct: number;
  savings_5yr_tco: number;
  confidence_score: number;
}

export interface RecommendationResponse {
  requested: {
    vehicle_type: string;
    payload_kg: number;
    daily_km: number;
    dwell_hours_available: number;
  };
  recommendations: EVRecommendation[];
}

export interface ChatResponse {
  role: string;
  content: string;
}

export const api = {
  getFleetOverview: async (): Promise<FleetOverview> => {
    const res = await fetch(`${API_BASE_URL}/fleet/overview`);
    if (!res.ok) throw new Error('Failed to fetch fleet overview');
    return res.json();
  },
  
  getFleetVehicles: async (): Promise<Vehicle[]> => {
    const res = await fetch(`${API_BASE_URL}/fleet/vehicles`);
    if (!res.ok) throw new Error('Failed to fetch fleet vehicles');
    return res.json();
  },
  
  getVehicleDetail: async (id: string): Promise<VehicleDetail> => {
    const res = await fetch(`${API_BASE_URL}/fleet/vehicle/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch vehicle ${id} detail`);
    return res.json();
  },
  
  getCarbonSavings: async () => {
    const res = await fetch(`${API_BASE_URL}/carbon/savings`);
    if (!res.ok) throw new Error('Failed to fetch carbon savings');
    return res.json();
  },
  
  getSupplyChainRisk: async (): Promise<SupplyChainRisk> => {
    const res = await fetch(`${API_BASE_URL}/supplychain/risk`);
    if (!res.ok) throw new Error('Failed to fetch supply chain risk');
    return res.json();
  },
  
  recommendEV: async (data: {
    vehicle_type: string;
    payload_kg: number;
    daily_km: number;
    dwell_hours_available: number;
  }): Promise<RecommendationResponse> => {
    const res = await fetch(`${API_BASE_URL}/procurement/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },
  
  chatAgent: async (messages: { role: string; content: string }[]): Promise<ChatResponse> => {
    const res = await fetch(`${API_BASE_URL}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error('Chat agent error');
    return res.json();
  }
};
