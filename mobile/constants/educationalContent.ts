/**
 * Educational content for the ETTJ app
 * All content in Portuguese (Brazilian)
 */

// ============================================
// TUTORIAL SLIDES
// ============================================

export interface TutorialSlide {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  icon: string;
  highlightPoints?: string[];
}

export const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    id: 1,
    title: 'Bem-vindo ao ETTJ DI1',
    subtitle: 'Ferramenta Educacional',
    content:
      'Este aplicativo foi desenvolvido pelo Prof. José Américo (Coppead/FGV/UCAM) para auxiliar no estudo e análise da Estrutura a Termo das Taxas de Juros brasileiras.',
    icon: 'school',
    highlightPoints: [
      'Visualize curvas de juros em tempo real',
      'Aprenda sobre diferentes métodos de interpolação',
      'Explore dados do mercado brasileiro',
    ],
  },
  {
    id: 2,
    title: 'O que é a ETTJ?',
    subtitle: 'Estrutura a Termo das Taxas de Juros',
    content:
      'A ETTJ representa a relação entre as taxas de juros e seus respectivos prazos de vencimento. É uma ferramenta fundamental para precificação de ativos, gestão de riscos e análise de política monetária.',
    icon: 'chart-line',
    highlightPoints: [
      'Mostra expectativas de juros futuros',
      'Usada por bancos centrais e investidores',
      'Base para precificação de títulos',
    ],
  },
  {
    id: 3,
    title: 'Contratos DI1',
    subtitle: 'Futuros de Taxa de Juros',
    content:
      'Os contratos DI1 são futuros negociados na B3, referenciados na taxa DI (Depósitos Interbancários). Cada contrato tem uma data de vencimento e uma taxa implícita que reflete as expectativas do mercado.',
    icon: 'finance',
    highlightPoints: [
      'Negociados na B3 (antiga BM&F)',
      'Liquidação financeira diária',
      'Convenção de 252 dias úteis/ano',
    ],
  },
  {
    id: 4,
    title: 'Métodos de Interpolação',
    subtitle: 'Construindo a Curva',
    content:
      'O app oferece 7 métodos de suavização para construir a curva de juros a partir dos pontos observados. Cada método tem características próprias e é adequado para diferentes análises.',
    icon: 'chart-bell-curve',
    highlightPoints: [
      'Paramétricos: Nelson-Siegel e NSS',
      'Splines: Cubic, Akima, PCHIP, Smoothing',
      'Linear: interpolação simples',
    ],
  },
  {
    id: 5,
    title: 'Usando o Aplicativo',
    subtitle: 'Passo a Passo',
    content:
      'Na tela inicial, selecione uma data de referência e escolha o método de suavização. Clique em "Calcular Curva" para visualizar os resultados em um gráfico interativo.',
    icon: 'cellphone-check',
    highlightPoints: [
      '1. Selecione a data de referência',
      '2. Escolha o método de suavização',
      '3. Clique em Calcular Curva',
    ],
  },
  {
    id: 6,
    title: 'Métricas e Estatísticas',
    subtitle: 'Analisando os Resultados',
    content:
      'Após calcular a curva, você verá estatísticas como erro médio (RMSE), parâmetros do modelo e métricas de qualidade do ajuste. Esses dados ajudam a avaliar a precisão da interpolação.',
    icon: 'chart-bar',
    highlightPoints: [
      'RMSE: erro médio quadrático',
      'Parâmetros do modelo ajustado',
      'Comparação entre métodos',
    ],
  },
  {
    id: 7,
    title: 'Convenções Brasileiras',
    subtitle: 'Mercado de Juros',
    content:
      'O mercado brasileiro utiliza convenções específicas: 252 dias úteis por ano, capitalização diária e taxas expressas em percentual ao ano. O app já converte todos os valores automaticamente.',
    icon: 'calendar-check',
    highlightPoints: [
      '252 dias úteis por ano',
      'Capitalização diária (CDI)',
      'Taxas em % ao ano',
    ],
  },
  {
    id: 8,
    title: 'Pronto para Começar!',
    subtitle: 'Explore e Aprenda',
    content:
      'Você pode acessar este tutorial novamente em Configurações > Recursos. Explore também a Central de Aprendizado e o Glossário para aprofundar seus conhecimentos.',
    icon: 'rocket-launch',
    highlightPoints: [
      'Tutorial disponível em Configurações',
      'Central de Aprendizado com conceitos',
      'Glossário de termos técnicos',
    ],
  },
];

