import networkx as nx
import csv
import json


def carregar_rede():
    """Carrega a rede elétrica do arquivo CSV"""
    grafo = nx.Graph()

    with open('powergrid.edgelist.csv', 'r', encoding='utf-8') as arquivo:
        leitor_csv = csv.reader(arquivo)
        for linha in leitor_csv:
            if len(linha) == 2:
                origem = int(linha[0])
                destino = int(linha[1])
                grafo.add_edge(origem, destino)

    return grafo


def calcular_betweenness_centrality(grafo):
    """
    Calcula a Centralidade de Intermediação (Betweenness Centrality)

    Mede quantas vezes um nó aparece no caminho mais curto entre outros nós.
    Valores altos indicam nós críticos para o fluxo de energia.
    """
    print("   Calculando betweenness centrality (pode levar alguns minutos)...")
    betweenness = nx.betweenness_centrality(grafo, normalized=True)
    print(f"   ✅ Betweenness calculada para {len(betweenness)} nós")
    return betweenness


def encontrar_pontos_articulacao(grafo):
    """
    Encontra Pontos de Articulação (Articulation Points / Cut Vertices)

    Nós cuja remoção desconectaria a rede. São pontos de falha críticos.
    """
    print("   Identificando pontos de articulação...")
    pontos = set(nx.articulation_points(grafo))
    print(
        f"   ✅ Encontrados {len(pontos)} pontos de articulação ({len(pontos)/grafo.number_of_nodes()*100:.1f}% da rede)")
    return pontos


def calcular_clustering(grafo):
    """
    Calcula Coeficiente de Agrupamento (Clustering Coefficient)

    Mede a tendência dos vizinhos de um nó estarem conectados entre si.
    Valores altos indicam estrutura comunitária forte.
    """
    print("   Calculando coeficiente de clustering...")

    # Clustering por nó
    clustering_por_no = nx.clustering(grafo)

    # Clustering médio da rede
    clustering_medio = nx.average_clustering(grafo)

    # Transitividade (clustering global)
    transitividade = nx.transitivity(grafo)

    print(f"   ✅ Clustering médio: {clustering_medio:.6f}")
    print(f"   ✅ Transitividade: {transitividade:.6f}")

    return clustering_por_no, clustering_medio, transitividade


def analisar_percolacao(grafo, pontos_articulacao):
    """
    Análise de Percolação: simula remoção de pontos de articulação
    e mede o impacto na fragmentação da rede.
    """
    print("   Simulando percolação (remoção de pontos de articulação)...")

    # Limitar análise aos top 500 pontos de articulação mais críticos
    # (ordenados por betweenness - será calculado antes)
    pontos_analisar = list(pontos_articulacao)[:500]

    resultados_percolacao = []

    for no in pontos_analisar:
        # Criar cópia do grafo
        G_simulado = grafo.copy()

        # Remover o ponto de articulação
        G_simulado.remove_node(no)

        # Analisar fragmentação
        componentes = list(nx.connected_components(G_simulado))
        num_componentes = len(componentes)

        # Tamanho do maior componente
        tamanho_maior_componente = len(
            max(componentes, key=len)) if componentes else 0

        # Percentual do maior componente em relação ao total original
        percentual_maior = (tamanho_maior_componente /
                            grafo.number_of_nodes()) * 100

        # Número de nós isolados
        nos_isolados = sum(1 for c in componentes if len(c) == 1)

        resultados_percolacao.append({
            "no_removido": no,
            "grau_no": grafo.degree(no),
            "componentes_criados": num_componentes,
            "tamanho_maior_componente": tamanho_maior_componente,
            "percentual_maior_componente": round(percentual_maior, 2),
            "nos_isolados": nos_isolados,
            "fragmentacao_percentual": round(100 - percentual_maior, 2)
        })

    # Ordenar por fragmentação (maior impacto primeiro)
    resultados_percolacao.sort(
        key=lambda x: x['fragmentacao_percentual'], reverse=True)

    print(
        f"   ✅ Percolação analisada para {len(resultados_percolacao)} pontos de articulação")

    return resultados_percolacao


