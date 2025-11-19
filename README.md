# Análise de Rede Elétrica - Power Grid

Sistema de análise topológica da rede de distribuição elétrica **para o trabalho de Grafos - Sistemas de Informação da UNIFEI**, desenvolvido com Python (análise de grafos) e React (visualização interativa).

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

**1. Análise Básica (estatísticas e distribuição de graus):**
```bash
python gerar_analise_base.py
```
- Gera: `ui/public/analise_basica.json`

**2. Análise Avançada (criticidade, betweenness, pontos de articulação):**
```bash
python gerar_analise_avancada.py
```
- Gera: `ui/public/analise_criticidade.json`

**3. Grafos Interativos 2D (visualizações dos hubs):**
```bash
python gerar_grafos_2d.py
```
- Gera: Arquivos HTML em `ui/public/rede_hub_*.html`

**4. Inferência de Papéis dos Nós (classificação topológica):**
```bash
python gerar_inferencia_papeis.py
```
- Gera: `ui/public/inferencia_papeis.json`

**5. Análise Direcionada (simulação de fluxo):**
```bash
python gerar_analise_direcionada.py
```
- Gera: `ui/public/analise_direcionada.json`

**6. Detecção de Comunidades (clustering espacial):**
```bash
python gerar_analise_comunidades.py
```
- Gera: `ui/public/analise_comunidades.json`

**7. Análise de Robustez (percolação e conectividade):**
```bash
python gerar_analise_robustez.py
```
- Gera: `ui/public/analise_robustez.json`

**8. Simulação de Ataques (randômicos vs direcionados):**
```bash
python gerar_analise_ataques.py
```
- Gera: `ui/public/analise_ataques.json`

**9. Estratégia de Mitigação (recomendações de infraestrutura):**
```bash
python gerar_estrategia_mitigacao.py
```
- Gera: `ui/public/estrategia_mitigacao.json`

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
│   ├── powergrid.edgelist.csv            # Dataset (4.941 nós, 6.594 arestas)
│   ├── requirements.txt                   # Dependências Python
│   │
│   ├── gerar_analise_base.py             # 1. Análise básica + Scale-Free
│   ├── gerar_analise_avancada.py         # 2. Criticidade + Percolação
│   ├── gerar_grafos_2d.py                # 3. Visualizações PyVis 2D
│   ├── gerar_inferencia_papeis.py        # 4. Classificação topológica
│   ├── gerar_analise_direcionada.py      # 5. Simulação de fluxo
│   ├── gerar_analise_comunidades.py      # 6. Detecção de comunidades
│   ├── gerar_analise_robustez.py         # 7. Robustez e resiliência
│   ├── gerar_analise_ataques.py          # 8. Simulação de ataques
│   └── gerar_estrategia_mitigacao.py     # 9. Recomendações estratégicas
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
│   │   └── rede_hub_*.html               # 20 visualizações interativas
│   │
│   ├── src/
│   │   ├── AnaliseRedeEletrica.tsx       # Componente principal (gerencia abas)
│   │   └── components/
│   │       ├── CartaoMetrica.tsx         # Componente de cartão de métrica
│   │       ├── ModalGrafo.tsx            # Modal para visualizações
│   │       └── abas/                     # 14 abas de análise
│   │           ├── AbaVisaoGeral.tsx
│   │           ├── AbaScaleFree.tsx
│   │           ├── AbaCategorias.tsx
│   │           ├── AbaAnalisePorGrau.tsx
│   │           ├── AbaBetweeness.tsx
│   │           ├── AbaClustering.tsx
│   │           ├── AbaPontosArticulacao.tsx
│   │           ├── AbaNiveisCriticidade.tsx
│   │           ├── AbaPapeis.tsx
│   │           ├── AbaComunidades.tsx
│   │           ├── AbaRobustez.tsx
│   │           ├── AbaSimulacaoAtaques.tsx
│   │           ├── AbaVisualizacoes.tsx
│   │           └── AbaVulnerabilidades.tsx
│   │
│   ├── package.json                       # Dependências Node.js
│   └── vite.config.ts                     # Configuração Vite
│
├── doc/                                   # Documentação adicional
├── CORRECOES_IMPLEMENTADAS.md            # Log de correções técnicas
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
Para executar todas as análises avançadas na ordem correta:
```bash
cd core
python gerar_analise_base.py              # 1. Análise básica (scale-free, distribuição)
python gerar_analise_avancada.py          # 2. Criticidade e percolação (2-5 min)
python gerar_grafos_2d.py                 # 3. Visualizações 2D dos hubs
python gerar_inferencia_papeis.py         # 4. Classificação topológica de papéis
python gerar_analise_direcionada.py       # 5. Simulação de fluxo direcionado
python gerar_analise_comunidades.py       # 6. Detecção de comunidades
python gerar_analise_robustez.py          # 7. Análise de robustez e resiliência
python gerar_analise_ataques.py           # 8. Simulação de ataques (1-2 min)
python gerar_estrategia_mitigacao.py      # 9. Recomendações de mitigação
```

**Tempo Total**: ~10-15 minutos (depende do processador)

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

### Análises Avançadas (Novas Funcionalidades)
- **Inferência de Papéis**: Classificação topológica em GERADOR, TRANSFORMADOR, CONSUMIDOR, LINHA_TRANSMISSÃO
- **Comunidades**: Detecção de 20 comunidades com análise de modularidade e localização espacial
- **Análise Direcionada**: Simulação de fluxo com métricas in/out-degree e consistência hierárquica
- **Criticidade**: 5 níveis de criticidade estrutural combinando betweenness, grau e articulação
- **Vulnerabilidades**: **29 nós Nível 1** com as 3 dimensões de risco

### Análises de Resiliência e Segurança
- **Robustez**: Análise de percolação (500 pontos), conectividade algébrica e coeficiente de resiliência
- **Simulação de Ataques**: Comparação entre ataques aleatórios vs direcionados (high-degree e high-betweenness)
- **Estratégia de Mitigação**: Recomendações de proteção, redundância e monitoramento

### Visualizações Interativas
- **Grafos 2D**: 20 visualizações interativas dos principais hubs (2-hop neighborhoods)
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
- **Disclaimer**: Simulação teórica, dataset original é não-direcionado

### 7. Estratégia de Mitigação e Tomada de Decisão
- **Script**: `gerar_estrategia_mitigacao.py`
- **Recomendações**: Proteção física (29 nós Nível 1), Redundância (158 nós críticos), Monitoramento em tempo real
- **Priorização**: 3 níveis de prioridade baseados em criticidade

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

1. **Necessário**: Dados operacionais reais (tensão, corrente, capacidade, localização GPS)
2. **Necessário**: Validação de campo por engenheiros elétricos
3. **Necessário**: Simulação de fluxo de potência (power flow analysis) com dados de carga
4. **Necessário**: Integração com sistemas SCADA (Supervisory Control and Data Acquisition)

**As inferências topológicas NÃO substituem análise de engenharia elétrica.**