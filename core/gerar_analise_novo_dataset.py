"""
Análise Temporal do Novo Dataset de Rede Elétrica
Dataset: power_grid_dataset.csv (10 nós, 1.000 timestamps, direcionado e ponderado)

Análise:
- Temporal: Séries temporais de carga, voltage, frequency, grid_status
- Direcionada: In/Out-degree, PageRank, betweenness direcionado
- Ponderada: Fluxo de potência agregado, balanceamento de carga
- Falhas: Correlação entre fault_detected e instabilidade
- Comparação: Análise estratificada por grid_status (estável vs. instável)
"""

import pandas as pd
import networkx as nx
import numpy as np
import json
from collections import defaultdict
from typing import Dict, List, Tuple


def carregar_dataset() -> pd.DataFrame:
    """Carrega o dataset temporal de rede elétrica"""
    print("Carregando power_grid_dataset.csv...")
    df = pd.read_csv('power_grid_dataset.csv')

    # Converter timestamp para datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])

    print(f"   ✓ {len(df)} timestamps carregados")
    print(f"   ✓ Período: {df['timestamp'].min()} a {df['timestamp'].max()}")

    return df


def construir_grafo_temporal(df: pd.DataFrame, timestamp_idx: int = None) -> nx.DiGraph:
    """
    Constrói grafo direcionado e ponderado para um timestamp específico
    Se timestamp_idx=None, usa médias de todos os timestamps
    """
    if timestamp_idx is not None:
        row = df.iloc[timestamp_idx]
    else:
        # Usar médias de todos os timestamps
        row = df.mean(numeric_only=True)

    G = nx.DiGraph()

    # Adicionar nós 1-10
    for i in range(1, 11):
        G.add_node(i)

    # Adicionar arestas com peso = power_flow
    for origem in range(1, 11):
        for destino in range(1, 11):
            if origem != destino:
                col_name = f'power_flow_{origem}_to_{destino}'
                peso = row[col_name]

                # Adicionar aresta se houver fluxo significativo (> 0.1 MW)
                if peso > 0.1:
                    G.add_edge(origem, destino, weight=peso)

    return G


def calcular_metricas_temporais(df: pd.DataFrame) -> Dict:
    """Calcula estatísticas temporais para cada nó"""
    print("\nCalculando métricas temporais...")

    metricas_por_no = {}

    for i in range(1, 11):
        load_col = f'load_node_{i}'

        metricas_por_no[i] = {
            'load_media': round(df[load_col].mean(), 2),
            'load_desvio': round(df[load_col].std(), 2),
            'load_min': round(df[load_col].min(), 2),
            'load_max': round(df[load_col].max(), 2),
            'load_percentil_25': round(df[load_col].quantile(0.25), 2),
            'load_percentil_75': round(df[load_col].quantile(0.75), 2)
        }

    # Estatísticas globais
    estatisticas_globais = {
        'voltage_media': round(df['voltage'].mean(), 6),
        'voltage_desvio': round(df['voltage'].std(), 6),
        'voltage_min': round(df['voltage'].min(), 6),
        'voltage_max': round(df['voltage'].max(), 6),
        'frequency_media': round(df['frequency'].mean(), 4),
        'frequency_desvio': round(df['frequency'].std(), 4),
        'frequency_min': round(df['frequency'].min(), 4),
        'frequency_max': round(df['frequency'].max(), 4),
        'taxa_falhas': round(df['fault_detected'].sum() / len(df) * 100, 2),
        'taxa_instabilidade': round(df['grid_status'].sum() / len(df) * 100, 2),
        'total_timestamps': len(df)
    }

    print(f"   ✓ Métricas calculadas para 10 nós")

    return {
        'metricas_por_no': metricas_por_no,
        'estatisticas_globais': estatisticas_globais
    }


def gerar_series_temporais(df: pd.DataFrame, amostragem: int = 10) -> Dict:
    """
    Gera séries temporais para visualização
    Amostragem: pegar 1 a cada N timestamps para reduzir tamanho do JSON
    """
    print(f"\nGerando séries temporais (amostragem 1/{amostragem})...")

    # Amostrar timestamps
    df_amostrado = df.iloc[::amostragem].copy()

    series = {
        'timestamps': df_amostrado['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S').tolist(),
        'load_por_no': {},
        'voltage': df_amostrado['voltage'].round(4).tolist(),
        'frequency': df_amostrado['frequency'].round(2).tolist(),
        'grid_status': df_amostrado['grid_status'].tolist(),
        'fault_detected': df_amostrado['fault_detected'].tolist()
    }

    # Séries de carga por nó
    for i in range(1, 11):
        col = f'load_node_{i}'
        series['load_por_no'][i] = df_amostrado[col].round(2).tolist()

    print(f"   ✓ {len(series['timestamps'])} pontos temporais gerados")

    return series


