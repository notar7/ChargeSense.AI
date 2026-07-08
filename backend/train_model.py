import os
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import joblib

def train_battery_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    metadata_path = os.path.abspath(os.path.join(current_dir, "..", "datasets", "nasa_battery_aging_data", "metadata.csv"))
    
    print(f"Loading NASA battery metadata from: {metadata_path}")
    if not os.path.exists(metadata_path):
        raise FileNotFoundError(f"Metadata file not found at {metadata_path}")
        
    df = pd.read_csv(metadata_path)
    
    # Filter for discharge cycles of main batteries
    df_discharge = df[(df['type'] == 'discharge') & (df['battery_id'].isin(['B0005', 'B0006', 'B0007', 'B0018']))].copy()
    
    if df_discharge.empty:
        raise ValueError("No discharge cycle data found in metadata.csv for batteries B0005, B0006, B0007, B0018.")
        
    # Calculate sequential cycle number per battery
    df_discharge['cycle'] = df_discharge.groupby('battery_id').cumcount() + 1
    
    # Drop rows with missing Capacity
    df_discharge = df_discharge.dropna(subset=['Capacity'])
    
    X = df_discharge[['cycle']].values
    y = df_discharge['Capacity'].values
    
    print(f"Training on {len(df_discharge)} cycles across B0005, B0006, B0007, and B0018...")
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Initial rated capacity is 2.0 Ah
    initial_capacity = 2.0
    
    print(f"Model coefficients:")
    print(f"  Slope (Capacity loss per cycle): {model.coef_[0]:.6f} Ah")
    print(f"  Intercept (Initial model capacity): {model.intercept_:.4f} Ah (compared to 2.0 Ah rated)")
    
    model_dir = os.path.join(current_dir, "models")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "battery_model.pkl")
    
    # Save the model
    joblib.dump(model, model_path)
    print(f"Trained battery model saved successfully to {model_path}!")

if __name__ == "__main__":
    train_battery_model()
