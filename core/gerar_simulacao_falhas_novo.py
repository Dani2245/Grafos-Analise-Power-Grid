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
    df = pd.read_csv("power_grid_dataset.csv")
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


def construir_grafo_medio(df: pd.DataFrame) -> nx.DiGraph:
    """Constrói grafo usando médias temporais"""
    row = df.mean(numeric_only=True)

    G = nx.DiGraph()

    # Adicionar nós com atributo de carga média
    for i in range(1, 11):
        G.add_node(i, load=row[f"load_node_{i}"])

    # Adicionar arestas com peso
    for origem in range(1, 11):
        for destino in range(1, 11):
            if origem != destino:
                peso = row[f"power_flow_{origem}_to_{destino}"]
                if peso > 0.1:
                    G.add_edge(origem, destino, weight=peso)

    return G


def simular_remocao_no(G: nx.DiGraph, no_remover: int) -> Dict:
    """Simula remoção de um nó e mede impacto"""

    # Copiar grafo
    G_falha = G.copy()

    # Armazenar informações do nó antes de remover
    load_no = G.nodes[no_remover].get("load", 0)
    in_degree_antes = G.in_degree(no_remover)
    out_degree_antes = G.out_degree(no_remover)

    # Calcular carga total antes
    carga_total_antes = sum(G.nodes[n].get("load", 0) for n in G.nodes())

    # Remover nó
    G_falha.remove_node(no_remover)

    # Calcular métricas após remoção
    carga_total_depois = sum(G_falha.nodes[n].get("load", 0) for n in G_falha.nodes())
    perda_carga = carga_total_antes - carga_total_depois
    perda_carga_percentual = (
        (perda_carga / carga_total_antes * 100) if carga_total_antes > 0 else 0
    )

    # Verificar conectividade
    if len(G_falha.nodes()) > 0:
        G_undirected = G_falha.to_undirected()
        componentes = list(nx.connected_components(G_undirected))
        num_componentes = len(componentes)
        tamanho_maior_componente = len(max(componentes, key=len)) if componentes else 0
        fragmentacao = (
            (
                (G.number_of_nodes() - 1 - tamanho_maior_componente)
                / (G.number_of_nodes() - 1)
                * 100
            )
            if G.number_of_nodes() > 1
            else 0
        )
    else:
        num_componentes = 0
        tamanho_maior_componente = 0
        fragmentacao = 100

    # Arestas perdidas
    arestas_antes = G.number_of_edges()
    arestas_depois = G_falha.number_of_edges()
    arestas_perdidas = arestas_antes - arestas_depois
    perda_arestas_percentual = (
        (arestas_perdidas / arestas_antes * 100) if arestas_antes > 0 else 0
    )

    return {
        "no_removido": no_remover,
        "load_no_removido": round(load_no, 2),
        "in_degree_antes": in_degree_antes,
        "out_degree_antes": out_degree_antes,
        "carga_total_antes": round(carga_total_antes, 2),
        "carga_total_depois": round(carga_total_depois, 2),
        "perda_carga_MW": round(perda_carga, 2),
        "perda_carga_percentual": round(perda_carga_percentual, 2),
        "num_componentes": num_componentes,
        "tamanho_maior_componente": tamanho_maior_componente,
        "fragmentacao_percentual": round(fragmentacao, 2),
        "arestas_antes": arestas_antes,
        "arestas_depois": arestas_depois,
        "arestas_perdidas": arestas_perdidas,
        "perda_arestas_percentual": round(perda_arestas_percentual, 2),
    }


def calcular_threshold_baseado_dados(df: pd.DataFrame) -> Dict:
    """
    Calcula threshold de sobrecarga baseado em análise de grid_status
    Identifica em quais níveis de carga a rede se torna instável
    """
    # Separar dados estáveis vs instáveis
    df_estavel = df[df["grid_status"] == 0]
    df_instavel = df[df["grid_status"] == 1]

    # Extrair todas as cargas dos nós
    load_cols = [f"load_node_{i}" for i in range(1, 11)]

    cargas_estaveis = df_estavel[load_cols].values.flatten()
    cargas_instaveis = df_instavel[load_cols].values.flatten()

    # Threshold: percentil 75 das cargas durante instabilidade
    threshold_p75 = (
        np.percentile(cargas_instaveis, 75) if len(cargas_instaveis) > 0 else 400
    )
    # Threshold conservador: média das cargas durante instabilidade
    threshold_media = np.mean(cargas_instaveis) if len(cargas_instaveis) > 0 else 350

    return {
        "threshold_percentil_75": round(threshold_p75, 2),
        "threshold_media_instavel": round(threshold_media, 2),
        "carga_maxima_estavel": (
            round(np.max(cargas_estaveis), 2) if len(cargas_estaveis) > 0 else 0
        ),
        "carga_minima_instavel": (
            round(np.min(cargas_instaveis), 2) if len(cargas_instaveis) > 0 else 0
        ),
        # Usar média como threshold operacional
        "recomendacao": round(threshold_media, 2),
    }


