# Feature 1: Project Setup & Infrastructure

## Overview
Establish the foundational project structure for both backend (FastAPI) and mobile (Expo React Native) applications. This feature creates the skeleton of the entire application with proper configuration, dependency management, and development environment setup.

---

## Objectives
- Create a well-organized project structure following best practices
- Configure backend API server with CORS for mobile access
- Initialize mobile app with Expo managed workflow
- Set up navigation system for mobile screens
- Install and configure essential dependencies
- Establish development workflow (run, test, deploy)

---

## Backend Setup

### Directory Structure
```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore patterns
├── services/
│   ├── __init__.py
│   ├── data.py           # DI1 data fetching (placeholder)
│   └── models.py         # Interpolation methods (placeholder)
├── routers/
│   ├── __init__.py
│   └── api.py           # API endpoints
├── schemas/
│   ├── __init__.py
│   └── contracts.py     # Pydantic models
└── utils/
    ├── __init__.py
    └── config.py        # Configuration management
```

### Files to Create

#### `backend/requirements.txt`
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pyield==1.3.0
scipy==1.11.4
pandas==2.1.4
numpy==1.26.3
python-dotenv==1.0.0
pydantic==2.5.3
pydantic-settings==2.1.0
```

#### `backend/.env.example`
```bash
# Server Configuration
HOST=0.0.0.0
PORT=8000
RELOAD=true

# CORS Configuration (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:19006,exp://192.168.1.*

# Application Settings
APP_NAME="ETTJ DI1 API"
DEBUG=true
```

#### `backend/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import api
from utils.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Brazilian DI1 Term Structure API for mobile application"
)

# CORS configuration for mobile app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api.router, prefix="/api", tags=["api"])