def calcular_metricas_direcionadas(df: pd.DataFrame) -> Dict:
    """Calcula métricas de grafo direcionado usando média temporal"""
    print("\nCalculando métricas direcionadas...")

    # Construir grafo com médias temporais
    G = construir_grafo_temporal(df, timestamp_idx=None)

    # In-degree e Out-degree
    in_degrees = dict(G.in_degree())
    out_degrees = dict(G.out_degree())

    # PageRank
    try:
        pagerank = nx.pagerank(G, alpha=0.85, weight='weight')
    except:
        pagerank = {i: 0 for i in range(1, 11)}

    # Betweenness Centrality (direcionado)
    try:
        betweenness = nx.betweenness_centrality(
            G, normalized=True, weight='weight')
    except:
        betweenness = {i: 0 for i in range(1, 11)}

    # Closeness Centrality (direcionado)
    try:
        closeness = nx.closeness_centrality(G, distance='weight')
    except:
        closeness = {i: 0 for i in range(1, 11)}

    # Identificar fontes e sumidouros
    fontes = [no for no in G.nodes() if out_degrees[no] >
              0 and in_degrees[no] == 0]
    sumidouros = [no for no in G.nodes() if in_degrees[no] >
                  0 and out_degrees[no] == 0]

    print(f"   ✓ Fontes: {len(fontes)}, Sumidouros: {len(sumidouros)}")

    return {
        'in_degree': in_degrees,
        'out_degree': out_degrees,
        'pagerank': {k: round(v, 6) for k, v in pagerank.items()},
        'betweenness': {k: round(v, 6) for k, v in betweenness.items()},
        'closeness': {k: round(v, 6) for k, v in closeness.items()},
        'fontes': fontes,
        'sumidouros': sumidouros,
        'total_nos': G.number_of_nodes(),
        'total_arestas': G.number_of_edges(),
        'densidade': round(nx.density(G), 4)
    }


def calcular_metricas_ponderadas(df: pd.DataFrame) -> Dict:
    """Calcula métricas relacionadas ao peso das arestas (fluxo de potência)"""
    print("\nCalculando métricas ponderadas (fluxo de potência)...")

    # Matriz de fluxo médio (10x10)
    matriz_fluxo = np.zeros((10, 10))

    for origem in range(1, 11):
        for destino in range(1, 11):
            if origem != destino:
                col = f'power_flow_{origem}_to_{destino}'
                matriz_fluxo[origem-1, destino-1] = df[col].mean()

    # Fluxo total por nó (entrada + saída)
    fluxo_entrada = {}
    fluxo_saida = {}
    fluxo_total = {}

    for i in range(1, 11):
        # Soma de fluxo que ENTRA no nó i
        fluxo_entrada[i] = round(matriz_fluxo[:, i-1].sum(), 2)

        # Soma de fluxo que SAI do nó i
        fluxo_saida[i] = round(matriz_fluxo[i-1, :].sum(), 2)

        # Fluxo total (entrada + saída)
        fluxo_total[i] = round(fluxo_entrada[i] + fluxo_saida[i], 2)

    # Balanceamento de carga (entrada vs. saída)
    balanceamento = {}
    for i in range(1, 11):
        if fluxo_entrada[i] + fluxo_saida[i] > 0:
            balanceamento[i] = round(
                abs(fluxo_entrada[i] - fluxo_saida[i]) /
                (fluxo_entrada[i] + fluxo_saida[i]),
                4
            )
        else:
            balanceamento[i] = 0

    # Top 5 arestas com maior fluxo médio
    top_arestas = []
    for origem in range(1, 11):
        for destino in range(1, 11):
            if origem != destino:
                fluxo = matriz_fluxo[origem-1, destino-1]
                if fluxo > 0:
                    top_arestas.append({
                        'origem': origem,
                        'destino': destino,
                        'fluxo_medio': round(fluxo, 2)
                    })

    top_arestas.sort(key=lambda x: x['fluxo_medio'], reverse=True)

    print(f"   ✓ Matriz de fluxo calculada")

    return {
        'matriz_fluxo': matriz_fluxo.round(2).tolist(),
        'fluxo_entrada': fluxo_entrada,
        'fluxo_saida': fluxo_saida,
        'fluxo_total': fluxo_total,
        'balanceamento': balanceamento,
        'top_arestas': top_arestas[:20]
    }


