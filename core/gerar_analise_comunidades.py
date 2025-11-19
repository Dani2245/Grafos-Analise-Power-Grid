import networkx as nx
import csv
import json
from collections import defaultdict


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


def detectar_comunidades(grafo):
    """
    Detecta comunidades usando algoritmo Greedy Modularity

    Encontra grupos de nós densamente conectados entre si,
    mas esparsamente conectados com outros grupos.
    """
    print("   Detectando comunidades com algoritmo Greedy Modularity...")

    # Detectar comunidades
    comunidades = nx.community.greedy_modularity_communities(grafo)
    comunidades_list = [list(c) for c in comunidades]

    # Calcular modularidade
    modularidade = nx.community.modularity(grafo, comunidades)

    print(f"   ✅ Encontradas {len(comunidades_list)} comunidades")
    print(f"   ✅ Modularidade: {modularidade:.4f}")

    return comunidades_list, modularidade


def analisar_comunidades(grafo, comunidades):
    """Analisa propriedades detalhadas de cada comunidade"""
    print("   Analisando propriedades de cada comunidade...")

    analise_comunidades = []

    for idx, comunidade in enumerate(comunidades):
        # Criar subgrafo da comunidade
        subgrafo = grafo.subgraph(comunidade)

        # Calcular métricas
        tamanho = len(comunidade)
        densidade = nx.density(subgrafo)

        # Grau médio dentro da comunidade
        graus = dict(subgrafo.degree())
        grau_medio = sum(graus.values()) / len(graus) if graus else 0

        # Identificar hubs da comunidade (top 5 por grau)
        nos_ordenados = sorted(
            comunidade, key=lambda x: grafo.degree(x), reverse=True)
        top_hubs = [
            {"no": no, "grau": grafo.degree(no)}
            for no in nos_ordenados[:min(5, len(nos_ordenados))]
        ]

        # Identificar pontos de articulação dentro da comunidade
        try:
            pontos_articulacao_internos = list(
                nx.articulation_points(subgrafo))
        except nx.NetworkXError:
            pontos_articulacao_internos = []

        # Identificar nós de borda (conectados a outras comunidades)
        nos_borda = []
        for no in comunidade:
            vizinhos = set(grafo.neighbors(no))
            if not vizinhos.issubset(set(comunidade)):
                nos_borda.append(no)

        analise_comunidades.append({
            "id": idx,
            "tamanho": tamanho,
            "percentual_rede": round(tamanho / grafo.number_of_nodes() * 100, 2),
            "densidade": round(densidade, 4),
            "grau_medio": round(grau_medio, 2),
            "nos": sorted(comunidade),
            "top_hubs": top_hubs,
            "pontos_articulacao_internos": len(pontos_articulacao_internos),
            "nos_borda": len(nos_borda),
            "coesao": round(densidade * tamanho, 2)  # Métrica combinada
        })

    # Ordenar por tamanho (maior primeiro)
    analise_comunidades.sort(key=lambda x: x['tamanho'], reverse=True)

    return analise_comunidades