@app.get("/")
async def root():
    return {
        "message": "ETTJ DI1 API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

#### `backend/utils/config.py`
```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:19006",  # Expo web
        "exp://192.168.1.*",        # Expo mobile (local network)
    ]
    
    # Application
    APP_NAME: str = "ETTJ DI1 API"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

#### `backend/routers/api.py`
```python
from fastapi import APIRouter, HTTPException
from datetime import date

router = APIRouter()

@router.get("/di1")
async def get_di1_data(date: str):
    """
    Fetch DI1 futures contracts for a given date.
    
    Args:
        date: Date in YYYY-MM-DD format
    
    Returns:
        List of DI1 contracts with rates and expiry dates
    """
    # Placeholder - will be implemented in Feature 2
    return {
        "message": "DI1 data endpoint (placeholder)",
        "date": date,
        "contracts": []
    }

@router.post("/curve")
async def calculate_curve():
    """
    Calculate smoothed yield curve using selected method.
    
    Returns:
        Smoothed curve points
    """
    # Placeholder - will be implemented in Feature 3
    return {
        "message": "Curve calculation endpoint (placeholder)",
        "curve": []
    }

@router.get("/methods")
async def get_available_methods():
    """
    Get list of available smoothing methods.
    
    Returns:
        List of method names and descriptions
    """
    return {
        "methods": [
            {
                "id": "linear",
                "name": "Linear Interpolation",
                "type": "simple",
                "description": "Simple linear interpolation between points"
            },
            {
                "id": "cubic",
                "name": "Cubic Spline",
                "type": "spline",
                "description": "Smooth cubic spline interpolation"
            },
            {
                "id": "akima",
                "name": "Akima Spline",
                "type": "spline",
                "description": "Akima spline (reduces oscillations)"
            },
            {
                "id": "pchip",
                "name": "PCHIP",
                "type": "spline",
                "description": "Monotonic piecewise cubic interpolation"
            },
            {
                "id": "smoothing",
                "name": "Smoothing Spline",
                "type": "spline",
                "description": "Regularized smoothing spline"
            },
            {
                "id": "nelson_siegel",
                "name": "Nelson-Siegel",
                "type": "parametric",
                "description": "4-parameter Nelson-Siegel model"
            },
            {
                "id": "nelson_siegel_svensson",
                "name": "Nelson-Siegel-Svensson",
                "type": "parametric",
                "description": "6-parameter Nelson-Siegel-Svensson model"
            }
        ]
    }
```

#### `backend/schemas/contracts.py`
```python
from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional

class DI1Contract(BaseModel):
    """Individual DI1 futures contract"""
    code: str = Field(..., description="Contract code (e.g., DI1F25)")
    expiry_date: date = Field(..., description="Contract expiry date")
    business_days: int = Field(..., description="Business days to expiry")
    rate: float = Field(..., description="Contract rate (as decimal)")
    rate_percent: float = Field(..., description="Contract rate (as percentage)")

class DI1Response(BaseModel):
    """Response for DI1 data endpoint"""
    reference_date: date
    contracts: List[DI1Contract]
    count: int

class CurvePoint(BaseModel):
    """Single point on the yield curve"""
    business_days: int
    years: float
    rate: float
    rate_percent: float

class CurveRequest(BaseModel):
    """Request to calculate yield curve"""
    method: str = Field(..., description="Interpolation method ID")
    data: List[dict] = Field(..., description="Original DI1 contract data")
    parameters: Optional[dict] = Field(default={}, description="Method-specific parameters")

class CurveResponse(BaseModel):
    """Response for curve calculation endpoint"""
    method: str
    original_points: List[CurvePoint]
    curve_points: List[CurvePoint]
    parameters_used: dict
```

#### `backend/services/__init__.py`
```python
# Placeholder - services will be implemented in Features 2 and 3
```

#### `backend/services/data.py`
```python
# Placeholder for Feature 2: DI1 data fetching
def fetch_di1_data(reference_date: str):
    """
    Fetch DI1 futures contracts from B3.
    
    To be implemented in Feature 2.
    """
    pass
```

#### `backend/services/models.py`
```python
# Placeholder for Feature 3: Interpolation methods
def calculate_curve(method: str, data: list, parameters: dict):
    """
    Calculate smoothed yield curve using specified method.
    
    To be implemented in Feature 3.
    """
    pass
```

#### `backend/.gitignore`
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
dist/
*.egg-info/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
.pytest_cache/
.coverage
htmlcov/
```

---

## Mobile Setup

### Directory Structure
```
mobile/
├── app/                   # Expo Router screens
│   ├── index.tsx         # Home screen
│   ├── chart.tsx         # Chart screen
│   ├── data.tsx          # Data table screen
│   ├── _layout.tsx       # Root layout
│   └── +not-found.tsx    # 404 screen
├── components/
│   ├── DatePicker.tsx
│   ├── MethodSelector.tsx
│   └── LoadingSpinner.tsx
├── services/
│   └── api.ts           # API client
├── types/
│   └── index.ts         # TypeScript interfaces
├── constants/
│   └── config.ts        # App configuration
├── app.json
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

### Files to Create

#### `mobile/package.json`
```json
{
  "name": "ettj-mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "expo-router": "~3.4.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "react-native-paper": "^5.12.0",
    "react-native-vector-icons": "^10.0.3",
    "axios": "^1.6.5",
    "react-native-chart-kit": "^6.12.0",
    "react-native-svg": "14.1.0",
    "@react-native-community/datetimepicker": "7.6.2",
    "expo-constants": "~15.4.0",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.3.0"
  },
  "private": true
}
```

#### `mobile/app.json`
```json
{
  "expo": {
    "name": "ETTJ DI1",
    "slug": "ettj-di1",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.coppead.ettjdi1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.coppead.ettjdi1"
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "scheme": "ettjdi1",
    "plugins": [
      "expo-router"
    ]
  }
}
```

#### `mobile/tsconfig.json`
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

#### `mobile/.env.example`
```bash
# Backend API URL
API_BASE_URL=http://192.168.1.100:8000

