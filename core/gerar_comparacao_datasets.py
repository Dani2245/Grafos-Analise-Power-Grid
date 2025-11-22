"""
Comparação entre Dataset Original e Novo Dataset
Normaliza métricas por tamanho de rede para permitir comparação relativa
"""

import pandas as pd
import networkx as nx
import csv
import json
import numpy as np
import os
from typing import Dict, Optional


def carregar_dados_precalculados_original() -> Optional[Dict]:
    """
    Carrega betweenness e articulation points pré-calculados
    Economia: ~3 minutos de recalculação
    """
    try:
        caminho_json = os.path.join("..", "ui", "public", "analise_criticidade.json")
        with open(caminho_json, "r", encoding="utf-8") as f:
            dados = json.load(f)

            # Extrair betweenness do dicionário todos_nos dentro de centralidade_intermediacao
            betweenness_dict = dados.get("centralidade_intermediacao", {}).get(
                "todos_nos", {}
            )
            # Converter chaves de string para int
            betweenness = {int(no): bc for no, bc in betweenness_dict.items()}

            # Extrair pontos de articulação da lista_completa
            pontos_art_list = dados.get("pontos_articulacao", {}).get(
                "lista_completa", []
            )
            pontos_articulacao = set(pontos_art_list)

            print(f"   ✓ Betweenness carregado para {len(betweenness)} nós")
            print(f"   ✓ {len(pontos_articulacao)} pontos de articulação carregados")

            return {
                "betweenness": betweenness,
                "pontos_articulacao": pontos_articulacao,
            }
    except Exception as e:
        print(f"   ⚠️  Não foi possível carregar dados pré-calculados: {e}")
        return None


def carregar_dataset_original() -> nx.Graph:
    """Carrega dataset original (não-direcionado)"""
    print("Carregando dataset original (powergrid.edgelist.csv)...")

    grafo = nx.Graph()
    with open("powergrid.edgelist.csv", "r", encoding="utf-8") as arquivo:
        leitor_csv = csv.reader(arquivo)
        for linha in leitor_csv:
            if len(linha) == 2:
                origem = int(linha[0])
                destino = int(linha[1])
                grafo.add_edge(origem, destino)

    print(f"   ✓ {grafo.number_of_nodes()} nós, {grafo.number_of_edges()} arestas")
    return grafo


def carregar_dataset_novo() -> tuple:
    """Carrega novo dataset (direcionado e ponderado)"""
    print("Carregando novo dataset (power_grid_dataset.csv)...")

    df = pd.read_csv("power_grid_dataset.csv")
    row = df.mean(numeric_only=True)

    G = nx.DiGraph()
    for i in range(1, 11):
        G.add_node(i)

    for origem in range(1, 11):
        for destino in range(1, 11):
            if origem != destino:
                peso = row[f"power_flow_{origem}_to_{destino}"]
                if peso > 0.1:
                    G.add_edge(origem, destino, weight=peso)

    print(f"   ✓ {G.number_of_nodes()} nós, {G.number_of_edges()} arestas")
    return G, df


