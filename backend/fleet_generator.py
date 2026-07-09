import os
import random
import numpy as np
import joblib

# Set random seed for deterministic generation so the same fleet loads each time
random.seed(42)
np.random.seed(42)

CITIES = {
    "Mumbai":    (19.076, 72.877, "MUM"),
    "Delhi":     (28.679, 77.213, "DEL"),
    "Chennai":   (13.082, 80.270, "MAA"),
    "Kolkata":   (22.572, 88.363, "CCU"),
    "Pune":      (18.520, 73.856, "PNQ"),
    "Bangalore": (12.971, 77.594, "BLR"),
    "Hyderabad": (17.385, 78.486, "HYD"),
    "Ahmedabad": (23.022, 72.571, "AMD"),
    "Jaipur":    (26.912, 75.787, "JAI"),
    "Surat":     (21.170, 72.831, "STV")
}

EV_MODELS = [
    # Light Cargo (Tata Motors, Mahindra, Euler, BYD, etc.)
    { "brand": "Tata Motors",  "model": "Ace EV",              "payload_kg": 750,   "range_km": 154, "battery_kwh": 21.3, "price_lakh": 14.5,  "type": "Light Cargo" },
    { "brand": "Euler Motors", "model": "Storm EV",            "payload_kg": 688,   "range_km": 151, "battery_kwh": 19.2, "price_lakh": 12.9,  "type": "Light Cargo" },
    { "brand": "Mahindra",     "model": "Treo Zor",            "payload_kg": 550,   "range_km": 125, "battery_kwh": 7.4,  "price_lakh": 3.8,   "type": "Light Cargo" },
    { "brand": "Mahindra",     "model": "Zor Grand",           "payload_kg": 450,   "range_km": 90,  "battery_kwh": 10.2, "price_lakh": 4.2,   "type": "Light Cargo" },
    { "brand": "BYD",          "model": "T3 Cargo Van",        "payload_kg": 720,   "range_km": 300, "battery_kwh": 50.3, "price_lakh": 27.5,  "type": "Light Cargo" },
    
    # Mid Cargo (Tata Motors, Ashok Leyland, etc. 1 to 4 tonnes)
    { "brand": "Tata Motors",  "model": "Ultra T.7 Electric",  "payload_kg": 3690,  "range_km": 180, "battery_kwh": 62.5, "price_lakh": 35.0,  "type": "Mid Cargo" },
    { "brand": "Ashok Leyland", "model": "Bada Dost i1",       "payload_kg": 1250,  "range_km": 150, "battery_kwh": 32.0, "price_lakh": 16.8,  "type": "Mid Cargo" },
    { "brand": "Ashok Leyland", "model": "Bada Dost i3",       "payload_kg": 1400,  "range_km": 160, "battery_kwh": 38.5, "price_lakh": 18.2,  "type": "Mid Cargo" },
    { "brand": "Eicher",       "model": "Pro 2049 EV",         "payload_kg": 3500,  "range_km": 174, "battery_kwh": 60.0, "price_lakh": 28.0,  "type": "Mid Cargo" },
    
    # Heavy Loader (Volvo, Eicher, BYD - 5 to 25 tonnes)
    { "brand": "Volvo",        "model": "FH Electric",         "payload_kg": 24000, "range_km": 300, "battery_kwh": 540.0, "price_lakh": 650.0, "type": "Heavy Loader" },
    { "brand": "Volvo",        "model": "FM Electric",         "payload_kg": 18000, "range_km": 300, "battery_kwh": 450.0, "price_lakh": 480.0, "type": "Heavy Loader" },
    { "brand": "Eicher",       "model": "Pro 8055 EV",         "payload_kg": 12000, "range_km": 220, "battery_kwh": 250.0, "price_lakh": 95.0,  "type": "Heavy Loader" },
    { "brand": "Tata Motors",  "model": "Prima E.28K Dumper",  "payload_kg": 15000, "range_km": 200, "battery_kwh": 453.0, "price_lakh": 160.0, "type": "Heavy Loader" },
    
    # Passenger Bus (Olectra, PMI Electro, Tata Motors)
    { "brand": "Olectra",      "model": "C19 Heavy Bus",       "payload_kg": 5000,  "range_km": 200, "battery_kwh": 150.0, "price_lakh": 280.0, "type": "Passenger Bus" },
    { "brand": "Olectra",      "model": "K7 City Shuttle",     "payload_kg": 3000,  "range_km": 180, "battery_kwh": 120.0, "price_lakh": 190.0, "type": "Passenger Bus" },
    { "brand": "PMI Electro",  "model": "Toofan Transit",      "payload_kg": 500,   "range_km": 120, "battery_kwh": 12.0,  "price_lakh": 8.5,   "type": "Passenger Bus" },
    { "brand": "Tata Motors",  "model": "Starbus EV 4/12",     "payload_kg": 4500,  "range_km": 220, "battery_kwh": 140.0, "price_lakh": 220.0, "type": "Passenger Bus" }
]

def load_battery_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "models", "battery_model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}. Run train_model.py first.")
    return joblib.load(model_path)

def generate_fleet():
    model = load_battery_model()
    w = model.coef_[0]
    b = model.intercept_
    
    # EOL defined as Capacity dropping to 1.4 Ah (70% SoH)
    end_of_life_cycle = (1.4 - b) / w
    
    fleet = []
    vehicle_counter = 1
    
    cities_list = list(CITIES.keys())
    
    for i in range(500):
        # Evenly distribute across the 10 cities
        city_name = cities_list[i % len(cities_list)]
        city_lat, city_lng, city_code = CITIES[city_name]
        
        # Select random EV model
        ev_model = random.choice(EV_MODELS)
        
        # Generate cycle count with realistic distribution:
        # Most are fresh, some are aged, few are near failure
        rand_val = random.random()
        if rand_val < 0.65:
            cycle = random.randint(10, 80)
        elif rand_val < 0.90:
            cycle = random.randint(80, 130)
        else:
            cycle = random.randint(130, 200)
            
        # Predict Capacity
        predicted_cap = model.predict([[cycle]])[0]
        # State of Health (%) relative to rated 2.0 Ah
        soh = (predicted_cap / 2.0) * 100
        soh = max(0.0, min(100.0, soh))
        
        # Remaining Useful Life in cycles (assume 1 cycle per day = RUL in days)
        rul = max(0, int(end_of_life_cycle - cycle))
        
        # Add a bit of noise to SoH to make it look realistic
        soh += random.uniform(-1.5, 1.5)
        soh = max(0.0, min(100.0, round(soh, 1)))
        
        # Status color
        if soh >= 80.0:
            status = "Active"
            color = "green"
        elif soh >= 65.0:
            status = "Attention"
            color = "yellow"
        else:
            status = "Critical"
            color = "red"
            
        # Add random scatter around the city center (logistics routes within 15-20km)
        lat = city_lat + random.uniform(-0.12, 0.12)
        lng = city_lng + random.uniform(-0.12, 0.12)
        
        vehicle_id = f"EV-{city_code}-{1000 + vehicle_counter}"
        vehicle_counter += 1
        
        fleet.append({
            "id": vehicle_id,
            "brand": ev_model["brand"],
            "model": ev_model["model"],
            "payload_kg": ev_model["payload_kg"],
            "range_km": ev_model["range_km"],
            "battery_kwh": ev_model["battery_kwh"],
            "price_lakh": ev_model["price_lakh"],
            "type": ev_model["type"],
            "city": city_name,
            "lat": round(lat, 5),
            "lng": round(lng, 5),
            "cycle": cycle,
            "soh": soh,
            "rul_days": rul,
            "status": status,
            "color": color
        })
        
    return fleet

if __name__ == "__main__":
    fleet = generate_fleet()
    print(f"Successfully generated {len(fleet)} synthetic vehicles!")
    print(f"Sample vehicle: {fleet[0]}")