def analisar_conexoes_intercomunidades(grafo, comunidades):
    """Analisa as conexões entre diferentes comunidades"""
    print("   Analisando conexões entre comunidades...")

    # Criar mapeamento: nó -> índice da comunidade
    no_para_comunidade = {}
    for idx, comunidade in enumerate(comunidades):
        for no in comunidade:
            no_para_comunidade[no] = idx

    # Contar arestas entre comunidades
    conexoes = defaultdict(int)
    pontes = []

    for origem, destino in grafo.edges():
        com_origem = no_para_comunidade[origem]
        com_destino = no_para_comunidade[destino]

        if com_origem != com_destino:
            # Aresta entre comunidades diferentes
            par = tuple(sorted([com_origem, com_destino]))
            conexoes[par] += 1
            pontes.append({
                "no_origem": origem,
                "no_destino": destino,
                "comunidade_origem": com_origem,
                "comunidade_destino": com_destino
            })

    # Converter para lista
    conexoes_lista = [
        {
            "comunidade_origem": par[0],
            "comunidade_destino": par[1],
            "num_arestas": count,
            "forca_conexao": round(count / grafo.number_of_edges() * 100, 2)
        }
        for par, count in sorted(conexoes.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "total_conexoes": len(conexoes),
        "total_arestas_intercomunidades": sum(conexoes.values()),
        "percentual_arestas_intercomunidades": round(
            sum(conexoes.values()) / grafo.number_of_edges() * 100, 2
        ),
        "conexoes": conexoes_lista[:20],  # Top 20 conexões
        "pontes_criticas": pontes[:50]  # Primeiras 50 pontes
    }


def identificar_grupos_consumidores(grafo, comunidades):
    """Identifica e analisa grupos de consumidores (nós terminais)"""
    print("   Identificando grupos de consumidores...")

    # Identificar todos os consumidores (grau = 1)
    consumidores = [n for n in grafo.nodes() if grafo.degree(n) == 1]

    # Mapear consumidores para comunidades
    grupos_consumidores = []

    for idx, comunidade in enumerate(comunidades):
        consumidores_na_comunidade = [
            n for n in comunidade if n in consumidores]

        if consumidores_na_comunidade:
            # Identificar o hub principal (maior grau)
            hub_principal = max(comunidade, key=lambda x: grafo.degree(x))

            # Calcular distância média dos consumidores ao hub
            distancias = []
            for consumidor in consumidores_na_comunidade:
                try:
                    dist = nx.shortest_path_length(
                        grafo, consumidor, hub_principal)
                    distancias.append(dist)
                except nx.NetworkXNoPath:
                    pass

            distancia_media = sum(distancias) / \
                len(distancias) if distancias else 0

            grupos_consumidores.append({
                "comunidade_id": idx,
                "tamanho_comunidade": len(comunidade),
                "num_consumidores": len(consumidores_na_comunidade),
                "percentual_consumidores": round(
                    len(consumidores_na_comunidade) / len(comunidade) * 100, 2
                ),
                # Limitar a 100
                "consumidores": sorted(consumidores_na_comunidade)[:100],
                "hub_principal": hub_principal,
                "grau_hub_principal": grafo.degree(hub_principal),
                "distancia_media_ao_hub": round(distancia_media, 2)
            })

    return {
        "total_consumidores": len(consumidores),
        "percentual_rede": round(len(consumidores) / grafo.number_of_nodes() * 100, 2),
        "grupos": grupos_consumidores
    }


def gerar_analise_json(comunidades, modularidade, analise_comunidades,
                       conexoes_intercomunidades, grupos_consumidores):
    """Gera arquivo JSON com todas as informações de comunidades"""

    dados = {
        "estatisticas_gerais": {
            "num_comunidades": len(comunidades),
            "modularidade": round(modularidade, 4),
            "interpretacao_modularidade": (
                "ALTA (>0.7) - Comunidades muito bem definidas" if modularidade > 0.7
                else "MÉDIA (0.4-0.7) - Comunidades razoavelmente definidas" if modularidade > 0.4
                else "BAIXA (<0.4) - Estrutura comunitária fraca"
            ),
            "tamanho_medio_comunidade": round(
                sum(c['tamanho'] for c in analise_comunidades) /
                len(analise_comunidades), 1
            ),
            "maior_comunidade": max(analise_comunidades, key=lambda x: x['tamanho'])['tamanho'],
            "menor_comunidade": min(analise_comunidades, key=lambda x: x['tamanho'])['tamanho']
        },
        "comunidades": analise_comunidades,
        "conexoes_intercomunidades": conexoes_intercomunidades,
        "grupos_consumidores": grupos_consumidores
    }

    return dados


def main():
    print("=" * 80)
    print("ANÁLISE DE COMUNIDADES DA REDE ELÉTRICA")
    print("=" * 80)

    print("\n[1/6] Carregando rede elétrica...")
    grafo = carregar_rede()
    print(
        f"   ✅ Rede carregada: {grafo.number_of_nodes()} nós, {grafo.number_of_edges()} arestas")

    print("\n[2/6] Detectando comunidades (Greedy Modularity)...")
    comunidades, modularidade = detectar_comunidades(grafo)

    print("\n[3/6] Analisando propriedades de cada comunidade...")
    analise_comunidades = analisar_comunidades(grafo, comunidades)

    print("\n[4/6] Analisando conexões entre comunidades...")
    conexoes_intercomunidades = analisar_conexoes_intercomunidades(
        grafo, comunidades)

    print("\n[5/6] Identificando grupos de consumidores...")
    grupos_consumidores = identificar_grupos_consumidores(grafo, comunidades)

    print("\n[6/6] Gerando análise de comunidades e exportando para JSON...")
    dados = gerar_analise_json(
        comunidades, modularidade, analise_comunidades,
        conexoes_intercomunidades, grupos_consumidores
    )

    with open('../ui/public/analise_comunidades.json', 'w', encoding='utf-8') as f:
        json.dump(dados, f, indent=2, ensure_ascii=False)

    print("   ✅ Arquivo '../ui/public/analise_comunidades.json' gerado com sucesso!")

    print("\n" + "=" * 80)
    print("RESUMO DA ANÁLISE DE COMUNIDADES")
    print("=" * 80)

    print("\n📊 Estrutura Comunitária:")
    print(
        f"   • Número de comunidades: {dados['estatisticas_gerais']['num_comunidades']}")
    print(f"   • Modularidade: {dados['estatisticas_gerais']['modularidade']}")
    print(
        f"   • Interpretação: {dados['estatisticas_gerais']['interpretacao_modularidade']}")

    print("\n🏘️ Tamanho das Comunidades:")
    print(
        f"   • Tamanho médio: {dados['estatisticas_gerais']['tamanho_medio_comunidade']:.1f} nós")
    print(
        f"   • Maior comunidade: {dados['estatisticas_gerais']['maior_comunidade']} nós")
    print(
        f"   • Menor comunidade: {dados['estatisticas_gerais']['menor_comunidade']} nós")

    print("\n🔗 Conexões entre Comunidades:")
    print(
        f"   • Total de conexões: {dados['conexoes_intercomunidades']['total_conexoes']} pares")
    print(
        f"   • Arestas intercomunidades: {dados['conexoes_intercomunidades']['total_arestas_intercomunidades']}")
    print(
        f"   • Percentual: {dados['conexoes_intercomunidades']['percentual_arestas_intercomunidades']}%")

    print("\n👥 Grupos de Consumidores:")
    print(
        f"   • Total de consumidores: {dados['grupos_consumidores']['total_consumidores']}")
    print(
        f"   • Percentual da rede: {dados['grupos_consumidores']['percentual_rede']}%")
    print(
        f"   • Distribuídos em: {len(dados['grupos_consumidores']['grupos'])} comunidades")

    print("\n📋 Top 5 Maiores Comunidades:")
    for i, comunidade in enumerate(analise_comunidades[:5], 1):
        print(f"   {i}. Comunidade {comunidade['id']}: {comunidade['tamanho']} nós "
              f"({comunidade['percentual_rede']}%) - "
              f"Densidade: {comunidade['densidade']:.4f}")

    print("\n" + "=" * 80)
    print("✅ ANÁLISE COMPLETA")
    print("=" * 80)


if __name__ == '__main__':
    main()