def calcular_metricas_normalizadas_original(
    G: nx.Graph, dados_precalc: Optional[Dict] = None
) -> Dict:
    """Calcula métricas normalizadas para o dataset original"""
    print("Calculando métricas do dataset original...")

    n = G.number_of_nodes()
    m = G.number_of_edges()

    # Métricas básicas
    densidade = nx.density(G)
    graus = dict(G.degree())
    grau_medio = sum(graus.values()) / n
    grau_maximo = max(graus.values())
    grau_minimo = min(graus.values())

    # Coeficiente de clustering
    clustering_medio = nx.average_clustering(G)

    # Métricas de centralidade - OTIMIZADO: usar pré-calculados
    if dados_precalc and "betweenness" in dados_precalc:
        betweenness = dados_precalc["betweenness"]
        betweenness_media = sum(betweenness.values()) / n
        betweenness_maxima = max(betweenness.values())
    else:
        print("   Calculando betweenness (pode demorar ~3 min)...")
        betweenness = nx.betweenness_centrality(G, normalized=True)
        betweenness_media = sum(betweenness.values()) / n
        betweenness_maxima = max(betweenness.values())

    # Pontos de articulação - OTIMIZADO: usar pré-calculados
    if dados_precalc and "pontos_articulacao" in dados_precalc:
        pontos_articulacao = dados_precalc["pontos_articulacao"]
    else:
        print("   Calculando pontos de articulação...")
        pontos_articulacao = set(nx.articulation_points(G))

    taxa_pontos_articulacao = len(pontos_articulacao) / n * 100

    # Componentes conectados
    componentes = list(nx.connected_components(G))
    maior_componente = len(max(componentes, key=len))
    taxa_maior_componente = maior_componente / n * 100

    # Diâmetro e caminho médio (só do maior componente)
    G_maior = G.subgraph(max(componentes, key=len))
    try:
        diametro = nx.diameter(G_maior)
        caminho_medio = nx.average_shortest_path_length(G_maior)
    except:
        diametro = 0
        caminho_medio = 0

    print("   ✓ Métricas calculadas")

    return {
        "total_nos": n,
        "total_arestas": m,
        "densidade": round(densidade, 6),
        "grau_medio": round(grau_medio, 4),
        # Grau médio / nós totais
        "grau_medio_normalizado": round(grau_medio / n, 6),
        "grau_maximo": grau_maximo,
        "grau_minimo": grau_minimo,
        "clustering_medio": round(clustering_medio, 6),
        "betweenness_media": round(betweenness_media, 6),
        "betweenness_maxima": round(betweenness_maxima, 6),
        "taxa_pontos_articulacao": round(taxa_pontos_articulacao, 2),
        "total_pontos_articulacao": len(pontos_articulacao),
        "num_componentes": len(componentes),
        "taxa_maior_componente": round(taxa_maior_componente, 2),
        "diametro": diametro,
        "caminho_medio": round(caminho_medio, 4) if caminho_medio > 0 else None,
    }


def calcular_metricas_normalizadas_novo(G: nx.DiGraph) -> Dict:
    """Calcula métricas normalizadas para o novo dataset"""
    print("Calculando métricas do novo dataset...")

    n = G.number_of_nodes()
    m = G.number_of_edges()

    # Métricas básicas
    densidade = nx.density(G)

    # In/Out degree
    in_degrees = dict(G.in_degree())
    out_degrees = dict(G.out_degree())

    grau_medio_in = sum(in_degrees.values()) / n
    grau_medio_out = sum(out_degrees.values()) / n
    grau_medio = (grau_medio_in + grau_medio_out) / 2

    # Clustering (converter para não-direcionado temporariamente)
    G_undirected = G.to_undirected()
    clustering_medio = nx.average_clustering(G_undirected)

    # Betweenness
    print("   Calculando betweenness direcionado...")
    try:
        betweenness = nx.betweenness_centrality(G, normalized=True, weight="weight")
        betweenness_media = sum(betweenness.values()) / n
        betweenness_maxima = max(betweenness.values())
    except:
        betweenness_media = 0
        betweenness_maxima = 0

    # Componentes (considerar como não-direcionado para análise de conectividade)
    componentes = list(nx.connected_components(G_undirected))
    maior_componente = len(max(componentes, key=len))
    taxa_maior_componente = maior_componente / n * 100

    # Diâmetro e caminho médio
    G_maior = G_undirected.subgraph(max(componentes, key=len))
    try:
        diametro = nx.diameter(G_maior)
        caminho_medio = nx.average_shortest_path_length(G_maior)
    except:
        diametro = 0
        caminho_medio = 0

    # Fontes e sumidouros (específico para grafo direcionado)
    fontes = [n for n in G.nodes() if out_degrees[n] > 0 and in_degrees[n] == 0]
    sumidouros = [n for n in G.nodes() if in_degrees[n] > 0 and out_degrees[n] == 0]

    print("   ✓ Métricas calculadas")

    return {
        "total_nos": n,
        "total_arestas": m,
        "densidade": round(densidade, 6),
        "grau_medio": round(grau_medio, 4),
        "grau_medio_normalizado": round(grau_medio / n, 6),
        "grau_medio_in": round(grau_medio_in, 4),
        "grau_medio_out": round(grau_medio_out, 4),
        "clustering_medio": round(clustering_medio, 6),
        "betweenness_media": round(betweenness_media, 6),
        "betweenness_maxima": round(betweenness_maxima, 6),
        "num_componentes": len(componentes),
        "taxa_maior_componente": round(taxa_maior_componente, 2),
        "diametro": diametro,
        "caminho_medio": round(caminho_medio, 4) if caminho_medio > 0 else None,
        "num_fontes": len(fontes),
        "num_sumidouros": len(sumidouros),
    }


