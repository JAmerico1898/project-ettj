# Feature 6: Home Screen UI - Date Selection and Method Configuration

## Overview
Build the main home screen of the mobile application where users select a reference date, choose an interpolation method, configure parameters, and initiate the yield curve calculation. This screen serves as the primary entry point for the application. Make it appealing, sober and professional.

---

## Prerequisites
- **Feature 1** completed (project setup)
- **Feature 5** completed (API client with hooks)
- Mobile app running with navigation configured
- Backend API accessible

---

## Objectives
- Create intuitive date picker with Brazilian format (DD/MM/YYYY)
- Implement method selector with descriptions
- Add parameter configuration for advanced methods
- Display method information and requirements
- Show loading states during API calls
- Handle errors with user-friendly messages
- Navigate to Chart screen upon success
- Store user preferences (last selected date/method)
- Add quick date shortcuts (today, yesterday, last week)
- Validate inputs before submission
- Support both light and dark themes

---

## Screen Design

### Layout Structure
```
┌─────────────────────────────────┐
│ ETTJ DI1                    [ℹ️] │ Header
├─────────────────────────────────┤
│                                 │
│  📅 Data de Referência          │ Date Section
│  ┌──────────────────────────┐  │
│  │  31/01/2025        [📅]   │  │
│  └──────────────────────────┘  │
│                                 │
│  Atalhos:                       │ Quick Dates
│  [Hoje] [Ontem] [Semana Pass.] │
│                                 │
│  📊 Método de Interpolação      │ Method Section
│  ┌──────────────────────────┐  │
│  │ Nelson-Siegel       [▼]  │  │
│  └──────────────────────────┘  │
│                                 │
│  ℹ️ Modelo paramétrico de 4    │ Method Info
│  parâmetros para suavização    │
│  da curva de juros             │
│                                 │
│  ⚙️ Parâmetros (Opcional)      │ Parameters (collapsed)
│  [Expandir]                     │
│                                 │
│  📋 Resumo                      │ Summary Section
│  • Data: 31/01/2025            │
│  • Método: Nelson-Siegel        │
│  • Maturidade: 5 anos           │
│                                 │
├─────────────────────────────────┤
│  [    Calcular Curva    ]      │ Action Button
│                                 │
│  [Ver Dados Históricos]         │ Secondary Action
└─────────────────────────────────┘
```

---

## Implementation

### File Structure
```
mobile/
├── app/
│   └── index.tsx              # Home screen (UPDATE)
├── components/
│   ├── DatePicker.tsx         # Date picker component (NEW)
│   ├── MethodSelector.tsx     # Method selector (NEW)
│   ├── ParameterEditor.tsx    # Parameter configuration (NEW)
│   ├── QuickDateButtons.tsx   # Quick date shortcuts (NEW)
│   ├── LoadingOverlay.tsx     # Loading state (NEW)
│   └── ErrorMessage.tsx       # Error display (NEW)
├── utils/
│   ├── dateUtils.ts           # Date utilities (NEW)
│   └── validation.ts          # Input validation (NEW)
└── styles/
    └── homeScreen.ts          # Screen styles (NEW)
```

---

## Code Implementation

### `mobile/utils/dateUtils.ts` (NEW FILE)
```typescript
/**
 * Date utilities for Brazilian format
 */

export function formatDateBR(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateBR(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  const date = new Date(year, month, day);
  if (date.getDate() !== day || date.getMonth() !== month) return null;
  
  return date;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date);
  // TODO: Add Brazilian holiday calendar
}

export function getPreviousBusinessDay(date: Date): Date {
  const newDate = new Date(date);
  do {
    newDate.setDate(newDate.getDate() - 1);
  } while (isWeekend(newDate));
  return newDate;
}

export function getToday(): Date {
  return new Date();
}

export function getYesterday(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
}

export function getLastWeek(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date;
}

export function getTodayOrLastBusinessDay(): Date {
  const today = getToday();
  return isBusinessDay(today) ? today : getPreviousBusinessDay(today);
}

export function validateDateRange(date: Date): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  if (checkDate > today) {
    return 'A data não pode ser no futuro';
  }
  
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  
  if (checkDate < tenYearsAgo) {
    return 'A data não pode ser mais de 10 anos no passado';
  }
  
  if (isWeekend(checkDate)) {
    return 'Selecione um dia útil (segunda a sexta-feira)';
  }
  
  return null;
}
```

