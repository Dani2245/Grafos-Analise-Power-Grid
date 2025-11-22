# -*- coding: utf-8 -*-
"""
Análise de Simulação de Ataques à Rede Elétrica
Compara impacto de ataques aleatórios vs direcionados (targeted)
Mede fragmentação progressiva da rede
"""
from typing import List, Dict

import csv
import json
import networkx as nx
import random
import sys
import os
from tqdm import tqdm

# Configurar encoding UTF-8 para output no Windows
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except BaseException:
        pass


def carregar_dados_precalculados():
    """
    Carrega pontos de articulação pré-calculados do JSON
    Economia: ~1 minuto de recalculação
    """
    try:
        caminho_json = os.path.join("..", "ui", "public", "analise_criticidade.json")
        with open(caminho_json, "r", encoding="utf-8") as f:
            dados = json.load(f)
            pontos_articulacao = set(dados.get("pontos_articulacao", []))
            print(
                f"   ✓ {
                    len(pontos_articulacao)} pontos de articulação carregados do JSON"
            )
            return pontos_articulacao
    except Exception as e:
        print(f"   ⚠️  Não foi possível carregar do JSON: {e}")
        return None


def carregar_grafo(arquivo: str) -> nx.Graph:
    """Carrega o grafo a partir do arquivo CSV"""
    grafo = nx.Graph()
    with open(arquivo, "r", encoding="utf-8") as f:
        leitor_csv = csv.reader(f)
        for linha in leitor_csv:
            origem, destino = int(linha[0]), int(linha[1])
            grafo.add_edge(origem, destino)
    return grafo


def medir_fragmentacao(grafo: nx.Graph) -> Dict:
    """Mede métricas de fragmentação do grafo"""
    if len(grafo.nodes()) == 0:
        return {
            "num_componentes": 0,
            "tamanho_maior_componente": 0,
            "percentual_maior_componente": 0.0,
            "componentes_isolados": 0,
            "fragmentacao": 1.0,
        }

    componentes = list(nx.connected_components(grafo))
    tamanhos = [len(c) for c in componentes]
    maior_componente = max(tamanhos) if tamanhos else 0
    num_total_nos = len(grafo.nodes())

    return {
        "num_componentes": len(componentes),
        "tamanho_maior_componente": maior_componente,
        "percentual_maior_componente": (
            (maior_componente / num_total_nos * 100) if num_total_nos > 0 else 0.0
        ),
        "componentes_isolados": sum(1 for t in tamanhos if t == 1),
        "fragmentacao": (
            1 - (maior_componente / num_total_nos) if num_total_nos > 0 else 1.0
        ),
    }


