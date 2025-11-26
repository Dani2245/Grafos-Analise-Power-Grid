from flask import Flask, request, jsonify
import pandas as pd
import networkx as nx
import os
import tempfile
import json
from typing import List, Tuple, Dict
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Carrega a base de dados JSON
try:
    with open('dados.json', 'r', encoding='utf-8') as f:
        dados_completos = json.load(f)
        base_dados = dados_completos.get('analise_rede_energia', {})
        print("Chaves carregadas:", list(base_dados.keys()))
except UnicodeDecodeError:
    with open('dados.json', 'r', encoding='latin-1') as f:
        dados_completos = json.load(f)
        base_dados = dados_completos.get('analise_rede_energia', {})
        print("Chaves carregadas:", list(base_dados.keys()))
except FileNotFoundError:
    print("Erro: Arquivo dados.json não encontrado")
    base_dados = {
        'top_10_hubs_rede': [],
        'top_20_geradores': [],
        'top_20_transformadores': [],
        'top_20_nos_grau': [],
        'top_50_nos_betweenness': [],
        'top_100_pontos_articulacao_criticos': [],
        'top_10_pontos_percolacao': [],
        'prioridades': []
    }

# Carrega o grafo
def carregar_grafo(conteudo_arquivo):
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as tmp:
        tmp.write(conteudo_arquivo)
        tmp_path = tmp.name
    
    try:
        df = pd.read_csv(tmp_path, sep="\t", header=None, names=["fonte", "alvo"])
        G = nx.Graph()
        G.add_edges_from(df.values)
        return G
    finally:
        os.unlink(tmp_path)


# --------------------------------------------------------------------
# HEURÍSTICA + BLOQUEIO DE SUPER-HUB + LIMITADOR DE DESTINOS
# --------------------------------------------------------------------
def encontrar_vizinhos_adequados(G, no_alvo, nos_criticos=None, k=3, limite_superhub=0.10):
    if nos_criticos is None:
        nos_criticos = set()

    vizinhos_atuais = set(G.neighbors(no_alvo))
    candidatos = set(G.nodes()) - vizinhos_atuais - {no_alvo}
    candidatos -= nos_criticos

    if not candidatos:
        return []

    # Bloqueio de super-hubs
    grau_maximo = max(G.degree(n) for n in G.nodes())
    limite_grau = int(grau_maximo * limite_superhub)
    candidatos = {n for n in candidatos if G.degree(n) <= limite_grau}
    if not candidatos:
        return []

    # Limite de burst
    grau_medio = np.mean([G.degree(n) for n in G.nodes()])
    limite_burst = int(grau_medio * 1.3)
    candidatos = {n for n in candidatos if G.degree(n) < limite_burst}
    if not candidatos:
        return []

    # Componentes
    componente_alvo = next(comp for comp in nx.connected_components(G) if no_alvo in comp)
    candidatos_outro = [n for n in candidatos if n not in componente_alvo]
    candidatos_mesmo = [n for n in candidatos if n in componente_alvo]

    # Distância geodésica
    dist = nx.single_source_shortest_path_length(G, no_alvo)
    distancia = lambda n: dist.get(n, 0)

    # Clustering
    clustering = nx.clustering(G)
    cluster = lambda n: clustering.get(n, 0)

    # Ranking
    rank = lambda n: (distancia(n), cluster(n))
    candidatos_ordenados = (
        sorted(candidatos_outro, key=rank, reverse=True) +
        sorted(candidatos_mesmo, key=rank, reverse=True)
    )

    return candidatos_ordenados[:k]


# --------------------------------------------------------------------
# FUNÇÕES DE OTIMIZAÇÃO
# --------------------------------------------------------------------
def otimiza_prioridades(G):
    ligacoes_novas = []
    if 'prioridades' not in base_dados:
        return ligacoes_novas

    for prioridade in base_dados['prioridades']:
        no = prioridade['no']
        if no in G.nodes():
            candidatos = encontrar_vizinhos_adequados(G, no)
            for cand in candidatos:
                if not G.has_edge(no, cand):
                    G.add_edge(no, cand)
                    ligacoes_novas.append((no, cand))
    return ligacoes_novas

