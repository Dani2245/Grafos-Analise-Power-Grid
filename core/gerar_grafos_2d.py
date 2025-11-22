# -*- coding: utf-8 -*-
"""
Geração de Visualizações 2D Completa da Rede
Cria grafos interativos com PyVis para múltiplas métricas de criticidade
"""

import json
import csv
import random
import os
import pandas as pd
import networkx as nx
from collections import defaultdict
from pyvis.network import Network
import sys

# Configurar encoding UTF-8 para output no Windows
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except:
        pass


def ajustar_cor_fundo_html(caminho_arquivo):
    """Ajusta a cor de fundo do HTML para #222222 e remove bordas claras"""
    with open(caminho_arquivo, "r", encoding="utf-8") as f:
        conteudo = f.read()

    # Ajustar a cor de fundo do body no HTML
    conteudo = conteudo.replace(
        "<body>", '<body style="background-color: #222222; margin: 0; padding: 0;">'
    )

    # Ajustar a borda do container do grafo
    conteudo = conteudo.replace(
        "border: 1px solid lightgray;", "border: 1px solid #222222;"
    )

    # Ajustar a borda do card
    conteudo = conteudo.replace(
        '<div class="card" style="width: 100%">',
        '<div class="card" style="width: 100%; border: 0px;">',
    )

    with open(caminho_arquivo, "w", encoding="utf-8") as f:
        f.write(conteudo)


def obter_cor_tamanho_por_grau(grau):
    """
    Retorna cor e tamanho do nó baseado no grau (sem categorização fixa)
    Usa gradiente de cores baseado no grau
    """
    if grau == 1:
        return "#00FF00", 8  # Verde, tamanho 8
    elif grau <= 3:
        return "#4169E1", 10  # Azul royal, tamanho 10
    elif grau <= 7:
        return "#FFA500", 15  # Laranja, tamanho 15
    else:
        return "#FF0000", 25  # Vermelho, tamanho 25


def analisar_topologia_rede():
    """Analisa a estrutura da rede e imprime estatísticas"""
    arestas = []
    nos = set()
    contagem_grau = defaultdict(int)

    # Ler o arquivo CSV
    with open("powergrid.edgelist.csv", "r", encoding="utf-8") as arquivo:
        leitor_csv = csv.reader(arquivo)
        for linha in leitor_csv:
            if len(linha) == 2:
                origem = int(linha[0])
                destino = int(linha[1])
                arestas.append((origem, destino))
                nos.add(origem)
                nos.add(destino)
                contagem_grau[origem] += 1
                contagem_grau[destino] += 1

    print("Estatísticas da Rede:")
    print(f"Total de nós: {len(nos)}")
    print(f"Total de arestas: {len(arestas)}")

    # Analisar distribuição de graus
    graus = list(contagem_grau.values())
    grau_medio = sum(graus) / len(graus)
    grau_maximo = max(graus)
    grau_minimo = min(graus)

    print(f"Grau médio: {grau_medio:.2f}")
    print(f"Grau máximo: {grau_maximo}")
    print(f"Grau mínimo: {grau_minimo}")

    # Distribuição de graus
    distribuicao_graus = defaultdict(int)
    for grau in graus:
        distribuicao_graus[grau] += 1

    print("\nDistribuição por Grau:")
    for grau in sorted(distribuicao_graus.keys())[:10]:
        quantidade = distribuicao_graus[grau]
        print(f"  Grau {grau}: {quantidade} nós ({quantidade/len(graus)*100:.1f}%)")

    # Encontrar nós de alto grau (hubs)
    limiar_alto_grau = 8
    hubs = [no for no, grau in contagem_grau.items() if grau >= limiar_alto_grau]
    hubs.sort(key=lambda x: contagem_grau[x], reverse=True)

    print(f"\nNúmero de hubs (grau >= {limiar_alto_grau}): {len(hubs)}")
    print("Top 10 hubs:")
    for i, hub in enumerate(hubs[:10]):
        print(f"  Nó {hub}: grau {contagem_grau[hub]}")

    # NÃO sobrescrever analise_basica.json - ele já existe e contém scale_free_analysis
    # Apenas retornar os dados necessários para geração de grafos
    print("\n✅ Análise topológica concluída (sem sobrescrever analise_basica.json)")

    return arestas, contagem_grau, hubs


