# Testing Guide - ETTJ Mobile API Client

This document provides a comprehensive guide for testing the mobile API client.

## Environment Setup

### Prerequisites

1. **Backend Running**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Mobile App**
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

3. **Network Configuration**
   - For emulator: Use `http://localhost:8000` or `http://10.0.2.2:8000` (Android)
   - For physical device: Use your computer's local IP (e.g., `http://192.168.1.100:8000`)
   - Set via environment variable: `EXPO_PUBLIC_API_URL=http://your-ip:8000`

## Unit Tests

### Running Tests

```bash
# Install test dependencies (if not installed)
npm install --save-dev jest @types/jest ts-jest

# Add to package.json scripts:
# "test": "jest"

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### Test Files

| File | Description |
|------|-------------|
| `__tests__/api.test.ts` | API client, error handling, mock data tests |

## Manual Testing Checklist

### 1. Health Check

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Basic health | Call `api.healthCheck()` | Returns `{ status: "ok" }` |
| Detailed health | Call `api.healthCheckDetailed()` | Returns status with version, timestamp |

### 2. DI1 Data Fetching

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Fetch latest data | Call `api.fetchDI1Data()` without date | Returns contracts for last business day |
| Fetch specific date | Call `api.fetchDI1Data('2024-01-15')` | Returns contracts for that date |
| Invalid date format | Call `api.fetchDI1Data('invalid')` | Returns ValidationError |
| Weekend date | Call `api.fetchDI1Data('2024-01-13')` (Saturday) | Returns adjusted date (Friday) or error |
| Future date | Call `api.fetchDI1Data('2030-01-01')` | Returns ValidationError |

### 3. Methods

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Get methods | Call `api.getAvailableMethods()` | Returns 7 methods |
| Verify categories | Check method categories | Simples, Splines, Paramétrico |

### 4. Curve Calculation

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Calculate NSS curve | Call `calculateCurve` with contracts | Returns points with parameters |
| Calculate linear | Use method `'linear'` | Returns interpolated points |
| Invalid method | Use invalid method name | Returns ValidationError |
| Empty contracts | Send empty contracts array | Returns ValidationError |

### 5. Error Handling

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Backend offline | Stop backend, make request | Returns NetworkError with retry attempts |
| Request timeout | Set very low timeout | Returns TimeoutError |
| Network offline | Disable network, make request | Returns NetworkError immediately |

### 6. Retry Logic

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Transient failure | Simulate 503 error | Retries up to 3 times |
| Permanent failure | Simulate 400 error | No retry, returns ValidationError |
| Recovery | Return error twice, then success | Request succeeds after retries |

### 7. React Hooks

| Test | Steps | Expected Result |
|------|-------|-----------------|
| useDI1Data | Use hook in component | Loading → Data states work |
| useDI1DataOnMount | Render component | Fetches on mount automatically |
| useCurve | Call calculateCurve | Returns curve data |
| useWorkflow | Execute workflow | Returns combined di1 + curve |
| Error state | Trigger error | Hook returns error, errorMessage |
| Reset | Call reset() | Clears data and error |

## Integration Testing

### Complete Workflow Test

```typescript
import { api } from './services/api';

async function testCompleteWorkflow() {
  console.log('Starting integration test...');

  // 1. Health check
  const health = await api.healthCheck();
  console.log('Health:', health);

  // 2. Get methods
  const methods = await api.getAvailableMethods();
  console.log('Methods:', methods.length);

  // 3. Fetch DI1 data
  const di1 = await api.fetchDI1Data();
  console.log('DI1 contracts:', di1.count);

  // 4. Calculate curve
  const curve = await api.calculateCurve({
    reference_date: di1.actual_date,
    method: 'nelson_siegel_svensson',
    contracts: di1.contracts,
  });
  console.log('Curve points:', curve.points.length);

  // 5. Test workflow endpoint
  const workflow = await api.workflow({
    method: 'nelson_siegel_svensson',
  });
  console.log('Workflow completed');

  console.log('All tests passed!');
}
```

### Hook Usage Test

```tsx
import { useDI1DataOnMount, useCurve } from './hooks';

function TestComponent() {
  const { contracts, loading, error, actualDate } = useDI1DataOnMount();
  const { calculateCurve, points } = useCurve();

  useEffect(() => {
    if (contracts.length > 0 && actualDate) {
      calculateCurve({
        reference_date: actualDate,
        method: 'nelson_siegel_svensson',
        contracts,
      });
    }
  }, [contracts, actualDate]);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View>
      <Text>Contracts: {contracts.length}</Text>
      <Text>Curve points: {points.length}</Text>
    </View>
  );
}
```

## Error Scenarios

### Common Errors and Their Messages

| Error Code | HTTP Status | Portuguese Message |
|------------|-------------|-------------------|
| NETWORK_ERROR | - | "Erro de conexão. Verifique sua internet e tente novamente." |
| TIMEOUT_ERROR | 408 | "A requisição excedeu o tempo limite. Tente novamente." |
| VALIDATION_ERROR | 400 | "Dados inválidos. Verifique os parâmetros e tente novamente." |
| NOT_FOUND | 404 | "Dados não encontrados para a data selecionada." |
| SERVER_ERROR | 500 | "Erro interno do servidor. Tente novamente mais tarde." |
| SERVICE_UNAVAILABLE | 503 | "Serviço em manutenção. Tente novamente em alguns minutos." |

## Performance Testing

### Response Time Expectations

| Endpoint | Expected Time |
|----------|--------------|
| Health check | < 100ms |
| DI1 data | < 2s (first request), < 500ms (cached) |
| Curve calculation | < 1s (simple methods), < 3s (parametric) |
| Workflow | < 4s |

### Load Testing

For production readiness, test with:
- Multiple concurrent requests
- Large date ranges
- Compare all methods simultaneously

## Debugging Tips

### Enable Logging

Logging is enabled by default in development (`__DEV__`). Check console for:
- `[API] GET /api/di1` - Request logs
- `[API] Response 200 (150ms)` - Response logs with timing
- `[API] Retrying request (attempt 1/3)` - Retry logs

### Common Issues

1. **"Você está offline"** - Check network connectivity
2. **Connection refused** - Backend not running
3. **Timeout errors** - Backend too slow or network issues
4. **CORS errors** - Only on web, configure backend CORS

## Mock Mode

For testing without backend:

```typescript
import {
  MOCK_DI1_RESPONSE,
  MOCK_CURVE_RESPONSE,
  simulateDelay,
} from './services/apiMocks';

// Use mock data in development
const useMockData = __DEV__ && !BACKEND_AVAILABLE;

async function fetchData() {
  if (useMockData) {
    await simulateDelay(200, 500);
    return MOCK_DI1_RESPONSE;
  }
  return api.fetchDI1Data();
}
```