### `mobile/utils/validation.ts` (NEW FILE)
```typescript
/**
 * Input validation utilities
 */
import type { MethodInfo } from '@/types/api';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateMethodSelection(
  method: string | null,
  availableMethods: MethodInfo[]
): ValidationResult {
  const errors: string[] = [];
  
  if (!method) {
    errors.push('Selecione um método de interpolação');
    return { isValid: false, errors };
  }
  
  const methodExists = availableMethods.some(m => m.id === method);
  if (!methodExists) {
    errors.push('Método selecionado não é válido');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateParameters(
  method: string,
  parameters: Record<string, any>,
  methodInfo: MethodInfo | undefined
): ValidationResult {
  const errors: string[] = [];
  
  if (!methodInfo) {
    return { isValid: true, errors };
  }
  
  // Validate smoothing parameter for smoothing spline
  if (method === 'smoothing' && parameters.smoothing !== undefined) {
    const smoothing = parameters.smoothing;
    if (typeof smoothing !== 'number' || smoothing < 0 || smoothing > 10) {
      errors.push('Parâmetro de suavização deve estar entre 0 e 10');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### `mobile/components/DatePicker.tsx` (NEW FILE)
```typescript
/**
 * Brazilian-format date picker component
 */
import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateBR, formatDateISO, parseDateBR, validateDateRange } from '@/utils/dateUtils';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

export function DatePicker({ value, onChange, error }: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [textValue, setTextValue] = useState(formatDateBR(value));

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // Keep open on iOS
    
    if (selectedDate) {
      onChange(selectedDate);
      setTextValue(formatDateBR(selectedDate));
    }
  };

  const handleTextChange = (text: string) => {
    setTextValue(text);
    
    // Try to parse when user types complete date
    if (text.length === 10) {
      const parsed = parseDateBR(text);
      if (parsed) {
        onChange(parsed);
      }
    }
  };

  const handleTextBlur = () => {
    // Validate and reformat on blur
    const parsed = parseDateBR(textValue);
    if (parsed) {
      onChange(parsed);
      setTextValue(formatDateBR(parsed));
    } else {
      // Revert to last valid value
      setTextValue(formatDateBR(value));
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Data de Referência"
        value={textValue}
        onChangeText={handleTextChange}
        onBlur={handleTextBlur}
        placeholder="DD/MM/AAAA"
        keyboardType="numeric"
        error={!!error}
        right={
          <TextInput.Icon
            icon="calendar"
            onPress={() => setShowPicker(true)}
          />
        }
        style={styles.input}
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
});
```

### `mobile/components/QuickDateButtons.tsx` (NEW FILE)
```typescript
/**
 * Quick date selection buttons
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import {
  getTodayOrLastBusinessDay,
  getPreviousBusinessDay,
  getLastWeek,
} from '@/utils/dateUtils';

interface QuickDateButtonsProps {
  onDateSelect: (date: Date) => void;
}

export function QuickDateButtons({ onDateSelect }: QuickDateButtonsProps) {
  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.label}>
        Atalhos:
      </Text>
      <View style={styles.buttonRow}>
        <Button
          mode="outlined"
          onPress={() => onDateSelect(getTodayOrLastBusinessDay())}
          style={styles.button}
          compact
        >
          Hoje
        </Button>
        <Button
          mode="outlined"
          onPress={() => onDateSelect(getPreviousBusinessDay(new Date()))}
          style={styles.button}
          compact
        >
          Ontem
        </Button>
        <Button
          mode="outlined"
          onPress={() => onDateSelect(getLastWeek())}
          style={styles.button}
          compact
        >
          Semana Passada
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    opacity: 0.7,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
  },
});
```

### `mobile/components/MethodSelector.tsx` (NEW FILE)
```typescript
/**
 * Method selection dropdown with descriptions
 */
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Menu, Button, Text, Divider, IconButton } from 'react-native-paper';
import type { MethodInfo } from '@/types/api';