# ============================================================================
# FUNÇÕES AUXILIARES REUTILIZÁVEIS
# ============================================================================


def carregar_grafo_original():
    """Carrega o grafo original do dataset powergrid.edgelist.csv"""
    arestas = []
    contagem_grau = defaultdict(int)

    with open("powergrid.edgelist.csv", "r", encoding="utf-8") as arquivo:
        leitor_csv = csv.reader(arquivo)
        for linha in leitor_csv:
            if len(linha) == 2:
                origem, destino = int(linha[0]), int(linha[1])
                arestas.append((origem, destino))
                contagem_grau[origem] += 1
                contagem_grau[destino] += 1

    return arestas, contagem_grau


def construir_grafo_adjacencia(arestas):
    """Constrói dicionário de adjacência a partir de lista de arestas"""
    grafo = defaultdict(set)
    for origem, destino in arestas:
        grafo[origem].add(destino)
        grafo[destino].add(origem)
    return grafo


def obter_vizinhanca_bfs(grafo, no_central, saltos_maximos=2):
    """
    Obtém nós dentro de saltos_maximos a partir do no_central usando BFS

    Args:
        grafo: Dicionário de adjacência
        no_central: Nó central da vizinhança
        saltos_maximos: Número de saltos (hops) a partir do central

    Returns:
        Set com IDs dos nós na vizinhança
    """
    vizinhanca = set([no_central])
    nivel_atual = set([no_central])

    for _ in range(saltos_maximos):
        proximo_nivel = set()
        for no in nivel_atual:
            for vizinho in grafo[no]:
                if vizinho not in vizinhanca:
                    proximo_nivel.add(vizinho)
                    vizinhanca.add(vizinho)
        nivel_atual = proximo_nivel
        if not nivel_atual:
            break

    return vizinhanca


def criar_rede_pyvis_base():
    """Cria uma rede PyVis com configurações padrão"""
    rede = Network(height="600px", width="100%", bgcolor="#222222", font_color="white")
    rede.set_options(
        """
    var options = {
      "physics": {
        "enabled": true,
        "stabilization": {"iterations": 100}
      }
    }
    """
    )
    return rede


def adicionar_nos_arestas_subgrafo(
    rede, vizinhanca, arestas, contagem_grau, no_central=None, tipo_destaque=None
):
    """
    Adicionar nós e arestas de um subgrafo à rede PyVis

    Args:
        rede: Objeto Network do PyVis
        vizinhanca: Set com IDs dos nós
        arestas: Lista de tuplas (origem, destino)
        contagem_grau: Dict com grau de cada nó
        no_central: ID do nó a destacar (opcional)
        tipo_destaque: String descrevendo o tipo de destaque (opcional)
    """
    # Adicionar nós
    for id_no in vizinhanca:
        grau = contagem_grau[id_no]
        cor, tamanho = obter_cor_tamanho_por_grau(grau)

        if id_no == no_central and tipo_destaque:
            rotulo = f"⚡ {tipo_destaque} {id_no}\n(Grau: {grau})"
            rede.add_node(
                id_no,
                label=rotulo,
                color="#FF0000",
                size=30,
                title=f"{tipo_destaque} - Grau: {grau}",
            )
        else:
            rotulo = f"Nó {id_no}\n(Grau: {grau})"
            rede.add_node(
                id_no,
                label=rotulo,
                color=cor,
                size=tamanho,
                title=f"Nó {id_no} - Grau: {grau}",
            )

    # Adicionar arestas
    for origem, destino in arestas:
        if origem in vizinhanca and destino in vizinhanca:
            rede.add_edge(origem, destino)


# ============================================================================
# GERAÇÃO DE GRAFOS POR TIPO DE ANÁLISE
# ============================================================================


def criar_grafos_hubs(arestas, contagem_grau, analise_basica):
    """Cria grafos para top 20 hubs (maior grau)"""
    print("\n" + "=" * 60)
    print("GERANDO GRAFOS: TOP 20 HUBS (MAIOR GRAU)")
    print("=" * 60)

    grafo = construir_grafo_adjacencia(arestas)
    top_hubs = analise_basica["top_hubs"][:20]

    for idx, hub_info in enumerate(top_hubs, 1):
        hub = hub_info["no"]
        grau = hub_info["grau"]

        print(f"[{idx}/20] Hub {hub} (grau {grau})...")

        vizinhanca = obter_vizinhanca_bfs(grafo, hub, saltos_maximos=2)

        if len(vizinhanca) > 200:
            vizinhanca = set(random.sample(list(vizinhanca), 200))
            vizinhanca.add(hub)

        rede = criar_rede_pyvis_base()
        adicionar_nos_arestas_subgrafo(
            rede, vizinhanca, arestas, contagem_grau, hub, "HUB"
        )

        nome_arquivo = f"../ui/public/grafos/hubs/rede_hub_{hub}_grau_{grau}.html"
        rede.save_graph(nome_arquivo)
        ajustar_cor_fundo_html(nome_arquivo)

    print(f"✅ Criados 20 grafos em grafos/hubs/")


def criar_grafos_betweenness(arestas, contagem_grau, analise_criticidade):
    """Cria grafos para top 50 nós com maior betweenness centrality"""
    print("\n" + "=" * 60)
    print("GERANDO GRAFOS: TOP 50 BETWEENNESS CENTRALITY")
    print("=" * 60)

    grafo = construir_grafo_adjacencia(arestas)
    top_50 = analise_criticidade["centralidade_intermediacao"]["top_50"]

    for idx, node_info in enumerate(top_50, 1):
        no = node_info["no"]
        grau = node_info["grau"]
        bc = node_info["betweenness"]

        print(f"[{idx}/50] Nó {no} (grau {grau}, BC {bc:.6f})...")

        vizinhanca = obter_vizinhanca_bfs(grafo, no, saltos_maximos=2)

        if len(vizinhanca) > 200:
            vizinhanca = set(random.sample(list(vizinhanca), 200))
            vizinhanca.add(no)

        rede = criar_rede_pyvis_base()

        for id_no in vizinhanca:
            grau_no = contagem_grau[id_no]
            cor, tamanho = obter_cor_tamanho_por_grau(grau_no)

            if id_no == no:
                rotulo = f"📊 BETWEENNESS {id_no}\n(BC: {bc:.6f}, Grau: {grau_no})"
                rede.add_node(
                    id_no,
                    label=rotulo,
                    color="#FCD34D",
                    size=30,
                    title=f"Betweenness: {bc:.6f} - Grau: {grau_no}",
                )
            else:
                rotulo = f"Nó {id_no}\n(Grau: {grau_no})"
                rede.add_node(
                    id_no,
                    label=rotulo,
                    color=cor,
                    size=tamanho,
                    title=f"Nó {id_no} - Grau: {grau_no}",
                )

        for origem, destino in arestas:
            if origem in vizinhanca and destino in vizinhanca:
                rede.add_edge(origem, destino)

        nome_arquivo = f"../ui/public/grafos/betweenness/rede_betweenness_{no}_grau_{grau}_bc_{bc:.6f}.html"
        rede.save_graph(nome_arquivo)
        ajustar_cor_fundo_html(nome_arquivo)

    print(f"✅ Criados 50 grafos em grafos/betweenness/")