def gerar_distribuicao_clustering(clustering_por_no):
    """Gera distribuição de clustering coefficient em bins"""

    # Criar bins: 0-0.1, 0.1-0.2, ..., 0.9-1.0
    bins = [(i/10, (i+1)/10) for i in range(10)]
    distribuicao = {f"{b[0]:.1f}-{b[1]:.1f}": 0 for b in bins}

    for coef in clustering_por_no.values():
        for bin_range in bins:
            if bin_range[0] <= coef < bin_range[1] or (coef == 1.0 and bin_range[1] == 1.0):
                key = f"{bin_range[0]:.1f}-{bin_range[1]:.1f}"
                distribuicao[key] += 1
                break

    return [{"range": k, "count": v} for k, v in distribuicao.items()]


def gerar_analise_json(grafo, betweenness, pontos_articulacao):
    """Gera arquivo JSON com todas as informações de criticidade"""

    # Top 50 nós por betweenness
    top_betweenness = sorted(
        betweenness.items(), key=lambda x: x[1], reverse=True)[:50]

    # Estatísticas de betweenness
    valores_bc = list(betweenness.values())
    bc_media = sum(valores_bc) / len(valores_bc)
    bc_threshold = sorted(valores_bc, reverse=True)[
        int(len(valores_bc) * 0.05)]  # Top 5%

    # Analisar pontos de articulação por grau
    pa_por_grau = {
        'grau_1': [],
        'grau_2_3': [],
        'grau_4_7': [],
        'grau_8_plus': []
    }

    for no in pontos_articulacao:
        grau = grafo.degree(no)
        if grau == 1:
            pa_por_grau['grau_1'].append(no)
        elif grau <= 3:
            pa_por_grau['grau_2_3'].append(no)
        elif grau <= 7:
            pa_por_grau['grau_4_7'].append(no)
        else:
            pa_por_grau['grau_8_plus'].append(no)

    # Classificação de criticidade em 5 níveis
    critico_nivel_1 = []
    critico_nivel_2 = []
    critico_nivel_3 = []
    atencao_nivel_1 = []
    atencao_nivel_2 = []

    for no in grafo.nodes():
        grau = grafo.degree(no)
        bc = betweenness[no]
        eh_articulacao = no in pontos_articulacao

        if eh_articulacao:
            if grau >= 8 and bc >= bc_threshold:
                critico_nivel_1.append({
                    'no': no,
                    'grau': grau,
                    'betweenness': round(bc, 6),
                    'motivo': 'Ponto de Articulação + Alto Grau + Alta Betweenness'
                })
            elif grau >= 8 or bc >= bc_threshold:
                critico_nivel_2.append({
                    'no': no,
                    'grau': grau,
                    'betweenness': round(bc, 6),
                    'motivo': 'Ponto de Articulação + (Alto Grau OU Alta Betweenness)'
                })
            else:
                critico_nivel_3.append({
                    'no': no,
                    'grau': grau,
                    'betweenness': round(bc, 6),
                    'motivo': 'Ponto de Articulação'
                })
        else:
            if bc >= bc_threshold:
                atencao_nivel_1.append({
                    'no': no,
                    'grau': grau,
                    'betweenness': round(bc, 6),
                    'motivo': 'Alta Betweenness (gargalo) mas não articulação'
                })
            elif grau >= 8:
                atencao_nivel_2.append({
                    'no': no,
                    'grau': grau,
                    'betweenness': round(bc, 6),
                    'motivo': 'Alto Grau mas baixa betweenness e não articulação'
                })

    # Montar JSON completo
    dados = {
        'estatisticas_rede': {
            'total_nos': grafo.number_of_nodes(),
            'total_arestas': grafo.number_of_edges(),
            'grau_medio': round(sum(dict(grafo.degree()).values()) / grafo.number_of_nodes(), 2),
            'grau_maximo': max(dict(grafo.degree()).values())
        },
        'centralidade_intermediacao': {
            'media': round(bc_media, 6),
            'threshold_top_5_pct': round(bc_threshold, 6),
            'top_50': [
                {
                    'no': no,
                    'betweenness': round(bc, 6),
                    'grau': grafo.degree(no),
                    'eh_ponto_articulacao': no in pontos_articulacao
                }
                for no, bc in top_betweenness
            ],
            'todos_nos': {
                str(no): round(bc, 6)
                for no, bc in betweenness.items()
            }
        },
        'pontos_articulacao': {
            'total': len(pontos_articulacao),
            'percentual_rede': round(len(pontos_articulacao) / grafo.number_of_nodes() * 100, 2),
            'lista_completa': sorted(list(pontos_articulacao)),
            'distribuicao_por_grau': {
                'grau_1': {
                    'quantidade': len(pa_por_grau['grau_1']),
                    'nos': pa_por_grau['grau_1']
                },
                'grau_2_3': {
                    'quantidade': len(pa_por_grau['grau_2_3']),
                    'nos': pa_por_grau['grau_2_3']
                },
                'grau_4_7': {
                    'quantidade': len(pa_por_grau['grau_4_7']),
                    'nos': pa_por_grau['grau_4_7']
                },
                'grau_8_plus': {
                    'quantidade': len(pa_por_grau['grau_8_plus']),
                    'nos': pa_por_grau['grau_8_plus']
                }
            }
        },
        'classificacao_criticidade': {
            'nivel_1_critico_maximo': {
                'total': len(critico_nivel_1),
                'descricao': 'Ponto de Articulação + Alto Grau + Alta Betweenness',
                'impacto': 'Falha causa FRAGMENTAÇÃO e afeta MUITOS pontos',
                'nos': critico_nivel_1
            },
            'nivel_2_critico_alto': {
                'total': len(critico_nivel_2),
                'descricao': 'Ponto de Articulação + (Alto Grau OU Alta Betweenness)',
                'impacto': 'Falha causa FRAGMENTAÇÃO',
                'nos': critico_nivel_2
            },
            'nivel_3_critico_medio': {
                'total': len(critico_nivel_3),
                'descricao': 'Ponto de Articulação (grau baixo/médio)',
                'impacto': 'Falha causa fragmentação localizada',
                'nos': critico_nivel_3
            },
            'nivel_4_atencao_gargalo': {
                'total': len(atencao_nivel_1),
                'descricao': 'Alta Betweenness mas não articulação',
                'impacto': 'Gargalo de fluxo, redundância existe',
                'nos': atencao_nivel_1
            },
            'nivel_5_atencao_hub': {
                'total': len(atencao_nivel_2),
                'descricao': 'Alto Grau mas baixa betweenness e não articulação',
                'impacto': 'Muitas conexões mas não crítico estruturalmente',
                'nos': atencao_nivel_2
            }
        }
    }

    return dados