# For production, use your deployed backend URL
# API_BASE_URL=https://api.yourdomain.com
```

#### `mobile/constants/config.ts`
```typescript
import Constants from 'expo-constants';

// Get API URL from environment or use default
const getApiUrl = (): string => {
  // In development, use local IP
  // In production, use environment variable
  return process.env.API_BASE_URL || 'http://192.168.1.100:8000';
};

export const config = {
  apiBaseUrl: getApiUrl(),
  apiTimeout: 30000, // 30 seconds
  dateFormat: 'DD/MM/YYYY',
  maxBusinessDays: 1260, // 5 years
  businessDaysPerYear: 252,
};
```

#### `mobile/types/index.ts`
```typescript
export interface DI1Contract {
  code: string;
  expiry_date: string;
  business_days: number;
  rate: number;
  rate_percent: number;
}

export interface DI1Response {
  reference_date: string;
  contracts: DI1Contract[];
  count: number;
}

export interface CurvePoint {
  business_days: number;
  years: number;
  rate: number;
  rate_percent: number;
}

export interface SmoothingMethod {
  id: string;
  name: string;
  type: 'simple' | 'spline' | 'parametric';
  description: string;
}

export interface MethodsResponse {
  methods: SmoothingMethod[];
}

export interface CurveRequest {
  method: string;
  data: any[];
  parameters?: Record<string, any>;
}

