<div align="center">
  <h1>ChargeSense.AI — Industrial EV Telemetry & Predictive Analytics Platform</h1>
  <img src="chargesense/public/logo.png" alt="ChargeSense.AI Logo" width="200" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);"/>
  <h3>State-of-the-Art EV Telemetry and Predictive Analytics Platform</h3>
  <p><strong>Developed for the ET AI Hackathon 2026</strong></p>

  [![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black&style=for-the-badge)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
  [![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white&style=for-the-badge)](https://www.python.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.95.x-009688?logo=fastapi&logoColor=white&style=for-the-badge)](https://fastapi.tiangolo.com/)
  [![Groq](https://img.shields.io/badge/Groq-LLaMA%203.3-orange?style=for-the-badge)](https://groq.com/)
  [![Three.js](https://img.shields.io/badge/Three.js-Interactive-black?logo=three.js&logoColor=white&style=for-the-badge)](https://threejs.org/)
</div>

---

## Platform Overview

**ChargeSense.AI** is a unified, full-stack EV fleet intelligence and logistics optimization portal engineered to transition siloed vehicle data into an actionable decision-making database. It enables Logistics Managers, Procurement Officers, Cell Quality Engineers, and Sustainability Officers to perform end-to-end operational workflows—ranging from spatial fleet tracking and predictive battery degradation monitoring to interactive co-offending network link-analysis and AI-assisted conversational query resolution.

The platform is designed to scale dynamically, integrating real-time telemetry inputs with LLaMA 3.3 conversational intelligence.

---

## System Architecture

The ChargeSense.AI platform is built on a decoupled serverless architecture:

* **Client-Side (React Client App):** A responsive React + TypeScript Single Page Application (SPA) utilizing Tailwind CSS for styling, Leaflet for spatial coordinates tracking, Recharts for battery capacity curves, and Three.js + GSAP for the cinematic 3D Earth landing page.
* **Backend API (FastAPI):** A high-performance Python ASGI web service handling data ingestion, predictions from locally trained Scikit-Learn regressors, commodity pricing feeds, and LLM completions via Groq Cloud APIs.

---

## Key Functional Modules & Features

### 1. 🪐 3D Cinematic Orbit Landing
* **Volumetric Earth Sphere:** A custom Three.js globe showing 7 distinct, color-coded transport terminal nodes across India.
* **Internal Breathing Pulses:** Breathing scale animations that pulse internally inside dot borders to prevent visual overlap.
* **GSAP Transition:** Zoom-fly camera timelines that navigate to India's coordinates upon entry.

### 2. 📊 Predictive Fleet Telemetry & Battery SOH
* **India Tracking Map:** A customized Leaflet coordinate dashboard pinning 500 active commercial EVs across transport lanes.
* **Degradation Analytics:** Plots real-time cycle decay capacity curves using regression parameters trained on the **NASA Lithium-Ion Battery Aging dataset**.
* **Failure Boundaries:** Highlights critical battery thresholds (SOH < 70%) to issue pre-emptive maintenance warnings.

### 3. 🤖 AI Procurement Agent (VoltAdvisor)
* **Electrification TCO Matcher:** Filter payload requirements and range margins to match 17 commercial EV models.
* **Spec Ground-Truth Chatbot:** Integrates **Groq LLaMA 3.3 70B** to generate custom transition reports using ground-truth Indian OEM specifications (Tata, Ashok Leyland, Olectra).
* **Interactive Cards:** Selection clicks automatically query the chatbot to compile custom TCO profiles.

### 4. 🗺️ Geopolitical Supply Chain Risk & QMS (VoltQMS)
* **Commodity Price Feeds:** Monitors indexes for Cobalt, Lithium, and Nickel.
* **Geopolitical Shipping Map:** Visualizes shipping channels from global mineral suppliers to India HQ with polyline risk color grading.
* **VoltQMS Quality Control:** Monitors manufacturing internal resistance in an SPC control chart. Anomalies trigger diagnostic LLaMA completions to recommend corrective actions.

### 5. 🌿 Real-Time Carbon Mitigation Ticker
* **High-Frequency offset counter:** Dynamic ticking counter updating every 100ms based on active EV savings indices.
* **Class Emissions:** Compare target vs. actual saved CO₂ by cargo dimensions.
* **Audits Checklist:** Progress logs tracking terminal electrification completions.

---

## Installation & Local Setup

### Prerequisites
* Node.js (v18+)
* Python (v3.9+)

### Step 1: Install Frontend Dependencies
```bash
cd chargesense
npm install
```

### Step 2: Install Backend Dependencies
```bash
cd ../backend
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

---

## Running Locally

To run the full-stack application locally:

### Step 1: Start Backend Server
```bash
cd backend
python -m uvicorn main:app --port 8000 --reload
```

### Step 2: Start Frontend Application
```bash
cd chargesense
npm run dev
```

---

## Contributors

* **Ashish Ranising** (GitHub: [@notar7](https://github.com/notar7))

---

<div align="center">
  <p><strong>Developed for the ET AI Hackathon 2026</strong></p>
  <p>© 2026 ChargeSense.AI. All rights reserved.</p>
</div>
