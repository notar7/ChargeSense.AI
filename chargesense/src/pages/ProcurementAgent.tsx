import { useState, useEffect } from 'react';
import { Truck, MessageSquare, Send, Sliders, DollarSign, Battery, Zap, Sparkles, Activity } from 'lucide-react';
import { api, type EVRecommendation } from '../services/api';

export default function ProcurementAgent() {
  // 1. Parameter Form States
  const [vehicleType, setVehicleType] = useState('Light Cargo');
  const [payloadKg, setPayloadKg] = useState(750);
  const [dailyKm, setDailyKm] = useState(80);
  const [dwellHours, setDwellHours] = useState(4);
  const [recommendations, setRecommendations] = useState<EVRecommendation[]>([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  // 2. Chat Agent Console States
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: 'Welcome to **VoltAdvisor**, your ChargeSense fleet electrification assistant. I analyze target payloads, route ranges, and charging windows to suggest optimal commercial EV replacements. Ask me about 5-year TCO payback, AC vs DC charging speed, or battery specifications.'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // 3. Initialize recommendations on load
  useEffect(() => {
    runMatcher();
  }, []);

  const runMatcher = async () => {
    setRecommendationLoading(true);
    try {
      const res = await api.recommendEV({
        vehicle_type: vehicleType,
        payload_kg: payloadKg,
        daily_km: dailyKm,
        dwell_hours_available: dwellHours
      });
      setRecommendations(res.recommendations);
    } catch (err) {
      console.error('Error fetching EV matches:', err);
    } finally {
      setRecommendationLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return;

    const userMsg = { role: 'user' as const, content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputVal('');
    setChatLoading(true);

    try {
      const res = await api.chatAgent(updatedMessages);
      setMessages(prev => [...prev, { role: 'assistant' as const, content: res.content }]);
    } catch (err) {
      console.error('Chat agent error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ **Connection Error**: I could not reach the Chat Agent service. Please verify your backend server is running and the `GROQ_API_KEY` is configured.'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper to format text with bold and list items (suited for Dark Terminal)
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let formattedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(formattedLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(formattedLine.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-white font-extrabold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < formattedLine.length) {
        parts.push(formattedLine.substring(lastIndex));
      }
      
      const isListItem = line.trim().startsWith('*') || line.trim().startsWith('-');
      const cleanLine = isListItem ? line.replace(/^[\s*-]+/, '').trim() : formattedLine;

      if (isListItem) {
        return (
          <li key={idx} className="ml-4 list-disc my-1 leading-relaxed text-slate-300">
            {parts.length > 0 ? parts : cleanLine}
          </li>
        );
      }
      return (
        <p key={idx} className="my-1.5 leading-relaxed text-slate-300">
          {parts.length > 0 ? parts : cleanLine}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pt-4">
      {/* Main Grid: 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Column 1: Parametric Fleet Input Sliders (4 cols) */}
        <div className="lg:col-span-4 light-card p-5 flex flex-col justify-between h-[calc(100vh-11.5rem)] min-h-[520px]">
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
              <Sliders className="h-4.5 w-4.5 text-cyan-600" />
              <span className="font-bold text-slate-900 text-sm tracking-wider font-mono uppercase">Operational Inputs</span>
            </div>

            {/* Dropdown Selector */}
            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold text-slate-400 font-mono uppercase block">Vehicle Class</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="Light Cargo">Light Cargo (Tata Ace EV style)</option>
                <option value="Mid Cargo">Mid Cargo (Euler Storm EV style)</option>
                <option value="Heavy Loader">Heavy Loader (Olectra C19 style)</option>
                <option value="Passenger Bus">Passenger Bus / Shuttle</option>
              </select>
            </div>

            {/* Payload Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[0.65rem] font-bold font-mono uppercase">
                <span className="text-slate-400">Target Payload</span>
                <span className="text-cyan-600">{payloadKg.toLocaleString()} kg</span>
              </div>
              <input
                type="range"
                min="100"
                max="6000"
                step="50"
                value={payloadKg}
                onChange={(e) => setPayloadKg(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-600 border border-slate-200"
              />
            </div>

            {/* Range Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[0.65rem] font-bold font-mono uppercase">
                <span className="text-slate-400">Daily Run Mileage</span>
                <span className="text-cyan-600">{dailyKm} km</span>
              </div>
              <input
                type="range"
                min="10"
                max="350"
                step="5"
                value={dailyKm}
                onChange={(e) => setDailyKm(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-600 border border-slate-200"
              />
            </div>

            {/* Dwell Charging Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[0.65rem] font-bold font-mono uppercase">
                <span className="text-slate-400">Charging Window (Dwell)</span>
                <span className="text-cyan-600">{dwellHours} hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                step="0.5"
                value={dwellHours}
                onChange={(e) => setDwellHours(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-600 border border-slate-200"
              />
            </div>
          </div>

          <button
            onClick={runMatcher}
            disabled={recommendationLoading}
            className="w-full py-3 mt-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-cyan-100"
          >
            {recommendationLoading ? (
              <>
                <Activity className="animate-spin h-4 w-4" />
                Matching Models...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Find EV Matches
              </>
            )}
          </button>
        </div>

        {/* Column 2: Optimal EV Replacement Cards (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4 h-[calc(100vh-11.5rem)] min-h-[520px]">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Truck className="h-4.5 w-4.5 text-cyan-600" />
              Optimal Replacements
            </h3>
            <span className="text-[0.65rem] font-mono text-slate-500">
              {recommendations.length} MATCHES FOUND
            </span>
          </div>

          {recommendationLoading ? (
            <div className="flex-1 light-card flex flex-col items-center justify-center p-8 text-slate-400 font-mono text-xs gap-3">
              <Activity className="animate-spin h-6 w-6 text-cyan-600" />
              COMPILING MATCH MATRICES...
            </div>
          ) : recommendations.length > 0 ? (
            <div className="flex-grow overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  onClick={() => sendMessage(`Provide a full specifications report and 5-year TCO details for the ${rec.brand} ${rec.model} EV.`)}
                  className="bg-white/95 border border-slate-200/90 hover:border-cyan-300 rounded-2xl p-4 transition-all duration-200 relative group shadow-sm cursor-pointer hover:shadow-md hover:shadow-cyan-100/20 hover:-translate-y-0.5"
                  title="Click to query chat assistant about this model"
                >
                  {/* Match Confidence Score Pill */}
                  <div className="absolute top-4 right-4 bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded-full text-[0.6rem] font-bold text-cyan-700 tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block animate-pulse"></span>
                    {rec.confidence_score}%
                  </div>

                  <div className="flex items-center gap-3 mb-3 pr-16">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 group-hover:bg-cyan-500 group-hover:text-white group-hover:border-cyan-500 transition-all duration-200">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm font-mono tracking-tight leading-tight">{rec.brand} {rec.model}</h4>
                      <p className="text-[0.55rem] font-bold text-slate-400 uppercase mt-1 font-mono tracking-wider">
                        {rec.type} • Cap: {rec.payload_capacity_kg} kg • Price: ₹{rec.price_lakh}L
                      </p>
                    </div>
                  </div>

                  {/* Specs Row */}
                  <div className="grid grid-cols-3 gap-2.5 border-t border-slate-100 pt-3 text-center font-mono text-[0.6rem]">
                    <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/80 flex flex-col items-center justify-center">
                      <span className="text-[0.5rem] text-slate-400 block uppercase font-bold tracking-wider flex items-center gap-1 mb-1">
                        <Zap className="h-3 w-3 text-cyan-500" /> Range
                      </span>
                      <span className="font-extrabold text-slate-800 block text-xs">{rec.range_km} km</span>
                    </div>
                    <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/80 flex flex-col items-center justify-center">
                      <span className="text-[0.5rem] text-slate-400 block uppercase font-bold tracking-wider flex items-center gap-1 mb-1">
                        <Battery className="h-3 w-3 text-indigo-500" /> Battery
                      </span>
                      <span className="font-extrabold text-slate-800 block text-xs">{rec.battery_kwh} kWh</span>
                    </div>
                    <div className="bg-emerald-50/30 p-2 rounded-xl border border-emerald-100/50 flex flex-col items-center justify-center">
                      <span className="text-[0.5rem] text-emerald-600 block uppercase font-bold tracking-wider flex items-center gap-1 mb-1">
                        <DollarSign className="h-3 w-3 text-emerald-500" /> 5Y Savings
                      </span>
                      <span className="font-extrabold text-emerald-600 block text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        ₹{rec.savings_5yr_tco}L
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-grow light-card flex flex-col items-center justify-center p-8 text-slate-400 font-mono text-xs text-center border-dashed border-2 border-slate-200">
              NO MATCHES FOUND FOR THESE PARAMETERS.
              <br />
              <span className="text-[0.65rem] text-slate-400 mt-1 block">Try lowering payload or range requirements.</span>
            </div>
          )}
        </div>

        {/* Column 3: VoltAdvisor AI Console (4 cols) - Premium Dark cyberdeck layout */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-[#080C14] border border-cyan-950/40 rounded-2xl p-5 h-[calc(100vh-11.5rem)] min-h-[520px] shadow-xl text-gray-200">
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            
            {/* Header row */}
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-cyan-400" />
                <span className="font-bold text-white text-sm tracking-wider font-mono uppercase">VoltAdvisor AI</span>
              </div>
              <span className="text-[0.55rem] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Active
              </span>
            </div>

            {/* Prompt Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => sendMessage('Compare Tata Motors Ace EV vs conventional diesel cargo specifications.')}
                className="text-[0.55rem] font-mono font-bold bg-[#111827] border border-slate-800 hover:border-cyan-800/60 hover:bg-cyan-950/10 text-slate-400 hover:text-cyan-400 px-2 py-1 rounded-lg transition-all cursor-pointer text-left"
              >
                📊 Ace EV vs Diesel
              </button>
              <button
                onClick={() => sendMessage('Calculate 5-year TCO savings and payback periods for a mid-cargo commercial EV doing 120km daily.')}
                className="text-[0.55rem] font-mono font-bold bg-[#111827] border border-slate-800 hover:border-cyan-800/60 hover:bg-cyan-950/10 text-slate-400 hover:text-cyan-400 px-2 py-1 rounded-lg transition-all cursor-pointer text-left"
              >
                💰 Payback & TCO
              </button>
              <button
                onClick={() => sendMessage('Compare EV charging timelines and capacity buffers for a 22kW AC vs DC Fast Charger.')}
                className="text-[0.55rem] font-mono font-bold bg-[#111827] border border-slate-800 hover:border-cyan-800/60 hover:bg-cyan-950/10 text-slate-400 hover:text-cyan-400 px-2 py-1 rounded-lg transition-all cursor-pointer text-left"
              >
                🔌 AC vs DC Charging
              </button>
            </div>

            {/* Chat Message Stream - flex-1 & overflow-y-auto to fill exact card middle space dynamically */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[90%] p-3 rounded-xl text-xs ${
                    msg.role === 'user'
                      ? 'ml-auto bg-cyan-950/40 border border-cyan-900/30 text-cyan-200 rounded-tr-none font-semibold'
                      : 'bg-slate-900/60 border border-slate-800/40 text-slate-300 rounded-tl-none font-medium'
                  }`}
                >
                  <span className="text-[0.5rem] font-mono text-slate-500 mb-1 uppercase font-bold">
                    {msg.role === 'user' ? 'OPERATOR_REQUEST' : 'AI_AGENT_RESPONSE'}
                  </span>
                  <div className="space-y-1">
                    {formatMessageText(msg.content)}
                  </div>
                </div>
              ))}

              {/* Chat Loading Typing Indicator */}
              {chatLoading && (
                <div className="bg-slate-900/60 border border-slate-800/40 text-slate-300 rounded-xl rounded-tl-none p-3 max-w-[90%] animate-pulse">
                  <span className="text-[0.5rem] font-mono text-slate-500 mb-1 block uppercase font-bold">AI_AGENT_RESOLVING</span>
                  <div className="flex items-center gap-2 font-mono text-[0.6rem] text-slate-400 font-bold">
                    <Activity className="animate-spin h-3.5 w-3.5 text-cyan-500" />
                    COMPILING ELECTRIFICATION MATRICES...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Form input */}
          <div className="flex gap-2 border-t border-slate-800/60 pt-3 mt-2">
            <input
              type="text"
              placeholder="Ask EV transition questions..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-slate-900/90 border border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-600"
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputVal)}
              disabled={chatLoading}
            />
            <button
              onClick={() => sendMessage(inputVal)}
              disabled={chatLoading}
              className="p-2.5 bg-cyan-600 hover:bg-cyan-500 transition-all text-white rounded-xl flex items-center justify-center cursor-pointer disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
