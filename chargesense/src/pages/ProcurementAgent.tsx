import { useState } from 'react';
import { Truck, MessageSquare, Send } from 'lucide-react';

const MOCK_RECOMMENDATIONS = [
  { brand: 'Tata Motors', model: 'Ace EV', type: 'Light Cargo', payload: '750 kg', range: '154 km', battery: '21.3 kWh', price: '₹14.5 Lakh', savings: '₹4.2 Lakh/yr', fit: 98 },
  { brand: 'Euler Motors', model: 'Storm EV', type: 'Mid Cargo', payload: '688 kg', range: '151 km', battery: '19.2 kWh', price: '₹12.9 Lakh', savings: '₹3.8 Lakh/yr', fit: 94 },
  { brand: 'PMI Electro', model: 'Toofan', type: 'Light Loader', payload: '500 kg', range: '120 km', battery: '12 kWh', price: '₹8.5 Lakh', savings: '₹2.9 Lakh/yr', fit: 86 }
];

export default function ProcurementAgent() {
  const [messages, setMessages] = useState([
    { sender: 'user', text: 'I have 20 Tata Ace diesel trucks doing 80km/day in Mumbai. What EV should I switch to?' },
    { sender: 'agent', text: 'Based on your parameters (payload ~750kg, daily run 80km in traffic conditions), I have run a match against the Indian EV OEM specs database. The Tata Ace EV is your optimal replacement with a 98% range fit. It covers your daily run with a 48% charge buffer left.' }
  ]);
  const [inputVal, setInputVal] = useState('');

  const handleSend = () => {
    if (!inputVal.trim()) return;
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: inputVal },
      { sender: 'agent', text: 'Processing new vehicle parameters... Running TCO matching algorithms against specs database.' }
    ]);
    setInputVal('');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
            AI Procurement Agent
          </h1>
          <p className="text-[0.65rem] text-slate-500 font-mono tracking-widest mt-1 uppercase">
            Groq Conversational Optimizer // active
          </p>
        </div>
      </div>

      {/* Main Grid: Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Cyber AI Chat interface (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between light-card p-5 min-h-[460px]">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-cyan-600" />
                <span className="font-bold text-slate-900 text-sm tracking-wider font-mono">GROQ LLAMA_3.3_70B // CONSOLE</span>
              </div>
              <span className="text-[0.6rem] font-mono text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">
                SECURE INTERFACE
              </span>
            </div>

            {/* Chat message stream */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[85%] p-3.5 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'ml-auto bg-cyan-50 border border-cyan-100 text-cyan-900 rounded-tr-none'
                      : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none'
                  }`}
                >
                  <span className="text-[0.55rem] font-mono text-slate-400 mb-1 uppercase">
                    {msg.sender === 'user' ? 'OPERATOR_REQUEST' : 'AI_AGENT_RESPONSE'}
                  </span>
                  <p className="leading-relaxed font-semibold">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form input */}
          <div className="flex gap-2 border-t border-slate-100 pt-4 mt-6">
            <input
              type="text"
              placeholder="Input diesel fleet specs or ask EV transition parameters..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 font-semibold text-slate-800 placeholder-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              className="p-3 bg-cyan-600 hover:bg-cyan-500 transition-all text-white rounded-xl flex items-center justify-center cursor-pointer"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Right Side: Active Recommendation cards (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              OPTIMAL REPLACEMENTS
            </h3>
            <span className="text-[0.65rem] font-mono text-slate-500">3 MATCHES FOUND</span>
          </div>

          <div className="space-y-4">
            {MOCK_RECOMMENDATIONS.map((rec, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 hover:border-cyan-300 rounded-xl p-4 transition-all duration-200 relative group shadow-sm"
              >
                <div className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full bg-cyan-50 border border-cyan-100 font-mono">
                  <span className="text-[0.65rem] font-bold text-cyan-700">{rec.fit}%</span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 group-hover:text-cyan-600 group-hover:border-cyan-100">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm font-mono">{rec.brand} {rec.model}</h4>
                    <p className="text-[0.6rem] text-slate-500 uppercase mt-0.5">{rec.type} • PAYLOAD: {rec.payload}</p>
                  </div>
                </div>

                {/* Specs row */}
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center font-mono">
                  <div className="bg-slate-50 p-2 rounded-md">
                    <span className="text-[0.5rem] text-slate-400 block uppercase">RANGE</span>
                    <span className="text-[0.65rem] font-bold text-slate-800 mt-0.5 block">{rec.range}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-md">
                    <span className="text-[0.5rem] text-slate-400 block uppercase">BATTERY</span>
                    <span className="text-[0.65rem] font-bold text-slate-800 mt-0.5 block">{rec.battery}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-md">
                    <span className="text-[0.5rem] text-slate-400 block uppercase">5YR SAVING</span>
                    <span className="text-[0.65rem] font-bold text-emerald-600 mt-0.5 block">{rec.savings}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
