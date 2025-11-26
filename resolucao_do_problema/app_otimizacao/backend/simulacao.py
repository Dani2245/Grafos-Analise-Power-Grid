from flask import Flask, request, jsonify
import networkx as nx
import pandas as pd
import base64
import io
import matplotlib.pyplot as plt
from flask_cors import CORS
import json
import random
import os

app = Flask(__name__)
CORS(app)

###############################
# CARREGAMENTO DA BASE DE DADOS
###############################

def carregar_base_dados():
    """Carrega a base de dados com fallback para caminhos alternativos."""
    caminhos_tentativos = [
        'dados.json',
        '../dados.json',
        '../../dados.json',
        'backend/dados.json',
    ]
    
    for caminho in caminhos_tentativos:
        try:
            if os.path.exists(caminho):
                with open(caminho, 'r', encoding='utf-8') as f:
                    dados_completos = json.load(f)
                    base_dados = dados_completos.get('analise_rede_energia', {})
                    print(f"Base de dados carregada de: {caminho}")
                    return base_dados
        except Exception as e:
            print(f"Erro ao carregar {caminho}: {e}")
            continue

    print("Nenhum arquivo dados.json encontrado, usando dados vazios")
    return {}

base_dados = carregar_base_dados()

##########################
# FUNÇÕES DE PROCESSAMENTO
##########################

def carregar_grafo_de_texto(conteudo):
    """Carrega um grafo a partir de texto contendo arestas."""
    from io import StringIO
    df = pd.read_csv(StringIO(conteudo), sep="\t", header=None, names=["u", "v"])
    G = nx.Graph()
    G.add_edges_from(df.values)
    return G

def obter_nos_criticos():
    """Obtém nós críticos das categorias mapeadas na base de dados."""
    nos_criticos = set()
    
    categorias = [
        'top_10_hubs_rede',
        'top_20_geradores', 
        'top_20_transformadores',
        'top_20_nos_grau',
        'top_50_nos_betweenness',
        'top_100_pontos_articulacao_criticos',
        'top_10_pontos_percolacao',
        'prioridades'
    ]
    
    for categoria in categorias:
        if categoria in base_dados:
            for item in base_dados[categoria]:
                if 'no' in item:
                    nos_criticos.add(item['no'])

    return list(nos_criticos)

def remover_uma_aresta_por_no(G, nos):
    """Remove uma aresta aleatória por nó crítico."""
    G2 = G.copy()
    arestas_removidas = []
    arestas_ja_removidas = set()
    
    for no in nos:
        if no in G2 and G2.degree(no) > 0:
            vizinhos_disponiveis = [
                v for v in G2.neighbors(no)
                if (no, v) not in arestas_ja_removidas and (v, no) not in arestas_ja_removidas
            ]
            
            if vizinhos_disponiveis:
                vizinho_remover = random.choice(vizinhos_disponiveis)
                G2.remove_edge(no, vizinho_remover)

                aresta = (no, vizinho_remover)
                arestas_removidas.append(aresta)
                arestas_ja_removidas.add(aresta)
                arestas_ja_removidas.add((vizinho_remover, no))
    
    return G2, arestas_removidas

def calcular_metricas_simples(G):
    """Calcula métricas básicas do grafo."""
    if G.number_of_nodes() == 0:
        return {"nos": 0, "arestas": 0, "componentes": 0, "maior_componente": 0}
    
    comp = list(nx.connected_components(G))
    return {
        "nos": G.number_of_nodes(),
        "arestas": G.number_of_edges(),
        "componentes": len(comp),
        "maior_componente": max((len(c) for c in comp), default=0)
    }

##########################
# API ENDPOINTS
##########################

@app.route('/simular', methods=['POST'])
def simular():
    """Executa simulação removendo uma aresta por nó crítico e compara os grafos."""
    try:
        dados = request.json

        grafo_original_txt = dados.get("grafo_original")
        grafo_otimizado_txt = dados.get("grafo_otimizado")

        if not grafo_original_txt or not grafo_otimizado_txt:
            return jsonify({"erro": "Grafos não fornecidos"}), 400

        G_original = carregar_grafo_de_texto(grafo_original_txt)
        G_otimizado = carregar_grafo_de_texto(grafo_otimizado_txt)

        nos_criticos = obter_nos_criticos()
        nos_criticos = nos_criticos[:min(50, len(nos_criticos))]

        G_original_falho, arestas_rem_orig = remover_uma_aresta_por_no(G_original, nos_criticos)
        G_otimizado_falho, arestas_rem_opt = remover_uma_aresta_por_no(G_otimizado, nos_criticos)

        met_original = calcular_metricas_simples(G_original_falho)
        met_otimizado = calcular_metricas_simples(G_otimizado_falho)
        met_original_base = calcular_metricas_simples(G_original)
        met_otimizado_base = calcular_metricas_simples(G_otimizado)

        tabela_comparativa = {
            "titulo": f"Simulação de Falhas ({len(nos_criticos)} em cada grafo)",
            "colunas": ["Métrica", "Original c/ Falha", "Otimizado c/ Falha", "Diferença"],
            "linhas": [
                {
                    "metrica": "Componentes",
                    "original": met_original["componentes"],
                    "otimizado": met_otimizado["componentes"],
                    "diferenca_formatada": f"{met_otimizado['componentes'] - met_original['componentes']:+.0f}"
                },
                {
                    "metrica": "Maior Componente",
                    "original": met_original["maior_componente"],
                    "otimizado": met_otimizado["maior_componente"],
                    "diferenca_formatada": f"{met_otimizado['maior_componente'] - met_original['maior_componente']:+.0f}"
                },
                {
                    "metrica": "Arestas",
                    "original": met_original["arestas"],
                    "otimizado": met_otimizado["arestas"],
                    "diferenca_formatada": f"{met_otimizado['arestas'] - met_original['arestas']:+.0f}"
                },
                {
                    "metrica": "Nós",
                    "original": met_original["nos"],
                    "otimizado": met_otimizado["nos"],
                    "diferenca_formatada": f"{met_otimizado['nos'] - met_original['nos']:+.0f}"
                }
            ]
        }

        return jsonify({
            "metricas": {
                "original_baseline": met_original_base,
                "otimizado_baseline": met_otimizado_base,
                "original_falho": met_original,
                "otimizado_falho": met_otimizado
            },
            "configuracao_simulacao": {
                "nos_criticos_afetados": len(nos_criticos),
                "arestas_removidas_original": len(arestas_rem_orig),
                "arestas_removidas_otimizado": len(arestas_rem_opt),
                "nos_criticos_lista": nos_criticos[:10]
            },
            "tabela_comparativa": tabela_comparativa,
            "resumo": {
                "melhoria_componentes": met_otimizado["componentes"] - met_original["componentes"],
                "melhoria_maior_componente": met_otimizado["maior_componente"] - met_original["maior_componente"],
                "resiliencia": (
                    "ALTA" if met_otimizado["maior_componente"] > met_original["maior_componente"]
                    else "MODERADA" if met_otimizado["maior_componente"] == met_original["maior_componente"]
                    else "BAIXA"
                )
            }
        })

    except Exception as e:
        return jsonify({"erro": f"Erro na simulação: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online", "servico": "simulacao"})

if __name__ == '__main__':
    print("Iniciando servidor de simulação na porta 5051...")
    app.run(debug=False, port=5051)