interface MethodSelectorProps {
  methods: MethodInfo[];
  selectedMethod: string | null;
  onMethodSelect: (methodId: string) => void;
  error?: string;
}

export function MethodSelector({
  methods,
  selectedMethod,
  onMethodSelect,
  error,
}: MethodSelectorProps) {
  const [visible, setVisible] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const selectedMethodInfo = methods.find(m => m.id === selectedMethod);

  const getMethodTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      simple: 'Simples',
      spline: 'Spline',
      parametric: 'Paramétrico',
    };
    return labels[type] || type;
  };

  const getMethodTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      simple: '#4CAF50',
      spline: '#2196F3',
      parametric: '#FF9800',
    };
    return colors[type] || '#757575';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="labelLarge" style={styles.label}>
          Método de Interpolação
        </Text>
        {selectedMethodInfo && (
          <IconButton
            icon="information"
            size={20}
            onPress={() => setShowInfo(!showInfo)}
          />
        )}
      </View>

      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setVisible(true)}
            style={[styles.selector, error && styles.selectorError]}
            contentStyle={styles.selectorContent}
            icon="chevron-down"
          >
            {selectedMethodInfo?.name || 'Selecione um método'}
          </Button>
        }
      >
        <ScrollView style={styles.menuScroll}>
          {methods.map((method, index) => (
            <React.Fragment key={method.id}>
              <Menu.Item
                onPress={() => {
                  onMethodSelect(method.id);
                  setVisible(false);
                }}
                title={method.name}
                leadingIcon={selectedMethod === method.id ? 'check' : undefined}
                style={selectedMethod === method.id && styles.selectedItem}
              />
              {index < methods.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </ScrollView>
      </Menu>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {selectedMethodInfo && showInfo && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: getMethodTypeBadgeColor(selectedMethodInfo.type) },
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {getMethodTypeLabel(selectedMethodInfo.type)}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.minPoints}>
              Mín. {selectedMethodInfo.min_points} pontos
            </Text>
          </View>
          
          <Text variant="bodyMedium" style={styles.description}>
            {selectedMethodInfo.description}
          </Text>

          {Object.keys(selectedMethodInfo.parameters).length > 0 && (
            <View style={styles.parametersInfo}>
              <Text variant="labelSmall" style={styles.parametersLabel}>
                Parâmetros disponíveis:
              </Text>
              {Object.entries(selectedMethodInfo.parameters).map(([key, param]) => (
                <Text key={key} variant="bodySmall" style={styles.parameterItem}>
                  • {key}: {param.description}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    marginBottom: 8,
  },
  selector: {
    marginBottom: 8,
  },
  selectorError: {
    borderColor: '#B00020',
  },
  selectorContent: {
    justifyContent: 'space-between',
  },
  menuScroll: {
    maxHeight: 400,
  },
  selectedItem: {
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  infoCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  minPoints: {
    opacity: 0.7,
  },
  description: {
    marginBottom: 8,
  },
  parametersInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  parametersLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  parameterItem: {
    marginLeft: 8,
    opacity: 0.8,
  },
});
```

### `mobile/components/ParameterEditor.tsx` (NEW FILE)
```typescript
/**
 * Parameter configuration for advanced methods
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import type { MethodInfo } from '@/types/api';

interface ParameterEditorProps {
  method: MethodInfo | undefined;
  parameters: Record<string, any>;
  onParametersChange: (params: Record<string, any>) => void;
}

export function ParameterEditor({
  method,
  parameters,
  onParametersChange,
}: ParameterEditorProps) {
  const [expanded, setExpanded] = useState(false);

  if (!method || Object.keys(method.parameters).length === 0) {
    return null;
  }

  const handleParameterChange = (key: string, value: any) => {
    onParametersChange({
      ...parameters,
      [key]: value,
    });
  };

  const resetToDefaults = () => {
    const defaults: Record<string, any> = {};
    Object.entries(method.parameters).forEach(([key, param]) => {
      if (param.default !== undefined) {
        defaults[key] = param.default;
      }
    });
    onParametersChange(defaults);
  };

  return (
    <View style={styles.container}>
      <Button
        mode="text"
        onPress={() => setExpanded(!expanded)}
        icon={expanded ? 'chevron-up' : 'chevron-down'}
        contentStyle={styles.toggleButton}
      >
        Parâmetros {expanded ? '(Ocultar)' : '(Avançado)'}
      </Button>

      {expanded && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="labelLarge">Configuração de Parâmetros</Text>
              <Button mode="text" onPress={resetToDefaults} compact>
                Redefinir
              </Button>
            </View>

            {/* Smoothing parameter for smoothing spline */}
            {method.id === 'smoothing' && (
              <View style={styles.parameterGroup}>
                <Text variant="bodyMedium" style={styles.parameterLabel}>
                  Fator de Suavização
                </Text>
                <Text variant="bodySmall" style={styles.parameterDescription}>
                  0 = interpolação exata, valores maiores = mais suave
                </Text>
                <TextInput
                  mode="outlined"
                  keyboardType="decimal-pad"
                  value={parameters.smoothing?.toString() || '0.5'}
                  onChangeText={(text) => {
                    const value = parseFloat(text) || 0;
                    handleParameterChange('smoothing', value);
                  }}
                  style={styles.input}
                  dense
                />
              </View>
            )}

            {/* Initial parameters for Nelson-Siegel */}
            {method.id === 'nelson_siegel' && (
              <View style={styles.parameterGroup}>
                <Text variant="bodyMedium" style={styles.parameterLabel}>
                  Parâmetros Iniciais (Opcional)
                </Text>
                <Text variant="bodySmall" style={styles.parameterDescription}>
                  Deixe em branco para usar valores automáticos
                </Text>
                {/* Add input fields for beta0, beta1, beta2, tau if needed */}
                <Text variant="bodySmall" style={styles.note}>
                  Os parâmetros iniciais serão estimados automaticamente se não fornecidos.
                </Text>
              </View>
            )}

            <Text variant="bodySmall" style={styles.helpText}>
              💡 Para a maioria dos casos, os valores padrão são recomendados.
            </Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  toggleButton: {
    justifyContent: 'flex-start',
  },
  card: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  parameterGroup: {
    marginBottom: 16,
  },
  parameterLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  parameterDescription: {
    opacity: 0.7,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
  note: {
    fontStyle: 'italic',
    opacity: 0.6,
    marginTop: 8,
  },
  helpText: {
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 8,
  },
});
```

### `mobile/components/LoadingOverlay.tsx` (NEW FILE)
```typescript
/**
 * Loading overlay component
 */
import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Carregando...' }: LoadingOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.message}>
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  message: {
    marginTop: 16,
  },
});
```

### `mobile/components/ErrorMessage.tsx` (NEW FILE)
```typescript
/**
 * Error message display component
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onRetry, onDismiss }: ErrorMessageProps) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            ⚠️ Erro
          </Text>
        </View>
        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>
      </Card.Content>
      {(onRetry || onDismiss) && (
        <Card.Actions>
          {onDismiss && (
            <Button onPress={onDismiss}>Fechar</Button>
          )}
          {onRetry && (
            <Button mode="contained" onPress={onRetry}>
              Tentar Novamente
            </Button>
          )}
        </Card.Actions>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFEBEE',
    marginBottom: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    color: '#C62828',
  },
  message: {
    color: '#B71C1C',
  },
});
```

### `mobile/app/index.tsx` (COMPLETE REWRITE)
```typescript
/**
 * Home Screen - Main entry point
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DatePicker } from '@/components/DatePicker';
import { QuickDateButtons } from '@/components/QuickDateButtons';
import { MethodSelector } from '@/components/MethodSelector';
import { ParameterEditor } from '@/components/ParameterEditor';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ErrorMessage } from '@/components/ErrorMessage';

import { useWorkflow } from '@/hooks/useWorkflow';
import { apiClient } from '@/services/api';
import type { MethodInfo } from '@/types/api';

import {
  formatDateBR,
  formatDateISO,
  getTodayOrLastBusinessDay,
  validateDateRange,
} from '@/utils/dateUtils';
import {
  validateMethodSelection,
  validateParameters,
} from '@/utils/validation';

const STORAGE_KEYS = {
  LAST_DATE: 'lastSelectedDate',
  LAST_METHOD: 'lastSelectedMethod',
  LAST_PARAMS: 'lastParameters',
};

export default function HomeScreen() {
  const router = useRouter();
  
  // State
  const [date, setDate] = useState<Date>(getTodayOrLastBusinessDay());
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [methods, setMethods] = useState<MethodInfo[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [dateError, setDateError] = useState<string | null>(null);
  const [methodError, setMethodError] = useState<string | null>(null);

  // API hooks
  const workflow = useWorkflow();

  // Load methods on mount
  useEffect(() => {
    loadMethods();
    loadLastSelections();
  }, []);

  const loadMethods = async () => {
    try {
      setLoadingMethods(true);
      const data = await apiClient.getAvailableMethods();
      setMethods(data);
    } catch (error) {
      console.error('Failed to load methods:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const loadLastSelections = async () => {
    try {
      const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_DATE);
      const lastMethod = await AsyncStorage.getItem(STORAGE_KEYS.LAST_METHOD);
      const lastParams = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PARAMS);

      if (lastDate) {
        const parsed = new Date(lastDate);
        if (!isNaN(parsed.getTime())) {
          setDate(parsed);
        }
      }

      if (lastMethod) {
        setSelectedMethod(lastMethod);
      }

      if (lastParams) {
        setParameters(JSON.parse(lastParams));
      }
    } catch (error) {
      console.error('Failed to load last selections:', error);
    }
  };

  const saveSelections = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_DATE, date.toISOString());
      if (selectedMethod) {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_METHOD, selectedMethod);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_PARAMS, JSON.stringify(parameters));
    } catch (error) {
      console.error('Failed to save selections:', error);
    }
  };

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    const error = validateDateRange(newDate);
    setDateError(error);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setMethodError(null);
    
    // Reset parameters when method changes
    const method = methods.find(m => m.id === methodId);
    if (method) {
      const defaults: Record<string, any> = {};
      Object.entries(method.parameters).forEach(([key, param]) => {
        if (param.default !== undefined) {
          defaults[key] = param.default;
        }
      });
      setParameters(defaults);
    }
  };

  const validateInputs = (): boolean => {
    let isValid = true;

    // Validate date
    const dateValidation = validateDateRange(date);
    if (dateValidation) {
      setDateError(dateValidation);
      isValid = false;
    } else {
      setDateError(null);
    }

    // Validate method
    const methodValidation = validateMethodSelection(selectedMethod, methods);
    if (!methodValidation.isValid) {
      setMethodError(methodValidation.errors[0]);
      isValid = false;
    } else {
      setMethodError(null);
    }

    // Validate parameters
    if (selectedMethod) {
      const method = methods.find(m => m.id === selectedMethod);
      const paramValidation = validateParameters(selectedMethod, parameters, method);
      if (!paramValidation.isValid) {
        // Could show parameter errors here
        isValid = false;
      }
    }

    return isValid;
  };

  const handleCalculate = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      await saveSelections();

      const result = await workflow.execute({
        date: formatDateISO(date),
        method: selectedMethod!,
        max_business_days: 1260,
        parameters,
        num_points: 1260,
      });

      if (result) {
        // Navigate to chart screen with result
        router.push({
          pathname: '/chart',
          params: {
            data: JSON.stringify(result),
          },
        });
      }
    } catch (error) {
      console.error('Workflow error:', error);
    }
  };

  const selectedMethodInfo = methods.find(m => m.id === selectedMethod);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            ETTJ DI1
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Estrutura a Termo da Taxa de Juros
          </Text>
        </View>

        {/* Error display */}
        {workflow.errorMessage && (
          <ErrorMessage
            message={workflow.errorMessage}
            onRetry={handleCalculate}
            onDismiss={workflow.reset}
          />
        )}

        {/* Date Selection */}
        <DatePicker
          value={date}
          onChange={handleDateChange}
          error={dateError || undefined}
        />

        <QuickDateButtons onDateSelect={handleDateChange} />

        <Divider style={styles.divider} />

        {/* Method Selection */}
        {loadingMethods ? (
          <Text>Carregando métodos...</Text>
        ) : (
          <>
            <MethodSelector
              methods={methods}
              selectedMethod={selectedMethod}
              onMethodSelect={handleMethodSelect}
              error={methodError || undefined}
            />

            <ParameterEditor
              method={selectedMethodInfo}
              parameters={parameters}
              onParametersChange={setParameters}
            />
          </>
        )}

        <Divider style={styles.divider} />

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.summaryTitle}>
              📋 Resumo
            </Text>
            <View style={styles.summaryItem}>
              <Text variant="bodyMedium">📅 Data:</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {formatDateBR(date)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="bodyMedium">📊 Método:</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {selectedMethodInfo?.name || 'Não selecionado'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="bodyMedium">⏱️ Maturidade:</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                5 anos (1260 dias úteis)
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <Button
          mode="contained"
          onPress={handleCalculate}
          disabled={!selectedMethod || !!dateError || workflow.loading}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          loading={workflow.loading}
        >
          {workflow.loading ? 'Calculando...' : 'Calcular Curva'}
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.push('/data')}
          style={styles.secondaryButton}
        >
          Ver Dados Históricos
        </Button>
      </ScrollView>

      <LoadingOverlay
        visible={workflow.loading}
        message="Buscando dados e calculando curva..."
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    color: '#6750A4',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  summaryCard: {
    marginBottom: 24,
    backgroundColor: '#F3E5F5',
  },
  summaryTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  primaryButton: {
    marginBottom: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  secondaryButton: {
    marginBottom: 24,
  },
});
```

---

## Testing

### Manual Testing Checklist

```markdown
# Home Screen Testing Checklist

