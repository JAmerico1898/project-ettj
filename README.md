# 📈 Aplicação de Modelagem da Estrutura a Termo - Taxa DI

## Descrição

Esta aplicação Streamlit modela a estrutura a termo das taxas de juros brasileiras utilizando dados de contratos futuros DI1 da B3 (Brasil, Bolsa, Balcão).

Os contratos DI1 são derivativos da taxa DI (CDI) pós-fixada e representam essencialmente taxas zero-cupom com capitalização de 252 dias úteis sobre a taxa DI média entre a data de negociação e o vencimento.

## Funcionalidades

### 📊 Coleta Automática de Dados
- Busca automática de dados DI1 via biblioteca `pyield`
- Se não houver dados para a data solicitada, busca automaticamente nos dias anteriores
- Validação automática dos dados coletados

### 🎯 Múltiplos Métodos de Suavização

A aplicação oferece 7 métodos diferentes de suavização da curva:

1. **Nelson-Siegel-Svensson**: Extensão do NS com maior flexibilidade
2. **Nelson-Siegel**: Modelo paramétrico clássico para estrutura a termo
3. **Smoothing Spline**: Permite ajustar o nível de suavização via parâmetro
4. **Akima Spline**: Menos sensível a outliers, menos oscilações que cubic spline
5. **PCHIP (Monotônica)**: Preserva monotonicidade dos dados, evita overshoots
6. **Cubic Spline**: Spline cúbica clássica, muito suave mas pode oscilar
7. **Interpolação Linear**: Método mais simples, conecta pontos com linhas retas

### 📈 Visualizações Interativas

- Gráfico principal com taxas observadas e curva ajustada
- Análise de resíduos
- Métricas de qualidade do ajuste (RMSE, MAE, R², Erro Máximo)
- Gráficos interativos com Plotly

### 💾 Exportação de Dados

- Download da curva ajustada em CSV
- Download dos dados originais filtrados
- Formato compatível com Excel (separador `;` e decimal `,`)

## Instalação

### Pré-requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

### Passo a Passo

1. Clone ou baixe este repositório

2. Crie um ambiente virtual (recomendado):
```bash
python -m venv venv
```

3. Ative o ambiente virtual:
   - Windows:
   ```bash
   venv\Scripts\activate
   ```
   - Linux/Mac:
   ```bash
   source venv/bin/activate
   ```

4. Instale as dependências:
```bash
pip install -r requirements.txt
```

## Como Usar

1. Execute a aplicação:
```bash
streamlit run app_estrutura_termo.py
```

2. A aplicação abrirá automaticamente no seu navegador padrão (geralmente em `http://localhost:8501`)

3. Use a barra lateral para:
   - Selecionar a data de referência
   - Escolher o método de suavização
   - Ajustar parâmetros específicos (quando disponível)
   - Visualizar estatísticas dos dados

4. Explore as diferentes abas:
   - **Dados Utilizados**: Visualize os contratos DI1 filtrados
   - **Análise de Resíduos**: Avalie a qualidade do ajuste
   - **Download**: Baixe os resultados em CSV

## Estrutura dos Dados

### Dados de Entrada (DI1)

A aplicação utiliza as seguintes colunas do DataFrame:

- `BDaysToExp`: Número de dias úteis até o vencimento
- `SettlementRate`: Taxa de fechamento do contrato futuro
- `ExpirationDate`: Data de vencimento do contrato
- `TickerSymbol`: Símbolo do contrato (ex: DI1F26, DI1N27)

### Filtros Aplicados

- **Prazo Máximo**: 5 anos = 1260 dias úteis (252 dias úteis/ano × 5)
- Apenas contratos com dados válidos de `SettlementRate`

## Métodos de Suavização - Detalhes Técnicos

### Métodos de Interpolação

#### 1. Interpolação Linear
- Método mais simples
- Conecta pontos adjacentes com segmentos de reta
- Rápido mas pode gerar "quebras" na curva

#### 2. Cubic Spline
- Utiliza polinômios cúbicos entre cada par de pontos
- Garante suavidade até a segunda derivada
- Pode gerar oscilações indesejadas