def simular_ataque_aleatorio(
    grafo_original: nx.Graph, num_passos: int = 100
) -> List[Dict]:
    """Simula ataque aleatório removendo nós progressivamente"""
    grafo = grafo_original.copy()
    total_nos = len(grafo.nodes())
    nos_para_remover = int(total_nos * 0.5)  # Remove até 50% dos nós
    passo = max(1, nos_para_remover // num_passos)

    resultados = []
    nos_disponiveis = list(grafo.nodes())
    random.shuffle(nos_disponiveis)

    # Estado inicial
    resultados.append(
        {"nos_removidos": 0, "percentual_removido": 0.0, **medir_fragmentacao(grafo)}
    )

    # Remoção progressiva
    removidos = 0
    for i in tqdm(
        range(0, nos_para_remover, passo),
        desc="      Ataque aleatório",
        unit="lote",
        ncols=80,
        ascii=True,
        leave=False,
    ):
        # Remove próximo lote de nós
        lote = nos_disponiveis[i : i + passo]
        for no in lote:
            if grafo.has_node(no):
                grafo.remove_node(no)
                removidos += 1

        metricas = medir_fragmentacao(grafo)
        resultados.append(
            {
                "nos_removidos": removidos,
                "percentual_removido": (removidos / total_nos * 100),
                **metricas,
            }
        )

    return resultados


def simular_ataque_direcionado(
    grafo_original: nx.Graph, num_passos: int = 100, criterio: str = "grau"
) -> List[Dict]:
    """
    Simula ataque direcionado aos nós mais importantes

    OTIMIZAÇÃO: Para betweenness, calcula UMA vez no início (não adaptativo)
    para evitar recalcular ~50 vezes.
    """
    grafo = grafo_original.copy()
    total_nos = len(grafo.nodes())
    nos_para_remover = int(total_nos * 0.5)
    passo = max(1, nos_para_remover // num_passos)

    resultados = []

    # Estado inicial
    resultados.append(
        {"nos_removidos": 0, "percentual_removido": 0.0, **medir_fragmentacao(grafo)}
    )

    # PRÉ-CALCULAR betweenness uma única vez (não adaptativo)
    # Razão: Recalcular a cada iteração levaria ~2min × 50 passos.
    betweenness_inicial = None
    if criterio == "betweenness":
        print("      Pré-calculando betweenness (uma única vez)...")
        betweenness_inicial = nx.betweenness_centrality(grafo, normalized=True)
        nos_ordenados_inicial = sorted(
            betweenness_inicial.items(), key=lambda x: x[1], reverse=True
        )
        nos_ordenados_inicial = [
            n for n, _ in nos_ordenados_inicial
        ]  # Lista ordenada de nós

    # Remoção progressiva
    removidos = 0
    pbar = tqdm(
        total=nos_para_remover,
        desc=f"      Ataque {criterio}",
        unit="nós",
        ncols=80,
        ascii=True,
        leave=False,
    )

    idx_betweenness = 0  # Índice para betweenness pré-calculado

    while removidos < nos_para_remover and len(grafo.nodes()) > 0:
        # Recalcula importância a cada passo (ataque adaptativo)
        if criterio == "grau":
            nos_ordenados = sorted(grafo.degree(), key=lambda x: x[1], reverse=True)
        elif criterio == "betweenness":
            # Usa lista pré-ordenada (não adaptativo, mas MUITO mais rápido)
            nos_ordenados = [
                (n, 1)
                for n in nos_ordenados_inicial[idx_betweenness:]
                if grafo.has_node(n)
            ]
        elif criterio == "articulacao":
            pontos_art = list(nx.articulation_points(grafo))
            # Prioriza pontos de articulação, depois por grau
            graus = dict(grafo.degree())
            nos_ordenados = [(no, graus[no]) for no in pontos_art]
            nos_ordenados.sort(key=lambda x: x[1], reverse=True)
            # Adiciona os demais nós
            outros = [(no, grau) for no, grau in graus.items() if no not in pontos_art]
            outros.sort(key=lambda x: x[1], reverse=True)
            nos_ordenados.extend(outros)

        # Remove próximo lote
        lote_size = min(passo, len(nos_ordenados), nos_para_remover - removidos)
        for i in range(lote_size):
            no = nos_ordenados[i][0]
            if grafo.has_node(no):
                grafo.remove_node(no)
                removidos += 1
                pbar.update(1)

        metricas = medir_fragmentacao(grafo)
        resultados.append(
            {
                "nos_removidos": removidos,
                "percentual_removido": (removidos / total_nos * 100),
                **metricas,
            }
        )

    pbar.close()
    return resultados


def comparar_ataques(grafo: nx.Graph) -> Dict:
    """Compara diferentes estratégias de ataque"""
    print("⚔️ Simulando ataque aleatório...")
    ataque_aleatorio = simular_ataque_aleatorio(grafo, num_passos=50)

    print("🎯 Simulando ataque direcionado por grau...")
    ataque_grau = simular_ataque_direcionado(grafo, num_passos=50, criterio="grau")

    print("🎯 Simulando ataque direcionado por betweenness...")
    ataque_betweenness = simular_ataque_direcionado(
        grafo, num_passos=50, criterio="betweenness"
    )

    print("🎯 Simulando ataque direcionado a pontos de articulação...")
    ataque_articulacao = simular_ataque_direcionado(
        grafo, num_passos=50, criterio="articulacao"
    )

    # Calcula pontos críticos de fragmentação (quando fragmentação > 50%)
    def encontrar_ponto_critico(resultados):
        for r in resultados:
            if r["fragmentacao"] > 0.5:
                return r["percentual_removido"]
        return 100.0  # Não fragmentou significativamente

    return {
        "ataque_aleatorio": {
            "curva": ataque_aleatorio,
            "ponto_critico": encontrar_ponto_critico(ataque_aleatorio),
            "fragmentacao_final": ataque_aleatorio[-1]["fragmentacao"],
        },
        "ataque_grau": {
            "curva": ataque_grau,
            "ponto_critico": encontrar_ponto_critico(ataque_grau),
            "fragmentacao_final": ataque_grau[-1]["fragmentacao"],
        },
        "ataque_betweenness": {
            "curva": ataque_betweenness,
            "ponto_critico": encontrar_ponto_critico(ataque_betweenness),
            "fragmentacao_final": ataque_betweenness[-1]["fragmentacao"],
        },
        "ataque_articulacao": {
            "curva": ataque_articulacao,
            "ponto_critico": encontrar_ponto_critico(ataque_articulacao),
            "fragmentacao_final": ataque_articulacao[-1]["fragmentacao"],
        },
    }


def analisar_vulnerabilidade_critica(
    grafo: nx.Graph, pontos_art_precalculados=None
) -> Dict:
    """Identifica combinações de nós que causam máxima fragmentação"""
    print("🔍 Analisando vulnerabilidades críticas...")

    # Pontos de articulação (carrega pré-calculados ou recalcula)
    if pontos_art_precalculados is not None:
        pontos_art = list(pontos_art_precalculados)
        print(f"   ✓ Usando {len(pontos_art)} pontos pré-calculados")
    else:
        print("   Recalculando pontos de articulação...")
        pontos_art = list(nx.articulation_points(grafo))
        print(f"   ✓ {len(pontos_art)} pontos calculados")

    # Testa remoção dos top 10 hubs simultaneamente
    graus = dict(grafo.degree())
    top_hubs = sorted(graus.items(), key=lambda x: x[1], reverse=True)[:10]

    grafo_sem_hubs = grafo.copy()
    for hub, _ in top_hubs:
        grafo_sem_hubs.remove_node(hub)

    impacto_hubs = medir_fragmentacao(grafo_sem_hubs)

    # Testa remoção dos top 10 pontos de articulação
    grafo_sem_art = grafo.copy()
    for no in pontos_art[:10]:
        if grafo_sem_art.has_node(no):
            grafo_sem_art.remove_node(no)

    impacto_articulacao = medir_fragmentacao(grafo_sem_art)

    # Testa combinação (hubs + articulação)
    grafo_combinado = grafo.copy()
    nos_criticos = set([no for no, _ in top_hubs[:5]] + pontos_art[:5])
    for no in nos_criticos:
        if grafo_combinado.has_node(no):
            grafo_combinado.remove_node(no)

    impacto_combinado = medir_fragmentacao(grafo_combinado)

    return {
        "remocao_top_10_hubs": {
            "nos_removidos": [no for no, _ in top_hubs],
            "impacto": impacto_hubs,
        },
        "remocao_top_10_articulacao": {
            "nos_removidos": pontos_art[:10],
            "impacto": impacto_articulacao,
        },
        "remocao_combinada": {
            "nos_removidos": list(nos_criticos),
            "impacto": impacto_combinado,
        },
    }


def main():
    print("=" * 80)
    print("ANÁLISE DE SIMULAÇÃO DE ATAQUES À REDE ELÉTRICA")
    print("=" * 80)

    # Carrega grafo
    print("\n📂 Carregando grafo...")
    grafo = carregar_grafo("powergrid.edgelist.csv")
    print(f"✓ Grafo carregado: {len(grafo.nodes())} nós, {len(grafo.edges())} arestas")

    # Carregar dados pré-calculados
    print("\n💾 Carregando dados pré-calculados...")
    pontos_articulacao_precalc = carregar_dados_precalculados()

    # Estatísticas iniciais
    estado_inicial = medir_fragmentacao(grafo)

    # Comparação de ataques
    comparacao = comparar_ataques(grafo)

    # Vulnerabilidades críticas (usando dados pré-calculados)
    vulnerabilidades = analisar_vulnerabilidade_critica(
        grafo, pontos_articulacao_precalc
    )

    # Análise comparativa
    interpretacao = []

    # Compara pontos críticos
    pc_aleatorio = comparacao["ataque_aleatorio"]["ponto_critico"]
    pc_grau = comparacao["ataque_grau"]["ponto_critico"]
    pc_betweenness = comparacao["ataque_betweenness"]["ponto_critico"]
    pc_articulacao = comparacao["ataque_articulacao"]["ponto_critico"]

    interpretacao.append(
        f"Ataque aleatório: fragmentação significativa após {
            pc_aleatorio:.1f}% de remoções"
    )
    interpretacao.append(
        f"Ataque por grau: fragmentação significativa após {
            pc_grau:.1f}% de remoções"
    )
    interpretacao.append(
        f"Ataque por betweenness: fragmentação significativa após {
            pc_betweenness:.1f}% de remoções"
    )
    interpretacao.append(
        f"Ataque a pontos de articulação: fragmentação significativa após {
            pc_articulacao:.1f}% de remoções"
    )

    # Determina estratégia mais eficaz
    estrategias = [
        ("Grau", pc_grau),
        ("Betweenness", pc_betweenness),
        ("Articulação", pc_articulacao),
    ]
    estrategia_mais_eficaz = min(estrategias, key=lambda x: x[1])

    interpretacao.append(
        f"\n🎯 Estratégia mais eficaz: {
            estrategia_mais_eficaz[0]} (fragmenta com apenas {
            estrategia_mais_eficaz[1]:.1f}% de remoções)"
    )

    # Avalia robustez
    diferenca = pc_aleatorio - estrategia_mais_eficaz[1]
    if diferenca > 30:
        nivel_robustez = "BAIXA"
        desc_robustez = "Grande diferença entre ataques aleatórios e direcionados indica vulnerabilidade a ataques estratégicos"
    elif diferenca > 15:
        nivel_robustez = "MÉDIA"
        desc_robustez = (
            "Diferença moderada indica alguma vulnerabilidade a ataques direcionados"
        )
    else:
        nivel_robustez = "ALTA"
        desc_robustez = (
            "Pequena diferença indica boa resiliência mesmo contra ataques direcionados"
        )

    interpretacao.append(f"\n🛡️ Robustez da rede: {nivel_robustez}")
    interpretacao.append(desc_robustez)

    # Monta resultado
    resultado = {
        "estatisticas_iniciais": {
            "total_nos": len(grafo.nodes()),
            "total_arestas": len(grafo.edges()),
            "estado_inicial": estado_inicial,
        },
        "comparacao_estrategias": comparacao,
        "vulnerabilidades_criticas": vulnerabilidades,
        "analise_comparativa": {
            "ponto_critico_aleatorio": pc_aleatorio,
            "ponto_critico_grau": pc_grau,
            "ponto_critico_betweenness": pc_betweenness,
            "ponto_critico_articulacao": pc_articulacao,
            "estrategia_mais_eficaz": estrategia_mais_eficaz[0],
            "diferenca_aleatorio_direcionado": diferenca,
            "nivel_robustez": nivel_robustez,
            "descricao_robustez": desc_robustez,
        },
        "interpretacao": interpretacao,
    }

    # Salva resultado
    caminho_saida = "../ui/public/analise_ataques.json"
    with open(caminho_saida, "w", encoding="utf-8") as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("RESUMO DA ANÁLISE")
    print("=" * 80)
    for linha in interpretacao:
        print(linha)

    print(f"\n✅ Análise de ataques salva em '{caminho_saida}'")


if __name__ == "__main__":
    random.seed(42)  # Para reprodutibilidade
    main()
