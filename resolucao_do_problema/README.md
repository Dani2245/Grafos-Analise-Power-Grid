Resolução do Problema — Instruções de Uso

Este diretório contém dois aplicativos desenvolvidos para análise e modificação de grafos no contexto do trabalho dos alunos: Atila, Daniela, Pedro e Rafael.

###Aplicativos incluídos
1. app_2_connectivity

Aplicação responsável por tornar o grafo 2–conexo, realizando correções estruturais necessárias.

Possui função de otimização, que pode levar ~10 minutos em grafos grandes.

2. app_otimizacao

Aplicação que otimiza o grafo apenas nos pontos críticos identificados no diagnóstico da Daniela.
Ela não otimiza o grafo inteiro — só corrige os trechos problemáticos já identificados.

Possui função de otimização mais leve, durando ~1 minuto.

###Como Rodar Cada Aplicativo

Os dois apps têm a mesma estrutura de execução.

1. Clonar o repositório

Clone somente a pasta resolucao_do_problema ou o repositório completo:

git clone https://github.com/Dani2245/Grafos-Analise-Power-Grid


Entre na pasta resolucao_do_problema.

Preparação para Execução

Para cada um dos dois apps, siga os passos abaixo:

2. Instalar dependências do Node

Dentro da pasta raiz do app, rode:

npm install


Isso recria o node_modules, que não é enviado ao GitHub.

3. Instalar dependências do backend (Python)

Abra a pasta:

backend/


E instale o que está no requirements.txt:

pip install -r requirements.txt


Mesmo assim, não é necessário rodar o backend Python manualmente, porque o frontend usa o .exe incluído na pasta dist/.

O .py está incluído apenas para fins de análise do código.

###Executando o Aplicativo

Abra um terminal na pasta raiz do aplicativo (não no backend).

Execute:

npm start


Isso irá:

inicializar o Electron,

ativar automaticamente o backend usando o executável .exe que está em:

backend/dist/

###ATENÇÃO IMPORTANTE
Após rodar npm start, AGUARDE

No terminal aparecerão mensagens indicando que o backend foi iniciado.

Não carregue arquivos, nem tente processar nada antes dessas mensagens aparecerem, caso contrário o app apresentará erro de conexão.

###Tempo de Execução
No app 2-connectivity

Otimização completa do grafo: ~10 minutos com grafos grandes.

No app de otimização

Otimização dos trechos críticos: ~1 minuto.

###Observação sobre os arquivos do backend

Cada app possui:

o backend em Python (.py) — incluído para inspeção e entendimento do código;

o backend em executável (.exe) — utilizado automaticamente pelo frontend.

O professor não precisa rodar o backend Python — apenas o .exe será usado pelo app.
