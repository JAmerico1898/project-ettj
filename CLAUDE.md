# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mobile application for modeling the term structure of Brazilian DI (CDI) interest rates using DI1 futures contracts from B3. Educational tool for fixed income analysis developed at Coppead/UFRJ.

**Architecture**: Expo (React Native) mobile frontend + FastAPI Python backend.

## Project Structure

```
project-ettj/
├── backend/                 # Python FastAPI server
│   ├── main.py              # API endpoints
│   ├── services/
│   │   ├── data.py          # DI1 data fetching (pyield)
│   │   └── models.py        # Interpolation/smoothing methods
│   └── requirements.txt
├── mobile/                  # Expo React Native app
│   ├── app/                 # Screens and navigation
│   ├── components/          # Reusable UI components
│   ├── services/
│   │   └── api.ts           # Backend API client
│   └── package.json
├── ettj.py                  # Original Streamlit app (reference)
└── README.md
```

## Commands

### Backend (Python)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Mobile (Expo)
```bash
cd mobile
npm install
npx expo start
# Scan QR code with Expo Go app on your phone
```

### Git / GitHub
```bash
# Initialize repository (first time)
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/project-ettj.git
git push -u origin main

# Daily workflow
git add .
git commit -m "Description of changes"
git push
```

## Architecture Details

### Backend (FastAPI)

The backend exposes REST endpoints for the mobile app. Core computation logic migrated from `ettj.py`:

**Endpoints:**
- `GET /api/di1?date=YYYY-MM-DD` - Fetch DI1 futures data
- `POST /api/curve` - Calculate smoothed curve (accepts method, parameters, data)

**Key modules to extract from `ettj.py`:**
- `buscar_dados_di1()` → `services/data.py`
- All interpolation functions → `services/models.py`
- Nelson-Siegel, Nelson-Siegel-Svensson fitting → `services/models.py`

**Technical notes:**
- PyArrow arrays from pyield must be converted to numpy using `.to_numpy()`
- Uses 252 business days/year (Brazilian market standard)
- Rates stored as decimals, API should return percentages for mobile

### Mobile (Expo/React Native)

**Key screens:**
- Home: Date picker, method selector
- Chart: Interactive rate curve visualization
- Data: Contract details table

**Recommended libraries:**
- `react-native-chart-kit` or `victory-native`: Charts
- `expo-router`: Navigation
- `axios` or `fetch`: API calls
- `react-native-paper` or `tamagui`: UI components

**State management:** Start with React Context; add Zustand if needed.

### Backend Dependencies
- `fastapi`: REST API framework
- `uvicorn`: ASGI server
- `pyield`: B3 futures data source
- `scipy`: Interpolation and optimization
- `pandas`/`numpy`: Data manipulation

### Mobile Dependencies
- `expo`: Managed React Native workflow
- `react-native-chart-kit`: Charting
- `axios`: HTTP client

## Domain Knowledge

### Smoothing Methods (7 total)
1. **Parametric**: Nelson-Siegel, Nelson-Siegel-Svensson (L-BFGS-B optimization)
2. **Splines**: Cubic, Akima, PCHIP (monotonic), Smoothing Spline
3. **Simple**: Linear interpolation

### Brazilian Market Conventions
- 252 business days per year
- DI1 contracts are zero-coupon rates with daily compounding
- Maximum 5 years = 1260 business days filter
