"""
Análise de Grafo Direcionado da Rede Elétrica
Infere direções das arestas baseado em papéis dos nós e compara métricas
direcionadas vs não-direcionadas.

Requisito do professor: "Devemos analisar os impactos direcionados e não direcionados"
"""

import networkx as nx
import csv
import json
import sys
import os


def carregar_rede_nao_direcionada():
    """Carrega a rede não-direcionada original"""
    if not os.path.exists('powergrid.edgelist.csv'):
        print("❌ ERRO: Arquivo 'powergrid.edgelist.csv' não encontrado!")
        sys.exit(1)

    grafo = nx.Graph()
    with open('powergrid.edgelist.csv', 'r', encoding='utf-8') as arquivo:
        leitor_csv = csv.reader(arquivo)
        for linha in leitor_csv:
            if len(linha) == 2:
                origem = int(linha[0])
                destino = int(linha[1])
                grafo.add_edge(origem, destino)

    return grafo


def carregar_inferencia_papeis():
    """Carrega a inferência de papéis dos nós"""
    caminho = '../ui/public/inferencia_papeis.json'
    with open(caminho, 'r', encoding='utf-8') as f:
        return json.load(f)


def inferir_direcao_aresta(no_origem, no_destino, papeis_dict):
    """
    Infere a direção da aresta baseado nos papéis dos nós.

    *** LIMITAÇÃO METODOLÓGICA ***
    Esta função realiza SIMULAÇÃO TEÓRICA de direção de fluxo.
    O dataset original é NÃO-DIRECIONADO (sem dados de fluxo real).
    A direção é inferida usando hierarquia de papéis (também inferidos).

    Hierarquia de fluxo de energia (do maior para o menor):
    GERADOR → TRANSFORMADOR → LINHA_TRANSMISSAO → CONSUMIDOR

    Retorna: (origem_direcionada, destino_direcionado)
    """
    papel_origem = papeis_dict.get(str(no_origem), 'DESCONHECIDO')
    papel_destino = papeis_dict.get(str(no_destino), 'DESCONHECIDO')

    # Hierarquia: quanto menor o número, maior a prioridade (fonte de energia)
    hierarquia = {
        'GERADOR': 1,
        'TRANSFORMADOR': 2,
        'LINHA_TRANSMISSAO': 3,
        'CONSUMIDOR': 4,
        'DESCONHECIDO': 5
    }

    prioridade_origem = hierarquia.get(papel_origem, 5)
    prioridade_destino = hierarquia.get(papel_destino, 5)

    # A direção vai de menor prioridade (fonte) para maior (consumidor)
    if prioridade_origem < prioridade_destino:
        return (no_origem, no_destino)  # Origem → Destino
    elif prioridade_destino < prioridade_origem:
        return (no_destino, no_origem)  # Destino → Origem (invertido)
    else:
        # Mesma prioridade: mantém ordem original (bidirecional implícito)
        return (no_origem, no_destino)


def criar_grafo_direcionado(grafo_original, papeis_inferencia):
    """
    Cria grafo direcionado inferindo direções das arestas
    """
    print("   Inferindo direções das arestas...")

    # Mapear nós para papéis
    # A estrutura do JSON é: classificacao_completa[str(no)] = {'papel': ..., ...}
    papeis_dict = {}
    if 'classificacao_completa' in papeis_inferencia:
        for no_str, info in papeis_inferencia['classificacao_completa'].items():
            papeis_dict[no_str] = info['papel']
    else:
        print("   ⚠️ AVISO: Estrutura de JSON não reconhecida, usando papéis padrão")
        papeis_dict = {}

    grafo_direcionado = nx.DiGraph()

    # Adicionar todos os nós
    grafo_direcionado.add_nodes_from(grafo_original.nodes())

    # Adicionar arestas com direção inferida
    for u, v in grafo_original.edges():
        origem, destino = inferir_direcao_aresta(u, v, papeis_dict)
        grafo_direcionado.add_edge(origem, destino)

    print(
        f"   ✓ Grafo direcionado criado: {grafo_direcionado.number_of_edges()} arestas")

    return grafo_direcionado, papeis_dict


def calcular_metricas_direcionadas(grafo_dir):
    """
    Calcula métricas específicas para grafos direcionados
    """
    print("   Calculando métricas direcionadas...")

    # In-degree e Out-degree
    in_degrees = dict(grafo_dir.in_degree())
    out_degrees = dict(grafo_dir.out_degree())

    # PageRank (importância considerando direção)
    pagerank = nx.pagerank(grafo_dir, alpha=0.85)

    # Betweenness Centrality (direcionado)
    print("   Calculando betweenness direcionado (pode demorar)...")
    betweenness_dir = nx.betweenness_centrality(grafo_dir, normalized=True)

    # Closeness Centrality (direcionado)
    closeness_dir = nx.closeness_centrality(grafo_dir)

    # Identificar fontes (out-degree > 0, in-degree = 0)
    fontes = [no for no in grafo_dir.nodes()
              if out_degrees[no] > 0 and in_degrees[no] == 0]

    # Identificar sumidouros (in-degree > 0, out-degree = 0)
    sumidouros = [no for no in grafo_dir.nodes()
                  if in_degrees[no] > 0 and out_degrees[no] == 0]

    return {
        'in_degree': in_degrees,
        'out_degree': out_degrees,
        'pagerank': pagerank,
        'betweenness': betweenness_dir,
        'closeness': closeness_dir,
        'fontes': fontes,
        'sumidouros': sumidouros
    }


