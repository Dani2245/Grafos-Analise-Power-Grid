# Análise de Rede Elétrica - Power Grid

Sistema de análise topológica da rede de distribuição elétrica **para o trabalho de Grafos - Sistemas de Informação da UNIFEI**, desenvolvido com Python (análise de grafos) e React (visualização interativa).

**Assista à apresentação do projeto no YouTube](https://www.youtube.com/watch?v=4v_qbMWpPD4)**

## Pré-requisitos

Antes de começar, você precisa instalar no seu computador:

### 1. Python (versão 3.8 ou superior)
- **Windows**: Baixe em [python.org](https://www.python.org/downloads/)
  - **IMPORTANTE**: Durante a instalação, marque a opção **"Add Python to PATH"**
- **Linux/Mac**: Geralmente já vem instalado. Verifique com `python3 --version`

### 2. Node.js e npm (versão 16 ou superior)
- Baixe e instale em [nodejs.org](https://nodejs.org/)
- O npm é instalado automaticamente junto com o Node.js

### 3. Git (para clonar o repositório)
- Baixe em [git-scm.com](https://git-scm.com/)

---

## Como Executar o Projeto

### Passo 1: Obter o Projeto

Clone ou baixe o repositório:
```bash
git clone https://github.com/Dani2245/Grafos-Analise-PowerGrid.git
cd Grafos-Analise-PowerGrid
```

---

## Parte 1: Scripts Python (Análise de Dados)

### 1.1 Criar Ambiente Virtual (Recomendado)

**Windows (PowerShell/CMD):**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 1.2 Instalar Dependências Python

```bash
cd core
pip install -r requirements.txt
```

### 1.3 Executar as Análises

Execute os scripts na seguinte ordem:

**1. Análise Básica (estatísticas, distribuição de graus e scale-free):**
```bash
python gerar_analise_base.py
```
- Gera: `ui/public/analise_basica.json`
- Análises: Estatísticas da rede, distribuição de graus, identificação de hubs
- Verificação scale-free: Algoritmo Clauset-Shalizi-Newman (biblioteca powerlaw)

**2. Análise Avançada de Criticidade 4D (betweenness, articulação, clustering, percolação):**
```bash
python gerar_analise_avancada.py
```
- Gera: `ui/public/analise_criticidade.json`
- Análises: 9 níveis de criticidade combinando 4 dimensões (Articulação, Grau Alto, Betweenness, Percolação)
- Tempo: 2-5 minutos (cálculo de betweenness em 4.941 nós)

**3. Grafos Interativos 2D (visualizações completas da rede):**
```bash
python gerar_grafos_2d.py
```
- Gera: ~208 arquivos HTML interativos com PyVis organizados em:
  - `ui/public/rede_hub_*.html` (20 arquivos - top hubs)
  - `ui/public/grafos/hubs/` - Vizinhanças detalhadas dos hubs
  - `ui/public/grafos/betweenness/` - Nós com alta centralidade de intermediação
  - `ui/public/grafos/articulacao/` - Pontos de articulação por criticidade
  - `ui/public/grafos/percolacao/` - Nós com alto impacto de percolação
  - `ui/public/grafos/nivel1/` - Nós críticos máximos (4D)
  - `ui/public/grafos/comunidades/` - 10 maiores comunidades
  - `ui/public/grafos/novo_dataset/` - Grafos temporais do novo dataset

**4. Inferência de Papéis dos Nós (classificação topológica baseada em métricas):**
```bash
python gerar_inferencia_papeis.py
```
- Gera: `ui/public/inferencia_papeis.json`
- Método: Classifica nós em GERADOR, TRANSFORMADOR, CONSUMIDOR, LINHA_TRANSMISSÃO
- Baseado em: Grau, betweenness, clustering, análise de comunidades
- IMPORTANTE: Inferência topológica - validação de campo necessária

**5. Análise Direcionada (simulação de fluxo):**
```bash
python gerar_analise_direcionada.py
```
- Gera: `ui/public/analise_direcionada.json`
- Método: Infere direções baseado em hierarquia de papéis (GERADOR → TRANSFORMADOR → CONSUMIDOR)
- Métricas: In/out-degree, reciprocidade, consistência hierárquica
- **NOTA**: Simulação teórica - dataset original é não-direcionado
- **INCLUÍDO no `executar_todos.py`**

**6. Detecção de Comunidades (Greedy Modularity Optimization):**
```bash
python gerar_analise_comunidades.py
```
- Gera: `ui/public/analise_comunidades.json`
- Método: Greedy Modularity (20 comunidades, Q=0.879)
- Análises: Métricas por comunidade, conexões inter-comunidades, identificação de grupos consumidores
- Localização: Spring layout para visualização topológica (NÃO geográfica)

**7. Análise de Robustez (percolação, conectividade algébrica, resiliência):**
```bash
python gerar_analise_robustez.py
```
- Gera: `ui/public/analise_robustez.json`
- Análises: Simulação de remoção de 500 pontos de articulação
- Métricas: Conectividade algébrica, coeficiente de resiliência, fragmentação percentual
- Comparação: Redes teóricas (Erdős-Rényi, Barabási-Albert)

**8. Simulação de Ataques (randômicos vs direcionados):**
```bash
python gerar_analise_ataques.py
```
- Gera: `ui/public/analise_ataques.json`
- Cenários: Ataque aleatório, high-degree, high-betweenness, híbrido
- Análises: Fragmentação progressiva, identificação de combinações críticas
- Tempo: 1-2 minutos

**9. Análise do Novo Dataset (temporal, direcionado e ponderado):**
```bash
python gerar_analise_novo_dataset.py
```
- Gera: `ui/public/analise_novo_dataset.json`
- Dataset: `power_grid_dataset.csv` (10 nós, 1.000 timestamps)
- Métricas Temporais: Agregação estatística (média, desvio, percentis) por nó
- Métricas Direcionadas: PageRank, in/out-degree, fontes/sumidouros
- Métricas Ponderadas: Matriz 10×10 de fluxo de potência, balanceamento de carga
- Análises Operacionais: Correlação de falhas, estratificação por grid_status (estável/instável)

**10. Simulação de Falhas no Novo Dataset:**
```bash
python gerar_simulacao_falhas_novo.py
```
- Gera: `ui/public/simulacao_falhas_novo.json`
- Threshold Data-Driven: 272.24 MW calculado de 933 timestamps com grid_status=1
- Simulação de Remoção: Testa impacto da falha de cada um dos 10 nós
- Cenários de Sobrecarga: 4 cenários localizados (30-75% aumento em nós específicos)
- Simulação de Cascata: Propagação iterativa de falhas
- Resultados: Nó 9 mais crítico (10.17% perda de carga), qualquer falha → colapso total

**11. Comparação entre Datasets:**
```bash
python gerar_comparacao_datasets.py
```
- Gera: `ui/public/comparacao_datasets.json`
- Compara: Dataset original (4.941 nós, topológico) vs. novo dataset (10 nós, operacional)
- Índices Normalizados (0-100): Densidade, clustering, conectividade, centralização
- Análises Estruturais: Diâmetro, caminho médio, componentes
- Comparação de Robustez: Fragmentação, percentual de nós críticos
- **NOTA**: Otimizado - carrega betweenness pré-calculado de analise_criticidade.json

**12. Execução Automática de Todos os Scripts:**
```bash
python executar_todos.py
```
- Executa 11 scripts principais na ordem correta
- Tempo total: ~15-20 minutos
- Scripts executados em ordem:
  1. gerar_analise_base.py
  2. gerar_analise_avancada.py
  3. gerar_analise_comunidades.py
  4. gerar_analise_robustez.py
  5. gerar_analise_ataques.py
  6. gerar_inferencia_papeis.py
  7. gerar_analise_direcionada.py (agora incluído automaticamente)
  8. gerar_analise_novo_dataset.py
  9. gerar_simulacao_falhas_novo.py
  10. gerar_comparacao_datasets.py
  11. gerar_grafos_2d.py

**Pronto!** Os arquivos de análise foram gerados e estão prontos para serem visualizados no frontend.

---

## Parte 2: Frontend React (Visualização)

### 2.1 Instalar Dependências do Node.js

```bash
cd ../ui
npm install
```

### 2.2 Executar o Servidor de Desenvolvimento

```bash
npm run dev
```

### 2.3 Acessar a Aplicação

Abra seu navegador e acesse:
```
http://localhost:3000
```

**Parabéns!** A aplicação está rodando e mostrando a análise da rede elétrica.

---

## Estrutura do Projeto

```
Grafos-Analise-PowerGrid/
│
├── core/                                  # Scripts Python de Análise
│   ├── powergrid.edgelist.csv            # Dataset Original (4.941 nós, 6.594 arestas)
│   ├── power_grid_dataset.csv            # Novo Dataset (10 nós, 1.000 timestamps)
│   ├── requirements.txt                   # Dependências Python
│   ├── executar_todos.py                  # Script que executa todas as análises
│   │
│   ├── gerar_analise_base.py             # 1. Análise básica + Scale-Free + Distribuição
│   ├── gerar_analise_avancada.py         # 2. Criticidade 4D (Articulação, Grau, Betweenness, Percolação)
│   ├── gerar_grafos_2d.py                # 3. Visualizações PyVis 2D (~208 arquivos em 7 categorias)
│   ├── gerar_inferencia_papeis.py        # 4. Classificação topológica (usa comunidades + criticidade)
│   ├── gerar_analise_direcionada.py      # 5. Simulação de fluxo direcionado
│   ├── gerar_analise_comunidades.py      # 6. Detecção de comunidades (Greedy Modularity, Q=0.879)
│   ├── gerar_analise_robustez.py         # 7. Robustez, resiliência e conectividade algébrica
│   ├── gerar_analise_ataques.py          # 8. Simulação de ataques (aleatório, high-degree, betweenness, híbrido)
│   ├── gerar_analise_novo_dataset.py     # 10. Análise temporal (PageRank, fluxo de potência, séries temporais)
│   ├── gerar_simulacao_falhas_novo.py    # 11. Simulação de falhas (threshold data-driven, cascata, sobrecarga)
│   └── gerar_comparacao_datasets.py      # 12. Comparação normalizada entre os 2 datasets
│
├── ui/                                    # Frontend React + TypeScript
│   ├── public/                            # Arquivos JSON gerados
│   │   ├── analise_basica.json
│   │   ├── analise_criticidade.json
│   │   ├── inferencia_papeis.json
│   │   ├── analise_direcionada.json
│   │   ├── analise_comunidades.json
│   │   ├── analise_robustez.json
│   │   ├── analise_ataques.json
│   │   ├── analise_novo_dataset.json
│   │   ├── simulacao_falhas_novo.json
│   │   ├── comparacao_datasets.json
│   │   ├── rede_hub_*.html                    # 20 visualizações dos top hubs
│   │   └── grafos/                            # ~188 visualizações em 7 categorias
│   │       ├── hubs/                          # Vizinhanças detalhadas dos hubs
│   │       ├── betweenness/                   # Top 50 nós por betweenness
│   │       ├── articulacao/                   # Top 100 pontos de articulação
│   │       ├── percolacao/                    # Top 10 nós por impacto de percolação
│   │       ├── nivel1/                        # Nós críticos máximos (4D)
│   │       ├── comunidades/                   # 10 maiores comunidades
│   │       └── novo_dataset/                  # Grafos temporais do novo dataset
│   │
│   ├── src/
│   │   ├── AnaliseRedeEletrica.tsx       # Componente principal (gerencia abas)
│   │   └── components/
│   │       ├── CartaoMetrica.tsx         # Componente de cartão de métrica
│   │       ├── ModalGrafo.tsx            # Modal para visualizações
│   │       ├── TooltipTermoTecnico.tsx   # Tooltip para termos técnicos
│   │       └── abas/                     # 15+ abas de análise
│   │           ├── AbaVisaoGeral.tsx
│   │           ├── AbaScaleFree.tsx
│   │           ├── AbaAnalisePorGrau.tsx
│   │           ├── AbaBetweeness.tsx
│   │           ├── AbaClustering.tsx
│   │           ├── AbaPontosArticulacao.tsx
│   │           ├── AbaPapeis.tsx
│   │           ├── AbaComunidades.tsx
│   │           ├── AbaSimulacaoAtaques.tsx
│   │           ├── AbaVulnerabilidades.tsx
│   │           ├── AbaNovoDataset.tsx
│   │           ├── AbaSimulacaoFalhasNovo.tsx
│   │           ├── AbaPercolacao.tsx
│   │           └── AbaGlossario.tsx
│   │
│   ├── package.json                       # Dependências Node.js
│   └── vite.config.ts                     # Configuração Vite
│
├── doc/                                   # Documentação técnica (LaTeX/Overleaf)
│
├── resolucao_do_problema/                 # Aplicativos Electron para otimização de conectividade
│   ├── powergrid.edgelist.txt            # Dataset em formato TXT (para os apps)
│   ├── README.md                          # Instruções de uso dos aplicativos
│   │
│   ├── app_2_connectivity/                # Aplicativo 1: Torna o grafo 2-conexo (~10 min)
│   │   ├── package.json                   # Dependências Electron + Node.js
│   │   ├── backend/                       # Backend Python (executável + scripts)
│   │   │   ├── diagnostico.py            # Identifica pontos de articulação
│   │   │   ├── otimizacao.py             # Algoritmo de otimização 2-connectivity
│   │   │   ├── recomendacoes.py          # Gera recomendações de arestas
│   │   │   ├── requirements.txt          # Dependências Python (networkx, etc.)
│   │   │   └── start_backend.py          # Inicializador do backend
│   │   ├── frontend/                      # Interface HTML/CSS/JS
│   │   │   ├── index.html                # UI do aplicativo
│   │   │   ├── renderer.js               # Lógica de renderização
│   │   │   └── styles.css                # Estilos da interface
│   │   └── src_electron/                  # Configuração Electron
│   │       └── main.js                    # Processo principal Electron
│   │
│   └── app_otimizacao/                    # Aplicativo 2: Otimização de pontos críticos (~1 min)
│       ├── package.json                   # Dependências Electron + Node.js
│       ├── backend/                       # Backend Python (executável + scripts)
│       │   ├── dados.json                # Cache de dados de análise
│       │   ├── otimizacao.py             # Otimização focada em nós críticos
│       │   ├── simulacao.py              # Simulação de impacto
│       │   └── requirements.txt          # Dependências Python
│       ├── frontend/                      # Interface HTML/CSS/JS
│       │   ├── index.html                # UI do aplicativo
│       │   ├── renderer.js               # Lógica de renderização
│       │   └── styles.css                # Estilos da interface
│       └── src_electron/                  # Configuração Electron
│           └── main.js                    # Processo principal Electron
│
└── README.md                              # Este arquivo
```

---

## Workflow Completo

### Execução Rápida (Scripts Essenciais)
1. **Ative o ambiente virtual Python** (`.venv`)
2. **Execute os scripts principais**:
   ```bash
   cd core
   python gerar_analise_base.py
   python gerar_analise_avancada.py
   python gerar_grafos_2d.py
   ```
3. **Execute `npm run dev`** no diretório `ui/`
4. **Acesse `localhost:3000`** no navegador

### Execução Completa (Todas as Análises)

**OPÇÃO 1: Execução Automatizada (Recomendado)**
```bash
cd core
python executar_todos.py
```
- Executa os 11 scripts principais na ordem correta 
- Tempo total: ~15-20 minutos (depende do processador)
- Continua em caso de erro (com prompt de confirmação)

**OPÇÃO 2: Execução Manual (ordem correta)**
```bash
cd core
python gerar_analise_base.py              # 1. Análise básica (scale-free, distribuição)
python gerar_analise_avancada.py          # 2. Criticidade 4D e percolação (2-5 min)
python gerar_analise_comunidades.py       # 3. Detecção de comunidades (Greedy Modularity)
python gerar_analise_robustez.py          # 4. Robustez e resiliência
python gerar_analise_ataques.py           # 5. Simulação de ataques (1-2 min)
python gerar_inferencia_papeis.py         # 6. Classificação de papéis (depende de 2 e 3)
python gerar_analise_direcionada.py       # 7. Simulação de fluxo direcionado (depende de 6)
python gerar_analise_novo_dataset.py      # 8. Análise temporal (novo dataset)
python gerar_simulacao_falhas_novo.py     # 9. Simulação de falhas (novo dataset)
python gerar_comparacao_datasets.py       # 10. Comparação entre datasets (depende de 2)
python gerar_grafos_2d.py                 # 11. Visualizações 2D (~208 arquivos HTML)
```
---

## Comandos Úteis

### Python
```bash
# Desativar ambiente virtual
deactivate

# Reinstalar dependências
pip install -r requirements.txt --force-reinstall
```

### Frontend React
```bash
# Compilar para produção
npm run build

# Visualizar build de produção
npm run preview
```

---

## O que a Aplicação Mostra?

### Análises Estruturais Básicas
- **Visão Geral**: Estatísticas da rede (nós, arestas, grau médio, análise scale-free)
- **Análise por Grau**: Top 20 nós com mais conexões (hubs)
- **Betweenness**: Centralidade de intermediação (nós-gargalo)
- **Clustering**: Coeficiente de agrupamento e transitividade da rede
- **Pontos de Articulação**: Nós que fragmentam a rede se removidos
- **Glossário**: Definições de termos técnicos com tooltips contextuais

### Análises Avançadas (Novas Funcionalidades)
- **Inferência de Papéis**: Classificação topológica em GERADOR, TRANSFORMADOR, CONSUMIDOR, LINHA_TRANSMISSÃO
- **Comunidades**: Detecção de 20 comunidades com análise de modularidade e localização espacial
- **Análise Direcionada**: Simulação de fluxo com métricas in/out-degree e consistência hierárquica
- **Criticidade**: 9 níveis de criticidade estrutural (4D system) combinando betweenness, grau, articulação e percolação
- **Vulnerabilidades**: **29 nós Nível 1** (Crítico Máximo 4D) com todas as 4 dimensões de risco

### Análises de Resiliência e Segurança
- **Robustez**: Análise de percolação (500 pontos), conectividade algébrica e coeficiente de resiliência
- **Simulação de Ataques**: Comparação entre ataques aleatórios vs direcionados (high-degree e high-betweenness)

### Visualizações Interativas
- **Grafos 2D**: ~208 visualizações interativas organizadas em:
  - **Root** (20 arquivos): Top 20 hubs principais (2-hop neighborhoods)
  - **grafos/hubs/**: Visualizações detalhadas de hubs
  - **grafos/betweenness/**: Nós com alta centralidade de intermediação
  - **grafos/articulacao/**: Pontos críticos de fragmentação
  - **grafos/percolacao/**: Nós com alto impacto de percolação
  - **grafos/nivel1/**: Nós críticos máximos (4D - todas dimensões de risco)
  - **grafos/comunidades/**: 10 visualizações de comunidades detectadas
  - **grafos/novo_dataset/**: Grafos temporais do dataset operacional
- **Dashboards**: Gráficos de barras, pizza, dispersão e linha para todas as métricas

---

## Problemas Comuns

### Python não encontrado
- Certifique-se de ter marcado "Add Python to PATH" durante a instalação
- Reinicie o terminal após instalar o Python

### `npm` não é reconhecido
- Verifique se o Node.js foi instalado corretamente
- Reinicie o terminal após a instalação

### Porta 3000 já está em uso
- Pare outros servidores na porta 3000
- Ou edite `vite.config.ts` para usar outra porta

### Arquivos JSON não aparecem
- Certifique-se de ter executado **todos os scripts Python**
- Verifique se os arquivos foram gerados em `ui/public/`

---

## Limitações Metodológicas

### Importante: Transparência Científica

Este projeto utiliza **inferência topológica** baseada em métricas de redes complexas. As seguintes limitações devem ser consideradas:

#### 1. **Inferência de Papéis dos Nós**
- **Método**: Classificação heurística baseada em grau, betweenness centrality e clustering coefficient
- **Limitação**: O dataset original (Western States Power Grid) **NÃO contém metadados** sobre a função real dos nós (geradores, transformadores, consumidores, linhas de transmissão)
- **Implicação**: Os "papéis" (GERADOR, TRANSFORMADOR, etc.) são **aproximações topológicas**, não dados operacionais reais
- **Uso**: Adequado para análise acadêmica e exploração conceitual. **Validação de campo necessária** para uso operacional

#### 2. **Análise de Grafo Direcionado**
- **Método**: Inferência de direção de fluxo baseada em hierarquia de papéis (também inferidos)
- **Limitação**: O dataset original é **não-direcionado** (sem informação de direção de fluxo real de energia)
- **Implicação**: As direções das arestas são **simulações teóricas**, não medições reais
- **Uso**: Serve para **comparação metodológica** entre análises direcionadas vs não-direcionadas, não para planejamento operacional

#### 3. **Localização Espacial das Comunidades**
- **Método**: Spring layout (força-direcionado) para posicionamento dos nós
- **Limitação**: O dataset **NÃO possui coordenadas geográficas reais**
- **Implicação**: As "posições" e "centroides de comunidades" representam **proximidade topológica** (conectividade), não localização física
- **Uso**: Visualização da estrutura da rede, não mapeamento geográfico

#### 4. **Análise Scale-Free**
- **Método**: Algoritmo rigoroso Clauset-Shalizi-Newman (biblioteca `powerlaw`)
- **Resultado**: A rede **NÃO é scale-free**, segue distribuição log-normal
- **Validade**: Este resultado está **correto** segundo literatura científica (redes de infraestrutura crítica tendem a ser mais regulares que redes sociais)

### Adequação para Fins Acadêmicos

Apesar das limitações listadas, o projeto é **plenamente adequado** para:
- Demonstração de conceitos de teoria de grafos
- Análise exploratória de redes complexas
- Comparação de métricas estruturais (betweenness, clustering, percolação)
- Simulação de cenários de falha e robustez
- Estudo de algoritmos de detecção de comunidades
- Prática de técnicas de ciência de dados em redes

### Validação Técnica

Todas as implementações seguem **padrões da literatura científica**:
- NetworkX (biblioteca padrão para análise de grafos em Python)
- Métricas validadas em publicações científicas (betweenness centrality, algebraic connectivity, etc.)
- Algoritmos de referência (Greedy Modularity, Clauset-Shalizi-Newman)

---

## Arquitetura de Datasets Duais

### Visão Geral

O projeto agora suporta **dois datasets paralelos** com características completamente diferentes:

#### Dataset 1: Original (Topológico)
- **Arquivo**: `core/powergrid.edgelist.csv`
- **Tipo**: Estático, não-direcionado, não-ponderado
- **Escala**: 4.941 nós, 6.594 arestas
- **Propósito**: Análise topológica da Western States Power Grid
- **Análises**: Detecção de comunidades, betweenness centrality, pontos de articulação, distribuição de grau (verificação scale-free)

#### Dataset 2: Novo (Operacional)
- **Arquivo**: `core/power_grid_dataset.csv`
- **Tipo**: Temporal (1.000 timestamps), direcionado, ponderado
- **Escala**: 10 nós, ~90 arestas (variável por timestamp)
- **Propósito**: Análise operacional com carga, voltagem, frequência, detecção de falhas
- **Análises**: Séries temporais, matrizes de fluxo de potência, simulação de falhas, estratificação por grid_status

### Princípio de Design Crítico

**NENHUMA MODIFICAÇÃO** nas análises do dataset original. Toda nova funcionalidade é **aditiva**:
- Scripts Python separados (`gerar_analise_novo_dataset.py`, `gerar_simulacao_falhas_novo.py`, `gerar_comparacao_datasets.py`)
- Saídas JSON separadas (`analise_novo_dataset.json`, `simulacao_falhas_novo.json`, `comparacao_datasets.json`)
- Componentes React separados (`AbaNovoDataset.tsx`, `AbaSimulacaoFalhasNovo.tsx`)
- Schemas JSON originais (`analise_basica.json`, `analise_criticidade.json`) permanecem **intocados**

### Características do Novo Dataset

#### 1. Análise Temporal (`gerar_analise_novo_dataset.py`)
- **Agregação Temporal**: Média, desvio padrão, mín, máx, percentis para load_node_X em 1.000 timestamps
- **Séries Temporais**: Amostradas a intervalos de 1/10 (100 pontos) para visualização JSON
- **Métricas Operacionais**: Estatísticas de voltagem, frequência, fault_detected, grid_status
- **Métricas Direcionadas**: PageRank, in/out-degree, betweenness centrality, identificação de fontes/sumidouros
- **Métricas Ponderadas**: Matriz de fluxo de potência 10×10, balanceamento de carga por nó, top 20 arestas por fluxo
- **Correlação de Falhas**: Compara voltagem/frequência durante fault_detected=1 vs. fault_detected=0
- **Estratificação por Grid Status**: Métricas separadas para grid_status=0 (estável) vs. grid_status=1 (instável)

#### 2. Simulação de Falhas (`gerar_simulacao_falhas_novo.py`)
- **Remoção de Nós**: Testa remoção de cada um dos 10 nós, mede fragmentação (%), perda de carga (MW/%), arestas perdidas, contagem de componentes
- **Cenários de Sobrecarga**: Simula aumento de carga de +25%, +50%, +75%, +100%, identifica nós excedendo threshold de 500MW
- **Identificação de Nós Críticos**: Classifica nós por impacto (fragmentação + perda de carga)
- **Comparação Conceitual**: Nota diferenças de escala com dataset original

#### 3. Comparação entre Datasets (`gerar_comparacao_datasets.py`)
- **Índices Normalizados (0-100)**: Densidade, clustering, conectividade, centralização
- **Comparação Estrutural**: Diâmetro, caminho médio, contagem de componentes
- **Comparação de Robustez**: Taxas de fragmentação, percentuais de nós críticos
- **Saída Tabular**: Métricas lado a lado com interpretações

### Atualizações no Frontend React

#### Novos Componentes
- **`AbaNovoDataset.tsx`**:
  - **Grafo Cytoscape**: Grafo direcionado interativo com cores baseadas em PageRank, espessura de aresta baseada em peso
  - **Animação Temporal**: Slider + controles play/pause (velocidade 1x/2x/4x), tamanho de nó varia por carga no timestamp selecionado
  - **Gráficos de Séries Temporais**: 10 linhas (uma por nó) mostrando carga ao longo do tempo (Recharts LineChart)
  - **Métricas Operacionais**: Gráfico de eixo duplo para voltagem/frequência
  - **Top 20 Arestas**: Tabela ordenada por fluxo de potência
  - **Seção de Comparação**: Gráficos de barras de índices normalizados vs. dataset original

- **`AbaSimulacaoFalhasNovo.tsx`**:
  - **Gráficos de Barras de Impacto**: Fragmentação % e perda de carga % por remoção de nó
  - **Tabela Detalhada**: Clique para expandir detalhes, codificação por cores por criticidade (5 níveis)
  - **Cenários de Sobrecarga**: 4 cards mostrando impactos de aumento de carga +25/50/75/100%
  - **Modal de Detalhes do Nó**: Mostra breakdown de fragmentação, mudanças de componentes

#### Integração em `AnaliseRedeEletrica.tsx`
- **Novos Estados**: `analiseNovoDataset`, `simulacaoFalhasNovo`, `comparacaoDatasets`
- **Lógica de Fetch**: Encapsulada em `.catch(() => null)` para lidar graciosamente com JSONs ausentes (scripts ainda não executados)
- **Novas Abas**: "Novo Dataset (Temporal)" e "Falhas Novo Dataset" na barra de navegação

### Stack Tecnológico Atualizado

#### Backend Python (Novas Dependências)
- **pandas**: Parsing de CSV e manipulação de dados temporais (1.000 linhas × 110 colunas)
- **scipy** (já presente): Funções estatísticas para correlação
- **powerlaw** (já presente): Verificação scale-free

#### Frontend React (Novas Dependências)
- **cytoscape**: Renderização de grafo direcionado interativo
- **cytoscape-dagre**: Algoritmo de layout hierárquico para grafos direcionados
- **@types/cytoscape**: Definições de tipo TypeScript

## Dependências Críticas

### Python - Biblioteca `powerlaw`

**IMPORTANTE**: A biblioteca `powerlaw` é essencial para análise rigorosa de distribuição scale-free.

**Instalação**:
```bash
pip install powerlaw
```

Se a instalação falhar, o script `gerar_analise_base.py` usará **fallback** para regressão linear (menos rigoroso, mas funcional).

**Dependências completas** (`requirements.txt`):
```
pyvis          # Visualizações interativas 2D
networkx       # Biblioteca padrão de análise de grafos
numpy          # Operações matemáticas
scipy          # Algoritmos científicos
powerlaw       # Análise rigorosa de distribuição scale-free
pandas         # Manipulação de dados temporais (novo dataset)
```

---

## Análises implementadas

### 1. Clustering e Percolação
- **Script**: `gerar_analise_avancada.py` + `gerar_analise_robustez.py`
- **Métricas**: Coeficiente de clustering global/local, análise de percolação em 500 pontos de articulação
- **Resultado**: Rede robusta com CC=0.080, impacto máximo de fragmentação de 2.1%

### 2. Exploração de Papéis (Gerador, Transformador, Consumidor, Linha)
- **Script**: `gerar_inferencia_papeis.py`
- **Método**: Inferência topológica baseada em grau, betweenness e clustering
- **Distribuição**: 53% Linhas, 24.8% Consumidores, 20.6% Transformadores, 1.6% Geradores
- **Disclaimer**: Classificação heurística, validação de campo necessária

### 3. Centralidade e Identificação de Geradores/Transformadores
- **Script**: `gerar_analise_base.py` + `gerar_inferencia_papeis.py`
- **Critério**: Grau ≥8 + Betweenness alto → GERADOR; Grau 4-7 + Clustering médio → TRANSFORMADOR
- **Top Hub**: Nó 2553 (grau 19, betweenness 0.0486)

### 4. Identificação de Grupos Consumidores
- **Script**: `gerar_analise_comunidades.py`
- **Método**: Greedy Modularity (20 comunidades com Q=0.879)
- **Localização**: Spring layout para visualização topológica (NÃO geográfica)
- **Distribuição**: 1.226 nós classificados como CONSUMIDOR (grau 1)

### 5. Simulação de Falhas em Pontos Críticos
- **Script**: `gerar_analise_robustez.py`
- **Análise**: Remoção simulada de 500 pontos de articulação
- **Resultado**: Nó 726 causa fragmentação de 2.1% (104 nós isolados)

### 6. Análise Direcionada vs Não-Direcionada
- **Script**: `gerar_analise_direcionada.py`
- **Comparação**: In-degree vs Out-degree, Reciprocidade, Consistência hierárquica (94.4%)
- **Método**: Inferência de direções baseada em hierarquia de papéis (GERADOR → TRANSFORMADOR → CONSUMIDOR)
- **Disclaimer**: Simulação teórica - dataset original é não-direcionado, sem dados reais de fluxo

### 8. Verificação de Rede Scale-Free
- **Script**: `gerar_analise_base.py`
- **Método**: Clauset-Shalizi-Newman (biblioteca `powerlaw`)
- **Resultado**: **NÃO é scale-free** (p-value=0.00), segue distribuição log-normal
- **Interpretação**: Típico de redes de infraestrutura crítica (mais regular que redes sociais)

### 9. Simulação de Ataques Aleatórios vs Direcionados
- **Script**: `gerar_analise_ataques.py`
- **Cenários**: Ataque aleatório, High-Degree, High-Betweenness, Híbrido
- **Resultado**: Ataque a hubs (high-degree) é 4x mais devastador que aleatório
- **Conclusão**: Rede vulnerável a ataques direcionados

### 10. Detecção de Comunidades
- **Script**: `gerar_analise_comunidades.py`
- **Algoritmo**: Greedy Modularity Optimization
- **Resultado**: 20 comunidades com modularidade Q=0.879 (excelente)

### 11. Análise de Robustez
- **Script**: `gerar_analise_robustez.py`
- **Métricas**: Conectividade algébrica (0.0038), Coeficiente de resiliência (0.0018)
- **Conclusão**: Rede tem **baixa robustez estrutural** (alta dependência de pontos de articulação)

### 12. Análise de Resiliência
- **Script**: `gerar_analise_robustez.py`
- **Método**: Taxa de sobrevivência após remoção de nós críticos
- **Resultado**: 97.9% da rede permanece conectada após remoção de 500 pontos

---

## Tecnologias Utilizadas

### Backend (Python)
- **NetworkX 3.x**: Análise de grafos, algoritmos de centralidade, detecção de comunidades
- **PyVis**: Visualizações interativas 2D com física de força
- **Powerlaw**: Análise rigorosa de distribuição scale-free (Clauset-Shalizi-Newman)
- **NumPy/SciPy**: Operações matemáticas e científicas

### Frontend (React)
- **React 18 + TypeScript**: Framework UI com tipagem estática
- **Vite**: Build tool de alta performance
- **Tailwind CSS**: Estilização utility-first com tema dark (slate/yellow)
- **Recharts**: Biblioteca de gráficos declarativos (BarChart, PieChart, ScatterChart, LineChart)
- **Lucide React**: Ícones modernos e consistentes

---

## Validação Científica

### Padrões e Boas Práticas Implementadas
- **Algoritmos de Referência**: NetworkX usa implementações validadas cientificamente
- **Métricas Normalizadas**: Betweenness centrality com `normalized=True`
- **Testes Estatísticos**: Clauset-Shalizi-Newman para scale-free (mais rigoroso que regressão linear)
- **Transparência Metodológica**: Disclaimers em todos os JSONs sobre limitações
- **Documentação de Código**: Comentários explicativos em funções críticas

### Publicações de Referência
- **Barabási & Albert (1999)**: Redes scale-free e distribuição power-law
- **Clauset, Shalizi, Newman (2009)**: "Power-law distributions in empirical data"
- **Newman (2006)**: "Modularity and community structure in networks"
- **Moody & White (2003)**: "Structural cohesion and embeddedness"

---

## Notas Importantes para Uso Operacional

**Este projeto é para FINS ACADÊMICOS**. Para uso em sistemas reais de distribuição elétrica:
