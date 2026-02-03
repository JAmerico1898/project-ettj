/**
 * App context for managing global state
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DI1Contract, DI1Response, SmoothingMethod, MethodInfo, WorkflowResponse } from '../types';
import { api, getErrorMessage } from '../services/api';

interface AppState {
  // Date selection
  selectedDate: Date | null; // null = use server default (last business day)
  actualDate: string | null; // The date data was actually found for

  // Method selection
  selectedMethod: SmoothingMethod;

  // Data
  contracts: DI1Contract[];
  methods: MethodInfo[];

  // Workflow result (for chart screen)
  workflowResult: WorkflowResponse | null;

  // UI state
  isLoading: boolean;
  error: string | null;
}

interface AppContextValue extends AppState {
  setSelectedDate: (date: Date | null) => void;
  setSelectedMethod: (method: SmoothingMethod) => void;
  setWorkflowResult: (result: WorkflowResponse | null) => void;
  loadData: () => Promise<void>;
  loadMethods: () => Promise<void>;
  clearError: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [actualDate, setActualDate] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<SmoothingMethod>('nelson_siegel_svensson');
  const [workflowResult, setWorkflowResult] = useState<WorkflowResponse | null>(null);
  const [contracts, setContracts] = useState<DI1Contract[]>([]);
  const [methods, setMethods] = useState<MethodInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadMethods = useCallback(async () => {
    try {
      const methodList = await api.getMethods();
      setMethods(methodList);
    } catch (err) {
      console.error('Failed to load methods:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Format date for API if selected, otherwise let server use default
      const dateStr = selectedDate
        ? selectedDate.toISOString().split('T')[0]
        : undefined;

      const response: DI1Response = await api.getDI1Data(dateStr);

      setContracts(response.contracts);
      setActualDate(response.actual_date);

      // If no date was selected, update selectedDate to match what server returned
      if (!selectedDate && response.actual_date) {
        setSelectedDate(new Date(response.actual_date + 'T12:00:00'));
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  const value: AppContextValue = {
    selectedDate,
    actualDate,
    selectedMethod,
    workflowResult,
    contracts,
    methods,
    isLoading,
    error,
    setSelectedDate,
    setSelectedMethod,
    setWorkflowResult,
    loadData,
    loadMethods,
    clearError,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