def otimiza_hubs(G):
    ligacoes_novas = []
    if 'top_10_hubs_rede' not in base_dados:
        return ligacoes_novas
    
    hubs_criticos = [
        hub['no'] for hub in base_dados['top_10_hubs_rede']
        if hub.get('ponto_articulacao', False)
    ]
    
    for hub in hubs_criticos:
        if hub in G.nodes():
            candidatos = encontrar_vizinhos_adequados(G, hub)
            for cand in candidatos:
                if not G.has_edge(hub, cand):
                    G.add_edge(hub, cand)
                    ligacoes_novas.append((hub, cand))
    return ligacoes_novas

def otimiza_geradores(G):
    ligacoes_novas = []
    if 'top_20_geradores' not in base_dados:
        return ligacoes_novas

    for no in [g['no'] for g in base_dados['top_20_geradores']]:
        if no in G.nodes():
            for cand in encontrar_vizinhos_adequados(G, no):
                if not G.has_edge(no, cand):
                    G.add_edge(no, cand); ligacoes_novas.append((no, cand))
    return ligacoes_novas

def otimiza_transformadores(G):
    ligacoes_novas = []
    if 'top_20_transformadores' not in base_dados:
        return ligacoes_novas

    for no in [t['no'] for t in base_dados['top_20_transformadores']]:
        if no in G.nodes():
            for cand in encontrar_vizinhos_adequados(G, no):
                if not G.has_edge(no, cand):
                    G.add_edge(no, cand); ligacoes_novas.append((no, cand))
    return ligacoes_novas

def otimiza_grau(G):
    ligacoes_novas = []
    if 'top_20_nos_grau' not in base_dados:
        return ligacoes_novas

    for no in [n['no'] for n in base_dados['top_20_nos_grau']]:
        if no in G.nodes():
            for cand in encontrar_vizinhos_adequados(G, no):
                if not G.has_edge(no, cand):
                    G.add_edge(no, cand); ligacoes_novas.append((no, cand))
    return ligacoes_novas

def otimiza_betweenness(G):
    ligacoes_novas = []
    if 'top_50_nos_betweenness' not in base_dados:
        return ligacoes_novas

    for no in [n['no'] for n in base_dados['top_50_nos_betweenness']]:
        if no in G.nodes():
            for cand in encontrar_vizinhos_adequados(G, no):
                if not G.has_edge(no, cand):
                    G.add_edge(no, cand); ligacoes_novas.append((no, cand))
    return ligacoes_novas

def otimiza_articulacao(G):
    ligacoes_novas = []
    if 'top_100_pontos_articulacao_criticos' not in base_dados:
        return ligacoes_novas

    for no in [n['no'] for n in base_dados['top_100_pontos_articulacao_criticos']]:
        if no in G.nodes():
            for cand in encontrar_vizinhos_adequados(G, no):
                if not G.has_edge(no, cand):
                    G.add_edge(no, cand); ligacoes_novas.append((no, cand))
    return ligacoes_novas

def otimiza_percolacao(G):
    ligacoes_novas = []
    if 'top_10_pontos_percolacao' not in base_dados:
        return ligacoes_novas

    for no in [n['no'] for n in base_dados['top_10_pontos_percolacao']]:
        if no in G.nodes():
            for cand in encontrar_vizinhos_adequados(G, no):
                if not G.has_edge(no, cand):
                    G.add_edge(no, cand); ligacoes_novas.append((no, cand))
    return ligacoes_novas


# --------------------------------------------------------------------
# EXECUTAR TODAS AS OTIMIZAÇÕES
# --------------------------------------------------------------------
def executar_otimizacao_completa(G):
    resultados = {
        'hubs': otimiza_hubs(G.copy()),
        'geradores': otimiza_geradores(G.copy()),
        'transformadores': otimiza_transformadores(G.copy()),
        'grau': otimiza_grau(G.copy()),
        'betweenness': otimiza_betweenness(G.copy()),
        'articulacao': otimiza_articulacao(G.copy()),
        'percolacao': otimiza_percolacao(G.copy()),
        'prioridades': otimiza_prioridades(G.copy())
    }
    
    grafo_otimizado = G.copy()
    for categoria, ligs in resultados.items():
        for a, b in ligs:
            grafo_otimizado.add_edge(a, b)
    
    return resultados, grafo_otimizado


