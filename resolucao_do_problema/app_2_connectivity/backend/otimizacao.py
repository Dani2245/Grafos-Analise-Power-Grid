from flask import Flask, request, jsonify
import pandas as pd
import networkx as nx
import os
import tempfile
import json
import random

app = Flask(__name__)

###############################################################################
# CARREGAMENTO DE DADOS
###############################################################################

def carregar_grafo(conteudo_arquivo):
    """
    Carrega arquivo TXT e constrói grafo não-direcionado.
    Formato esperado: duas colunas separadas por tabulação.
    """
    # Cria arquivo temporário para processamento
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as tmp:
        tmp.write(conteudo_arquivo)
        tmp_path = tmp.name
    
    try:
        # Lê dados e cria grafo
        df = pd.read_csv(tmp_path, sep="\t", header=None, names=["fonte", "alvo"])
        G = nx.Graph()
        G.add_edges_from(df.values)
        return G
    finally:
        os.unlink(tmp_path)  # Limpa arquivo temporário

###############################################################################
# ALGORITMOS DE OTIMIZAÇÃO - HEURÍSTICAS PRÓPRIAS
###############################################################################

def escolher_no_balanceado(componente, G, historico_uso, limite_grau=50):
    """
    Heurística própria: seleção balanceada de nós para evitar supernós.
    Balanceia grau alto (bons conectores) com uso prévio (evita concentração).
    """
    candidatos = []
    
    for node in componente:
        grau_atual = G.degree(node)
        
        # Respeita limite máximo de conexões por nó
        if grau_atual >= limite_grau:
            continue
            
        # Score: grau alto é bom, reutilização é ruim
        vezes_usado = historico_uso.get(node, 0)
        score = grau_atual - (vezes_usado * 3)
        
        candidatos.append((score, node))
    
    # Fallback: relaxa limites se não há candidatos
    if not candidatos:
        for node in componente:
            grau_atual = G.degree(node)
            vezes_usado = historico_uso.get(node, 0)
            score = grau_atual - (vezes_usado * 5)  # Penaliza mais a reutilização
            candidatos.append((score, node))
    
    if candidatos:
        melhor_score, melhor_no = max(candidatos)
        historico_uso[melhor_no] = historico_uso.get(melhor_no, 0) + 1
        return melhor_no
    else:
        return random.choice(list(componente))

###############################################################################
# ALGORITMOS BASEADOS EM 2-CONNECTIVITY AUGMENTATION
###############################################################################

def propor_bypass_para_pontes(G, historico_uso):
    """
    Baseado em 2-connectivity: elimina pontes conectando componentes desconectados.
    Para cada ponte, encontra nós alternativos nos lados que seriam isolados.
    """
    pontes = list(nx.bridges(G))
    novas_arestas = []

    for u, v in pontes:
        # Simula falha da ponte
        G_temp = G.copy()
        G_temp.remove_edge(u, v)

        # Identifica componentes que seriam desconectados
        componente1 = nx.node_connected_component(G_temp, u)
        componente2 = nx.node_connected_component(G_temp, v)

        # Escolhe nós balanceados para nova conexão
        u_alt = escolher_no_balanceado(componente1, G, historico_uso)
        v_alt = escolher_no_balanceado(componente2, G, historico_uso)

        if not G.has_edge(u_alt, v_alt):
            novas_arestas.append((u_alt, v_alt))

    return novas_arestas

def propor_bypass_para_articulacoes(G, historico_uso):
    """
    Baseado em 2-connectivity: elimina pontos de articulação criando caminhos alternativos.
    Conecta vizinhos que dependem exclusivamente do ponto de articulação.
    """
    articulacoes = list(nx.articulation_points(G))
    novas_arestas = []

    for a in articulacoes:
        vizinhos = list(G.neighbors(a))

        # Só articulações com 2+ vizinhos são vulneráveis
        if len(vizinhos) < 2:
            continue

        # Para cada par de vizinhos que dependem da articulação
        for i in range(len(vizinhos)):
            for j in range(i+1, len(vizinhos)):
                u = vizinhos[i]
                v = vizinhos[j]

                # Verifica se já existe caminho alternativo
                G_temp = G.copy()
                G_temp.remove_node(a)

                if nx.has_path(G_temp, u, v):
                    continue  # Já tem redundância

                # Cria conexão direta se nós estão dentro dos limites
                if not G.has_edge(u, v):
                    if (G.degree(u) < 50 and G.degree(v) < 50):
                        novas_arestas.append((u, v))
                    else:
                        # Busca alternativas se nós estão muito conectados
                        componente_u = nx.node_connected_component(G_temp, u)
                        componente_v = nx.node_connected_component(G_temp, v)
                        
                        u_alt = escolher_no_balanceado(componente_u, G, historico_uso)
                        v_alt = escolher_no_balanceado(componente_v, G, historico_uso)
                        
                        if not G.has_edge(u_alt, v_alt):
                            novas_arestas.append((u_alt, v_alt))

    return novas_arestas

