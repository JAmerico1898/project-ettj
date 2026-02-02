## Core Features Breakdown

### **Feature 1: Project Setup & Infrastructure**
- **Backend Setup**
  - Initialize FastAPI project structure
  - Configure CORS for mobile access
  - Set up uvicorn server configuration
  - Create requirements.txt with all dependencies
  
- **Mobile Setup**
  - Initialize Expo React Native project
  - Configure app.json/app.config.js
  - Set up navigation with expo-router
  - Install and configure UI library (react-native-paper or tamagui)

---

### **Feature 2: Data Service Layer (Backend)**
- **DI1 Data Fetching** (`backend/services/data.py`)
  - Implement `fetch_di1_data(date)` function
  - Integrate pyield library to fetch B3 futures contracts
  - Convert PyArrow arrays to numpy arrays
  - Filter contracts: max 5 years (1260 business days)
  - Return structured data: contract codes, expiry dates, rates
  
- **Data Validation**
  - Validate date format (YYYY-MM-DD)
  - Handle missing/unavailable trading days
  - Error handling for B3 API failures

---

### **Feature 3: Mathematical Models (Backend)**
- **Interpolation Methods** (`backend/services/models.py`)
  
  **Simple Methods:**
  - Linear interpolation
  
  **Spline Methods:**
  - Cubic spline
  - Akima spline
  - PCHIP (monotonic)
  - Smoothing spline
  
  **Parametric Methods:**
  - Nelson-Siegel model (4 parameters)
  - Nelson-Siegel-Svensson model (6 parameters)
  - L-BFGS-B optimization for parameter fitting
  
- **Common Utilities**
  - Convert business days to years (252-day convention)
  - Convert rates: decimal ↔ percentage
  - Generate smooth curve points (e.g., daily for 5 years)

---

### **Feature 4: REST API Endpoints (Backend)**
- **GET `/api/di1`**
  - Query param: `date` (YYYY-MM-DD)
  - Response: List of DI1 contracts with rates, expiry dates
  - Error handling: 404 if no data, 400 for invalid date
  
- **POST `/api/curve`**
  - Request body:
    ```json
    {
      "method": "nelson-siegel",
      "data": [...],
      "parameters": {...}
    }
    ```
  - Response: Smoothed curve points (business_days, rates)
  - Support all 7 smoothing methods
  
- **GET `/api/methods`** (optional)
  - Return available smoothing methods with descriptions

---

### **Feature 5: API Client (Mobile)**
- **Service Layer** (`mobile/services/api.ts`)
  - Configure base URL (environment variable for dev/prod)
  - Implement `fetchDI1Data(date)` function
  - Implement `calculateCurve(method, data, params)` function
  - Error handling and retry logic
  - TypeScript interfaces for API responses

---

### **Feature 6: Home Screen (Mobile)**
- **UI Components**
  - Date picker (Brazilian date format: DD/MM/YYYY)
  - Method selector dropdown (7 options)
  - "Calculate Curve" action button
  - Loading states
  
- **Functionality**
  - Default to today's date
  - Validate selected date (not future, not weekend)
  - Navigate to Chart screen on success
  - Show error messages (toast/alert)

---

### **Feature 7: Chart Screen (Mobile)**
- **Visualization** (using react-native-chart-kit or victory-native)
  - Line chart: X-axis = Business Days/Years, Y-axis = Rate (%)
  - Plot original DI1 points (scatter)
  - Plot smoothed curve (line)
  - Interactive touch to show values
  - Zoom/pan capabilities
  
- **Display Information**
  - Selected date
  - Selected method name
  - Number of contracts used
  - Legend for original vs. smoothed

---

### **Feature 8: Data Table Screen (Mobile)**
- **Contract Details Table**
  - Columns: Contract Code, Expiry Date, Business Days, Rate (%)
  - Sortable columns
  - Scrollable list
  
- **Smoothed Curve Data** (optional)
  - Toggle between original contracts and curve points
  - Export functionality (share as CSV)

---

### **Feature 9: Settings/Configuration (Mobile)**
- **Display Preferences**
  - Toggle rate format (% vs. decimal)
  - Chart color scheme
  - Default smoothing method
  
- **Backend Configuration**
  - Backend URL setting (for testing different environments)

---

### **Feature 10: Error Handling & Edge Cases**
- **Backend**
  - Handle B3 API downtime
  - Validate optimization convergence for parametric models
  - Return meaningful error messages
  
- **Mobile**
  - Offline detection
  - Network timeout handling
  - Invalid data handling (empty curves)
  - User-friendly error messages in Portuguese

---

### **Feature 11: Educational Content (Optional)**
- **Info Screens**
  - Explanation of each smoothing method
  - Brazilian market conventions (252 days, DI rates)
  - Glossary of terms
  
- **Help/Tutorial**
  - First-time user onboarding
  - Method comparison guide

---

### **Feature 12: Testing & Deployment**
- **Backend Testing**
  - Unit tests for each interpolation method
  - Integration tests for API endpoints
  - Test with historical B3 data
  
- **Mobile Testing**
  - Component tests
  - End-to-end flow testing
  - Test on iOS and Android
  
- **Deployment**
  - Backend: Docker container or cloud hosting
  - Mobile: Build for Expo Go / standalone APK/IPA
  - GitHub repository setup

---

## Development Priority

**Phase 1 (MVP):**
1. Project Setup (Features 1)
2. Data Service + Simple Interpolation (Features 2, 3 - linear only)
3. Basic API (Feature 4 - GET DI1, POST curve with linear)
4. Home + Chart screens (Features 6, 7)

**Phase 2 (Full Functionality):**
5. All 7 smoothing methods (Feature 3)
6. Data table screen (Feature 8)
7. API client improvements (Feature 5)

**Phase 3 (Polish):**
8. Settings (Feature 9)
9. Educational content (Feature 11)
10. Comprehensive testing (Feature 12)

---

This breakdown gives you **12 distinct features** that can be developed incrementally. Each feature has clear inputs/outputs and can be assigned as separate development tasks.