def converter_para_json_serializable(dados):
    if isinstance(dados, dict):
        return {k: converter_para_json_serializable(v) for k, v in dados.items()}
    elif isinstance(dados, list):
        return [converter_para_json_serializable(i) for i in dados]
    elif isinstance(dados, tuple):
        return tuple(converter_para_json_serializable(i) for i in dados)
    elif hasattr(dados, 'item'):
        return dados.item()
    elif isinstance(dados, (int, float, str)):
        return dados
    return str(dados)


# --------------------------------------------------------------------
# ESTATÍSTICAS ADICIONAIS
# --------------------------------------------------------------------
def calcular_estatisticas_completas(G):
    estatisticas = {}
    estatisticas['nos'] = G.number_of_nodes()
    estatisticas['arestas'] = G.number_of_edges()
    estatisticas['componentes'] = nx.number_connected_components(G)
    estatisticas['pontos_articulacao'] = len(list(nx.articulation_points(G)))
    estatisticas['pontes'] = len(list(nx.bridges(G)))
    return estatisticas


# --------------------------------------------------------------------
# ENDPOINT /otimizar
# --------------------------------------------------------------------
@app.route('/otimizar', methods=['POST'])
def otimizar():
    try:
        if 'arquivo' not in request.files:
            return jsonify({'erro': 'Nenhum arquivo enviado'}), 400
        
        arquivo = request.files['arquivo']
        conteudo = arquivo.read().decode('utf-8')

        G = carregar_grafo(conteudo)
        ligacoes, G_opt = executar_otimizacao_completa(G)

        estat_original = calcular_estatisticas_completas(G)
        estat_otimizado = calcular_estatisticas_completas(G_opt)

        resposta = {
            'tabela_estatisticas': {
                'Métrica': ['Nós', 'Arestas', 'Pontos de articulação', 'Pontes', 'Componentes', 'Novas ligações totais'],
                'Original': [
                    estat_original['nos'],
                    estat_original['arestas'],
                    estat_original['pontos_articulacao'],
                    estat_original['pontes'],
                    estat_original['componentes'],
                    '-'
                ],
                'Otimizado': [
                    estat_otimizado['nos'],
                    estat_otimizado['arestas'],
                    estat_otimizado['pontos_articulacao'],
                    estat_otimizado['pontes'],
                    estat_otimizado['componentes'],
                    sum(len(v) for v in ligacoes.values())
                ]
            },
            'novas_ligacoes': converter_para_json_serializable(ligacoes)
        }

        return jsonify(resposta)

    except Exception as e:
        return jsonify({'erro': f'Erro no processamento: {str(e)}'}), 500


# --------------------------------------------------------------------
# ENDPOINT /download-grafo
# --------------------------------------------------------------------
@app.route('/download-grafo', methods=['POST'])
def download_grafo():
    try:
        dados = request.json
        conteudo_original = dados.get('conteudo_original')
        novas_ligacoes = dados.get('novas_ligacoes', {})

        if not conteudo_original:
            return jsonify({'erro': 'Conteúdo original não fornecido'}), 400

        G = carregar_grafo(conteudo_original)

        for lig_list in novas_ligacoes.values():
            for a, b in lig_list:
                G.add_edge(a, b)

        linhas = [f"{a}\t{b}" for a, b in G.edges()]
        conteudo_txt = "\n".join(linhas)

        return jsonify({
            'conteudo': conteudo_txt,
            'nome_arquivo': 'grafo_otimizado_completo.txt',
            'estatisticas': {
                'nos': G.number_of_nodes(),
                'arestas': G.number_of_edges(),
                'novas_ligacoes_total': sum(len(l) for l in novas_ligacoes.values())
            }
        })

    except Exception as e:
        return jsonify({'erro': f'Erro no download: {str(e)}'}), 500


print("Rotas registradas no Flask:")
for rule in app.url_map.iter_rules():
    print(rule)

if __name__ == '__main__':
    app.run(debug=False, port=5050)