## Date Selection
- [ ] Date picker opens when calendar icon clicked
- [ ] Can type date manually in DD/MM/YYYY format
- [ ] Date formats correctly on blur
- [ ] Invalid dates show error message
- [ ] Weekend dates show error message
- [ ] Future dates show error message
- [ ] Quick date buttons work (Hoje, Ontem, Semana Passada)
- [ ] Selected date displays in Brazilian format

## Method Selection
- [ ] Method dropdown shows all 7 methods
- [ ] Selected method displays correctly
- [ ] Method info expands when info icon clicked
- [ ] Method type badge shows correct color
- [ ] Method description displays
- [ ] Minimum points requirement shown

## Parameter Configuration
- [ ] Parameters section hidden by default
- [ ] Parameters expand when clicked
- [ ] Smoothing parameter input works
- [ ] Reset button restores defaults
- [ ] Invalid parameter values show error

## Summary Section
- [ ] Date displays correctly
- [ ] Method name displays correctly
- [ ] Maturity shows 5 years

## Action Button
- [ ] Button disabled when no method selected
- [ ] Button disabled when date has error
- [ ] Loading state shows during API call
- [ ] Success navigates to chart screen
- [ ] Error shows error message with retry

## Persistence
- [ ] Last selected date saved
- [ ] Last selected method saved
- [ ] Parameters saved
- [ ] Selections restored on app restart

