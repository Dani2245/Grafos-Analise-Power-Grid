# Resolução do Problema — Instruções de Uso

Este diretório contém dois aplicativos desenvolvidos para análise e modificação de grafos no contexto do trabalho dos alunos: Atila, Daniela, Pedro e Rafael.

---

## Aplicativos incluídos

### 1. app_2_connectivity
Aplicação responsável por tornar o grafo 2–conexo, realizando correções estruturais necessárias.

- Possui função de otimização
- Tempo aproximado: **~10 minutos** para grafos grandes

---

### 2. app_otimizacao
Aplicação que otimiza o grafo apenas nos pontos críticos identificados no diagnóstico da Daniela.

Ela **não** otimiza o grafo inteiro — somente trechos considerados críticos.

- Tempo aproximado: **~1 minuto**

---

# Como Rodar Cada Aplicativo

Os dois aplicativos possuem a **mesma estrutura de execução**.

---

## 1. Clonar o repositório

Você pode clonar o repositório completo:

git clone https://github.com/Dani2245/Grafos-Analise-Power-Grid


Depois, entre na pasta:

resolucao_do_problema


---

# Preparação para Execução

Para **cada um dos dois aplicativos**, siga os passos abaixo.

---

## 2. Instalar dependências do Node

Na **pasta raiz do aplicativo**, execute:

npm install


Isso recria a pasta `node_modules`, que não é enviada ao GitHub.

---

## 3. Instalar dependências do backend (Python)

Entre na pasta do backend:

backend/


Instale os requisitos:

pip install -r requirements.txt


Observação:

- O backend **não precisa ser iniciado manualmente**
- O frontend utiliza automaticamente o arquivo executável `.exe` localizado em:

backend/dist/


Os arquivos `.py` foram incluídos apenas para análise do código.

---

# Executando o Aplicativo

Na **pasta raiz de cada aplicativo**, execute:

npm start


Ao fazer isso:

- o Electron será iniciado
- o backend será ativado automaticamente usando o executável `.exe` da pasta `dist`

---

# ATENÇÃO IMPORTANTE

Após executar:

npm start


**Aguarde** até que o terminal exiba mensagens indicando que o backend foi iniciado.

Não carregue arquivos nem execute nenhuma ação antes da inicialização completa, caso contrário ocorrerá **erro de conexão**.

**Observação sobre o dataset**:

As aplicações esperam um dataset em txt com as colunas: fonte e alvo, exatamente como o fornecido para estudos.

O dataset está disponível nesta pasta, com o nome powergrid.edgelist.txt.

**Testar com CSV ou outro formato irá gerar ERRO.**
---

# Tempo de Execução

### app_2_connectivity
- Otimização completa do grafo: **~10 minutos** para grafos grandes.

### app_otimizacao
- Otimização dos pontos críticos: **~1 minuto**.

---

# Observações sobre os arquivos do backend

Cada aplicativo contém:

- Arquivos Python (`.py`) — para análise e entendimento do funcionamento interno  
- Arquivos executáveis (`.exe`) — usados automaticamente pelos aplicativos durante a execução

O professor **não precisa executar o backend Python** manualmente.

---