def criar_grafos_articulacao(arestas, contagem_grau, analise_criticidade):
    """Cria grafos para top 100 pontos de articulação mais críticos"""
    print("\n" + "=" * 60)
    print("GERANDO GRAFOS: TOP 100 PONTOS DE ARTICULAÇÃO CRÍTICOS")
    print("=" * 60)

    grafo = construir_grafo_adjacencia(arestas)

    pontos_articulacao = analise_criticidade["pontos_articulacao"]["lista_completa"]
    todos_bc = analise_criticidade["centralidade_intermediacao"]["todos_nos"]

    articulacao_criticos = []
    for no in pontos_articulacao:
        grau = contagem_grau[no]
        bc = todos_bc.get(str(no), 0)

        if grau <= 3:
            risco = "CRITICO"
            prioridade = 1
        elif grau <= 7:
            risco = "ALTO"
            prioridade = 2
        else:
            risco = "MEDIO"
            prioridade = 3

        articulacao_criticos.append(
            {"no": no, "grau": grau, "bc": bc, "risco": risco, "prioridade": prioridade}
        )

    articulacao_criticos.sort(key=lambda x: (x["prioridade"], -x["bc"]))
    top_100 = articulacao_criticos[:100]

    for idx, node_info in enumerate(top_100, 1):
        no = node_info["no"]
        grau = node_info["grau"]
        bc = node_info["bc"]
        risco = node_info["risco"]

        print(f"[{idx}/100] Articulação {no} (grau {grau}, risco {risco})...")

        vizinhanca = obter_vizinhanca_bfs(grafo, no, saltos_maximos=2)

        if len(vizinhanca) > 200:
            vizinhanca = set(random.sample(list(vizinhanca), 200))
            vizinhanca.add(no)

        rede = criar_rede_pyvis_base()

        cor_risco = {"CRITICO": "#FF0000", "ALTO": "#FFA500", "MEDIO": "#FCD34D"}

        for id_no in vizinhanca:
            grau_no = contagem_grau[id_no]
            cor, tamanho = obter_cor_tamanho_por_grau(grau_no)

            if id_no == no:
                rotulo = f"⚠️ ARTICULAÇÃO {id_no}\n(Risco: {risco}, Grau: {grau_no})"
                rede.add_node(
                    id_no,
                    label=rotulo,
                    color=cor_risco[risco],
                    size=30,
                    title=f"Ponto de Articulação - Risco {risco} - Grau: {grau_no} - BC: {bc:.6f}",
                )
            else:
                rotulo = f"Nó {id_no}\n(Grau: {grau_no})"
                rede.add_node(
                    id_no,
                    label=rotulo,
                    color=cor,
                    size=tamanho,
                    title=f"Nó {id_no} - Grau: {grau_no}",
                )

        for origem, destino in arestas:
            if origem in vizinhanca and destino in vizinhanca:
                rede.add_edge(origem, destino)

        nome_arquivo = f"../ui/public/grafos/articulacao/rede_articulacao_{no}_grau_{grau}_risco_{risco}.html"
        rede.save_graph(nome_arquivo)
        ajustar_cor_fundo_html(nome_arquivo)

    print(f"✅ Criados 100 grafos em grafos/articulacao/")


def criar_grafos_percolacao(arestas, contagem_grau, analise_criticidade):
    """Cria grafos para top 10 nós críticos por percolação"""
    print("\n" + "=" * 60)
    print("GERANDO GRAFOS: TOP 10 PERCOLAÇÃO CRÍTICA")
    print("=" * 60)

    if "analise_percolacao" not in analise_criticidade:
        print("⚠️ Análise de percolação não disponível. Pulando...")
        return

    grafo = construir_grafo_adjacencia(arestas)
    resultados = analise_criticidade["analise_percolacao"]["resultados"]

    resultados_sorted = sorted(
        resultados, key=lambda x: x["fragmentacao_percentual"], reverse=True
    )
    top_10 = resultados_sorted[:10]

    for idx, node_info in enumerate(top_10, 1):
        no = node_info["no_removido"]
        grau = node_info["grau_no"]
        frag = node_info["fragmentacao_percentual"]

        print(f"[{idx}/10] Percolação {no} (grau {grau}, frag {frag:.2f}%)...")

        vizinhanca = obter_vizinhanca_bfs(grafo, no, saltos_maximos=2)

        if len(vizinhanca) > 200:
            vizinhanca = set(random.sample(list(vizinhanca), 200))
            vizinhanca.add(no)

        rede = criar_rede_pyvis_base()

        for id_no in vizinhanca:
            grau_no = contagem_grau[id_no]
            cor, tamanho = obter_cor_tamanho_por_grau(grau_no)

            if id_no == no:
                rotulo = f"🔗 PERCOLAÇÃO {id_no}\n(Frag: {frag:.2f}%, Grau: {grau_no})"
                rede.add_node(
                    id_no,
                    label=rotulo,
                    color="#9333EA",
                    size=30,
                    title=f"Percolação: {frag:.2f}% fragmentação - Grau: {grau_no}",
                )
            else:
                rotulo = f"Nó {id_no}\n(Grau: {grau_no})"
                rede.add_node(
                    id_no,
                    label=rotulo,
                    color=cor,
                    size=tamanho,
                    title=f"Nó {id_no} - Grau: {grau_no}",
                )

        for origem, destino in arestas:
            if origem in vizinhanca and destino in vizinhanca:
                rede.add_edge(origem, destino)

        nome_arquivo = f"../ui/public/grafos/percolacao/rede_percolacao_{no}_grau_{grau}_frag_{frag:.2f}.html"
        rede.save_graph(nome_arquivo)
        ajustar_cor_fundo_html(nome_arquivo)

    print(f"✅ Criados {len(top_10)} grafos em grafos/percolacao/")