## Error Handling
- [ ] Network errors show friendly message
- [ ] Backend errors show details
- [ ] Retry button works
- [ ] Dismiss button clears error

## UI/UX
- [ ] Keyboard doesn't cover inputs
- [ ] Scrolling works smoothly
- [ ] Loading overlay blocks interaction
- [ ] All text in Portuguese
- [ ] Touch targets large enough
```

---

## Acceptance Criteria

- ✅ Date picker works with Brazilian format (DD/MM/YYYY)
- ✅ Quick date shortcuts functional
- ✅ Date validation prevents invalid selections
- ✅ Method selector shows all available methods
- ✅ Method information displays correctly
- ✅ Parameter editor works for applicable methods
- ✅ Summary section shows current selections
- ✅ Calculate button disabled when inputs invalid
- ✅ Loading states display during API calls
- ✅ Errors show user-friendly messages
- ✅ Successful calculation navigates to chart
- ✅ User preferences persist across sessions
- ✅ All UI text in Portuguese
- ✅ Responsive on different screen sizes
- ✅ Works on both iOS and Android

---

## Next Steps

After Feature 6:
- **Feature 7**: Build Chart screen to visualize the curve
- **Feature 8**: Create Data table screen
- **Feature 9**: Add settings and preferences

---

## Dependencies

```json
{
  "@react-native-community/datetimepicker": "7.6.2",
  "@react-native-async-storage/async-storage": "^1.21.0"
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2025-02-02 | Initial specification for Feature 6 |