#### 3. PCHIP (Piecewise Cubic Hermite Interpolating Polynomial)
- Preserva a monotonicidade dos dados
- Evita overshoots e oscilações
- Boa escolha para dados monotônicos

#### 4. Akima Spline
- Menos sensível a outliers
- Produz curvas mais "naturais"
- Bom compromisso entre suavidade e estabilidade

#### 5. Smoothing Spline
- Permite controlar o trade-off entre ajuste e suavização
- Fator de suavização ajustável
- Útil quando há ruído nos dados

### Métodos Paramétricos

#### 6. Nelson-Siegel (NS)

Modelo paramétrico com 4 parâmetros:

```
r(τ) = β₀ + β₁ × [(1 - exp(-τ/λ)) / (τ/λ)] + β₂ × [((1 - exp(-τ/λ)) / (τ/λ)) - exp(-τ/λ)]
```

Onde:
- `β₀`: nível de longo prazo
- `β₁`: componente de curto prazo
- `β₂`: componente de médio prazo (curvatura)
- `λ`: parâmetro de decaimento

#### 7. Nelson-Siegel-Svensson (NSS)

Extensão do NS com 6 parâmetros, adiciona:

```
+ β₃ × [((1 - exp(-τ/λ₂)) / (τ/λ₂)) - exp(-τ/λ₂)]
```

Onde:
- `β₃`: segunda componente de curvatura
- `λ₂`: segundo parâmetro de decaimento

Permite maior flexibilidade para capturar formas complexas da curva.

## Métricas de Qualidade

A aplicação calcula automaticamente:

- **RMSE** (Root Mean Square Error): Raiz do erro quadrático médio
- **MAE** (Mean Absolute Error): Erro absoluto médio
- **R²** (Coeficiente de Determinação): Proporção da variância explicada
- **Erro Máximo**: Maior desvio em valor absoluto

Valores menores de RMSE e MAE indicam melhor ajuste. R² mais próximo de 1 indica melhor qualidade.

## Bibliotecas Utilizadas

- **streamlit**: Framework para criação da aplicação web
- **pandas**: Manipulação de dados
- **numpy**: Operações numéricas
- **scipy**: Métodos de interpolação e otimização
- **plotly**: Visualizações interativas
- **pyield**: Coleta de dados DI1 da B3
- **pyarrow**: Processamento eficiente de dados

## Observações Importantes

1. **Dias Úteis**: O mercado brasileiro considera 252 dias úteis por ano
2. **Capitalização**: As taxas DI1 utilizam capitalização diária de 252 dias
3. **Atualização**: Os dados são atualizados diariamente após o fechamento do mercado
4. **Cache**: A aplicação usa cache para melhorar performance (TTL de 1 hora)

## Solução de Problemas

### Erro "ArrowExtensionArray object has no attribute 'min'"

Este erro ocorre devido à incompatibilidade entre PyArrow e algumas operações do NumPy. A versão corrigida da aplicação já resolve este problema automaticamente convertendo os arrays PyArrow para NumPy quando necessário.

Se você ainda encontrar este erro:
1. Certifique-se de estar usando a versão mais recente do arquivo
2. Verifique se as dependências estão corretamente instaladas
3. Tente reinstalar o pyarrow: `pip install --upgrade pyarrow`

### Erro ao carregar dados

Se a aplicação não conseguir carregar dados:
1. Verifique sua conexão com a internet
2. Tente uma data anterior (pode não haver dados para dias muito recentes)
3. Clique em "🔄 Carregar Dados" para limpar o cache

### Erro de instalação do pyield

Se houver problemas ao instalar o pyield:
```bash
pip install --upgrade pip
pip install pyield --no-cache-dir
```

### Problemas com pyarrow

Se houver erros relacionados ao pyarrow:
```bash
pip uninstall pyarrow
pip install pyarrow --no-cache-dir
```

## Contribuições

Sugestões e melhorias são bem-vindas! 

## Licença

Este projeto é fornecido "como está", sem garantias de qualquer tipo.

## Contato

Para dúvidas ou sugestões sobre a aplicação, consulte a documentação do pyield em: https://github.com/crdcj/PYield

---

**Nota**: Esta aplicação é apenas para fins educacionais e de pesquisa. Não constitui recomendação de investimento.