// ============================================
// LEARNING CONCEPTS
// ============================================

export type ConceptCategory = 'fundamentos' | 'mercado' | 'modelos' | 'tecnico';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Concept {
  id: string;
  title: string;
  category: ConceptCategory;
  difficulty: DifficultyLevel;
  summary: string;
  content: string;
  formula?: string;
  relatedConcepts: string[];
  relatedTerms: string[];
}

export const CONCEPT_CATEGORIES: Record<ConceptCategory, { label: string; icon: string }> = {
  fundamentos: { label: 'Fundamentos', icon: 'book-open-variant' },
  mercado: { label: 'Mercado', icon: 'finance' },
  modelos: { label: 'Modelos', icon: 'function-variant' },
  tecnico: { label: 'Técnico', icon: 'cog' },
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, { label: string; color: string }> = {
  beginner: { label: 'Iniciante', color: '#4CAF50' },
  intermediate: { label: 'Intermediário', color: '#FF9800' },
  advanced: { label: 'Avançado', color: '#F44336' },
};

export const LEARNING_CONCEPTS: Concept[] = [
  {
    id: 'ettj-basics',
    title: 'Estrutura a Termo das Taxas de Juros',
    category: 'fundamentos',
    difficulty: 'beginner',
    summary: 'Entenda o que é a ETTJ e por que ela é importante para o mercado financeiro.',
    content: `A Estrutura a Termo das Taxas de Juros (ETTJ) representa a relação entre as taxas de juros e seus respectivos prazos de vencimento em um determinado momento.

Também conhecida como "curva de juros" ou "yield curve", a ETTJ é uma ferramenta fundamental para:

1. **Precificação de ativos**: Títulos de renda fixa, derivativos e outros instrumentos financeiros são precificados com base na curva de juros.

2. **Gestão de riscos**: Bancos e instituições financeiras usam a ETTJ para gerenciar exposições a taxas de juros.

3. **Análise econômica**: A forma da curva pode indicar expectativas sobre inflação, crescimento econômico e política monetária.

4. **Tomada de decisão**: Investidores usam a ETTJ para comparar alternativas de investimento em diferentes prazos.

A curva pode assumir diferentes formas:
- **Normal (ascendente)**: Taxas maiores para prazos mais longos
- **Invertida (descendente)**: Taxas maiores para prazos mais curtos
- **Flat (plana)**: Taxas similares em diferentes prazos`,
    relatedConcepts: ['di1-contracts', 'interpolation-methods'],
    relatedTerms: ['ettj', 'yield-curve', 'taxa-spot'],
  },
  {
    id: 'di1-contracts',
    title: 'Contratos DI1',
    category: 'mercado',
    difficulty: 'beginner',
    summary: 'Como funcionam os contratos futuros de taxa de juros negociados na B3.',
    content: `Os contratos DI1 são futuros de taxa de juros negociados na B3 (Brasil, Bolsa, Balcão), referenciados na taxa DI (Depósitos Interbancários).

**Características principais:**

1. **Ativo subjacente**: Taxa DI acumulada entre a data de negociação e o vencimento.

2. **Vencimentos**: Primeiro dia útil de cada mês, com liquidez concentrada nos vencimentos mais próximos e em meses específicos (Jan, Abr, Jul, Out).

3. **Cotação**: Em taxa de juros efetiva anual, base 252 dias úteis.

4. **Valor nocional**: R$ 100.000,00 por contrato.

5. **Ajuste diário**: Liquidação financeira diária baseada no PU (Preço Unitário) do contrato.

**Cálculo do PU:**

PU = 100.000 / (1 + taxa)^(DU/252)

Onde DU = dias úteis até o vencimento.

Os contratos DI1 são essenciais para:
- Hedge de taxas de juros
- Especulação sobre a política monetária
- Construção da curva de juros brasileira`,
    formula: 'PU = 100.000 / (1 + taxa)^(DU/252)',
    relatedConcepts: ['ettj-basics', 'business-days'],
    relatedTerms: ['di1', 'pu', 'b3'],
  },
  {
    id: 'interpolation-methods',
    title: 'Métodos de Interpolação',
    category: 'modelos',
    difficulty: 'intermediate',
    summary: 'Comparação entre os diferentes métodos para construir a curva de juros.',
    content: `A interpolação é necessária porque os contratos DI1 não cobrem todos os prazos possíveis. Os métodos se dividem em duas categorias principais:

**Métodos Paramétricos:**

1. **Nelson-Siegel (NS)**: Ajusta uma função matemática com 4 parâmetros que capturam nível, inclinação e curvatura. Produz curvas suaves e bem comportadas.

2. **Nelson-Siegel-Svensson (NSS)**: Extensão do NS com 6 parâmetros, adicionando uma segunda "corcova". Mais flexível para curvas complexas.

**Métodos Não-Paramétricos (Splines):**

3. **Linear**: Ligação simples entre pontos. Rápido mas produz curvas com "quinas".

4. **Cubic Spline**: Polinômios cúbicos entre cada par de pontos. Suave mas pode oscilar.

5. **Akima**: Spline que evita oscilações indesejadas. Bom balanço entre suavidade e estabilidade.

6. **PCHIP**: Preserva a monotonicidade local. Útil quando a curva não deve "voltar".

7. **Smoothing Spline**: Controla o balanço entre ajuste aos dados e suavidade através de um parâmetro.

**Escolha do método:**
- Para análises profissionais: NSS ou NS
- Para rapidez e simplicidade: Linear ou Cubic
- Para preservar características locais: Akima ou PCHIP`,
    relatedConcepts: ['nelson-siegel', 'spline-methods'],
    relatedTerms: ['interpolacao', 'spline', 'nelson-siegel'],
  },
  {
    id: 'nelson-siegel',
    title: 'Modelo Nelson-Siegel-Svensson',
    category: 'modelos',
    difficulty: 'advanced',
    summary: 'Detalhamento matemático do modelo paramétrico mais utilizado.',
    content: `O modelo Nelson-Siegel-Svensson (NSS) é uma extensão do modelo original de Nelson e Siegel (1987), proposta por Svensson (1994).

**Fórmula do NSS:**

y(t) = β0 + β1 * [(1-e^(-t/τ1)) / (t/τ1)] + β2 * [(1-e^(-t/τ1)) / (t/τ1) - e^(-t/τ1)] + β3 * [(1-e^(-t/τ2)) / (t/τ2) - e^(-t/τ2)]

**Interpretação dos parâmetros:**

- **β0 (beta0)**: Nível de longo prazo da curva. Representa a taxa assintótica quando t → ∞.

- **β1 (beta1)**: Inclinação de curto prazo. Valores negativos indicam curva ascendente.

- **β2 (beta2)**: Curvatura principal. Controla a primeira "corcova" da curva.

- **β3 (beta3)**: Curvatura adicional (exclusivo do NSS). Permite uma segunda "corcova".

- **τ1 (tau1)**: Velocidade de decaimento do primeiro termo exponencial.

- **τ2 (tau2)**: Velocidade de decaimento do segundo termo exponencial.

**Vantagens:**
- Interpretação econômica dos parâmetros
- Curvas sempre suaves
- Amplamente utilizado por bancos centrais

**Estimação:**
Os parâmetros são estimados por mínimos quadrados não-lineares, minimizando o erro entre taxas observadas e ajustadas.`,
    formula: 'y(t) = β0 + β1*f1(t,τ1) + β2*f2(t,τ1) + β3*f2(t,τ2)',
    relatedConcepts: ['interpolation-methods', 'ettj-basics'],
    relatedTerms: ['nelson-siegel', 'parametrico', 'beta'],
  },
  {
    id: 'business-days',
    title: 'Convenções de Dias Úteis',
    category: 'tecnico',
    difficulty: 'beginner',
    summary: 'Como o mercado brasileiro conta dias e calcula taxas.',
    content: `O mercado brasileiro de renda fixa utiliza convenções específicas para contagem de dias e cálculo de taxas:

**252 Dias Úteis por Ano:**

Diferente de outros mercados que usam 360 ou 365 dias, o Brasil adota 252 dias úteis como base anual. Isso exclui:
- Fins de semana (sábados e domingos)
- Feriados nacionais
- Alguns feriados locais (quando afetam o mercado)

**Capitalização Diária:**

As taxas no mercado brasileiro são expressas como taxas efetivas anuais com capitalização diária:

Fator = (1 + taxa_anual)^(DU/252)

Onde DU = número de dias úteis no período.

**Taxa Over vs Taxa Efetiva:**

- **Taxa Over**: Taxa diária = (1 + taxa_anual)^(1/252) - 1
- **Taxa Efetiva Anual**: Usada na cotação dos contratos DI1

**Por que 252?**

Historicamente, o número de dias úteis em um ano no Brasil gira em torno de 252, o que simplifica os cálculos e padroniza o mercado.

**Conversão:**

Para converter uma taxa anual em taxa para N dias úteis:
Taxa_período = (1 + taxa_anual)^(N/252) - 1`,
    formula: 'Fator = (1 + taxa)^(DU/252)',
    relatedConcepts: ['di1-contracts'],
    relatedTerms: ['dias-uteis', 'cdi', 'taxa-over'],
  },
  {
    id: 'spline-methods',
    title: 'Métodos de Spline',
    category: 'modelos',
    difficulty: 'intermediate',
    summary: 'Entenda as diferenças entre cubic spline, Akima, PCHIP e smoothing spline.',
    content: `Splines são funções definidas por partes (piecewise) que interpolam ou aproximam pontos de dados. Cada método tem características específicas:

**Cubic Spline Natural:**

Usa polinômios de grau 3 entre cada par de pontos consecutivos. Garante continuidade da função e de suas duas primeiras derivadas. Pode apresentar oscilações (overshooting) em regiões com grandes variações.

**Akima Spline:**

Desenvolvido por Hiroshi Akima, evita oscilações indesejadas usando uma média ponderada das inclinações locais. Produz curvas mais "naturais" em regiões de transição abrupta.

**PCHIP (Piecewise Cubic Hermite Interpolating Polynomial):**

Preserva a monotonicidade local dos dados. Se os dados estão crescendo entre dois pontos, a interpolação também será crescente. Útil para dados que naturalmente não devem oscilar.

**Smoothing Spline:**

Introduz um parâmetro de suavização (λ) que controla o balanço entre:
- Ajuste perfeito aos dados (λ → 1)
- Curva mais suave (λ → 0)

A função objetivo minimizada é:
Σ(yᵢ - s(xᵢ))² + λ * ∫s''(x)²dx

**Quando usar cada um:**
- Cubic: Dados suaves, sem ruído
- Akima: Dados com mudanças abruptas
- PCHIP: Quando monotonicidade é importante
- Smoothing: Dados com ruído`,
    relatedConcepts: ['interpolation-methods'],
    relatedTerms: ['spline', 'interpolacao', 'smoothing'],
  },
];

// ============================================
// GLOSSARY TERMS
// ============================================

export type GlossaryCategory = 'b3' | 'juros' | 'modelos' | 'tecnico' | 'matematica';

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: GlossaryCategory;
  example?: string;
  relatedTerms: string[];
}