def main():
    print("=" * 80)
    print("ANÁLISE AVANÇADA DE CRITICIDADE DA REDE ELÉTRICA")
    print("=" * 80)

    print("\n[1/4] Carregando rede elétrica...")
    grafo = carregar_rede()
    print(
        f"   ✅ Rede carregada: {grafo.number_of_nodes()} nós, {grafo.number_of_edges()} arestas")

    print(
        "\n[2/6] Calculando Centralidade de Intermediação (Betweenness Centrality)...")
    betweenness = calcular_betweenness_centrality(grafo)

    print("\n[3/6] Identificando Pontos de Articulação (Articulation Points)...")
    pontos_articulacao = encontrar_pontos_articulacao(grafo)

    print("\n[4/6] Calculando Coeficiente de Clustering...")
    clustering_por_no, clustering_medio, transitividade = calcular_clustering(
        grafo)

    print("\n[5/6] Analisando Percolação da Rede...")
    percolacao = analisar_percolacao(grafo, pontos_articulacao)

    print("\n[6/6] Gerando análise de criticidade e exportando para JSON...")
    dados = gerar_analise_json(grafo, betweenness, pontos_articulacao)

    # Adicionar dados de clustering e percolação
    dados['analise_clustering'] = {
        'clustering_medio': round(clustering_medio, 6),
        'transitividade': round(transitividade, 6),
        'interpretacao': (
            "Alta coesão local - rede com estrutura comunitária forte" if clustering_medio > 0.3
            else "Média coesão local - presença de comunidades" if clustering_medio > 0.1
            else "Baixa coesão local - rede dispersa, poucas comunidades"
        ),
        'clustering_por_no': {str(no): round(coef, 6) for no, coef in list(clustering_por_no.items())[:100]},
        'distribuicao_clustering': gerar_distribuicao_clustering(clustering_por_no)
    }

    dados['analise_percolacao'] = {
        'total_analisados': len(percolacao),
        'impacto_maximo_fragmentacao': max(p['fragmentacao_percentual'] for p in percolacao) if percolacao else 0,
        'impacto_medio_fragmentacao': round(
            sum(p['fragmentacao_percentual']
                for p in percolacao) / len(percolacao), 2
        ) if percolacao else 0,
        'resultados': percolacao[:50]  # Top 50 impactos
    }

    with open('../ui/public/analise_criticidade.json', 'w', encoding='utf-8') as f:
        json.dump(dados, f, indent=2, ensure_ascii=False)

    print("   ✅ Arquivo '../ui/public/analise_criticidade.json' gerado com sucesso!")

    print("\n" + "=" * 80)
    print("RESUMO DA ANÁLISE")
    print("=" * 80)
    print("\n📊 Estatísticas da Rede:")
    print(f"   • Total de nós: {dados['estatisticas_rede']['total_nos']}")
    print(
        f"   • Total de arestas: {dados['estatisticas_rede']['total_arestas']}")
    print(f"   • Grau médio: {dados['estatisticas_rede']['grau_medio']}")

    print("\n🔬 Clustering:")
    print(
        f"   • Clustering médio: {dados['analise_clustering']['clustering_medio']}")
    print(
        f"   • Transitividade: {dados['analise_clustering']['transitividade']}")
    print(f"   • {dados['analise_clustering']['interpretacao']}")

    print("\n🔍 Centralidade de Intermediação:")
    print(f"   • Média: {dados['centralidade_intermediacao']['media']}")
    print(
        f"   • Top 5% threshold: {dados['centralidade_intermediacao']['threshold_top_5_pct']}")
    print(
        f"   • Nó com maior betweenness: Nó {dados['centralidade_intermediacao']['top_50'][0]['no']} ({dados['centralidade_intermediacao']['top_50'][0]['betweenness']})")

    print("\n⚠️ Pontos de Articulação:")
    print(
        f"   • Total: {dados['pontos_articulacao']['total']} ({dados['pontos_articulacao']['percentual_rede']}% da rede)")
    print(
        f"   • Grau 1: {dados['pontos_articulacao']['distribuicao_por_grau']['grau_1']['quantidade']}")
    print(
        f"   • Grau 2-3: {dados['pontos_articulacao']['distribuicao_por_grau']['grau_2_3']['quantidade']}")
    print(
        f"   • Grau 4-7: {dados['pontos_articulacao']['distribuicao_por_grau']['grau_4_7']['quantidade']}")
    print(
        f"   • Grau 8+: {dados['pontos_articulacao']['distribuicao_por_grau']['grau_8_plus']['quantidade']}")

    print("\n💥 Análise de Percolação:")
    print(
        f"   • Pontos analisados: {dados['analise_percolacao']['total_analisados']}")
    print(
        f"   • Impacto máximo (fragmentação): {dados['analise_percolacao']['impacto_maximo_fragmentacao']:.1f}%")
    print(
        f"   • Impacto médio (fragmentação): {dados['analise_percolacao']['impacto_medio_fragmentacao']:.1f}%")
    if dados['analise_percolacao']['resultados']:
        top_impacto = dados['analise_percolacao']['resultados'][0]
        print(
            f"   • Nó mais crítico: {top_impacto['no_removido']} (fragmenta {top_impacto['fragmentacao_percentual']:.1f}% da rede)")

    print("\n🎯 Classificação de Criticidade:")
    print(
        f"   🔴 Nível 1 (Crítico Máximo): {dados['classificacao_criticidade']['nivel_1_critico_maximo']['total']} nós")
    print(
        f"   🟠 Nível 2 (Crítico Alto): {dados['classificacao_criticidade']['nivel_2_critico_alto']['total']} nós")
    print(
        f"   🟡 Nível 3 (Crítico Médio): {dados['classificacao_criticidade']['nivel_3_critico_medio']['total']} nós")
    print(
        f"   🔵 Nível 4 (Atenção - Gargalo): {dados['classificacao_criticidade']['nivel_4_atencao_gargalo']['total']} nós")
    print(
        f"   🟢 Nível 5 (Atenção - Hub): {dados['classificacao_criticidade']['nivel_5_atencao_hub']['total']} nós")

    print("\n" + "=" * 80)
    print("✅ ANÁLISE COMPLETA")
    print("=" * 80)


if __name__ == '__main__':
    main()
