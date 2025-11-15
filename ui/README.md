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
- **Tailwind CSS** - Framework CSS
- **Recharts** - Gráficos interativos
- **Lucide React** - Ícones

## 📊 Dados da Análise

A interface apresenta dados reais da análise da rede elétrica:

- **Total de Nós:** 4.941
- **Total de Conexões:** 6.594
- **Grau Médio:** 2.67
- **Grau Máximo:** 19

### Categorização por Grau

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

### 5 Abas Principais:

1. **Visão Geral** - Métricas principais e gráfico de distribuição
2. **Categorias** - Detalhamento da classificação dos nós
3. **Geradores Críticos** - Top 10 hubs e análise de impacto
4. **Distribuição** - Gráficos de distribuição de graus
5. **Vulnerabilidades** - Análise de riscos e recomendações

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