export interface CurveResponse {
  method: string;
  original_points: CurvePoint[];
  curve_points: CurvePoint[];
  parameters_used: Record<string, any>;
}
```

#### `mobile/services/api.ts`
```typescript
import axios, { AxiosInstance } from 'axios';
import { config } from '@/constants/config';
import type { 
  DI1Response, 
  MethodsResponse, 
  CurveRequest, 
  CurveResponse 
} from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  async fetchDI1Data(date: string): Promise<DI1Response> {
    const response = await this.client.get('/api/di1', {
      params: { date },
    });
    return response.data;
  }

  async getAvailableMethods(): Promise<MethodsResponse> {
    const response = await this.client.get('/api/methods');
    return response.data;
  }

  async calculateCurve(request: CurveRequest): Promise<CurveResponse> {
    const response = await this.client.post('/api/curve', request);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

#### `mobile/app/_layout.tsx`
```typescript
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  return (
    <PaperProvider>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'ETTJ DI1',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="chart" 
          options={{ 
            title: 'Curva de Juros',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="data" 
          options={{ 
            title: 'Dados dos Contratos',
            headerShown: true 
          }} 
        />
      </Stack>
    </PaperProvider>
  );
}
```

#### `mobile/app/index.tsx`
```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        ETTJ DI1
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Estrutura a Termo da Taxa de Juros
      </Text>
      
      {/* Placeholder - will be implemented in Feature 6 */}
      <Button 
        mode="contained" 
        onPress={() => console.log('Date picker coming in Feature 6')}
        style={styles.button}
      >
        Selecionar Data
      </Button>
      
      <Button 
        mode="outlined" 
        onPress={() => console.log('Method selector coming in Feature 6')}
        style={styles.button}
      >
        Escolher Método
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 40,
    color: '#666',
  },
  button: {
    marginVertical: 10,
    width: 250,
  },
});
```

#### `mobile/app/chart.tsx`
```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function ChartScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">
        Gráfico da Curva
      </Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Chart visualization will be implemented in Feature 7
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    marginTop: 20,
    color: '#666',
  },
});
```

#### `mobile/app/data.tsx`
```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function DataScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">
        Dados dos Contratos
      </Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Data table will be implemented in Feature 8
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    marginTop: 20,
    color: '#666',
  },
});
```

#### `mobile/.gitignore`
```
# Dependencies
node_modules/

# Expo
.expo/
dist/
web-build/

# Environment
.env
.env.local

# Native
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# Debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# IDE
.vscode/
.idea/
```

---

## Development Commands

### Backend
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your local IP address

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Test API
curl http://localhost:8000/health
curl http://localhost:8000/api/methods
```

### Mobile
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your backend IP address (use your computer's local IP)

# Start Expo development server
npx expo start

# Or directly on device
npx expo start --android  # For Android
npx expo start --ios      # For iOS (Mac only)
```

### Finding Your Local IP Address
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4

# Example: 192.168.1.100
# Use this in mobile/.env: API_BASE_URL=http://192.168.1.100:8000
```

---

## Testing Feature 1

### Backend Tests
1. **Server starts successfully**
   ```bash
   uvicorn main:app --reload
   # Should see: "Uvicorn running on http://0.0.0.0:8000"
   ```

2. **Root endpoint responds**
   ```bash
   curl http://localhost:8000/
   # Expected: {"message": "ETTJ DI1 API", "version": "1.0.0", "status": "running"}
   ```

3. **Health check works**
   ```bash
   curl http://localhost:8000/health
   # Expected: {"status": "healthy"}
   ```

4. **Methods endpoint returns data**
   ```bash
   curl http://localhost:8000/api/methods
   # Expected: JSON with 7 methods
   ```

5. **CORS headers present**
   ```bash
   curl -H "Origin: http://localhost:19006" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS http://localhost:8000/api/curve
   # Should include CORS headers in response
   ```

### Mobile Tests
1. **App starts without errors**
   ```bash
   npx expo start
   # Should open Metro bundler
   ```

2. **Can scan QR code with Expo Go**
   - Scan QR from terminal
   - App should load home screen

3. **API client can connect**
   - Check console for any network errors
   - Verify backend URL is correct

4. **Navigation works**
   - Home screen displays
   - Can navigate to chart/data screens (when implemented)

5. **UI components render**
   - Text displays correctly
   - Buttons are clickable
   - No visual glitches

---

## Acceptance Criteria

### Backend
- ✅ FastAPI server runs on port 8000
- ✅ CORS configured for mobile access
- ✅ All endpoints respond (even if placeholder)
- ✅ Project structure follows best practices
- ✅ Dependencies installed correctly
- ✅ Environment configuration working
- ✅ No errors in server logs

### Mobile
- ✅ Expo app runs on physical device or emulator
- ✅ Can connect to backend API
- ✅ Navigation system operational
- ✅ UI library (React Native Paper) configured
- ✅ TypeScript compilation successful
- ✅ All screens accessible (even if placeholder)
- ✅ No red screen errors

---

## Common Issues & Solutions

### Backend

**Issue**: `ModuleNotFoundError: No module named 'fastapi'`
- **Solution**: Activate virtual environment, run `pip install -r requirements.txt`

**Issue**: CORS errors in mobile app
- **Solution**: Add mobile device's IP range to `ALLOWED_ORIGINS` in `.env`

**Issue**: Port 8000 already in use
- **Solution**: Change PORT in `.env` or kill existing process

### Mobile

**Issue**: Cannot connect to backend
- **Solution**: 
  1. Ensure backend is running
  2. Use computer's local IP (not localhost)
  3. Check firewall settings
  4. Verify both devices on same network

**Issue**: Metro bundler won't start
- **Solution**: 
  ```bash
  rm -rf node_modules
  npm install
  npx expo start --clear
  ```

**Issue**: TypeScript errors
- **Solution**: Ensure all `@types/*` packages installed, restart TypeScript server

---

## Next Steps

After completing Feature 1:
- **Feature 2**: Implement DI1 data fetching in `backend/services/data.py`
- **Feature 3**: Implement interpolation methods in `backend/services/models.py`
- **Feature 6**: Build Home screen UI with date picker and method selector
- **Feature 7**: Create Chart screen with visualization

---

## Documentation References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Axios Documentation](https://axios-http.com/)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2025-02-02 | Initial specification for Feature 1 |