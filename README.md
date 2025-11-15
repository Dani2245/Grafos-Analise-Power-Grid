# Análise de Rede Elétrica - Power Grid

Sistema de análise topológica da rede de distribuição elétrica **para o trabalho de Grafos - Sistemas de Informação da UNIFEI**, desenvolvido com Python (análise de grafos) e React (visualização interativa).

## Pré-requisitos

Antes de começar, você precisa instalar no seu computador:

### 1. Python (versão 3.8 ou superior)
- **Windows**: Baixe em [python.org](https://www.python.org/downloads/)
  - ⚠️ Durante a instalação, marque a opção **"Add Python to PATH"**
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
├── core/                          # Scripts Python
│   ├── powergrid.edgelist.csv    # Dataset da rede elétrica
│   ├── requirements.txt           # Dependências Python
│   ├── gerar_analise_base.py      # Script 1: Análise básica
│   ├── gerar_analise_avancada.py  # Script 2: Criticidade
│   └── gerar_grafos_2d.py         # Script 3: Visualizações 2D
│
├── ui/                            # Frontend React
│   ├── public/                    # Arquivos gerados pelos scripts
│   │   ├── analise_basica.json
│   │   ├── analise_criticidade.json
│   │   └── rede_hub_*.html
│   ├── src/
│   │   └── AnaliseRedeEletrica.tsx  # Componente principal
│   └── package.json               # Dependências Node.js
│
└── README.md                      # Este arquivo
```

---

## Workflow Completo

1. **Ative o ambiente virtual Python** (`.venv`)
2. **Execute os 3 scripts Python** (análise base → avançada → grafos)
3. **Execute `npm run dev`** no diretório `ui/`
4. **Acesse `localhost:3000`** no navegador

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

- **Visão Geral**: Estatísticas da rede (nós, arestas, grau médio)
- **Categorias**: Distribuição hipotética por tipo de elemento
- **Análise por Grau**: Top 20 nós com mais conexões
- **Betweenness**: Centralidade de intermediação (fluxo)
- **Pontos de Articulação**: Nós que fragmentam a rede se removidos
- **Criticidade**: 5 níveis de criticidade estrutural
- **Visualizações**: Grafos interativos 2D dos principais hubs
- **Vulnerabilidades**: **29 nós mais críticos** com as 3 dimensões de risco

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
- Certifique-se de ter executado **todos os 3 scripts Python**
- Verifique se os arquivos foram gerados em `ui/public/`