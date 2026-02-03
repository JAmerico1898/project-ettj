/**
 * Help screen - FAQ and usage instructions
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Card, Divider, Searchbar } from 'react-native-paper';
import { COLORS } from '../constants/config';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    id: '1',
    category: 'Primeiros Passos',
    question: 'O que é o ETTJ DI1?',
    answer:
      'O ETTJ DI1 é uma ferramenta educacional para visualização e análise da Estrutura a Termo das Taxas de Juros brasileiras. Utiliza dados de contratos futuros de DI1 negociados na B3 para construir curvas de juros usando diferentes métodos de interpolação.',
  },
  {
    id: '2',
    category: 'Primeiros Passos',
    question: 'Como calcular uma curva de juros?',
    answer:
      '1. Na tela inicial, selecione uma data de referência (ou deixe em branco para usar o último dia útil)\n2. Escolha o método de suavização desejado\n3. Configure parâmetros adicionais se necessário\n4. Clique em "Calcular Curva"\n5. A curva será exibida em um gráfico interativo',
  },
  {
    id: '3',
    category: 'Primeiros Passos',
    question: 'O que são os contratos DI1?',
    answer:
      'Os contratos DI1 são futuros de taxa de juros negociados na B3, referenciados na taxa DI (Depósitos Interbancários). Cada contrato tem uma data de vencimento específica e uma taxa implícita que reflete as expectativas do mercado para a taxa de juros naquele período.',
  },

  // Methods
  {
    id: '4',
    category: 'Métodos de Suavização',
    question: 'Qual a diferença entre os métodos de interpolação?',
    answer:
      'Os métodos se dividem em duas categorias:\n\nParamétricos (Nelson-Siegel e NSS): Ajustam uma função matemática aos dados, produzindo curvas suaves que capturam a forma geral da estrutura a termo.\n\nNão-paramétricos (Linear, Cubic, Akima, PCHIP, Smoothing Spline): Interpolam diretamente entre os pontos observados, com diferentes níveis de suavidade e preservação de características locais.',
  },
  {
    id: '5',
    category: 'Métodos de Suavização',
    question: 'O que é o modelo Nelson-Siegel-Svensson?',
    answer:
      'O modelo NSS é uma extensão do modelo Nelson-Siegel que adiciona um termo extra para capturar uma segunda "corcova" na curva de juros. É amplamente utilizado por bancos centrais e instituições financeiras por sua flexibilidade em representar diferentes formas de curvas de juros.',
  },
  {
    id: '6',
    category: 'Métodos de Suavização',
    question: 'O que é o parâmetro de suavização (Smoothing Spline)?',
    answer:
      'O parâmetro de suavização controla o balanço entre ajuste aos dados e suavidade da curva. Valores próximos de 0 produzem curvas mais suaves (menos sensível a ruídos), enquanto valores próximos de 1 ajustam mais precisamente aos pontos observados.',
  },

  // Data
  {
    id: '7',
    category: 'Dados',
    question: 'De onde vêm os dados?',
    answer:
      'Os dados são obtidos da B3 (Brasil, Bolsa, Balcão) através da biblioteca pyield. Os preços e taxas são atualizados diariamente após o fechamento do mercado.',
  },
  {
    id: '8',
    category: 'Dados',
    question: 'Por que alguns dados não estão disponíveis?',
    answer:
      'Os dados podem não estar disponíveis por vários motivos:\n- Feriados ou dias sem negociação\n- Datas futuras\n- Problemas temporários de conexão com o servidor\n- Datas muito antigas não disponíveis na fonte',
  },
  {
    id: '9',
    category: 'Dados',
    question: 'O que significa "dias úteis"?',
    answer:
      'Dias úteis referem-se aos dias de negociação no mercado brasileiro, excluindo fins de semana e feriados. O mercado brasileiro utiliza a convenção de 252 dias úteis por ano para cálculo de taxas de juros.',
  },

  // Technical
  {
    id: '10',
    category: 'Técnico',
    question: 'Como configurar o servidor da API?',
    answer:
      'Acesse Configurações > Avançado > Configuração da API. Você pode alterar a URL base (útil se estiver rodando o backend localmente em outro IP) e o timeout das requisições.',
  },
  {
    id: '11',
    category: 'Técnico',
    question: 'O app funciona offline?',
    answer:
      'Não. O aplicativo requer conexão com a internet para buscar dados de mercado e calcular as curvas. Os dados são processados em um servidor backend que acessa as fontes de dados em tempo real.',
  },
  {
    id: '12',
    category: 'Técnico',
    question: 'Como exportar o gráfico?',
    answer:
      'Na tela do gráfico, use os botões de ação disponíveis:\n- Ícone de imagem: Salva o gráfico como PNG\n- Ícone de compartilhamento: Compartilha o gráfico com outros apps\n- Ícone de área de transferência: Copia os dados para a área de transferência',
  },
];

export default function HelpScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredFAQ = FAQ_DATA.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  // Group by category
  const groupedFAQ = filteredFAQ.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, FAQItem[]>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar nas perguntas..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        iconColor={COLORS.primary}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Tips Card */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.tipsTitle}>
              Dicas Rápidas
            </Text>
            <Text variant="bodySmall" style={styles.tipText}>
              • Use NSS para análises profissionais da curva de juros
            </Text>
            <Text variant="bodySmall" style={styles.tipText}>
              • Limite o prazo máximo para focar em vencimentos específicos
            </Text>
            <Text variant="bodySmall" style={styles.tipText}>
              • Compare diferentes métodos na mesma data
            </Text>
          </Card.Content>
        </Card>

        {/* FAQ Sections */}
        {Object.entries(groupedFAQ).map(([category, items]) => (
          <View key={category} style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              {category}
            </Text>
            <List.Section>
              {items.map((item) => (
                <List.Accordion
                  key={item.id}
                  title={item.question}
                  titleStyle={styles.questionTitle}
                  titleNumberOfLines={3}
                  expanded={expandedIds.includes(item.id)}
                  onPress={() => toggleExpanded(item.id)}
                  style={styles.accordion}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon="help-circle-outline"
                      color={COLORS.primary}
                    />
                  )}
                >
                  <View style={styles.answerContainer}>
                    <Text variant="bodyMedium" style={styles.answerText}>
                      {item.answer}
                    </Text>
                  </View>
                </List.Accordion>
              ))}
            </List.Section>
            <Divider style={styles.divider} />
          </View>
        ))}

        {filteredFAQ.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Nenhuma pergunta encontrada
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Tente usar outros termos de busca
            </Text>
          </View>
        )}

        {/* Contact Section */}
        <Card style={styles.contactCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.contactTitle}>
              Ainda tem dúvidas?
            </Text>
            <Text variant="bodyMedium" style={styles.contactText}>
              Este é um projeto educacional do Prof. José Américo (Coppead/FGV/UCAM). Para mais
              informações sobre a metodologia e os modelos utilizados, consulte
              a literatura acadêmica sobre estrutura a termo de taxas de juros.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tipsCard: {
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
  },
  tipsTitle: {
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    color: COLORS.text,
    marginVertical: 2,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  accordion: {
    backgroundColor: COLORS.surface,
    paddingVertical: 4,
  },
  questionTitle: {
    color: COLORS.text,
    fontSize: 14,
  },
  answerContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 56,
  },
  answerText: {
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  divider: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  contactCard: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
  },
  contactTitle: {
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  contactText: {
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