def criar_grafos_nivel1(arestas, contagem_grau, analise_criticidade):
    """Cria grafos para nós de Nível 1 (4 dimensões de criticidade)"""
    print("\n" + "=" * 60)
    print("GERANDO GRAFOS: NÍVEL 1 CRÍTICO MÁXIMO (4D)")
    print("=" * 60)

    if "classificacao_criticidade" not in analise_criticidade:
        print("⚠️ Classificação de criticidade não disponível. Pulando...")
        return

    grafo = construir_grafo_adjacencia(arestas)
    nivel1_info = analise_criticidade["classificacao_criticidade"][
        "nivel_1_critico_maximo_4d"
    ]
    nos_nivel1 = nivel1_info["nos"]

    for idx, node_info in enumerate(nos_nivel1, 1):
        no = node_info["no"]
        grau = node_info["grau"]
        bc = node_info["betweenness"]

        print(f"[{idx}/{len(nos_nivel1)}] Nível 1 {no} (grau {grau}, 4D)...")

        vizinhanca = obter_vizinhanca_bfs(grafo, no, saltos_maximos=2)

        if len(vizinhanca) > 200:
            vizinhanca = set(random.sample(list(vizinhanca), 200))
            vizinhanca.add(no)

        rede = criar_rede_pyvis_base()

        for id_no in vizinhanca:
            grau_no = contagem_grau[id_no]
            cor, tamanho = obter_cor_tamanho_por_grau(grau_no)

            if id_no == no:
                rotulo = f"🔴 NÍVEL 1 (4D) {id_no}\n(Grau: {grau_no}, BC: {bc:.6f})"
                rede.add_node(
                    id_no,
                    label=rotulo,
                    color="#DC2626",
                    size=35,
                    title=f"NÍVEL 1 - 4D: Articulação + Alto Grau + Alta BC + Alta Percolação - Grau: {grau_no}",
                )
            else:
                rotulo = f"Nó {id_no}\n(Grau: {grau_no})"
                rede.add_node(
                    id_no,
                    label=rotulo,
                    color=cor,
                    size=tamanho,
                    title=f"Nó {id_no} - Grau: {grau_no}",
                )

        for origem, destino in arestas:
            if origem in vizinhanca and destino in vizinhanca:
                rede.add_edge(origem, destino)

        nome_arquivo = (
            f"../ui/public/grafos/nivel1/rede_nivel1_{no}_grau_{grau}_4d.html"
        )
        rede.save_graph(nome_arquivo)
        ajustar_cor_fundo_html(nome_arquivo)

    print(f"✅ Criados {len(nos_nivel1)} grafos em grafos/nivel1/")


