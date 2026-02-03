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
    question: 'O que e o ETTJ DI1?',
    answer:
      'O ETTJ DI1 e uma ferramenta educacional para visualizacao e analise da Estrutura a Termo das Taxas de Juros brasileiras. Utiliza dados de contratos futuros de DI1 negociados na B3 para construir curvas de juros usando diferentes metodos de interpolacao.',
  },
  {
    id: '2',
    category: 'Primeiros Passos',
    question: 'Como calcular uma curva de juros?',
    answer:
      '1. Na tela inicial, selecione uma data de referencia (ou deixe em branco para usar o ultimo dia util)\n2. Escolha o metodo de suavizacao desejado\n3. Configure parametros adicionais se necessario\n4. Clique em "Calcular Curva"\n5. A curva sera exibida em um grafico interativo',
  },
  {
    id: '3',
    category: 'Primeiros Passos',
    question: 'O que sao os contratos DI1?',
    answer:
      'Os contratos DI1 sao futuros de taxa de juros negociados na B3, referenciados na taxa DI (Depositos Interbancarios). Cada contrato tem uma data de vencimento especifica e uma taxa implicita que reflete as expectativas do mercado para a taxa de juros naquele periodo.',
  },

  // Methods
  {
    id: '4',
    category: 'Metodos de Suavizacao',
    question: 'Qual a diferenca entre os metodos de interpolacao?',
    answer:
      'Os metodos se dividem em duas categorias:\n\nParametricos (Nelson-Siegel e NSS): Ajustam uma funcao matematica aos dados, produzindo curvas suaves que capturam a forma geral da estrutura a termo.\n\nNao-parametricos (Linear, Cubic, Akima, PCHIP, Smoothing Spline): Interpolam diretamente entre os pontos observados, com diferentes niveis de suavidade e preservacao de caracteristicas locais.',
  },
  {
    id: '5',
    category: 'Metodos de Suavizacao',
    question: 'O que e o modelo Nelson-Siegel-Svensson?',
    answer:
      'O modelo NSS e uma extensao do modelo Nelson-Siegel que adiciona um termo extra para capturar uma segunda "corcova" na curva de juros. E amplamente utilizado por bancos centrais e instituicoes financeiras por sua flexibilidade em representar diferentes formas de curvas de juros.',
  },
  {
    id: '6',
    category: 'Metodos de Suavizacao',
    question: 'O que e o parametro de suavizacao (Smoothing Spline)?',
    answer:
      'O parametro de suavizacao controla o balanco entre ajuste aos dados e suavidade da curva. Valores proximos de 0 produzem curvas mais suaves (menos sensivel a ruidos), enquanto valores proximos de 1 ajustam mais precisamente aos pontos observados.',
  },

  // Data
  {
    id: '7',
    category: 'Dados',
    question: 'De onde vem os dados?',
    answer:
      'Os dados sao obtidos da B3 (Brasil, Bolsa, Balcao) atraves da biblioteca pyield. Os precos e taxas sao atualizados diariamente apos o fechamento do mercado.',
  },
  {
    id: '8',
    category: 'Dados',
    question: 'Por que alguns dados nao estao disponiveis?',
    answer:
      'Os dados podem nao estar disponiveis por varios motivos:\n- Feriados ou dias sem negociacao\n- Datas futuras\n- Problemas temporarios de conexao com o servidor\n- Datas muito antigas nao disponiveis na fonte',
  },
  {
    id: '9',
    category: 'Dados',
    question: 'O que significa "dias uteis"?',
    answer:
      'Dias uteis referem-se aos dias de negociacao no mercado brasileiro, excluindo fins de semana e feriados. O mercado brasileiro utiliza a convencao de 252 dias uteis por ano para calculo de taxas de juros.',
  },

  // Technical
  {
    id: '10',
    category: 'Tecnico',
    question: 'Como configurar o servidor da API?',
    answer:
      'Acesse Configuracoes > Avancado > Configuracao da API. Voce pode alterar a URL base (util se estiver rodando o backend localmente em outro IP) e o timeout das requisicoes.',
  },
  {
    id: '11',
    category: 'Tecnico',
    question: 'O app funciona offline?',
    answer:
      'Nao. O aplicativo requer conexao com a internet para buscar dados de mercado e calcular as curvas. Os dados sao processados em um servidor backend que acessa as fontes de dados em tempo real.',
  },
  {
    id: '12',
    category: 'Tecnico',
    question: 'Como exportar o grafico?',
    answer:
      'Na tela do grafico, use os botoes de acao disponíveis:\n- Icone de imagem: Salva o grafico como PNG\n- Icone de compartilhamento: Compartilha o grafico com outros apps\n- Icone de area de transferencia: Copia os dados para a area de transferencia',
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
              Dicas Rapidas
            </Text>
            <Text variant="bodySmall" style={styles.tipText}>
              • Use NSS para analises profissionais da curva de juros
            </Text>
            <Text variant="bodySmall" style={styles.tipText}>
              • Limite o prazo maximo para focar em vencimentos especificos
            </Text>
            <Text variant="bodySmall" style={styles.tipText}>
              • Compare diferentes metodos na mesma data
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
              Ainda tem duvidas?
            </Text>
            <Text variant="bodyMedium" style={styles.contactText}>
              Este e um projeto educacional do Coppead/UFRJ. Para mais
              informacoes sobre a metodologia e os modelos utilizados, consulte
              a literatura academica sobre estrutura a termo de taxas de juros.
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