export const GLOSSARY_CATEGORIES: Record<GlossaryCategory, { label: string; icon: string }> = {
  b3: { label: 'B3 / Bolsa', icon: 'bank' },
  juros: { label: 'Taxas de Juros', icon: 'percent' },
  modelos: { label: 'Modelos', icon: 'function-variant' },
  tecnico: { label: 'Técnico', icon: 'cog' },
  matematica: { label: 'Matemática', icon: 'sigma' },
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'b3',
    term: 'B3',
    definition:
      'Brasil, Bolsa, Balcão. Bolsa de valores brasileira resultante da fusão entre BM&FBovespa e Cetip. É onde são negociados os contratos DI1.',
    category: 'b3',
    relatedTerms: ['di1', 'bmf'],
  },
  {
    id: 'cdi',
    term: 'CDI',
    definition:
      'Certificado de Depósito Interbancário. Taxa de juros usada em empréstimos entre bancos. O CDI é muito próximo da taxa Selic e serve como referência para diversos investimentos.',
    category: 'juros',
    example: 'Um CDB pode render 100% do CDI, ou seja, acompanha a variação dessa taxa.',
    relatedTerms: ['di', 'selic', 'taxa-over'],
  },
  {
    id: 'di',
    term: 'DI (Taxa DI)',
    definition:
      'Taxa média dos Depósitos Interbancários de um dia, calculada pela B3. É a taxa que remunera os contratos DI1.',
    category: 'juros',
    relatedTerms: ['cdi', 'di1', 'taxa-over'],
  },
  {
    id: 'di1',
    term: 'DI1 (Contrato Futuro)',
    definition:
      'Contrato futuro de taxa DI negociado na B3. Permite negociar a expectativa de taxa de juros até uma data futura. Usado para construir a curva de juros.',
    category: 'b3',
    example:
      'DI1F25 é o contrato de DI futuro com vencimento em janeiro de 2025.',
    relatedTerms: ['di', 'pu', 'ettj'],
  },
  {
    id: 'dias-uteis',
    term: 'Dias Úteis',
    definition:
      'Dias de negociação no mercado, excluindo fins de semana e feriados. O Brasil usa 252 dias úteis por ano como convenção para cálculo de taxas.',
    category: 'tecnico',
    example: 'Entre 02/01 e 02/02 pode haver aproximadamente 21 dias úteis.',
    relatedTerms: ['du-252', 'taxa-efetiva'],
  },
  {
    id: 'du-252',
    term: 'DU/252',
    definition:
      'Fração de ano em dias úteis. Divide-se o número de dias úteis por 252 para obter a fração do ano correspondente. Usado em todos os cálculos de taxas.',
    category: 'matematica',
    example: '63 dias úteis correspondem a 63/252 = 0,25 ano (1 trimestre).',
    relatedTerms: ['dias-uteis', 'taxa-efetiva'],
  },
  {
    id: 'ettj',
    term: 'ETTJ',
    definition:
      'Estrutura a Termo das Taxas de Juros. Relação entre taxas de juros e prazos de vencimento. Também chamada de curva de juros ou yield curve.',
    category: 'juros',
    relatedTerms: ['yield-curve', 'taxa-spot', 'taxa-forward'],
  },
  {
    id: 'interpolacao',
    term: 'Interpolação',
    definition:
      'Técnica matemática para estimar valores entre pontos conhecidos. Na ETTJ, usamos interpolação para obter taxas em prazos onde não há contratos negociados.',
    category: 'matematica',
    relatedTerms: ['spline', 'nelson-siegel'],
  },
  {
    id: 'nelson-siegel',
    term: 'Nelson-Siegel',
    definition:
      'Modelo paramétrico para ajuste da curva de juros. Usa 4 parâmetros que representam nível, inclinação e curvatura. O modelo NSS adiciona 2 parâmetros extras.',
    category: 'modelos',
    relatedTerms: ['nss', 'parametrico', 'beta'],
  },
  {
    id: 'nss',
    term: 'NSS (Nelson-Siegel-Svensson)',
    definition:
      'Extensão do modelo Nelson-Siegel com 6 parâmetros. Permite capturar uma segunda "corcova" na curva de juros, oferecendo mais flexibilidade no ajuste.',
    category: 'modelos',
    relatedTerms: ['nelson-siegel', 'parametrico'],
  },
  {
    id: 'pu',
    term: 'PU (Preço Unitário)',
    definition:
      'Valor presente de R$ 100.000 descontado pela taxa do contrato DI1. É o preço efetivo de negociação do contrato. PU = 100.000 / (1 + taxa)^(DU/252).',
    category: 'b3',
    example:
      'Com taxa de 10% a.a. e 252 DU, PU = 100.000 / 1,10 = 90.909,09.',
    relatedTerms: ['di1', 'taxa-efetiva'],
  },
  {
    id: 'rmse',
    term: 'RMSE',
    definition:
      'Root Mean Square Error (Erro Médio Quadrático). Métrica que mede a diferença média entre valores observados e estimados. Quanto menor, melhor o ajuste.',
    category: 'matematica',
    example: 'Um RMSE de 0,05% significa que o erro médio é de 5 pontos-base.',
    relatedTerms: ['ajuste', 'residuo'],
  },
  {
    id: 'selic',
    term: 'Selic',
    definition:
      'Taxa básica de juros da economia brasileira, definida pelo Copom (Banco Central). Os contratos DI1 refletem expectativas sobre a trajetória futura da Selic.',
    category: 'juros',
    relatedTerms: ['cdi', 'copom', 'politica-monetaria'],
  },
  {
    id: 'spline',
    term: 'Spline',
    definition:
      'Função matemática definida por partes, geralmente polinômios, conectados de forma suave. Tipos comuns: cubic spline, Akima e PCHIP.',
    category: 'modelos',
    relatedTerms: ['interpolacao', 'cubic-spline', 'pchip'],
  },
  {
    id: 'taxa-efetiva',
    term: 'Taxa Efetiva',
    definition:
      'Taxa de juros que considera a capitalização no período. No Brasil, as taxas dos contratos DI1 são expressas como taxas efetivas anuais.',
    category: 'juros',
    relatedTerms: ['taxa-nominal', 'capitalizacao'],
  },
  {
    id: 'taxa-forward',
    term: 'Taxa Forward',
    definition:
      'Taxa de juros implícita entre dois períodos futuros. Calculada a partir das taxas spot. Representa a taxa de um investimento que começa no futuro.',
    category: 'juros',
    example:
      'A taxa forward de 6 meses começando em 6 meses é derivada das taxas spot de 6 e 12 meses.',
    relatedTerms: ['taxa-spot', 'ettj'],
  },
  {
    id: 'taxa-over',
    term: 'Taxa Over',
    definition:
      'Taxa de juros expressa em base diária. Para obter a taxa diária: (1 + taxa_anual)^(1/252) - 1.',
    category: 'juros',
    example:
      'Uma taxa anual de 10% equivale a uma taxa over de aproximadamente 0,038% ao dia.',
    relatedTerms: ['di', 'cdi', 'taxa-efetiva'],
  },
  {
    id: 'taxa-spot',
    term: 'Taxa Spot',
    definition:
      'Taxa de juros para um investimento que começa hoje e termina em uma data futura. São as taxas que compõem a curva de juros.',
    category: 'juros',
    relatedTerms: ['taxa-forward', 'ettj', 'yield-curve'],
  },
  {
    id: 'yield-curve',
    term: 'Yield Curve',
    definition:
      'Curva de juros em inglês. Gráfico que mostra a relação entre taxas de juros (eixo Y) e prazos de vencimento (eixo X). Sinônimo de ETTJ.',
    category: 'juros',
    relatedTerms: ['ettj', 'taxa-spot'],
  },
];

// Helper function to get terms sorted alphabetically
export function getTermsAlphabetically(): GlossaryTerm[] {
  return [...GLOSSARY_TERMS].sort((a, b) =>
    a.term.localeCompare(b.term, 'pt-BR')
  );
}

// Helper function to group terms by first letter
export function getTermsGroupedByLetter(): Record<string, GlossaryTerm[]> {
  const sorted = getTermsAlphabetically();
  return sorted.reduce(
    (acc, term) => {
      const letter = term.term[0].toUpperCase();
      if (!acc[letter]) {
        acc[letter] = [];
      }
      acc[letter].push(term);
      return acc;
    },
    {} as Record<string, GlossaryTerm[]>
  );
}

// Helper function to get term by ID
export function getTermById(id: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((t) => t.id === id);
}

// Helper function to get concept by ID
export function getConceptById(id: string): Concept | undefined {
  return LEARNING_CONCEPTS.find((c) => c.id === id);
}