def criar_grafos_novo_dataset():
    """Cria grafos para o novo dataset (temporal, direcionado, ponderado)"""
    print("\n" + "=" * 60)
    print("GERANDO GRAFOS: NOVO DATASET (10 NÓS - DIRECIONADO)")
    print("=" * 60)

    if not os.path.exists("power_grid_dataset.csv"):
        print("⚠️ Arquivo power_grid_dataset.csv não encontrado. Pulando...")
        return

    df = pd.read_csv("power_grid_dataset.csv")

    fluxos_medios = {}
    for i in range(1, 11):
        for j in range(1, 11):
            if i != j:
                col_name = f"power_flow_{i}_to_{j}"
                if col_name in df.columns:
                    fluxo_medio = df[col_name].mean()
                    if fluxo_medio > 0:
                        fluxos_medios[(i, j)] = fluxo_medio

    cargas_medias = {}
    for i in range(1, 11):
        col_name = f"load_node_{i}"
        if col_name in df.columns:
            cargas_medias[i] = df[col_name].mean()

    print("\nCriando grafo completo com todos os 10 nós...")

    G = nx.DiGraph()

    for i in range(1, 11):
        G.add_node(i, carga_media=cargas_medias.get(i, 0))

    for (origem, destino), fluxo in fluxos_medios.items():
        G.add_edge(origem, destino, weight=fluxo)

    pagerank = nx.pagerank(G, weight="weight")

    rede = Network(
        height="700px",
        width="100%",
        bgcolor="#222222",
        font_color="white",
        directed=True,
    )
    rede.set_options(
        """
    var options = {
      "physics": {
        "enabled": true,
        "solver": "forceAtlas2Based",
        "forceAtlas2Based": {
          "gravitationalConstant": -50,
          "centralGravity": 0.01,
          "springLength": 200,
          "springConstant": 0.08
        },
        "stabilization": {"iterations": 200}
      },
      "edges": {
        "arrows": {
          "to": {"enabled": true, "scaleFactor": 0.5}
        },
        "smooth": {"type": "continuous"}
      }
    }
    """
    )

    pr_min = min(pagerank.values())
    pr_max = max(pagerank.values())

    for no in range(1, 11):
        pr = pagerank[no]
        if pr_max > pr_min:
            tamanho = 15 + 25 * (pr - pr_min) / (pr_max - pr_min)
        else:
            tamanho = 25

        if pr > (pr_min + 0.7 * (pr_max - pr_min)):
            cor = "#EF4444"
        elif pr > (pr_min + 0.4 * (pr_max - pr_min)):
            cor = "#F59E0B"
        else:
            cor = "#3B82F6"

        carga = cargas_medias.get(no, 0)
        rotulo = f"Nó {no}\n(PageRank: {pr:.3f})\n(Carga: {carga:.1f} MW)"

        rede.add_node(
            no,
            label=rotulo,
            color=cor,
            size=tamanho,
            title=f"Nó {no} - PageRank: {pr:.4f} - Carga Média: {carga:.2f} MW",
        )

    fluxo_min = min(fluxos_medios.values()) if fluxos_medios else 0
    fluxo_max = max(fluxos_medios.values()) if fluxos_medios else 1

    for (origem, destino), fluxo in fluxos_medios.items():
        if fluxo_max > fluxo_min:
            largura = 1 + 4 * (fluxo - fluxo_min) / (fluxo_max - fluxo_min)
        else:
            largura = 2

        rede.add_edge(
            origem, destino, width=largura, title=f"Fluxo médio: {fluxo:.2f} MW"
        )

    nome_arquivo = f"../ui/public/grafos/novo_dataset/rede_novo_dataset_completo.html"
    rede.save_graph(nome_arquivo)
    ajustar_cor_fundo_html(nome_arquivo)
    print(f"✅ Criado grafo completo: {nome_arquivo}")

    print("\nCriando grafos individuais (1-hop) para cada nó...")

    for no_central in range(1, 11):
        print(f"  [{no_central}/10] Grafo 1-hop do nó {no_central}...")

        # Obter predecessores e sucessores diretos (1-hop)
        vizinhanca = set([no_central])
        predecessores = set(G.predecessors(no_central))
        sucessores = set(G.successors(no_central))
        vizinhanca.update(predecessores)
        vizinhanca.update(sucessores)

        rede_individual = Network(
            height="600px",
            width="100%",
            bgcolor="#222222",
            font_color="white",
            directed=True,
        )
        rede_individual.set_options(
            """
        var options = {
          "physics": {
            "enabled": true,
            "solver": "forceAtlas2Based",
            "stabilization": {"iterations": 150}
          },
          "edges": {
            "arrows": {
              "to": {"enabled": true, "scaleFactor": 0.6}
            }
          }
        }
        """
        )

        for no in vizinhanca:
            pr = pagerank[no]
            carga = cargas_medias.get(no, 0)

            if no == no_central:
                cor = "#FCD34D"
                tamanho = 35
                rotulo = f"🎯 NÓ {no}\n(PageRank: {pr:.3f})\n(Carga: {carga:.1f} MW)"
            else:
                if pr > (pr_min + 0.7 * (pr_max - pr_min)):
                    cor = "#EF4444"
                elif pr > (pr_min + 0.4 * (pr_max - pr_min)):
                    cor = "#F59E0B"
                else:
                    cor = "#3B82F6"

                tamanho = 20
                rotulo = f"Nó {no}\n(PR: {pr:.3f})\n({carga:.1f} MW)"

            rede_individual.add_node(
                no,
                label=rotulo,
                color=cor,
                size=tamanho,
                title=f"Nó {no} - PageRank: {pr:.4f} - Carga: {carga:.2f} MW",
            )

        # APENAS ARESTAS CONECTADAS AO NÓ CENTRAL
        # Adicionar arestas de predecessores → nó central
        for origem in predecessores:
            if (origem, no_central) in fluxos_medios:
                fluxo = fluxos_medios[(origem, no_central)]
                if fluxo_max > fluxo_min:
                    largura = 1 + 4 * (fluxo - fluxo_min) / (fluxo_max - fluxo_min)
                else:
                    largura = 2
                rede_individual.add_edge(
                    origem, no_central, width=largura, title=f"Fluxo: {fluxo:.2f} MW"
                )

        # Adicionar arestas de nó central → sucessores
        for destino in sucessores:
            if (no_central, destino) in fluxos_medios:
                fluxo = fluxos_medios[(no_central, destino)]
                if fluxo_max > fluxo_min:
                    largura = 1 + 4 * (fluxo - fluxo_min) / (fluxo_max - fluxo_min)
                else:
                    largura = 2
                rede_individual.add_edge(
                    no_central, destino, width=largura, title=f"Fluxo: {fluxo:.2f} MW"
                )

        nome_arquivo_individual = (
            f"../ui/public/grafos/novo_dataset/rede_novo_dataset_node_{no_central}.html"
        )
        rede_individual.save_graph(nome_arquivo_individual)
        ajustar_cor_fundo_html(nome_arquivo_individual)

    print(f"✅ Criados 11 grafos (1 completo + 10 individuais) em grafos/novo_dataset/")


