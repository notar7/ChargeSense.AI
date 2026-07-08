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
    { "brand": "Tata Motors",  "model": "Ace EV",    "payload_kg": 750,  "range_km": 154, "battery_kwh": 21.3, "price_lakh": 14.5,  "type": "Light Cargo" },
    { "brand": "Olectra",      "model": "C19",       "payload_kg": 5000, "range_km": 200, "battery_kwh": 150,  "price_lakh": 280.0, "type": "Heavy Bus" },
    { "brand": "PMI Electro",  "model": "Toofan",    "payload_kg": 500,  "range_km": 120, "battery_kwh": 12.0, "price_lakh": 8.5,   "type": "Mini Cargo" },
    { "brand": "Euler Motors", "model": "Storm EV",  "payload_kg": 688,  "range_km": 151, "battery_kwh": 19.2, "price_lakh": 12.9,  "type": "Light Cargo" }
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