def analisar_falhas(df: pd.DataFrame) -> Dict:
    """Analisa correlação entre falhas detectadas e instabilidade da rede"""
    print("\nAnalisando detecção de falhas e instabilidade...")

    # Timestamps com falha
    timestamps_com_falha = df[df['fault_detected'] == 1]
    timestamps_sem_falha = df[df['fault_detected'] == 0]

    # Timestamps com instabilidade
    timestamps_instavel = df[df['grid_status'] == 1]
    timestamps_estavel = df[df['grid_status'] == 0]

    # Correlação entre fault_detected e grid_status
    correlacao_falha_instabilidade = df['fault_detected'].corr(
        df['grid_status'])

    # Estatísticas quando há falha vs. quando não há
    comparacao_falha = {
        'com_falha': {
            'quantidade': len(timestamps_com_falha),
            'percentual': round(len(timestamps_com_falha) / len(df) * 100, 2),
            'voltage_media': round(timestamps_com_falha['voltage'].mean(), 4),
            'frequency_media': round(timestamps_com_falha['frequency'].mean(), 2),
            'taxa_instabilidade': round(timestamps_com_falha['grid_status'].sum() / len(timestamps_com_falha) * 100, 2) if len(timestamps_com_falha) > 0 else 0
        },
        'sem_falha': {
            'quantidade': len(timestamps_sem_falha),
            'percentual': round(len(timestamps_sem_falha) / len(df) * 100, 2),
            'voltage_media': round(timestamps_sem_falha['voltage'].mean(), 4),
            'frequency_media': round(timestamps_sem_falha['frequency'].mean(), 2),
            'taxa_instabilidade': round(timestamps_sem_falha['grid_status'].sum() / len(timestamps_sem_falha) * 100, 2) if len(timestamps_sem_falha) > 0 else 0
        }
    }

    # Estatísticas quando rede está estável vs. instável
    comparacao_estabilidade = {
        'estavel': {
            'quantidade': len(timestamps_estavel),
            'percentual': round(len(timestamps_estavel) / len(df) * 100, 2),
            'voltage_media': round(timestamps_estavel['voltage'].mean(), 4),
            'frequency_media': round(timestamps_estavel['frequency'].mean(), 2),
            'taxa_falhas': round(timestamps_estavel['fault_detected'].sum() / len(timestamps_estavel) * 100, 2) if len(timestamps_estavel) > 0 else 0
        },
        'instavel': {
            'quantidade': len(timestamps_instavel),
            'percentual': round(len(timestamps_instavel) / len(df) * 100, 2),
            'voltage_media': round(timestamps_instavel['voltage'].mean(), 4),
            'frequency_media': round(timestamps_instavel['frequency'].mean(), 2),
            'taxa_falhas': round(timestamps_instavel['fault_detected'].sum() / len(timestamps_instavel) * 100, 2) if len(timestamps_instavel) > 0 else 0
        }
    }

    print(
        f"   ✓ Correlação fault/instabilidade: {correlacao_falha_instabilidade:.4f}")

    return {
        'correlacao_falha_instabilidade': round(correlacao_falha_instabilidade, 4),
        'comparacao_por_falha': comparacao_falha,
        'comparacao_por_estabilidade': comparacao_estabilidade
    }


def analise_estratificada_por_status(df: pd.DataFrame) -> Dict:
    """
    Análise OPÇÃO C: Estratifica dados por grid_status e calcula métricas separadas
    """
    print("\nAnálise estratificada por grid_status (estável vs. instável)...")

    df_estavel = df[df['grid_status'] == 0]
    df_instavel = df[df['grid_status'] == 1]

    # Calcular métricas direcionadas para cada grupo
    metricas_estavel = {}
    metricas_instavel = {}

    if len(df_estavel) > 0:
        G_estavel = construir_grafo_temporal(df_estavel, timestamp_idx=None)
        metricas_estavel = {
            'total_arestas': G_estavel.number_of_edges(),
            'densidade': round(nx.density(G_estavel), 4),
            'grau_medio': round(sum(dict(G_estavel.degree()).values()) / G_estavel.number_of_nodes(), 2)
        }

    if len(df_instavel) > 0:
        G_instavel = construir_grafo_temporal(df_instavel, timestamp_idx=None)
        metricas_instavel = {
            'total_arestas': G_instavel.number_of_edges(),
            'densidade': round(nx.density(G_instavel), 4),
            'grau_medio': round(sum(dict(G_instavel.degree()).values()) / G_instavel.number_of_nodes(), 2)
        }

    print(
        f"   ✓ Estável: {len(df_estavel)} timestamps, Instável: {len(df_instavel)} timestamps")

    return {
        'estavel': metricas_estavel,
        'instavel': metricas_instavel
    }