def criar_grafos_comunidades():
    """Cria grafos para as 10 maiores comunidades"""
    print("\n" + "=" * 60)
    print("GERANDO GRAFOS: TOP 10 MAIORES COMUNIDADES")
    print("=" * 60)

    print("\nCarregando analise_comunidades.json...")
    try:
        with open("../ui/public/analise_comunidades.json", "r", encoding="utf-8") as f:
            analise_comunidades = json.load(f)
    except FileNotFoundError:
        print(
            "⚠️ analise_comunidades.json não encontrado. Execute gerar_analise_comunidades.py primeiro."
        )
        return

    arestas, contagem_grau = carregar_grafo_original()
    grafo = construir_grafo_adjacencia(arestas)

    comunidades = analise_comunidades["comunidades"][:10]

    for idx, comunidade in enumerate(comunidades, 1):
        com_id = comunidade["id"]
        tamanho = comunidade["tamanho"]
        densidade = comunidade["densidade"]
        nos_comunidade = set(comunidade["nos"])

        print(
            f"[{idx}/10] Comunidade {com_id} ({tamanho} nós, densidade {densidade:.4f})..."
        )

        # Limitar a 300 nós se a comunidade for muito grande
        if len(nos_comunidade) > 300:
            nos_comunidade = set(random.sample(list(nos_comunidade), 300))
            print(f"    (limitado a 300 nós para visualização)")

        rede = criar_rede_pyvis_base()

        # Identificar hub principal (nó com maior grau dentro da comunidade)
        hub_principal = max(nos_comunidade, key=lambda n: contagem_grau[n])
        grau_hub = contagem_grau[hub_principal]

        # Adicionar nós
        for id_no in nos_comunidade:
            grau = contagem_grau[id_no]
            cor, tamanho_no = obter_cor_tamanho_por_grau(grau)

            if id_no == hub_principal:
                rotulo = f"🌟 HUB {id_no}\n(Grau: {grau})"
                rede.add_node(
                    id_no,
                    label=rotulo,
                    color="#10B981",  # Verde
                    size=30,
                    title=f"Hub da Comunidade {com_id} - Grau: {grau}",
                )
            else:
                rotulo = f"Nó {id_no}\n(Grau: {grau})"
                rede.add_node(
                    id_no,
                    label=rotulo,
                    color=cor,
                    size=tamanho_no,
                    title=f"Nó {id_no} - Grau: {grau}",
                )

        # Adicionar arestas internas da comunidade
        arestas_internas = 0
        for origem, destino in arestas:
            if origem in nos_comunidade and destino in nos_comunidade:
                rede.add_edge(origem, destino)
                arestas_internas += 1

        nome_arquivo = f"../ui/public/grafos/comunidades/rede_comunidade_{com_id}_tamanho_{tamanho}_densidade_{densidade:.4f}.html"
        rede.save_graph(nome_arquivo)
        ajustar_cor_fundo_html(nome_arquivo)

        print(f"    ✓ {arestas_internas} arestas internas")

    print(f"✅ Criados 10 grafos em grafos/comunidades/")


