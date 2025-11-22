"""
Análise de Robustez e Resiliência da Rede Elétrica
Calcula métricas estruturais de robustez e eficiência sob falhas
"""

# -*- coding: utf-8 -*-
import networkx as nx
import csv
import json
import sys
import os
import numpy as np
import random
from typing import List, Dict

# Configurar encoding UTF-8 para output no Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass


def carregar_grafo(arquivo: str) -> nx.Graph:
    """Carrega o grafo a partir do arquivo CSV"""
    if not os.path.exists(arquivo):
        print(f"❌ ERRO: Arquivo '{arquivo}' não encontrado!")
        sys.exit(1)

    grafo = nx.Graph()
    with open(arquivo, 'r', encoding='utf-8') as f:
        leitor_csv = csv.reader(f)
        for linha in leitor_csv:
            origem, destino = int(linha[0]), int(linha[1])
            grafo.add_edge(origem, destino)

    if grafo.number_of_nodes() == 0:
        print("❌ ERRO: Grafo vazio!")
        sys.exit(1)

    return grafo


def calcular_algebraic_connectivity(grafo: nx.Graph) -> float:
    """
    Calcula a conectividade algébrica (2º menor autovalor da matriz Laplaciana)
    Valores maiores indicam maior robustez
    """
    if not nx.is_connected(grafo):
        # Para grafos desconectados, retorna 0
        return 0.0

    # Calcula autovalores da matriz Laplaciana
    laplacian_matrix = nx.laplacian_matrix(grafo).todense()
    eigenvalues = np.linalg.eigvalsh(laplacian_matrix)
    eigenvalues.sort()

    # O segundo menor autovalor é a conectividade algébrica
    return float(eigenvalues[1])


def calcular_eficiencia_global(grafo: nx.Graph) -> float:
    """
    Calcula eficiência global: média das inversas das distâncias entre todos os pares
    """
    if len(grafo.nodes()) == 0:
        return 0.0

    # Para grafos grandes, usa amostragem
    nodes = list(grafo.nodes())
    if len(nodes) > 500:
        # Amostra 500 nós aleatórios
        nodes = random.sample(nodes, 500)

    eficiencias = []
    for i, source in enumerate(nodes):
        # Calcula distâncias de 'source' para todos os outros nós alcançáveis
        lengths = nx.single_source_shortest_path_length(grafo, source)
        for target, length in lengths.items():
            if source != target and length > 0:
                eficiencias.append(1.0 / length)

    return np.mean(eficiencias) if eficiencias else 0.0


def calcular_eficiencia_local(grafo: nx.Graph) -> float:
    """
    Calcula eficiência local média: mede eficiência dos subgrafos dos vizinhos
    """
    eficiencias_locais = []

    for node in grafo.nodes():
        neighbors = list(grafo.neighbors(node))
        if len(neighbors) < 2:
            continue

        # Subgrafo dos vizinhos
        subgrafo = grafo.subgraph(neighbors)

        # Eficiência do subgrafo
        if len(subgrafo.nodes()) > 0:
            eff = calcular_eficiencia_global(subgrafo)
            eficiencias_locais.append(eff)

    return np.mean(eficiencias_locais) if eficiencias_locais else 0.0


def calcular_metricas_caminho(grafo: nx.Graph) -> Dict:
    """Calcula métricas relacionadas a caminhos"""
    if not nx.is_connected(grafo):
        # Para grafos desconectados, analisa apenas o maior componente
        maior_componente = max(nx.connected_components(grafo), key=len)
        grafo = grafo.subgraph(maior_componente).copy()

    # Average shortest path length
    avg_path_length = nx.average_shortest_path_length(grafo)

    # Diameter (caminho mais longo)
    diameter = nx.diameter(grafo)

    # Radius (menor excentricidade)
    radius = nx.radius(grafo)

    return {
        'avg_path_length': avg_path_length,
        'diameter': diameter,
        'radius': radius
    }


def analisar_robustez_estrutural(grafo: nx.Graph) -> Dict:
    """Análise abrangente de robustez estrutural"""
    print("🔍 Calculando métricas de robustez estrutural...")

    # Conectividade algébrica
    print("  - Conectividade algébrica...")
    algebraic_conn = calcular_algebraic_connectivity(grafo)

    # Eficiências
    print("  - Eficiência global...")
    eff_global = calcular_eficiencia_global(grafo)

    print("  - Eficiência local...")
    eff_local = calcular_eficiencia_local(grafo)

    # Métricas de caminho
    print("  - Métricas de caminho...")
    metricas_caminho = calcular_metricas_caminho(grafo)

    # Node/Edge connectivity
    print("  - Conectividade de nós e arestas...")
    node_connectivity = nx.node_connectivity(grafo)
    edge_connectivity = nx.edge_connectivity(grafo)

    # Assortativity (correlação de grau)
    assortativity = nx.degree_assortativity_coefficient(grafo)

    # Densidade
    densidade = nx.density(grafo)

    return {
        'algebraic_connectivity': algebraic_conn,
        'eficiencia_global': eff_global,
        'eficiencia_local': eff_local,
        'avg_path_length': metricas_caminho['avg_path_length'],
        'diameter': metricas_caminho['diameter'],
        'radius': metricas_caminho['radius'],
        'node_connectivity': node_connectivity,
        'edge_connectivity': edge_connectivity,
        'assortativity': assortativity,
        'densidade': densidade
    }


def simular_recuperacao(grafo_original: nx.Graph, nos_falhos: List[int]) -> List[Dict]:
    """
    Simula processo de recuperação da rede após falha
    """
    grafo_falho = grafo_original.copy()
    for no in nos_falhos:
        if grafo_falho.has_node(no):
            grafo_falho.remove_node(no)

    # Simula recuperação gradual
    recuperacao = []

    # Estado inicial (pós-falha)
    eff_inicial = calcular_eficiencia_global(grafo_falho)
    recuperacao.append({
        'nos_recuperados': 0,
        'percentual_recuperado': 0.0,
        'eficiencia_global': eff_inicial
    })

    # Recupera nós em ordem aleatória
    nos_para_recuperar = nos_falhos.copy()
    random.shuffle(nos_para_recuperar)

    for i, no in enumerate(nos_para_recuperar):
        # Reinsere nó e suas arestas originais
        vizinhos = list(grafo_original.neighbors(no))
        grafo_falho.add_node(no)
        for vizinho in vizinhos:
            if grafo_falho.has_node(vizinho):
                grafo_falho.add_edge(no, vizinho)

        # Mede eficiência
        eff = calcular_eficiencia_global(grafo_falho)
        recuperacao.append({
            'nos_recuperados': i + 1,
            'percentual_recuperado': ((i + 1) / len(nos_falhos) * 100),
            'eficiencia_global': eff
        })

    return recuperacao


def analisar_resiliencia(grafo: nx.Graph) -> Dict:
    """Análise de resiliência e capacidade de recuperação"""
    print("🔄 Analisando resiliência...")

    # Identifica nós críticos
    graus = dict(grafo.degree())
    top_hubs = sorted(graus.items(), key=lambda x: x[1], reverse=True)[:10]
    nos_criticos = [no for no, _ in top_hubs]

    # Eficiência antes da falha
    eff_original = calcular_eficiencia_global(grafo)

    # Simula recuperação
    print("  - Simulando recuperação...")
    curva_recuperacao = simular_recuperacao(grafo, nos_criticos)

    # Calcula tempo de recuperação (quantos passos até atingir 90% da eficiência original)
    tempo_recuperacao_90 = None
    for passo in curva_recuperacao:
        if passo['eficiencia_global'] >= 0.9 * eff_original:
            tempo_recuperacao_90 = passo['percentual_recuperado']
            break

    if tempo_recuperacao_90 is None:
        tempo_recuperacao_90 = 100.0

    return {
        'eficiencia_original': eff_original,
        'nos_criticos_testados': nos_criticos,
        'curva_recuperacao': curva_recuperacao,
        'tempo_recuperacao_90': tempo_recuperacao_90,
        'impacto_remocao': {
            'eficiencia_apos_falha': curva_recuperacao[0]['eficiencia_global'],
            'perda_eficiencia': (eff_original - curva_recuperacao[0]['eficiencia_global']) / eff_original * 100
        }
    }


def calcular_threshold_percolacao(grafo: nx.Graph) -> Dict:
    """
    Calcula o threshold de percolação (fração crítica de nós removidos 
    onde a rede fragmenta significativamente)
    """
    print("🎯 Calculando threshold de percolação...")

    nos_originais = list(grafo.nodes())
    n_total = len(nos_originais)

    # Simula remoção incremental aleatória de nós
    resultados = []
    grafo_simulado = grafo.copy()
    nos_removidos = []

    # Remove nós em incrementos de 1% até 50%
    random.shuffle(nos_originais)

    for percentual in range(0, 51, 1):  # 0% a 50% em passos de 1%
        fracao_alvo = percentual / 100.0
        num_remover = int(n_total * fracao_alvo)

        # Remove nós adicionais até atingir a fração alvo
        while len(nos_removidos) < num_remover and len(nos_originais) > len(nos_removidos):
            no = nos_originais[len(nos_removidos)]
            if grafo_simulado.has_node(no):
                grafo_simulado.remove_node(no)
            nos_removidos.append(no)

        # Analisa fragmentação
        if len(grafo_simulado.nodes()) > 0:
            componentes = list(nx.connected_components(grafo_simulado))
            tamanho_maior = len(max(componentes, key=len)
                                ) if componentes else 0
            fragmentacao = 100.0 * (1 - tamanho_maior / n_total)
        else:
            fragmentacao = 100.0
            tamanho_maior = 0

        resultados.append({
            'percentual_removido': percentual,
            'nos_removidos': len(nos_removidos),
            'fragmentacao': round(fragmentacao, 2),
            'tamanho_maior_componente': tamanho_maior
        })

    # Identifica threshold (primeira vez que fragmentação > 50%)
    threshold_50 = None
    for res in resultados:
        if res['fragmentacao'] > 50.0:
            threshold_50 = res['percentual_removido']
            break

    if threshold_50 is None:
        threshold_50 = 50  # Não atingiu 50% de fragmentação

    print(
        f"  ✓ Threshold de percolação (50% fragmentação): {threshold_50}% de nós removidos")

    return {
        'threshold_50_pct': threshold_50,
        'curva_fragmentacao': resultados,
        'interpretacao': (
            f"Rede colapsa (>50% fragmentação) ao remover {threshold_50}% dos nós aleatoriamente"
            if threshold_50 < 50
            else "Rede mantém componente principal mesmo com 50% de nós removidos"
        )
    }


def comparar_com_redes_teoricas(grafo: nx.Graph) -> Dict:
    """Compara métricas com redes teóricas (Erdős-Rényi, Barabási-Albert)"""
    print("📊 Comparando com redes teóricas...")

    n = len(grafo.nodes())
    m = len(grafo.edges())
    avg_degree = 2 * m / n

    # Gera rede Erdős-Rényi (aleatória)
    print("  - Gerando rede Erdős-Rényi...")
    p_er = avg_degree / (n - 1)
    grafo_er = nx.erdos_renyi_graph(n, p_er, seed=42)

    # Gera rede Barabási-Albert (scale-free)
    print("  - Gerando rede Barabási-Albert...")
    m_ba = int(avg_degree / 2)
    grafo_ba = nx.barabasi_albert_graph(n, m_ba, seed=42)

    # Calcula métricas para comparação
    print("  - Calculando métricas...")

    # Nota: clustering é calculado em gerar_analise_avancada.py para evitar duplicação
    # Aqui usamos apenas para comparação com redes teóricas

    metricas_real = {
        'eficiencia_global': calcular_eficiencia_global(grafo),
        'assortativity': nx.degree_assortativity_coefficient(grafo)
    }

    metricas_er = {
        'eficiencia_global': calcular_eficiencia_global(grafo_er),
        'clustering': nx.average_clustering(grafo_er),
        'assortativity': nx.degree_assortativity_coefficient(grafo_er)
    }

    metricas_ba = {
        'eficiencia_global': calcular_eficiencia_global(grafo_ba),
        'clustering': nx.average_clustering(grafo_ba),
        'assortativity': nx.degree_assortativity_coefficient(grafo_ba)
    }

    return {
        'rede_real': metricas_real,
        'erdos_renyi': metricas_er,
        'barabasi_albert': metricas_ba,
        'interpretacao': {
            'similaridade_ER': 'Comparar com clustering em analise_criticidade.json',
            'similaridade_BA': 'Alta' if abs(metricas_real['assortativity'] - metricas_ba['assortativity']) < 0.2 else 'Baixa'
        }
    }


def interpretar_robustez(metricas: Dict) -> List[str]:
    """Gera interpretação textual das métricas de robustez"""
    interpretacao = []

    # Conectividade algébrica
    if metricas['algebraic_connectivity'] > 0.1:
        interpretacao.append(
            f"✓ Conectividade algébrica alta ({metricas['algebraic_connectivity']:.4f}) - rede bem conectada")
    elif metricas['algebraic_connectivity'] > 0.01:
        interpretacao.append(
            f"⚠ Conectividade algébrica moderada ({metricas['algebraic_connectivity']:.4f})")
    else:
        interpretacao.append(
            f"✗ Conectividade algébrica baixa ({metricas['algebraic_connectivity']:.4f}) - vulnerável a particionamento")

    # Eficiência global
    if metricas['eficiencia_global'] > 0.4:
        interpretacao.append(
            f"✓ Eficiência global alta ({metricas['eficiencia_global']:.4f}) - boa capacidade de transmissão")
    elif metricas['eficiencia_global'] > 0.2:
        interpretacao.append(
            f"⚠ Eficiência global moderada ({metricas['eficiencia_global']:.4f})")
    else:
        interpretacao.append(
            f"✗ Eficiência global baixa ({metricas['eficiencia_global']:.4f})")

    # Node connectivity
    if metricas['node_connectivity'] >= 3:
        interpretacao.append(
            f"✓ Node connectivity alto ({metricas['node_connectivity']}) - múltiplos caminhos alternativos")
    elif metricas['node_connectivity'] == 2:
        interpretacao.append(
            f"⚠ Node connectivity moderado ({metricas['node_connectivity']})")
    else:
        interpretacao.append(
            f"✗ Node connectivity baixo ({metricas['node_connectivity']}) - pontos únicos de falha")

    # Assortativity
    if metricas['assortativity'] < -0.2:
        interpretacao.append(
            f"Rede disassortativa (assortativity={metricas['assortativity']:.3f}) - hubs conectam a nós de baixo grau")
    elif metricas['assortativity'] > 0.2:
        interpretacao.append(
            f"Rede assortativa (assortativity={metricas['assortativity']:.3f}) - nós similares tendem a se conectar")
    else:
        interpretacao.append(
            f"Rede neutra (assortativity={metricas['assortativity']:.3f})")

    return interpretacao


def main():
    print("=" * 80)
    print("ANÁLISE DE ROBUSTEZ E RESILIÊNCIA DA REDE ELÉTRICA")
    print("=" * 80)

    # Carrega grafo
    print("\n📂 Carregando grafo...")
    grafo = carregar_grafo('powergrid.edgelist.csv')
    print(
        f"✓ Grafo carregado: {len(grafo.nodes())} nós, {len(grafo.edges())} arestas")

    # Análise de robustez estrutural
    metricas_robustez = analisar_robustez_estrutural(grafo)

    # Análise de resiliência
    analise_resiliencia = analisar_resiliencia(grafo)

    # Threshold de percolação
    threshold_percolacao = calcular_threshold_percolacao(grafo)

    # Comparação com redes teóricas
    comparacao_teorica = comparar_com_redes_teoricas(grafo)

    # Interpretação
    interpretacao = interpretar_robustez(metricas_robustez)

    # Carregar dados de percolação por nó (se existir)
    resumo_percolacao_nos = None
    try:
        import json
        with open('../ui/public/analise_criticidade.json', 'r', encoding='utf-8') as f:
            analise_crit = json.load(f)
            if 'percolacao_por_no' in analise_crit:
                perc_data = analise_crit['percolacao_por_no']
                threshold = perc_data['threshold_top_5_pct']

                # Identificar nós com alta percolação
                nos_alta_perc = []
                for no_str, info in perc_data['todos_nos'].items():
                    if info['fragmentacao_percentual'] >= threshold:
                        nos_alta_perc.append({
                            'no': int(no_str),
                            'fragmentacao_percentual': info['fragmentacao_percentual'],
                            'componentes_criados': info['componentes_criados'],
                            'nos_isolados': info['nos_isolados']
                        })

                # Ordenar por fragmentação
                nos_alta_perc.sort(
                    key=lambda x: x['fragmentacao_percentual'], reverse=True)

                resumo_percolacao_nos = {
                    'threshold_top_5_pct': threshold,
                    'total_nos_alta_percolacao': len(nos_alta_perc),
                    'top_20_fragmentadores': nos_alta_perc[:20],
                    'interpretacao': (
                        f"{len(nos_alta_perc)} nós apresentam alto impacto de fragmentação (≥{threshold:.2f}%). "
                        f"Estes nós, se removidos, causam particionamento significativo da rede."
                    )
                }
                print(
                    f"\n✓ Dados de percolação por nó carregados de analise_criticidade.json")
    except Exception as e:
        print(f"\n⚠️  Não foi possível carregar percolação por nó: {e}")

    # Monta resultado
    resultado = {
        'metricas_robustez': metricas_robustez,
        'analise_resiliencia': analise_resiliencia,
        'threshold_percolacao': threshold_percolacao,
        'comparacao_teorica': comparacao_teorica,
        'interpretacao': interpretacao
    }

    if resumo_percolacao_nos:
        resultado['resumo_percolacao_nos'] = resumo_percolacao_nos

    # Salva resultado
    caminho_saida = '../ui/public/analise_robustez.json'
    with open(caminho_saida, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("RESUMO DA ANÁLISE DE ROBUSTEZ")
    print("=" * 80)
    for linha in interpretacao:
        print(linha)

    print("\n🔄 Resiliência:")
    print(
        f"  - Tempo de recuperação (90%): {analise_resiliencia['tempo_recuperacao_90']:.1f}% dos nós")
    print(
        f"  - Perda de eficiência após falha: {analise_resiliencia['impacto_remocao']['perda_eficiencia']:.1f}%")

    print("\n🎯 Percolação:")
    print(
        f"  - Threshold (50% fragmentação): {threshold_percolacao['threshold_50_pct']}% dos nós")
    print(f"  - {threshold_percolacao['interpretacao']}")

    print(f"\n✅ Análise de robustez salva em '{caminho_saida}'")


if __name__ == '__main__':
    random.seed(42)
    main()