###############################################################################
# MELHORIAS
###############################################################################

def gerar_melhorias_reais(G):
    """
    Combina abordagens de 2-connectivity com heurísticas próprias.
    Gera conjunto completo de melhorias para a rede.
    """
    melhorias = []
    historico_uso = {}

    # Aplica ambas as estratégias de 2-connectivity
    bypass_pontes = propor_bypass_para_pontes(G, historico_uso)
    bypass_articulacoes = propor_bypass_para_articulacoes(G, historico_uso)

    melhorias.extend(bypass_pontes)
    melhorias.extend(bypass_articulacoes)

    # Remove duplicatas e padroniza ordenação
    melhorias = list(set(tuple(sorted(edge)) for edge in melhorias))

    return melhorias

def aplicar_melhorias(G, melhorias):
    """Aplica todas as melhorias identificadas ao grafo original."""
    G_new = G.copy()
    G_new.add_edges_from(melhorias)
    return G_new

def otimizar_rede(G, diagnostico):
    """
    Orquestra todo o processo de otimização da rede.
    Retorna grafo otimizado e lista de conexões adicionadas.
    """
    # Gera melhorias usando combinação de técnicas
    melhorias = gerar_melhorias_reais(G)
    
    # Aplica as melhorias ao grafo
    G_otimizado = aplicar_melhorias(G, melhorias)
    
    # Formata para exibição
    conexoes_adicionadas = [f"{u} -- {v}" for u, v in melhorias]
    
    return G_otimizado, conexoes_adicionadas

def calcular_metricas_melhoria(G_original, G_otimizado):
    """
    Calcula métricas de melhoria comparando rede original vs otimizada.
    Foca em 2-connectivity: articulações e pontes eliminadas.
    """
    metricas_orig = {
        "articulacoes": len(list(nx.articulation_points(G_original))),
        "pontes": len(list(nx.bridges(G_original))),
        "componentes": nx.number_connected_components(G_original)
    }
    
    # Analisa maior componente da rede otimizada
    if nx.is_connected(G_otimizado):
        Gcc_otim = G_otimizado
    else:
        Gcc_otim = G_otimizado.subgraph(max(nx.connected_components(G_otimizado), key=len)).copy()
    
    metricas_otim = {
        "articulacoes": len(list(nx.articulation_points(Gcc_otim))),
        "pontes": len(list(nx.bridges(Gcc_otim))),
        "componentes": nx.number_connected_components(G_otimizado)
    }
    
    # Calcula percentual de melhoria
    percentual = 0
    if metricas_orig["articulacoes"] > 0:
        percentual = ((metricas_orig["articulacoes"] - metricas_otim["articulacoes"]) / metricas_orig["articulacoes"]) * 100
    
    melhoria = {
        "reducao_articulacoes": metricas_orig["articulacoes"] - metricas_otim["articulacoes"],
        "reducao_pontes": metricas_orig["pontes"] - metricas_otim["pontes"],
        "reducao_componentes": metricas_orig["componentes"] - metricas_otim["componentes"],
        "percentual_melhoria": percentual
    }
    
    return metricas_orig, metricas_otim, melhoria

###############################################################################
# API ENDPOINTS
###############################################################################

@app.route('/otimizar', methods=['POST'])
def executar_otimizacao():
    """
    Endpoint principal: recebe rede e diagnóstico, retorna rede otimizada.
    """
    try:
        arquivo = request.files['arquivo']
        dados_diagnostico = request.form.get('diagnostico')
        
        # Carrega e processa rede
        conteudo = arquivo.read().decode('utf-8')
        G_original = carregar_grafo(conteudo)
        diagnostico = json.loads(dados_diagnostico)
        
        # Executa otimização
        G_otimizado, conexoes_adicionadas = otimizar_rede(G_original, diagnostico)
        
        # Calcula métricas de melhoria
        metricas_orig, metricas_otim, melhoria = calcular_metricas_melhoria(G_original, G_otimizado)
        
        # Prepara arquivo para download
        arestas_otimizadas = list(G_otimizado.edges())
        conteudo_download = "\n".join([f"{u}\t{v}" for u, v in arestas_otimizadas])
        
        resposta = {
            "status": "sucesso",
            "metricas_originais": metricas_orig,
            "metricas_otimizadas": metricas_otim,
            "melhoria": melhoria,
            "conexoes_adicionadas": conexoes_adicionadas,
            "total_conexoes_novas": len(conexoes_adicionadas),
            "grafo_otimizado": conteudo_download,
            "estatisticas": {
                "nos_originais": G_original.number_of_nodes(),
                "arestas_originais": G_original.number_of_edges(),
                "nos_otimizados": G_otimizado.number_of_nodes(),
                "arestas_otimizadas": G_otimizado.number_of_edges()
            }
        }
        
        return jsonify(resposta)
        
    except Exception as e:
        return jsonify({"erro": f"Erro no processamento: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online", "servico": "otimizacao"})

###############################################################################
# INICIALIZAÇÃO
###############################################################################

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5002, debug=False)