def calcular_metricas_nao_direcionadas(grafo):
    """
    Calcula métricas do grafo não-direcionado para comparação
    """
    print("   Calculando métricas não-direcionadas...")

    # Degree
    degrees = dict(grafo.degree())

    # Betweenness Centrality
    print("   Calculando betweenness não-direcionado (pode demorar)...")
    betweenness = nx.betweenness_centrality(grafo, normalized=True)

    # Closeness Centrality
    closeness = nx.closeness_centrality(grafo)

    return {
        'degree': degrees,
        'betweenness': betweenness,
        'closeness': closeness
    }


def comparar_metricas(metricas_dir, metricas_nao_dir, papeis_dict):
    """
    Compara métricas direcionadas vs não-direcionadas
    """
    print("   Comparando métricas...")

    comparacoes = []

    # Top 20 nós por diferentes métricas
    nos_analisar = set()

    # Top por PageRank
    top_pagerank = sorted(metricas_dir['pagerank'].items(),
                          key=lambda x: x[1], reverse=True)[:20]
    nos_analisar.update([no for no, _ in top_pagerank])

    # Top por betweenness direcionado
    top_betw_dir = sorted(metricas_dir['betweenness'].items(),
                          key=lambda x: x[1], reverse=True)[:20]
    nos_analisar.update([no for no, _ in top_betw_dir])

    # Top por out-degree
    top_out = sorted(metricas_dir['out_degree'].items(),
                     key=lambda x: x[1], reverse=True)[:20]
    nos_analisar.update([no for no, _ in top_out])

    for no in nos_analisar:
        papel = papeis_dict.get(str(no), 'DESCONHECIDO')

        comparacoes.append({
            'no': no,
            'papel': papel,
            'pagerank': round(metricas_dir['pagerank'][no], 6),
            'in_degree': metricas_dir['in_degree'][no],
            'out_degree': metricas_dir['out_degree'][no],
            'degree': metricas_nao_dir['degree'][no],
            'betweenness_direcionado': round(metricas_dir['betweenness'][no], 6),
            'betweenness_nao_direcionado': round(metricas_nao_dir['betweenness'][no], 6),
            'diferenca_betweenness': round(
                metricas_dir['betweenness'][no] -
                metricas_nao_dir['betweenness'][no], 6
            )
        })

    # Ordenar por PageRank
    comparacoes.sort(key=lambda x: x['pagerank'], reverse=True)

    return comparacoes


def analisar_validacao_papeis(metricas_dir, papeis_dict):
    """
    Valida se a inferência de papéis está consistente com métricas direcionadas
    """
    print("   Validando inferência de papéis...")

    validacoes = []

    # Geradores devem ter out-degree > in-degree
    # Consumidores devem ter in-degree > 0 e out-degree = 0

    for no in metricas_dir['out_degree'].keys():
        papel = papeis_dict.get(str(no), 'DESCONHECIDO')
        in_deg = metricas_dir['in_degree'][no]
        out_deg = metricas_dir['out_degree'][no]

        consistente = True
        motivo = ""

        if papel == 'GERADOR':
            if not (out_deg > in_deg):
                consistente = False
                motivo = f"Gerador com in_degree ({in_deg}) >= out_degree ({out_deg})"

        elif papel == 'CONSUMIDOR':
            if not (in_deg > 0 and out_deg == 0):
                consistente = False
                motivo = f"Consumidor com out_degree={out_deg} (esperado 0)"

        elif papel == 'TRANSFORMADOR':
            if not (in_deg > 0 and out_deg > 0):
                consistente = False
                motivo = "Transformador sem fluxo bidirecional"

        if not consistente:
            validacoes.append({
                'no': no,
                'papel': papel,
                'in_degree': in_deg,
                'out_degree': out_deg,
                'motivo_inconsistencia': motivo
            })

    return validacoes


def gerar_estatisticas_fluxo(grafo_dir, metricas_dir, papeis_dict):
    """
    Gera estatísticas sobre o fluxo de energia inferido
    """
    # Estatísticas por papel
    stats_por_papel = {}

    for papel in ['GERADOR', 'TRANSFORMADOR', 'LINHA_TRANSMISSAO', 'CONSUMIDOR']:
        nos_papel = [no for no, p in papeis_dict.items() if p == papel]
        nos_papel_int = [int(n) for n in nos_papel]

        if nos_papel_int:
            stats_por_papel[papel] = {
                'quantidade': len(nos_papel_int),
                'in_degree_medio': round(
                    sum(metricas_dir['in_degree'][n]
                        for n in nos_papel_int) / len(nos_papel_int), 2
                ),
                'out_degree_medio': round(
                    sum(metricas_dir['out_degree'][n]
                        for n in nos_papel_int) / len(nos_papel_int), 2
                ),
                'pagerank_medio': round(
                    sum(metricas_dir['pagerank'][n]
                        for n in nos_papel_int) / len(nos_papel_int), 6
                )
            }

    return stats_por_papel


