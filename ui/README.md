# 📊 Análise de Rede Elétrica - Interface React

Interface web para visualização e análise da topologia da rede elétrica.

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js versão 18 ou superior
- npm ou yarn

### Instalação

1. **Navegue até a pasta do projeto:**
```bash
cd ui
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

4. **Acesse no navegador:**
O projeto abrirá automaticamente em `http://localhost:3000`

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Visualiza build de produção localmente

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **Recharts** - Gráficos interativos (BarChart, LineChart, PieChart, ScatterChart)
- **Cytoscape.js** - Visualização de grafos direcionados (novo dataset)
- **Cytoscape-dagre** - Layout hierárquico para grafos
- **Lucide React** - Ícones SVG modernos

## 📊 Dados da Análise

A interface apresenta dados reais da análise da rede elétrica:

- **Total de Nós:** 4.941
- **Total de Conexões:** 6.594
- **Grau Médio:** 2.67
- **Grau Máximo:** 19

### Arquivos JSON Requeridos

A interface carrega os seguintes arquivos JSON de `/public`:

**Essenciais (4)**:
- `analise_basica.json` - Estatísticas gerais e scale-free
- `analise_criticidade.json` - Betweenness, articulação, percolação, clustering
- `analise_comunidades.json` - 20 comunidades detectadas
- `inferencia_papeis.json` - Classificação de papéis dos nós

**Avançados (4)**:
- `analise_ataques.json` - Simulações de ataque
- `analise_robustez.json` - Métricas de robustez estrutural
- `analise_novo_dataset.json` - Análise temporal (10 nós, 1.000 timestamps)
- `simulacao_falhas_novo.json` - Falhas no novo dataset

**Opcionais (3)**:
- `comparacao_datasets.json` - Comparação normalizada entre datasets
- `analise_direcionada.json` - Simulação de fluxo direcionado
- `estrategia_mitigacao.json` - Recomendações de infraestrutura

**Visualizações (~208 arquivos)**:
- `rede_hub_*.html` (20 arquivos raiz)
- `grafos/hubs/`, `grafos/betweenness/`, `grafos/articulacao/`, `grafos/percolacao/`, `grafos/nivel1/`, `grafos/comunidades/`, `grafos/novo_dataset/`

### Categorização por Grau (Inferência Topológica)

1. **Consumidores** (grau = 1): 1.226 nós (24.8%)
2. **Transmissão** (grau 2-3): 2.716 nós (55.0%)
3. **Transformadores** (grau 4-7): 177 nós (17.6%)
4. **Geradores/Usinas** (grau ≥ 8): 11 nós (2.2%)

## 📁 Estrutura do Projeto

```
ui/
├── src/
│   ├── AnaliseRedeEletrica.tsx   # Componente principal
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Estilos globais
├── index.html                     # HTML base
├── package.json                   # Dependências
├── vite.config.ts                 # Configuração Vite
├── tailwind.config.js             # Configuração Tailwind
└── tsconfig.json                  # Configuração TypeScript
```

## 🎨 Funcionalidades

### 4 Categorias Principais com 13 Sub-Abas:

1. **Visão Geral** (5 abas)
   - Dashboard - Métricas principais e visão consolidada
   - Papéis dos Nós - Classificação topológica (Geradores, Transformadores, etc.)
   - Scale-Free - Análise de distribuição power-law
   - Comunidades - Detecção de 20 comunidades (modularidade Q=0.879)
   - Glossário - Definições de termos técnicos

2. **Métricas de Centralidade** (3 abas)
   - Análise por Grau - Top nós por número de conexões
   - Betweenness - Centralidade de intermediação (gargalos)
   - Clustering - Coeficiente de agrupamento

3. **Criticidade & Vulnerabilidade** (4 abas)
   - Pontos de Articulação - Nós cuja remoção fragmenta a rede
   - Percolação - Análise de impacto de remoção (4.941 simulações)
   - Vulnerabilidades - Classificação 4D de criticidade (9 níveis)
   - Simulação de Ataques - Aleatórios vs. Direcionados

4. **Novo Dataset (Temporal)** (2 abas)
   - Análise Temporal - Séries temporais, PageRank, fluxo de potência
   - Simulação de Falhas - Remoção de nós, sobrecarga, cascata

**Nota:** Algumas abas estão implementadas mas comentadas na navegação (AbaRobustez.tsx).

## 🔧 Solução de Problemas

Se encontrar erros ao instalar:

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

Se a porta 3000 já estiver em uso, edite `vite.config.ts` e altere o número da porta.

## 📝 Notas

Os dados apresentados na interface são baseados na análise real da rede elétrica executada pelos scripts Python na pasta `/core`.
