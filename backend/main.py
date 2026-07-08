import os
import time
import random
import json
import http.client
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

# Import our fleet generator
from fleet_generator import generate_fleet, load_battery_model, EV_MODELS, CITIES

load_dotenv()

app = FastAPI(title="ChargeSense Operational API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database of 500 vehicles (generated once on startup)
try:
    FLEET_DATABASE = generate_fleet()
    print(f"Loaded {len(FLEET_DATABASE)} vehicles into operational memory.")
except Exception as e:
    print(f"Error generating fleet: {e}")
    # Fallback mock database if model is missing
    FLEET_DATABASE = []

# Base time for cumulative carbon counter (Jan 1, 2026)
CARBON_BASE_TIME = 1767225600  # Epoch for 2026-01-01 00:00:00 UTC
# 500 vehicles save ~350 tonnes CO2/day = 14.58 tonnes/hour = 0.00405 tonnes/second
CARBON_SAVINGS_PER_SECOND = 0.00405

# Hardcoded Commodity Prices & Risk Levels from PRD
COMMODITY_PRICES = {
    "lithium":  { "price": 162500, "unit": "CNY/T",  "change": "+1.56%", "risk": "HIGH",   "source": "Shanghai Metals Market", "history": [159000, 159500, 160000, 159800, 161200, 161000, 162500] },
    "cobalt":   { "price": 33000,  "unit": "USD/T",  "change": "-0.80%",  "risk": "MEDIUM", "source": "LME", "history": [33400, 33200, 33150, 33300, 33200, 33080, 33000] },
    "nickel":   { "price": 16172,  "unit": "USD/T",  "change": "-1.33%", "risk": "LOW",    "source": "LME", "history": [16450, 16320, 16280, 16300, 16220, 16190, 16172] }
}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class RecommendationRequest(BaseModel):
    vehicle_type: str
    payload_kg: float
    daily_km: float
    dwell_hours_available: float

# Helper to fetch chatbot completion via Groq or Gemini raw HTTP client
def get_llm_completion(prompt: str, system_instruction: str = "") -> str:
    groq_api_key = os.getenv("GROQ_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    if groq_api_key:
        try:
            print("Querying LLaMA-3.3-70B on Groq...")
            conn = http.client.HTTPSConnection("api.groq.com")
            payload = json.dumps({
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3
            })
            headers = {
                'Authorization': f'Bearer {groq_api_key}',
                'Content-Type': 'application/json'
            }
            conn.request("POST", "/openai/v1/chat/completions", payload, headers)
            res = conn.getresponse()
            data = res.read()
            response_json = json.loads(data.decode("utf-8"))
            return response_json['choices'][0]['message']['content']
        except Exception as e:
            print(f"Groq API error: {e}. Falling back to Gemini...")
            
    if gemini_api_key:
        try:
            print("Querying Gemini 1.5 Flash...")
            conn = http.client.HTTPSConnection("generativelanguage.googleapis.com")
            # Structure query for Gemini API
            combined_text = f"{system_instruction}\n\nUser Question:\n{prompt}"
            payload = json.dumps({
                "contents": [{"parts": [{"text": combined_text}]}]
            })
            headers = {'Content-Type': 'application/json'}
            conn.request("POST", f"/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}", payload, headers)
            res = conn.getresponse()
            data = res.read()
            response_json = json.loads(data.decode("utf-8"))
            return response_json['candidates'][0]['content']['parts'][0]['text']
        except Exception as e:
            print(f"Gemini API error: {e}")
            
    # Mock fallback response if no keys are configured
    return (
        "*(Demo Mode - API keys not configured)* Based on your request, Tata Ace EV is the recommended "
        "light cargo option. It yields an average of 42% TCO savings over 5 years compared to diesel, "
        "and handles a payload of 750kg with a 154km range."
    )

# --- Endpoints ---

@app.get("/api/fleet/overview")
def get_fleet_overview():
    if not FLEET_DATABASE:
        return {"total_vehicles": 0, "avg_soh": 0.0, "alerts_count": 0, "co2_saved": 0.0}
        
    soh_values = [v["soh"] for v in FLEET_DATABASE]
    avg_soh = sum(soh_values) / len(soh_values)
    alerts_count = sum(1 for v in FLEET_DATABASE if v["status"] == "Critical")
    
    # Calculate live ticking carbon savings
    elapsed_seconds = time.time() - CARBON_BASE_TIME
    co2_saved = round(6420.5 + elapsed_seconds * CARBON_SAVINGS_PER_SECOND, 4)
    
    return {
        "total_vehicles": len(FLEET_DATABASE),
        "avg_soh": round(avg_soh, 1),
        "alerts_count": alerts_count,
        "co2_saved": co2_saved
    }

@app.get("/api/fleet/vehicles")
def get_fleet_vehicles():
    return FLEET_DATABASE

@app.get("/api/fleet/vehicle/{vehicle_id}")
def get_vehicle_detail(vehicle_id: str):
    vehicle = next((v for v in FLEET_DATABASE if v["id"] == vehicle_id), None)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    # Generate actual and predicted cycle degradation curves using the ML model
    try:
        model = load_battery_model()
        w = model.coef_[0]
        b = model.intercept_
    except Exception:
        # Fallback dummy linear parameters
        w, b = -0.0039, 1.89
        
    current_cycle = vehicle["cycle"]
    history = []
    
    # Actual historical data up to current cycle (sampled every 10 cycles + jitter)
    random.seed(hash(vehicle_id)) # Consistent mock curve per vehicle
    for c in range(0, current_cycle + 1, 10):
        cap = w * c + b
        soh = (cap / 2.0) * 100
        soh += random.uniform(-1.0, 1.0)
        history.append({
            "cycle": c,
            "soh": round(max(0.0, min(100.0, soh)), 1),
            "type": "actual"
        })
        
    # Append the absolute current SoH as the transition point
    history.append({
        "cycle": current_cycle,
        "soh": vehicle["soh"],
        "type": "actual"
    })
    
    # Predicted future degradation (cycles after current up to failure at 70%)
    eol_cycle = int((1.4 - b) / w)
    step = max(5, int((eol_cycle - current_cycle) / 6))
    
    for c in range(current_cycle + step, eol_cycle + 25, step):
        cap = w * c + b
        soh = (cap / 2.0) * 100
        history.append({
            "cycle": c,
            "soh": round(max(0.0, min(100.0, soh)), 1),
            "type": "predicted"
        })
        
    # Sort points by cycle
    history = sorted(history, key=lambda x: x["cycle"])
    
    # Remove duplicates
    unique_history = []
    seen = set()
    for pt in history:
        if pt["cycle"] not in seen:
            seen.add(pt["cycle"])
            unique_history.append(pt)
            
    return {
        "vehicle": vehicle,
        "degradation_history": unique_history
    }

@app.get("/api/carbon/savings")
def get_carbon_savings():
    elapsed_seconds = time.time() - CARBON_BASE_TIME
    co2_saved = round(6420.5 + elapsed_seconds * CARBON_SAVINGS_PER_SECOND, 4)
    return {
        "co2_saved_tonnes": co2_saved,
        "tonnes_today": round(350 + random.uniform(-10, 10), 1),
        "target_progress_pct": 34.6
    }

@app.get("/api/supplychain/risk")
def get_supply_chain_risk():
    return {
        "prices": COMMODITY_PRICES,
        "supplier_countries": [
            {"country": "Australia", "mineral": "Lithium", "share": "47%", "risk": "LOW"},
            {"country": "Chile", "mineral": "Lithium", "share": "30%", "risk": "MEDIUM"},
            {"country": "DRC", "mineral": "Cobalt", "share": "70%", "risk": "HIGH"},
            {"country": "Indonesia", "mineral": "Nickel", "share": "37%", "risk": "MEDIUM"},
            {"country": "Russia", "mineral": "Nickel", "share": "9%", "risk": "HIGH"}
        ]
    }

@app.post("/api/procurement/recommend")
def recommend_ev(req: RecommendationRequest):
    # RAG/Matching logic
    payload = req.payload_kg
    daily_km = req.daily_km
    
    recommendations = []
    
    for oem in EV_MODELS:
        # Range fit rating
        range_margin = oem["range_km"] - daily_km
        if range_margin < -20:
            range_fit_pct = 0.0
        elif range_margin < 0:
            range_fit_pct = round(100 - abs(range_margin) * 5, 1)
        else:
            range_fit_pct = 100.0
            
        # Payload fit
        payload_fit = oem["payload_kg"] >= payload * 0.9
        
        if range_fit_pct > 30 and payload_fit:
            # 5-year TCO calculation: assume diesel TCO is much higher
            # Diesel: Fuel + maintenance + capital cost
            # EV: Low fuel + low maintenance + capital cost
            diesel_tco_5yr = (daily_km * 300 * 5) * 1.5 + (payload * 2.0)
            ev_tco_5yr = (daily_km * 300 * 5) * 0.3 + (oem["price_lakh"] * 100000)
            savings_5yr = max(0, int(diesel_tco_5yr - ev_tco_5yr))
            
            confidence = round((range_fit_pct * 0.6) + (100 if payload_fit else 40) * 0.4, 1)
            
            recommendations.append({
                "brand": oem["brand"],
                "model": oem["model"],
                "type": oem["type"],
                "payload_capacity_kg": oem["payload_kg"],
                "range_km": oem["range_km"],
                "battery_kwh": oem["battery_kwh"],
                "price_lakh": oem["price_lakh"],
                "range_fit_pct": range_fit_pct,
                "savings_5yr_tco": round(savings_5yr / 100000.0, 1), # in Lakhs
                "confidence_score": confidence
            })
            
    # Sort recommendations by confidence score descending
    recommendations = sorted(recommendations, key=lambda x: x["confidence_score"], reverse=True)
    
    return {
        "requested": req,
        "recommendations": recommendations[:3] # Top 3 matches
    }

@app.post("/api/agent/chat")
def chat_agent(req: ChatRequest):
    # Formulate prompt from conversation history
    history_text = ""
    for msg in req.messages[:-1]:
        history_text += f"{msg.role.capitalize()}: {msg.content}\n"
        
    user_question = req.messages[-1].content
    
    system_instruction = (
        "You are the ChargeSense AI Procurement Agent, an expert in industrial fleet electrification "
        "and TCO analysis for Indian operations. You recommend EV replacements for diesel fleets. "
        "Use real Indian OEM specifications (such as Tata Motors Ace EV payload 750kg, Olectra buses, "
        "Euler Motors Storm EV payload 688kg, PMI Electro Toofan). Answer in a professional, concise, "
        "data-driven tone, referencing TCO, payloads, battery sizing (kWh), carbon savings, and range. "
        "Format responses using bolding and clean bullet points where appropriate."
    )
    
    prompt = f"Conversation History:\n{history_text}\nUser Question: {user_question}"
    
    answer = get_llm_completion(prompt, system_instruction)
    
    return {"role": "assistant", "content": answer}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