def main():
    print("=" * 80)
    print("ANÁLISE DE GRAFO DIRECIONADO DA REDE ELÉTRICA")
    print("=" * 80)
    print("\n💡 Objetivo: Comparar impactos direcionados vs não-direcionados")
    print("   (Requisito do professor)\n")

    print("[1/7] Carregando rede não-direcionada...")
    grafo_original = carregar_rede_nao_direcionada()
    print(
        f"   ✓ {grafo_original.number_of_nodes()} nós, {grafo_original.number_of_edges()} arestas")

    print("\n[2/7] Carregando inferência de papéis...")
    papeis_inferencia = carregar_inferencia_papeis()
    print("   ✓ Papéis carregados")

    print("\n[3/7] Criando grafo direcionado (inferindo direções)...")
    grafo_direcionado, papeis_dict = criar_grafo_direcionado(
        grafo_original, papeis_inferencia)

    print("\n[4/7] Calculando métricas direcionadas...")
    metricas_dir = calcular_metricas_direcionadas(grafo_direcionado)
    print(f"   ✓ Fontes: {len(metricas_dir['fontes'])}")
    print(f"   ✓ Sumidouros: {len(metricas_dir['sumidouros'])}")

    print("\n[5/7] Calculando métricas não-direcionadas...")
    metricas_nao_dir = calcular_metricas_nao_direcionadas(grafo_original)

    print("\n[6/7] Comparando métricas...")
    comparacoes = comparar_metricas(
        metricas_dir, metricas_nao_dir, papeis_dict)

    print("\n[7/7] Validando inferência de papéis...")
    validacoes = analisar_validacao_papeis(metricas_dir, papeis_dict)
    print(f"   ✓ Inconsistências encontradas: {len(validacoes)}")

    # Gerar estatísticas de fluxo
    stats_fluxo = gerar_estatisticas_fluxo(
        grafo_direcionado, metricas_dir, papeis_dict)

    # Montar JSON de saída
    resultado = {
        'AVISO_METODOLOGICO': 'Grafo direcionado INFERIDO topologicamente. Dataset original é não-direcionado (sem informação de fluxo real de energia).',
        'LIMITACOES': 'Direções de arestas inferidas baseadas em hierarquia de papéis (também inferidos). Análise é simulação teórica, não representa fluxo real de energia.',
        'estatisticas_gerais': {
            'num_fontes': len(metricas_dir['fontes']),
            'num_sumidouros': len(metricas_dir['sumidouros']),
            'num_intermediarios': grafo_direcionado.number_of_nodes() -
            len(metricas_dir['fontes']) - len(metricas_dir['sumidouros'])
        },
        'fontes': metricas_dir['fontes'][:50],  # Limitar a 50
        'sumidouros': metricas_dir['sumidouros'][:50],
        'comparacao_top_nos': comparacoes[:50],
        'validacao_papeis': {
            'total_inconsistencias': len(validacoes),
            'inconsistencias': validacoes[:20]  # Top 20 inconsistências
        },
        'estatisticas_por_papel': stats_fluxo,
        'top_pagerank': [
            {
                'no': no,
                'pagerank': round(pr, 6),
                'papel': papeis_dict.get(str(no), 'DESCONHECIDO'),
                'in_degree': metricas_dir['in_degree'][no],
                'out_degree': metricas_dir['out_degree'][no]
            }
            for no, pr in sorted(metricas_dir['pagerank'].items(),
                                 key=lambda x: x[1], reverse=True)[:50]
        ]
    }

    # Salvar resultado
    caminho_saida = '../ui/public/analise_direcionada.json'
    with open(caminho_saida, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("RESUMO DA ANÁLISE DIRECIONADA")
    print("=" * 80)
    print("\n📊 Estrutura de Fluxo:")
    print(
        f"   • Fontes (out only): {resultado['estatisticas_gerais']['num_fontes']}")
    print(
        f"   • Sumidouros (in only): {resultado['estatisticas_gerais']['num_sumidouros']}")
    print(
        f"   • Intermediários: {resultado['estatisticas_gerais']['num_intermediarios']}")

    print("\n🔍 Validação de Papéis:")
    print(f"   • Inconsistências: {len(validacoes)}")
    if len(validacoes) > 0:
        print(
            f"   • Taxa de consistência: {(1 - len(validacoes)/grafo_direcionado.number_of_nodes())*100:.1f}%")

    print("\n🏆 Top 3 por PageRank:")
    for i, item in enumerate(resultado['top_pagerank'][:3], 1):
        print(
            f"   {i}. Nó {item['no']} ({item['papel']}): PageRank={item['pagerank']:.6f}")

    print(f"\n✅ Análise salva em '{caminho_saida}'")
    print("=" * 80)


if __name__ == '__main__':
    main()
