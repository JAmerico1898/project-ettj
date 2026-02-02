/**
 * Data screen - Contract details table
 */

import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, DataTable } from 'react-native-paper';
import { COLORS } from '../constants/config';
import { useApp } from '../context/AppContext';

export default function DataScreen() {
  const { contracts, actualDate } = useApp();

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Contratos DI1
          </Text>
          {actualDate && (
            <Text variant="bodySmall" style={styles.subtitle}>
              Data: {formatDate(actualDate)} | {contracts.length} contratos
            </Text>
          )}
        </Card.Content>
      </Card>

      {contracts.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Nenhum dado carregado
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Volte à tela inicial e carregue os dados
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={styles.tickerColumn}>
                  <Text style={styles.headerText}>Contrato</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={styles.numericColumn}>
                  <Text style={styles.headerText}>DU</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={styles.rateColumn}>
                  <Text style={styles.headerText}>Taxa (%)</Text>
                </DataTable.Title>
              </DataTable.Header>

              <ScrollView style={styles.tableBody}>
                {contracts.map((contract) => (
                  <DataTable.Row key={contract.ticker}>
                    <DataTable.Cell style={styles.tickerColumn}>
                      <Text style={styles.tickerText}>{contract.ticker}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.numericColumn}>
                      <Text style={styles.cellText}>{contract.business_days}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.rateColumn}>
                      <Text style={styles.rateText}>{contract.rate_percent.toFixed(2)}</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </ScrollView>
            </DataTable>
          </ScrollView>
        </Card>
      )}

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="bodySmall" style={styles.infoText}>
            DU = Dias Úteis até o vencimento
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            Taxa = Taxa anualizada (base 252 dias úteis)
          </Text>
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
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  tableCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 16,
    flex: 1,
  },
  tableBody: {
    maxHeight: 400,
  },
  tickerColumn: {
    width: 100,
  },
  numericColumn: {
    width: 80,
  },
  rateColumn: {
    width: 100,
  },
  headerText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tickerText: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: COLORS.text,
  },
  cellText: {
    color: COLORS.text,
  },
  rateText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.surface,
  },
  infoText: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
});
