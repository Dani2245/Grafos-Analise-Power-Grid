"""
Simulação de Falhas no Novo Dataset
Simula remoção de nós e sobrecarga para avaliar robustez da rede de 10 nós
"""

import pandas as pd
import networkx as nx
import numpy as np
import json
from typing import Dict, List


def carregar_dataset() -> pd.DataFrame:
    """Carrega o dataset temporal"""
    df = pd.read_csv('power_grid_dataset.csv')
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    return df


def construir_grafo_medio(df: pd.DataFrame) -> nx.DiGraph:
    """Constrói grafo usando médias temporais"""
    row = df.mean(numeric_only=True)

    G = nx.DiGraph()

    # Adicionar nós com atributo de carga média
    for i in range(1, 11):
        G.add_node(i, load=row[f'load_node_{i}'])

    # Adicionar arestas com peso
    for origem in range(1, 11):
        for destino in range(1, 11):
            if origem != destino:
                peso = row[f'power_flow_{origem}_to_{destino}']
                if peso > 0.1:
                    G.add_edge(origem, destino, weight=peso)

    return G


def simular_remocao_no(G: nx.DiGraph, no_remover: int) -> Dict:
    """Simula remoção de um nó e mede impacto"""

    # Copiar grafo
    G_falha = G.copy()

    # Armazenar informações do nó antes de remover
    load_no = G.nodes[no_remover].get('load', 0)
    in_degree_antes = G.in_degree(no_remover)
    out_degree_antes = G.out_degree(no_remover)

    # Calcular carga total antes
    carga_total_antes = sum(G.nodes[n].get('load', 0) for n in G.nodes())

    # Remover nó
    G_falha.remove_node(no_remover)

    # Calcular métricas após remoção
    carga_total_depois = sum(G_falha.nodes[n].get(
        'load', 0) for n in G_falha.nodes())
    perda_carga = carga_total_antes - carga_total_depois
    perda_carga_percentual = (
        perda_carga / carga_total_antes * 100) if carga_total_antes > 0 else 0

    # Verificar conectividade
    if len(G_falha.nodes()) > 0:
        G_undirected = G_falha.to_undirected()
        componentes = list(nx.connected_components(G_undirected))
        num_componentes = len(componentes)
        tamanho_maior_componente = len(
            max(componentes, key=len)) if componentes else 0
        fragmentacao = ((G.number_of_nodes() - 1 - tamanho_maior_componente) /
                        (G.number_of_nodes() - 1) * 100) if G.number_of_nodes() > 1 else 0
    else:
        num_componentes = 0
        tamanho_maior_componente = 0
        fragmentacao = 100

    # Arestas perdidas
    arestas_antes = G.number_of_edges()
    arestas_depois = G_falha.number_of_edges()
    arestas_perdidas = arestas_antes - arestas_depois
    perda_arestas_percentual = (
        arestas_perdidas / arestas_antes * 100) if arestas_antes > 0 else 0

    return {
        'no_removido': no_remover,
        'load_no_removido': round(load_no, 2),
        'in_degree_antes': in_degree_antes,
        'out_degree_antes': out_degree_antes,
        'carga_total_antes': round(carga_total_antes, 2),
        'carga_total_depois': round(carga_total_depois, 2),
        'perda_carga_MW': round(perda_carga, 2),
        'perda_carga_percentual': round(perda_carga_percentual, 2),
        'num_componentes': num_componentes,
        'tamanho_maior_componente': tamanho_maior_componente,
        'fragmentacao_percentual': round(fragmentacao, 2),
        'arestas_antes': arestas_antes,
        'arestas_depois': arestas_depois,
        'arestas_perdidas': arestas_perdidas,
        'perda_arestas_percentual': round(perda_arestas_percentual, 2)
    }


def simular_sobrecarga(G: nx.DiGraph, percentual_aumento: int) -> Dict:
    """Simula aumento de carga em todos os nós"""

    carga_original = {n: G.nodes[n].get('load', 0) for n in G.nodes()}
    carga_total_original = sum(carga_original.values())

    # Aumentar carga
    fator = 1 + (percentual_aumento / 100)
    carga_nova = {n: c * fator for n, c in carga_original.items()}
    carga_total_nova = sum(carga_nova.values())

    # Calcular nós que ultrapassam threshold (assumindo 500 MW como máximo)
    threshold = 500
    nos_sobrecarga = [n for n, c in carga_nova.items() if c > threshold]

    # Simular redistribuição de carga
    # (simplificado: assumir que nós sobrecarregados distribuem excesso para vizinhos)
    redistribuicao = {}
    for no in G.nodes():
        if no in nos_sobrecarga:
            excesso = carga_nova[no] - threshold
            vizinhos = list(G.neighbors(no))
            if vizinhos:
                excesso_por_vizinho = excesso / len(vizinhos)
                redistribuicao[no] = {
                    'carga_original': round(carga_original[no], 2),
                    'carga_apos_aumento': round(carga_nova[no], 2),
                    'excesso': round(excesso, 2),
                    'vizinhos_afetados': len(vizinhos),
                    'excesso_por_vizinho': round(excesso_por_vizinho, 2)
                }

    return {
        'percentual_aumento': percentual_aumento,
        'carga_total_original': round(carga_total_original, 2),
        'carga_total_apos_aumento': round(carga_total_nova, 2),
        'aumento_absoluto': round(carga_total_nova - carga_total_original, 2),
        'threshold_sobrecarga': threshold,
        'nos_em_sobrecarga': nos_sobrecarga,
        'quantidade_sobrecarga': len(nos_sobrecarga),
        'detalhes_redistribuicao': redistribuicao
    }


def comparar_com_dataset_original() -> Dict:
    """
    Compara robustez do novo dataset com o dataset original
    (baseado em resultados já calculados para o dataset original)
    """

    # Nota: Valores do dataset original vêm de analise_robustez.json
    # Aqui fazemos comparação conceitual

    comparacao = {
        'dataset_original': {
            'total_nos': 4941,
            'impacto_medio_remocao_no': 'Varia de 0% a 15% de fragmentação',
            'robustez_relativa': 'Alta (rede densa, muitas rotas alternativas)'
        },
        'dataset_novo': {
            'total_nos': 10,
            'impacto_medio_remocao_no': 'A ser calculado',
            'robustez_relativa': 'Menor (rede pequena, poucas rotas alternativas)'
        },
        'observacoes': [
            'Dataset original: Rede topológica grande com alta redundância',
            'Dataset novo: Rede operacional pequena, cada nó crítico',
            'Comparação direta não é válida devido a diferenças de escala e natureza',
            'Métricas normalizadas por nó permitem comparação relativa'
        ]
    }

    return comparacao


def main():
    print("=" * 80)
    print("SIMULAÇÃO DE FALHAS - NOVO DATASET")
    print("=" * 80)

    print("\n[1/4] Carregando dataset...")
    df = carregar_dataset()

    print("\n[2/4] Construindo grafo médio...")
    G = construir_grafo_medio(df)
    print(f"   ✓ {G.number_of_nodes()} nós, {G.number_of_edges()} arestas")

    print("\n[3/4] Simulando remoção de nós...")
    simulacoes_remocao = []
    for no in range(1, 11):
        resultado = simular_remocao_no(G, no)
        simulacoes_remocao.append(resultado)
        print(f"   • Nó {no}: Fragmentação {resultado['fragmentacao_percentual']:.1f}%, "
              f"Perda de carga {resultado['perda_carga_percentual']:.1f}%")

    # Ordenar por impacto (fragmentação)
    simulacoes_remocao.sort(
        key=lambda x: x['fragmentacao_percentual'], reverse=True)

    print("\n[4/4] Simulando sobrecarga...")
    simulacoes_sobrecarga = []
    for percentual in [25, 50, 75, 100]:
        resultado = simular_sobrecarga(G, percentual)
        simulacoes_sobrecarga.append(resultado)
        print(
            f"   • +{percentual}%: {resultado['quantidade_sobrecarga']} nós em sobrecarga")

    # Comparação com dataset original
    comparacao = comparar_com_dataset_original()

    # Montar JSON de saída
    resultado = {
        'AVISO_METODOLOGICO': 'Simulação de falhas em rede de 10 nós. Resultados baseados em médias temporais do dataset operacional.',
        'info_simulacao': {
            'total_nos': G.number_of_nodes(),
            'total_arestas': G.number_of_edges(),
            'carga_total_media': round(sum(G.nodes[n].get('load', 0) for n in G.nodes()), 2)
        },
        'simulacoes_remocao': {
            'total_simulacoes': len(simulacoes_remocao),
            'resultados': simulacoes_remocao,
            'estatisticas': {
                'fragmentacao_media': round(np.mean([s['fragmentacao_percentual'] for s in simulacoes_remocao]), 2),
                'fragmentacao_maxima': max(s['fragmentacao_percentual'] for s in simulacoes_remocao),
                'perda_carga_media': round(np.mean([s['perda_carga_percentual'] for s in simulacoes_remocao]), 2),
                'no_mais_critico': simulacoes_remocao[0]['no_removido']
            }
        },
        'simulacoes_sobrecarga': {
            'total_simulacoes': len(simulacoes_sobrecarga),
            'resultados': simulacoes_sobrecarga,
            'threshold_usado': 500
        },
        'comparacao_dataset_original': comparacao
    }

    # Salvar JSON
    caminho_saida = '../ui/public/simulacao_falhas_novo.json'
    with open(caminho_saida, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("RESUMO DA SIMULAÇÃO")
    print("=" * 80)
    print(f"\n💥 Remoção de Nós:")
    print(
        f"   • Nó mais crítico: {resultado['simulacoes_remocao']['estatisticas']['no_mais_critico']}")
    print(
        f"   • Fragmentação máxima: {resultado['simulacoes_remocao']['estatisticas']['fragmentacao_maxima']:.1f}%")
    print(
        f"   • Fragmentação média: {resultado['simulacoes_remocao']['estatisticas']['fragmentacao_media']:.1f}%")
    print(
        f"   • Perda de carga média: {resultado['simulacoes_remocao']['estatisticas']['perda_carga_media']:.1f}%")

    print(f"\n⚡ Sobrecarga:")
    print(
        f"   • Threshold: {resultado['simulacoes_sobrecarga']['threshold_usado']} MW")
    for sim in simulacoes_sobrecarga:
        print(
            f"   • +{sim['percentual_aumento']}%: {sim['quantidade_sobrecarga']} nós em sobrecarga")

    print(f"\n✅ Simulação salva em '{caminho_saida}'")
    print("=" * 80)


if __name__ == '__main__':
    main()