def gerar_tabela_comparativa(metricas_original: Dict, metricas_novo: Dict) -> Dict:
    """Gera tabela comparativa entre os dois datasets"""
    print("Gerando tabela comparativa...")

    comparacao = {
        "caracteristicas_gerais": {
            "dataset_original": {
                "tipo": "Topológico",
                "direcionamento": "Não-direcionado",
                "ponderacao": "Não-ponderado",
                "temporalidade": "Estático (snapshot único)",
                "total_nos": metricas_original["total_nos"],
                "total_arestas": metricas_original["total_arestas"],
                "escala": "Grande (milhares de nós)",
            },
            "dataset_novo": {
                "tipo": "Operacional",
                "direcionamento": "Direcionado",
                "ponderacao": "Ponderado (fluxo de potência)",
                "temporalidade": "Temporal (1.000 timestamps)",
                "total_nos": metricas_novo["total_nos"],
                "total_arestas": metricas_novo["total_arestas"],
                "escala": "Pequena (10 nós)",
            },
        },
        "metricas_estruturais": {
            "densidade": {
                "dataset_original": metricas_original["densidade"],
                "dataset_novo": metricas_novo["densidade"],
                "interpretacao": "Original mais esparso, Novo mais denso (proporcionalmente)",
            },
            "grau_medio_normalizado": {
                "dataset_original": metricas_original["grau_medio_normalizado"],
                "dataset_novo": metricas_novo["grau_medio_normalizado"],
                "interpretacao": "Grau médio relativo ao tamanho da rede",
            },
            "clustering_medio": {
                "dataset_original": metricas_original["clustering_medio"],
                "dataset_novo": metricas_novo["clustering_medio"],
                "interpretacao": "Coeficiente de agrupamento (coesão local)",
            },
            "diametro": {
                "dataset_original": metricas_original["diametro"],
                "dataset_novo": metricas_novo["diametro"],
                "interpretacao": "Distância máxima entre nós",
            },
            "caminho_medio": {
                "dataset_original": metricas_original["caminho_medio"],
                "dataset_novo": metricas_novo["caminho_medio"],
                "interpretacao": "Distância média entre pares de nós",
            },
        },
        "metricas_centralidade": {
            "betweenness_media": {
                "dataset_original": metricas_original["betweenness_media"],
                "dataset_novo": metricas_novo["betweenness_media"],
                "interpretacao": "Centralidade de intermediação média",
            },
            "betweenness_maxima": {
                "dataset_original": metricas_original["betweenness_maxima"],
                "dataset_novo": metricas_novo["betweenness_maxima"],
                "interpretacao": "Nó com maior centralidade",
            },
        },
        "robustez": {
            "taxa_pontos_articulacao": {
                "dataset_original": metricas_original.get(
                    "taxa_pontos_articulacao", "N/A"
                ),
                "dataset_novo": "N/A (grafo direcionado)",
                "interpretacao": "Pontos de articulação só se aplicam a grafos não-direcionados",
            },
            "taxa_maior_componente": {
                "dataset_original": metricas_original["taxa_maior_componente"],
                "dataset_novo": metricas_novo["taxa_maior_componente"],
                "interpretacao": "Percentual de nós no maior componente conectado",
            },
            "num_componentes": {
                "dataset_original": metricas_original["num_componentes"],
                "dataset_novo": metricas_novo["num_componentes"],
                "interpretacao": "Número de componentes desconectados",
            },
        },
    }

    print("   ✓ Tabela comparativa gerada")

    return comparacao