def simular_sobrecarga_localizada(
    G: nx.DiGraph, df: pd.DataFrame, nos_afetados: List[int], percentual_aumento: int
) -> Dict:
    """
    Simula aumento de carga localizado em nós específicos
    Mais realista que aumento global simultâneo
    """
    thresholds = calcular_threshold_baseado_dados(df)
    threshold = thresholds["recomendacao"]

    carga_original = {n: G.nodes[n].get("load", 0) for n in G.nodes()}
    carga_nova = carga_original.copy()

    # Aumentar carga apenas nos nós afetados
    fator = 1 + (percentual_aumento / 100)
    for no in nos_afetados:
        carga_nova[no] = carga_original[no] * fator

    carga_total_original = sum(carga_original.values())
    carga_total_nova = sum(carga_nova.values())

    # Identificar nós em sobrecarga
    nos_sobrecarga = [n for n in nos_afetados if carga_nova[n] > threshold]

    return {
        "cenario": f"Sobrecarga localizada em nós {nos_afetados}",
        "percentual_aumento": percentual_aumento,
        "nos_afetados_inicial": nos_afetados,
        "nos_em_sobrecarga": nos_sobrecarga,
        "quantidade_sobrecarga": len(nos_sobrecarga),
        "threshold_usado": threshold,
        "carga_total_antes": round(carga_total_original, 2),
        "carga_total_depois": round(carga_total_nova, 2),
        "detalhes_nos": [
            {
                "no": no,
                "carga_original": round(carga_original[no], 2),
                "carga_nova": round(carga_nova[no], 2),
                "aumento_MW": round(carga_nova[no] - carga_original[no], 2),
                "em_sobrecarga": no in nos_sobrecarga,
                "margem_seguranca": round(threshold - carga_nova[no], 2),
            }
            for no in nos_afetados
        ],
    }


def simular_cascata_falhas(G: nx.DiGraph, df: pd.DataFrame, no_inicial: int) -> Dict:
    """
    Simula efeito cascata: falha inicial causa sobrecarga em vizinhos,
    que podem falhar e propagar o problema
    """
    thresholds = calcular_threshold_baseado_dados(df)
    threshold = thresholds["recomendacao"]

    G_cascata = G.copy()
    carga_atual = {n: G.nodes[n].get("load", 0) for n in G.nodes()}

    nos_falhos = set()
    nos_sobrecarregados = set()
    historico_iteracoes = []

    # Iteração 0: Falha inicial
    nos_falhos.add(no_inicial)
    G_cascata.remove_node(no_inicial)

    iteracao = 0
    max_iteracoes = 10

    while iteracao < max_iteracoes:
        novos_falhos = set()

        # Para cada nó que ainda está ativo
        for no in list(G_cascata.nodes()):
            # Contar quantos predecessores (fornecedores) falharam
            predecessores_falhos = [p for p in G.predecessors(no) if p in nos_falhos]

            if len(predecessores_falhos) > 0:
                # Simular redistribuição da carga perdida
                # Simplificação: assumir que carga se distribui entre nós restantes
                carga_adicional = sum(
                    carga_atual[p] for p in predecessores_falhos
                ) / len(G_cascata.nodes())
                carga_atual[no] += carga_adicional

                # Verificar sobrecarga
                if carga_atual[no] > threshold:
                    novos_falhos.add(no)
                    nos_sobrecarregados.add(no)

        # Remover nós que falharam nesta iteração
        for no in novos_falhos:
            G_cascata.remove_node(no)
            nos_falhos.add(no)

        historico_iteracoes.append(
            {
                "iteracao": iteracao,
                "novos_falhos": list(novos_falhos),
                "total_falhos_acumulado": len(nos_falhos),
                "nos_restantes": G_cascata.number_of_nodes(),
            }
        )

        # Se não houve novos falhos, cascata estabilizou
        if len(novos_falhos) == 0:
            break

        iteracao += 1

    # Calcular fragmentação final
    if G_cascata.number_of_nodes() > 0:
        G_undirected = G_cascata.to_undirected()
        componentes = list(nx.connected_components(G_undirected))
        num_componentes = len(componentes)
        fragmentacao = (
            (G.number_of_nodes() - G_cascata.number_of_nodes())
            / G.number_of_nodes()
            * 100
        )
    else:
        num_componentes = 0
        fragmentacao = 100

    return {
        "no_inicial": no_inicial,
        "threshold_usado": threshold,
        "total_nos_falhos": len(nos_falhos),
        "nos_falhos": sorted(list(nos_falhos)),
        "nos_por_sobrecarga": sorted(list(nos_sobrecarregados)),
        "fragmentacao_percentual": round(fragmentacao, 2),
        "num_componentes_final": num_componentes,
        "iteracoes_ate_estabilizar": iteracao,
        "historico_cascata": historico_iteracoes,
        "rede_colapsou": G_cascata.number_of_nodes() == 0,
    }


