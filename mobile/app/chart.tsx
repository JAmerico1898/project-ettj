/**
 * Chart screen - Interactive rate curve visualization
 */

import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { COLORS } from '../constants/config';

const screenWidth = Dimensions.get('window').width;

export default function ChartScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Curva de Juros
          </Text>

          <View style={styles.chartPlaceholder}>
            <Text variant="bodyMedium" style={styles.placeholderText}>
              O gráfico será implementado nas próximas features
            </Text>
            <Text variant="bodySmall" style={styles.placeholderSubtext}>
              (Feature 2: Dados DI1 + Feature 3: Métodos de Suavização)
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.infoTitle}>
            Métodos Disponíveis
          </Text>
          <View style={styles.methodsList}>
            <Text variant="bodySmall" style={styles.methodItem}>• Linear</Text>
            <Text variant="bodySmall" style={styles.methodItem}>• Cubic Spline</Text>
            <Text variant="bodySmall" style={styles.methodItem}>• Akima</Text>
            <Text variant="bodySmall" style={styles.methodItem}>• PCHIP (Monotônico)</Text>
            <Text variant="bodySmall" style={styles.methodItem}>• Smoothing Spline</Text>
            <Text variant="bodySmall" style={styles.methodItem}>• Nelson-Siegel</Text>
            <Text variant="bodySmall" style={styles.methodItem}>• Nelson-Siegel-Svensson</Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
    color: COLORS.text,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  placeholderSubtext: {
    color: COLORS.textSecondary,
    marginTop: 8,
    fontSize: 11,
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: COLORS.surface,
  },
  infoTitle: {
    marginBottom: 12,
    color: COLORS.primary,
  },
  methodsList: {
    gap: 4,
  },
  methodItem: {
    color: COLORS.text,
  },
});
