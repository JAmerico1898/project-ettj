/**
 * MethodSelector component for choosing smoothing methods
 * Displays all 7 methods grouped by category with expandable info
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Card, Chip, IconButton, Divider, Surface } from 'react-native-paper';
import { COLORS } from '../constants/config';
import { SmoothingMethod, MethodInfo } from '../types';
import {
  METHOD_CATEGORIES,
  METHOD_TO_CATEGORY,
  METHOD_DISPLAY_NAMES,
  METHOD_DESCRIPTIONS,
  METHOD_MIN_POINTS,
  methodHasParameters,
} from '../utils/validation';

interface MethodSelectorProps {
  value: SmoothingMethod;
  onChange: (method: SmoothingMethod) => void;
  methods?: MethodInfo[];
  disabled?: boolean;
  showInfo?: boolean;
}

// Category colors for visual distinction
const CATEGORY_COLORS: Record<string, string> = {
  parametric: '#E3F2FD',
  splines: '#E8F5E9',
  simple: '#FFF3E0',
};

const CATEGORY_ACCENT: Record<string, string> = {
  parametric: '#1976D2',
  splines: '#388E3C',
  simple: '#F57C00',
};

// All available methods grouped by category
const METHODS_BY_CATEGORY: Record<string, SmoothingMethod[]> = {
  parametric: ['nelson_siegel', 'nelson_siegel_svensson'],
  splines: ['cubic_spline', 'akima', 'pchip', 'smoothing_spline'],
  simple: ['linear'],
};

export function MethodSelector({
  value,
  onChange,
  methods,
  disabled = false,
  showInfo = true,
}: MethodSelectorProps) {
  const [expandedMethod, setExpandedMethod] = useState<SmoothingMethod | null>(null);

  const handleMethodSelect = useCallback(
    (method: SmoothingMethod) => {
      if (!disabled) {
        onChange(method);
      }
    },
    [onChange, disabled]
  );

  const toggleMethodInfo = useCallback((method: SmoothingMethod) => {
    setExpandedMethod((prev) => (prev === method ? null : method));
  }, []);

  const renderMethodChip = (method: SmoothingMethod) => {
    const isSelected = value === method;
    const category = METHOD_TO_CATEGORY[method];
    const accentColor = CATEGORY_ACCENT[category];
    const methodName = METHOD_DISPLAY_NAMES[method];

    return (
      <View key={method} style={styles.methodChipContainer}>
        <Pressable
          onPress={() => handleMethodSelect(method)}
          disabled={disabled}
          style={[
            styles.methodChip,
            isSelected && { backgroundColor: accentColor },
            disabled && styles.disabledChip,
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: isSelected, disabled }}
          accessibilityLabel={`Metodo ${methodName}`}
          accessibilityHint={isSelected ? 'Selecionado' : 'Toque para selecionar este metodo'}
        >
          <Text
            style={[
              styles.methodChipText,
              isSelected && styles.selectedChipText,
              disabled && styles.disabledText,
            ]}
          >
            {methodName}
          </Text>
        </Pressable>
        {showInfo && (
          <IconButton
            icon={expandedMethod === method ? 'chevron-up' : 'information-outline'}
            size={18}
            onPress={() => toggleMethodInfo(method)}
            style={styles.infoButton}
            accessibilityLabel={`Informacoes sobre ${methodName}`}
            accessibilityHint={expandedMethod === method ? 'Toque para ocultar detalhes' : 'Toque para ver detalhes'}
          />
        )}
      </View>
    );
  };

  const renderMethodInfo = (method: SmoothingMethod) => {
    if (expandedMethod !== method) return null;

    const category = METHOD_TO_CATEGORY[method];
    const categoryName = METHOD_CATEGORIES[category];
    const description = METHOD_DESCRIPTIONS[method];
    const minPoints = METHOD_MIN_POINTS[method];
    const hasParams = methodHasParameters(method);

    return (
      <Surface style={[styles.methodInfo, { borderLeftColor: CATEGORY_ACCENT[category] }]} elevation={1}>
        <View style={styles.infoRow}>
          <Chip
            mode="flat"
            compact
            style={{ backgroundColor: CATEGORY_COLORS[category] }}
            textStyle={{ fontSize: 11, color: CATEGORY_ACCENT[category] }}
          >
            {categoryName}
          </Chip>
          <Text variant="labelSmall" style={styles.minPointsText}>
            Min: {minPoints} pontos
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.descriptionText}>
          {description}
        </Text>
        {hasParams && (
          <Text variant="labelSmall" style={styles.paramsNote}>
            Este método possui parâmetros configuráveis.
          </Text>
        )}
      </Surface>
    );
  };

  const renderCategory = (categoryKey: string) => {
    const categoryMethods = METHODS_BY_CATEGORY[categoryKey];
    const categoryName = METHOD_CATEGORIES[categoryKey];
    const categoryColor = CATEGORY_COLORS[categoryKey];
    const accentColor = CATEGORY_ACCENT[categoryKey];

    return (
      <Card
        key={categoryKey}
        style={[styles.categoryCard, { backgroundColor: categoryColor }]}
        mode="outlined"
      >
        <Card.Content style={styles.categoryContent}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryDot, { backgroundColor: accentColor }]} />
            <Text variant="labelMedium" style={[styles.categoryTitle, { color: accentColor }]}>
              {categoryName}
            </Text>
          </View>
          <View style={styles.methodsContainer}>
            {categoryMethods.map((method) => (
              <View key={method} style={styles.methodRow}>
                {renderMethodChip(method)}
                {renderMethodInfo(method)}
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Método de Suavização
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Selecione o método para construir a curva de juros
      </Text>
      <View style={styles.categoriesContainer}>
        {Object.keys(METHODS_BY_CATEGORY).map(renderCategory)}
      </View>
      {value && (
        <Surface style={styles.selectionSummary} elevation={1}>
          <Text variant="labelSmall" style={styles.summaryLabel}>
            Selecionado:
          </Text>
          <Text variant="bodyMedium" style={styles.summaryValue}>
            {METHOD_DISPLAY_NAMES[value]}
          </Text>
        </Surface>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  categoriesContainer: {
    gap: 8,
  },
  categoryCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryContent: {
    paddingVertical: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryTitle: {
    fontWeight: '600',
  },
  methodsContainer: {
    marginLeft: 4,
  },
  methodRow: {
    marginBottom: 4,
  },
  methodChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  methodChipText: {
    fontSize: 13,
    color: COLORS.text,
  },
  selectedChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledChip: {
    opacity: 0.5,
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
  infoButton: {
    margin: 0,
    marginLeft: -4,
  },
  methodInfo: {
    marginTop: 4,
    marginLeft: 8,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    backgroundColor: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  minPointsText: {
    color: COLORS.textSecondary,
  },
  descriptionText: {
    color: COLORS.text,
    lineHeight: 18,
  },
  paramsNote: {
    color: COLORS.primary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  selectionSummary: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  summaryValue: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default MethodSelector;
