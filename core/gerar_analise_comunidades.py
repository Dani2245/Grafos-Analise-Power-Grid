# -*- coding: utf-8 -*-
import networkx as nx
import csv
import json
import sys

# Configurar encoding UTF-8 para output no Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass
import sys
import os
import numpy as np
from collections import defaultdict


def carregar_rede():
    """Carrega a rede elétrica do arquivo CSV"""
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


def inferir_localizacao_espacial(grafo, comunidades):
    """
    Infere localização espacial aproximada das comunidades usando spring layout.

    *** IMPORTANTE: LIMITAÇÃO METODOLÓGICA ***
    O dataset NÃO possui coordenadas geográficas reais.
    O Spring Layout é um algoritmo de VISUALIZAÇÃO baseado em forças físicas simuladas,
    NÃO representa posições geográficas reais.

    Responde à pergunta do professor: "Onde estão localizados os grupos consumidores?"

    INTERPRETAÇÃO CORRETA:
    - Nós próximos no layout = Fortemente conectados topologicamente
    - Nós distantes no layout = Fracamente conectados
    - Proximidade indica CONECTIVIDADE da rede, não LOCALIZAÇÃO física

    Nota: Usamos inferência topológica baseada em conectividade da rede.
    """
    print("   Inferindo localização espacial das comunidades...")

    # Criar mapeamento: nó -> comunidade
    no_para_comunidade = {}
    for idx, comunidade in enumerate(comunidades):
        for no in comunidade:
            no_para_comunidade[no] = idx

    # Calcular layout spring (força-direcionado) para posicionar nós
    # Nós conectados ficam próximos, comunidades separadas ficam distantes
    print("      Calculando spring layout (pode demorar para grafos grandes)...")

    # Usar amostragem se grafo for muito grande (>1000 nós)
    if len(grafo.nodes()) > 1000:
        # Amostrar 500 nós representativos (hubs + amostra aleatória)
        graus = dict(grafo.degree())
        top_hubs = sorted(
            graus.items(), key=lambda x: x[1], reverse=True)[:200]
        hub_nodes = [n for n, _ in top_hubs]

        outros_nos = list(set(grafo.nodes()) - set(hub_nodes))
        amostra_outros = list(np.random.choice(
            outros_nos, min(300, len(outros_nos)), replace=False))

        nos_amostrados = hub_nodes + amostra_outros
        subgrafo = grafo.subgraph(nos_amostrados)

        pos = nx.spring_layout(subgrafo, k=0.5, iterations=50, seed=42)
        print(
            f"      ✓ Layout calculado para {len(nos_amostrados)} nós (amostra)")
    else:
        pos = nx.spring_layout(grafo, k=0.5, iterations=50, seed=42)
        print(f"      ✓ Layout calculado para {len(grafo.nodes())} nós")

    # Calcular centroide de cada comunidade (posição média dos nós)
    centroides_comunidades = []

    for idx, comunidade in enumerate(comunidades):
        # Filtrar apenas nós que têm posição (podem estar na amostra)
        nos_com_pos = [n for n in comunidade if n in pos]

        if nos_com_pos:
            # Calcular centroide
            coords = np.array([pos[n] for n in nos_com_pos])
            centroide_x = float(np.mean(coords[:, 0]))
            centroide_y = float(np.mean(coords[:, 1]))

            # Calcular raio (distância média dos nós ao centroide)
            distancias = [np.sqrt((pos[n][0] - centroide_x)**2 + (pos[n][1] - centroide_y)**2)
                          for n in nos_com_pos]
            raio_medio = float(np.mean(distancias))

            centroides_comunidades.append({
                "comunidade_id": idx,
                "centroide_x": round(centroide_x, 4),
                "centroide_y": round(centroide_y, 4),
                "raio_medio": round(raio_medio, 4),
                "nos_mapeados": len(nos_com_pos)
            })
        else:
            # Comunidade não tem nós na amostra
            centroides_comunidades.append({
                "comunidade_id": idx,
                "centroide_x": None,
                "centroide_y": None,
                "raio_medio": None,
                "nos_mapeados": 0
            })

    # Calcular distâncias entre centroides (proximidade entre comunidades)
    distancias_intercomunidades = []
    for i in range(len(centroides_comunidades)):
        for j in range(i + 1, len(centroides_comunidades)):
            c1 = centroides_comunidades[i]
            c2 = centroides_comunidades[j]

            if c1['centroide_x'] is not None and c2['centroide_x'] is not None:
                dist = np.sqrt((c1['centroide_x'] - c2['centroide_x'])**2 +
                               (c1['centroide_y'] - c2['centroide_y'])**2)

                distancias_intercomunidades.append({
                    "comunidade_1": i,
                    "comunidade_2": j,
                    "distancia_espacial": round(float(dist), 4)
                })

    # Ordenar por distância (mais próximas primeiro)
    distancias_intercomunidades.sort(key=lambda x: x['distancia_espacial'])

    # Identificar clusters espaciais (comunidades próximas geograficamente)
    # Threshold: distância < 0.3 (ajustar conforme necessário)
    clusters_espaciais = []
    threshold_proximidade = 0.3

    for dist_info in distancias_intercomunidades[:20]:  # Top 20 pares próximos
        if dist_info['distancia_espacial'] < threshold_proximidade:
            clusters_espaciais.append(dist_info)

    return {
        "metodo": "spring_layout_inferencia_topologica",
        "disclaimer": "IMPORTANTE: Posições baseadas em layout de força (spring layout) para visualização topológica. NÃO representam coordenadas geográficas reais. Proximidade indica conectividade da rede, não localização física.",
        "centroides_comunidades": centroides_comunidades,
        # Top 30
        "distancias_intercomunidades": distancias_intercomunidades[:30],
        "clusters_espaciais_proximos": clusters_espaciais,
        "interpretacao": (
            f"Detectados {len(clusters_espaciais)} pares de comunidades espacialmente próximas "
            f"(distância < {threshold_proximidade}). Comunidades próximas compartilham infraestrutura local."
        )
    }