def comparar_com_dataset_original() -> Dict:
    """
    Compara robustez do novo dataset com o dataset original
    (baseado em resultados já calculados para o dataset original)
    """

    # Nota: Valores do dataset original vêm de analise_robustez.json
    # Aqui fazemos comparação conceitual

    comparacao = {
        "dataset_original": {
            "total_nos": 4941,
            "impacto_medio_remocao_no": "Varia de 0% a 15% de fragmentação",
            "robustez_relativa": "Alta (rede densa, muitas rotas alternativas)",
        },
        "dataset_novo": {
            "total_nos": 10,
            "impacto_medio_remocao_no": "A ser calculado",
            "robustez_relativa": "Menor (rede pequena, poucas rotas alternativas)",
        },
        "observacoes": [
            "Dataset original: Rede topológica grande com alta redundância",
            "Dataset novo: Rede operacional pequena, cada nó crítico",
            "Comparação direta não é válida devido a diferenças de escala e natureza",
            "Métricas normalizadas por nó permitem comparação relativa",
        ],
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
        print(
            f"   • Nó {no}: Fragmentação {resultado['fragmentacao_percentual']:.1f}%, "
            f"Perda de carga {resultado['perda_carga_percentual']:.1f}%"
        )

    # Calcular threshold baseado em dados reais
    print("\n[4/7] Analisando threshold de sobrecarga...")
    thresholds = calcular_threshold_baseado_dados(df)
    print(f"   ✓ Threshold recomendado: {thresholds['recomendacao']:.1f} MW")
    print(
        f"   ✓ Carga máxima em estado estável: {thresholds['carga_maxima_estavel']:.1f} MW"
    )
    print(
        f"   ✓ Carga mínima durante instabilidade: {thresholds['carga_minima_instavel']:.1f} MW"
    )

    # Simulações de sobrecarga localizada (cenários realistas)
    print("\n[5/7] Simulando sobrecarga localizada...")
    cenarios_sobrecarga = []

    cenarios = [
        {"nome": "Pico em nós de alta carga", "nos": [6, 9], "aumento": 30},
        {"nome": "Sobrecarga dupla", "nos": [2, 4], "aumento": 50},
        {"nome": "Pico extremo único", "nos": [9], "aumento": 75},
        {"nome": "Múltiplos nós moderado", "nos": [1, 3, 5, 7], "aumento": 40},
    ]

    for cenario in cenarios:
        resultado = simular_sobrecarga_localizada(
            G, df, cenario["nos"], cenario["aumento"]
        )
        resultado["nome_cenario"] = cenario["nome"]
        cenarios_sobrecarga.append(resultado)
        print(
            f"   • {cenario['nome']}: {resultado['quantidade_sobrecarga']} nós em sobrecarga"
        )

    # Simulações de cascata de falhas
    print("\n[6/7] Simulando cascata de falhas...")
    simulacoes_cascata = []

    # Testar cascata iniciando nos 3 nós mais críticos
    nos_para_testar_cascata = [9, 6, 2]  # Baseado na análise de remoção

    for no in nos_para_testar_cascata:
        resultado = simular_cascata_falhas(G, df, no)
        simulacoes_cascata.append(resultado)
        print(
            f"   • Cascata iniciando no nó {no}: {resultado['total_nos_falhos']} nós falhos, "
            f"{resultado['fragmentacao_percentual']:.1f}% fragmentação"
        )

    print("\n[7/7] Compilando resultados...")

    # Ordenar por criticidade composta: fragmentação primeiro, depois perda de carga
    # Isso garante que se fragmentação for igual, a perda de carga seja o critério de desempate
    simulacoes_remocao.sort(
        key=lambda x: (x["fragmentacao_percentual"], x["perda_carga_percentual"]),
        reverse=True,
    )

    # Comparação com dataset original
    comparacao = comparar_com_dataset_original()

    # Montar JSON de saída
    resultado = {
        "AVISO_METODOLOGICO": "Simulação de falhas baseada em dados reais. Threshold calculado a partir de análise de grid_status. Cenários de sobrecarga localizada e cascata de falhas são mais realistas que aumento global.",
        "info_simulacao": {
            "total_nos": G.number_of_nodes(),
            "total_arestas": G.number_of_edges(),
            "carga_total_media": round(
                sum(G.nodes[n].get("load", 0) for n in G.nodes()), 2
            ),
        },
        "analise_threshold": thresholds,
        "simulacoes_remocao": {
            "total_simulacoes": len(simulacoes_remocao),
            "resultados": simulacoes_remocao,
            "estatisticas": {
                "fragmentacao_media": round(
                    np.mean([s["fragmentacao_percentual"] for s in simulacoes_remocao]),
                    2,
                ),
                "fragmentacao_maxima": max(
                    s["fragmentacao_percentual"] for s in simulacoes_remocao
                ),
                "perda_carga_media": round(
                    np.mean([s["perda_carga_percentual"] for s in simulacoes_remocao]),
                    2,
                ),
                "no_mais_critico": simulacoes_remocao[0]["no_removido"],
            },
        },
        "simulacoes_sobrecarga_localizada": {
            "total_cenarios": len(cenarios_sobrecarga),
            "resultados": cenarios_sobrecarga,
            "observacao": "Cenários de sobrecarga localizada são mais realistas que aumento global simultâneo",
        },
        "simulacoes_cascata": {
            "total_simulacoes": len(simulacoes_cascata),
            "resultados": simulacoes_cascata,
            "observacao": "Simula efeito dominó: falha inicial propaga sobrecarga para vizinhos",
        },
        "comparacao_dataset_original": comparacao,
    }

    # Salvar JSON
    caminho_saida = "../ui/public/simulacao_falhas_novo.json"
    with open(caminho_saida, "w", encoding="utf-8") as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("RESUMO DA SIMULAÇÃO")
    print("=" * 80)
    print(f"\n📊 Análise de Threshold:")
    print(f"   • Threshold recomendado: {thresholds['recomendacao']:.1f} MW")
    print(
        f"   • Baseado em análise de {df[df['grid_status'] == 1].shape[0]} timestamps com instabilidade"
    )

    print(f"\n💥 Remoção de Nós:")
    print(
        f"   • Nó mais crítico: {resultado['simulacoes_remocao']['estatisticas']['no_mais_critico']}"
    )
    print(
        f"   • Fragmentação máxima: {resultado['simulacoes_remocao']['estatisticas']['fragmentacao_maxima']:.1f}%"
    )
    print(
        f"   • Fragmentação média: {resultado['simulacoes_remocao']['estatisticas']['fragmentacao_media']:.1f}%"
    )
    print(
        f"   • Perda de carga média: {resultado['simulacoes_remocao']['estatisticas']['perda_carga_media']:.1f}%"
    )

    print(f"\n⚡ Sobrecarga Localizada:")
    for cenario in cenarios_sobrecarga:
        print(
            f"   • {cenario['nome_cenario']}: {cenario['quantidade_sobrecarga']} nós em sobrecarga"
        )

    print(f"\n🔗 Cascata de Falhas:")
    for cascata in simulacoes_cascata:
        status = (
            "COLAPSO TOTAL"
            if cascata["rede_colapsou"]
            else f"{cascata['fragmentacao_percentual']:.1f}% fragmentação"
        )
        print(
            f"   • Início no nó {cascata['no_inicial']}: {cascata['total_nos_falhos']} nós falhos, {status}"
        )

    print(f"\n✅ Simulação salva em '{caminho_saida}'")
    print("=" * 80)


if __name__ == "__main__":
    main()