def main():
    print("=" * 80)
    print("ANÁLISE TEMPORAL DO NOVO DATASET DE REDE ELÉTRICA")
    print("Dataset: power_grid_dataset.csv (10 nós, direcionado, ponderado)")
    print("=" * 80)

    # Carregar dataset
    df = carregar_dataset()

    # Métricas temporais
    metricas_temp = calcular_metricas_temporais(df)

    # Séries temporais (amostrar 1 a cada 10 para reduzir tamanho do JSON)
    series = gerar_series_temporais(df, amostragem=10)

    # Métricas direcionadas
    metricas_dir = calcular_metricas_direcionadas(df)

    # Métricas ponderadas
    metricas_pond = calcular_metricas_ponderadas(df)

    # Análise de falhas
    analise_falhas_result = analisar_falhas(df)

    # Análise estratificada
    analise_estrat = analise_estratificada_por_status(df)

    # Montar JSON de saída
    resultado = {
        'AVISO_METODOLOGICO': 'Dataset operacional com 10 nós e 1.000 timestamps. Análise temporal, direcionada e ponderada baseada em dados simulados de operação de rede elétrica.',
        'DIFERENCA_DATASET_ORIGINAL': 'Dataset original: 4.941 nós, topológico, estático, não-direcionado. Novo dataset: 10 nós, operacional, temporal (1.000 snapshots), direcionado e ponderado.',
        'info_dataset': {
            'total_nos': 10,
            'total_timestamps': len(df),
            'periodo': {
                'inicio': df['timestamp'].min().strftime('%Y-%m-%d %H:%M:%S'),
                'fim': df['timestamp'].max().strftime('%Y-%m-%d %H:%M:%S')
            }
        },
        'metricas_temporais': metricas_temp,
        'series_temporais': series,
        'metricas_direcionadas': metricas_dir,
        'metricas_ponderadas': metricas_pond,
        'analise_falhas': analise_falhas_result,
        'analise_estratificada': analise_estrat
    }

    # Salvar JSON
    caminho_saida = '../ui/public/analise_novo_dataset.json'
    with open(caminho_saida, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("RESUMO DA ANÁLISE")
    print("=" * 80)
    print(f"\n📊 Dataset:")
    print(f"   • Total de nós: 10")
    print(f"   • Total de timestamps: {len(df)}")
    print(
        f"   • Taxa de falhas: {metricas_temp['estatisticas_globais']['taxa_falhas']}%")
    print(
        f"   • Taxa de instabilidade: {metricas_temp['estatisticas_globais']['taxa_instabilidade']}%")

    print(f"\n🔍 Métricas Direcionadas:")
    print(f"   • Total de arestas: {metricas_dir['total_arestas']}")
    print(f"   • Densidade: {metricas_dir['densidade']}")
    print(f"   • Fontes: {len(metricas_dir['fontes'])}")
    print(f"   • Sumidouros: {len(metricas_dir['sumidouros'])}")

    print(f"\n⚡ Métricas Ponderadas:")
    top_fluxo = max(metricas_pond['fluxo_total'].values())
    no_top_fluxo = max(
        metricas_pond['fluxo_total'], key=metricas_pond['fluxo_total'].get)
    print(f"   • Nó com maior fluxo total: {no_top_fluxo} ({top_fluxo} MW)")
    print(
        f"   • Top aresta: {metricas_pond['top_arestas'][0]['origem']} → {metricas_pond['top_arestas'][0]['destino']} ({metricas_pond['top_arestas'][0]['fluxo_medio']} MW)")

    print(f"\n💥 Análise de Falhas:")
    print(
        f"   • Correlação fault/instabilidade: {analise_falhas_result['correlacao_falha_instabilidade']:.4f}")
    print(
        f"   • Instabilidade quando há falha: {analise_falhas_result['comparacao_por_falha']['com_falha']['taxa_instabilidade']}%")
    print(
        f"   • Instabilidade quando não há falha: {analise_falhas_result['comparacao_por_falha']['sem_falha']['taxa_instabilidade']}%")

    print(f"\n✅ Análise salva em '{caminho_saida}'")
    print("=" * 80)


if __name__ == '__main__':
    main()