def gerar_analise_json(comunidades, modularidade, analise_comunidades,
                       conexoes_intercomunidades, grupos_consumidores, localizacao_espacial):
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
        "grupos_consumidores": grupos_consumidores,
        "localizacao_espacial": localizacao_espacial
    }

    return dados


def main():
    print("=" * 80)
    print("ANÁLISE DE COMUNIDADES DA REDE ELÉTRICA")
    print("=" * 80)

    print("\n[1/7] Carregando rede elétrica...")
    grafo = carregar_rede()
    print(
        f"   ✅ Rede carregada: {grafo.number_of_nodes()} nós, {grafo.number_of_edges()} arestas")

    print("\n[2/7] Detectando comunidades (Greedy Modularity)...")
    comunidades, modularidade = detectar_comunidades(grafo)

    print("\n[3/7] Analisando propriedades de cada comunidade...")
    analise_comunidades = analisar_comunidades(grafo, comunidades)

    print("\n[4/7] Analisando conexões entre comunidades...")
    conexoes_intercomunidades = analisar_conexoes_intercomunidades(
        grafo, comunidades)

    print("\n[5/7] Identificando grupos de consumidores...")
    grupos_consumidores = identificar_grupos_consumidores(grafo, comunidades)

    print("\n[6/7] Inferindo localização espacial das comunidades...")
    localizacao_espacial = inferir_localizacao_espacial(grafo, comunidades)

    print("\n[7/7] Gerando análise de comunidades e exportando para JSON...")
    dados = gerar_analise_json(
        comunidades, modularidade, analise_comunidades,
        conexoes_intercomunidades, grupos_consumidores, localizacao_espacial
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

    print("\n📍 Localização Espacial (Inferência Topológica):")
    print(f"   • {dados['localizacao_espacial']['interpretacao']}")
    print(
        f"   • Clusters espaciais identificados: {len(dados['localizacao_espacial']['clusters_espaciais_proximos'])}")

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
