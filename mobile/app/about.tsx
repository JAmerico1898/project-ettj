/**
 * About screen - App information and credits
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { COLORS } from '../constants/config';

export default function AboutScreen() {
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to open URL:', error);
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* App Logo and Name */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="chart-line"
          size={80}
          color={COLORS.primary}
        />
        <Text variant="headlineMedium" style={styles.appName}>
          ETTJ DI1
        </Text>
        <Text variant="bodyMedium" style={styles.appDescription}>
          Estrutura a Termo das Taxas de Juros
        </Text>
        <Text variant="bodySmall" style={styles.version}>
          Versão {appVersion}
        </Text>
      </View>

      {/* About Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Sobre o Aplicativo
          </Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            O ETTJ DI1 é uma ferramenta educacional para modelagem da estrutura
            a termo das taxas de juros brasileiras utilizando contratos futuros
            de DI1 negociados na B3.
          </Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            O aplicativo permite visualizar e analisar curvas de juros usando
            diferentes métodos de interpolação e suavização, incluindo modelos
            paramétricos como Nelson-Siegel e Nelson-Siegel-Svensson.
          </Text>
        </Card.Content>
      </Card>

      {/* Features Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Funcionalidades
          </Text>
          <View style={styles.featureList}>
            <FeatureItem
              icon="database"
              text="Dados em tempo real dos contratos DI1"
            />
            <FeatureItem
              icon="chart-bell-curve"
              text="7 métodos de suavização disponíveis"
            />
            <FeatureItem
              icon="chart-line"
              text="Visualização interativa de curvas"
            />
            <FeatureItem icon="table" text="Tabelas detalhadas de contratos" />
            <FeatureItem
              icon="export"
              text="Exportação de gráficos e dados"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Credits Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Créditos
          </Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            Desenvolvido pelo Prof. José Américo (Coppead/FGV/UCAM) como ferramenta educacional.
          </Text>
          <Divider style={styles.divider} />
          <Text variant="labelMedium" style={styles.creditLabel}>
            Dados de Mercado
          </Text>
          <Text variant="bodySmall" style={styles.creditText}>
            B3 - Brasil, Bolsa, Balcao (via pyield)
          </Text>
          <Text variant="labelMedium" style={styles.creditLabel}>
            Tecnologias
          </Text>
          <Text variant="bodySmall" style={styles.creditText}>
            React Native, Expo, FastAPI, Python
          </Text>
        </Card.Content>
      </Card>

      {/* License Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Licença
          </Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            Este software é disponibilizado para fins educacionais. Os dados
            apresentados são obtidos de fontes públicas e não devem ser
            utilizados para tomada de decisões de investimento.
          </Text>
          <Text variant="bodySmall" style={styles.disclaimer}>
            AVISO: Este aplicativo não constitui recomendação de investimento.
            Consulte um profissional qualificado antes de tomar decisões
            financeiras.
          </Text>
        </Card.Content>
      </Card>

      {/* Links */}
      <View style={styles.linksContainer}>
        <Button
          mode="outlined"
          onPress={() => handleOpenLink('https://coppead.ufrj.br')}
          icon="school"
          style={styles.linkButton}
        >
          Coppead/UFRJ
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleOpenLink('https://portal.fgv.br')}
          icon="school"
          style={styles.linkButton}
        >
          FGV
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleOpenLink('https://www.b3.com.br')}
          icon="chart-line"
          style={styles.linkButton}
        >
          B3 - Bolsa de Valores
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleOpenLink('https://github.com/crdcj/pyield')}
          icon="github"
          style={styles.linkButton}
        >
          pyield (GitHub)
        </Button>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          © 2024 Prof. José Américo
        </Text>
        <Text variant="bodySmall" style={styles.footerText}>
          Ferramenta Educacional
        </Text>
      </View>
    </ScrollView>
  );
}

interface FeatureItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
}

function FeatureItem({ icon, text }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={COLORS.primary}
        style={styles.featureIcon}
      />
      <Text variant="bodyMedium" style={styles.featureText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appName: {
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 12,
  },
  appDescription: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  version: {
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  card: {
    marginVertical: 8,
    backgroundColor: COLORS.surface,
  },
  cardTitle: {
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardText: {
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  featureList: {
    marginTop: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    color: COLORS.text,
    flex: 1,
  },
  divider: {
    marginVertical: 12,
  },
  creditLabel: {
    color: COLORS.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  creditText: {
    color: COLORS.textSecondary,
  },
  disclaimer: {
    color: COLORS.error,
    fontStyle: 'italic',
    marginTop: 12,
  },
  linksContainer: {
    marginVertical: 16,
    gap: 8,
  },
  linkButton: {
    borderColor: COLORS.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
  },
});