def gerar_indices_normalizados(metricas_original: Dict, metricas_novo: Dict) -> Dict:
    """
    Gera índices normalizados (0-100) para comparação visual
    Normaliza métricas para permitir comparação em escalas diferentes
    """

    # Índice de Densidade (0-100)
    # Densidade máxima teórica = 1, então densidade * 100
    indice_densidade_original = metricas_original["densidade"] * 100
    indice_densidade_novo = metricas_novo["densidade"] * 100

    # Índice de Clustering (0-100)
    indice_clustering_original = metricas_original["clustering_medio"] * 100
    indice_clustering_novo = metricas_novo["clustering_medio"] * 100

    # Índice de Conectividade (baseado em % do maior componente)
    indice_conectividade_original = metricas_original["taxa_maior_componente"]
    indice_conectividade_novo = metricas_novo["taxa_maior_componente"]

    # Índice de Centralização (baseado em betweenness máxima)
    # Quanto maior, mais centralizada (alguns nós muito importantes)
    indice_centralizacao_original = metricas_original["betweenness_maxima"] * 100
    indice_centralizacao_novo = metricas_novo["betweenness_maxima"] * 100

    return {
        "dataset_original": {
            "densidade_indice": round(indice_densidade_original, 2),
            "clustering_indice": round(indice_clustering_original, 2),
            "conectividade_indice": round(indice_conectividade_original, 2),
            "centralizacao_indice": round(indice_centralizacao_original, 2),
        },
        "dataset_novo": {
            "densidade_indice": round(indice_densidade_novo, 2),
            "clustering_indice": round(indice_clustering_novo, 2),
            "conectividade_indice": round(indice_conectividade_novo, 2),
            "centralizacao_indice": round(indice_centralizacao_novo, 2),
        },
    }


def main():
    print("=" * 80)
    print("COMPARAÇÃO ENTRE DATASETS")
    print("=" * 80)

    print("\n[1/6] Carregando datasets...")
    G_original = carregar_dataset_original()
    G_novo, df_novo = carregar_dataset_novo()

    print("\n[2/6] Carregando dados pré-calculados do dataset original...")
    dados_precalc = carregar_dados_precalculados_original()

    print("\n[3/6] Calculando métricas do dataset original...")
    metricas_original = calcular_metricas_normalizadas_original(
        G_original, dados_precalc
    )

    print("\n[4/6] Calculando métricas do novo dataset...")
    metricas_novo = calcular_metricas_normalizadas_novo(G_novo)

    print("\n[5/6] Gerando tabela comparativa...")
    comparacao = gerar_tabela_comparativa(metricas_original, metricas_novo)

    print("\n[6/6] Gerando índices normalizados...")
    indices = gerar_indices_normalizados(metricas_original, metricas_novo)

    # Montar JSON de saída
    resultado = {
        "AVISO_METODOLOGICO": "Comparação entre datasets de naturezas diferentes. Métricas normalizadas permitem comparação relativa, mas escalas e objetivos são distintos.",
        "LIMITACOES": [
            "Dataset original: rede topológica estática de 4.941 nós",
            "Dataset novo: rede operacional temporal de 10 nós",
            "Comparação direta de valores absolutos não é válida",
            "Métricas normalizadas por tamanho permitem comparação estrutural relativa",
        ],
        "metricas_dataset_original": metricas_original,
        "metricas_dataset_novo": metricas_novo,
        "tabela_comparativa": comparacao,
        "indices_normalizados": indices,
    }

    # Salvar JSON
    caminho_saida = "../ui/public/comparacao_datasets.json"
    with open(caminho_saida, "w", encoding="utf-8") as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("RESUMO DA COMPARAÇÃO")
    print("=" * 80)

    print("\n📊 Dataset Original:")
    print(f"   • Nós: {metricas_original['total_nos']}")
    print(f"   • Arestas: {metricas_original['total_arestas']}")
    print(f"   • Densidade: {metricas_original['densidade']:.6f}")
    print(f"   • Clustering: {metricas_original['clustering_medio']:.6f}")

    print("\n📊 Dataset Novo:")
    print(f"   • Nós: {metricas_novo['total_nos']}")
    print(f"   • Arestas: {metricas_novo['total_arestas']}")
    print(f"   • Densidade: {metricas_novo['densidade']:.6f}")
    print(f"   • Clustering: {metricas_novo['clustering_medio']:.6f}")

    print("\n📈 Índices Normalizados (0-100):")
    print("\n   Dataset Original:")
    for k, v in indices["dataset_original"].items():
        print(f"   • {k}: {v}")

    print("\n   Dataset Novo:")
    for k, v in indices["dataset_novo"].items():
        print(f"   • {k}: {v}")

    print(f"\n✅ Comparação salva em '{caminho_saida}'")
    print("=" * 80)


if __name__ == "__main__":
    main()