# ============================================================================
# FUNÇÃO PRINCIPAL
# ============================================================================


def main():
    """Função principal - executa todas as gerações de grafos"""
    print("\n" + "=" * 60)
    print("GERAÇÃO COMPLETA DE VISUALIZAÇÕES 2D DA REDE")
    print("=" * 60)
    print("\nTotal estimado: ~208 arquivos HTML")
    print("Tempo estimado: 15-20 minutos\n")

    arestas, contagem_grau = carregar_grafo_original()

    # Realizar análise topológica interna (NÃO sobrescreve analise_basica.json)
    print("\nAnalisando topologia da rede...")
    arestas_temp, contagem_grau_temp, hubs_temp = analisar_topologia_rede()

    # Carregar analise_basica.json (gerado por gerar_analise_base.py com scale_free_analysis)
    print("\nCarregando analise_basica.json...")
    with open("../ui/public/analise_basica.json", "r", encoding="utf-8") as f:
        analise_basica = json.load(f)

    print("\nCarregando analise_criticidade.json...")
    try:
        with open("../ui/public/analise_criticidade.json", "r", encoding="utf-8") as f:
            analise_criticidade = json.load(f)
        print("✅ Análise de criticidade carregada")
    except FileNotFoundError:
        print(
            "⚠️ analise_criticidade.json não encontrado. Execute gerar_analise_avancada.py primeiro."
        )
        analise_criticidade = None

    criar_grafos_hubs(arestas, contagem_grau, analise_basica)

    if analise_criticidade:
        criar_grafos_betweenness(arestas, contagem_grau, analise_criticidade)
        criar_grafos_articulacao(arestas, contagem_grau, analise_criticidade)
        criar_grafos_percolacao(arestas, contagem_grau, analise_criticidade)
        criar_grafos_nivel1(arestas, contagem_grau, analise_criticidade)

    criar_grafos_novo_dataset()

    criar_grafos_comunidades()

    print("\n" + "=" * 60)
    print("✅ GERAÇÃO COMPLETA DE GRAFOS FINALIZADA")
    print("=" * 60)
    print("\nResumo:")
    print("  - 20 grafos de hubs (maior grau)")
    print("  - 50 grafos de betweenness centrality")
    print("  - 100 grafos de pontos de articulação")
    print("  - 10 grafos de percolação crítica")
    print("  - ~17 grafos de nível 1 (4D)")
    print("  - 11 grafos do novo dataset (1 completo + 10 individuais)")
    print("  - 10 grafos das maiores comunidades")
    print("\nTodos os arquivos em: ../ui/public/grafos/")


if __name__ == "__main__":
    main()
