# -*- coding: utf-8 -*-
"""
Estratégia de Mitigação de Infraestrutura para Rede Elétrica

Framework de decisão para priorização de investimentos em infraestrutura
baseado em análise multi-critério de criticidade e simulação de redundância.

Responde à questão do professor: "Definir uma tomada de decisão do ponto de vista
de infraestrutura para o ponto de contenção e quem pode atuar na mitigação."
"""

import networkx as nx
import csv
import json
import sys
import os
import numpy as np
from tqdm import tqdm

# Configurar encoding UTF-8 para output no Windows
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")


def carregar_rede():
    """Carrega a rede elétrica do arquivo CSV"""
    if not os.path.exists("powergrid.edgelist.csv"):
        print("❌ ERRO: Arquivo 'powergrid.edgelist.csv' não encontrado!")
        sys.exit(1)

    grafo = nx.Graph()

    with open("powergrid.edgelist.csv", "r", encoding="utf-8") as arquivo:
        leitor_csv = csv.reader(arquivo)
        for linha in leitor_csv:
            if len(linha) == 2:
                origem = int(linha[0])
                destino = int(linha[1])
                grafo.add_edge(origem, destino)

    if grafo.number_of_nodes() == 0:
        print("❌ ERRO: Grafo vazio!")
        sys.exit(1)

    print(
        f"✓ Rede carregada: {grafo.number_of_nodes()} nós, {grafo.number_of_edges()} arestas"
    )

    return grafo


def carregar_analises_existentes():
    """Carrega análises já computadas para enriquecer decisão"""
    analises = {}

    arquivos = {
        "criticidade": "../ui/public/analise_criticidade.json",
        "papeis": "../ui/public/inferencia_papeis.json",
        "comunidades": "../ui/public/analise_comunidades.json",
    }

    for nome, caminho in arquivos.items():
        if os.path.exists(caminho):
            with open(caminho, "r", encoding="utf-8") as f:
                analises[nome] = json.load(f)
                print(f"   ✓ Carregado: {nome}")
        else:
            print(f"   ⚠️  Não encontrado: {nome} (usando defaults)")
            analises[nome] = None

    # OTIMIZAÇÃO: Extrair betweenness e pontos de articulação de criticidade.json
    if analises.get("criticidade"):
        try:
            crit = analises["criticidade"]
            analises["betweenness"] = {
                int(k): v
                for k, v in crit["centralidade_intermediacao"]["todos_nos"].items()
            }
            analises["pontos_articulacao"] = set(
                crit["pontos_articulacao"]["lista_completa"]
            )
            print(
                "   ✓ Betweenness e pontos de articulação extraídos (economia: ~3 minutos)"
            )
        except Exception as e:
            print(f"   ⚠️  Erro ao extrair métricas: {e}")
            analises["betweenness"] = None
            analises["pontos_articulacao"] = None
    else:
        analises["betweenness"] = None
        analises["pontos_articulacao"] = None

    return analises


def calcular_score_criticidade(
    grafo, betweenness, pontos_articulacao, percolacao_por_no=None
):
    """
    Calcula score multi-critério de criticidade para cada nó (4 dimensões)

    Score 4D = 0.30 × Percolação_norm + 0.30 × Articulation + 0.25 × Betweenness_norm + 0.15 × Degree_norm

    FUNDAMENTAÇÃO TEÓRICA DOS PESOS (Teoria de Grafos + Redes Elétricas):

    1. Percolação (30% - PESO MÁXIMO):
       - Teoria: Mede impacto REAL de fragmentação ao remover o nó (percolation theory)
       - Redes Elétricas: Particionamento = isolamento de consumidores + colapso cascata
       - Justificativa: Métrica EMPÍRICA (não teórica) que capta efeito combinado de
         topologia + posicionamento estrutural. Prioritária para decisões de infraestrutura.

    2. Articulação (30% - PESO MÁXIMO):
       - Teoria: Cut vertex - ponto único de falha que desconecta o grafo (conectividade)
       - Redes Elétricas: Falha causa FRAGMENTAÇÃO GARANTIDA (blackout regional)
       - Justificativa: Predicado binário (sim/não) mas com impacto CRÍTICO - vulnerabilidade
         estrutural inaceitável em sistema crítico. Iguala peso de percolação pois ambos
         medem fragmentação (articulação: teórica; percolação: empírica).

    3. Betweenness (25%):
       - Teoria: Centralidade de intermediação - frequência em caminhos mais curtos (fluxo)
       - Redes Elétricas: Gargalo de transmissão + sobrecarga em cascata (redistribuição)
       - Justificativa: Peso MENOR que fragmentação porque rede elétrica tem redundância
         (lei de Kirchhoff permite caminhos alternativos). Impacto: sobrecarga local, não
         colapso total. Porém, alto o suficiente pois gargalos causam instabilidade.

    4. Grau (15% - PESO MÍNIMO):
       - Teoria: Número de arestas incidentes (conectividade local)
       - Redes Elétricas: Número de conexões diretas afetadas (carga redistributiva)
       - Justificativa: Peso REDUZIDO porque alto grau SEM articulação/betweenness/percolação
         indica redundância (hub robusto). Impacto: sobrecarga localizada facilmente mitigável.
         Mantém-se no modelo porque complementa análise de sobrecarga vs fragmentação.

    VALIDAÇÃO CRUZADA:
    - Fragmentação (P+A): 60% → Prioriza vulnerabilidade estrutural
    - Fluxo (B+G): 40% → Complementa com análise operacional
    - Balanceamento: Evita viés puramente topológico (teoria) ou puramente empírico (simulação)
    """
    print(
        "   Calculando scores multi-critério (4D: Percolação + Articulação + Betweenness + Grau)..."
    )

    graus = dict(grafo.degree())

    # Normalizar métricas [0, 1]
    max_betweenness = max(betweenness.values())
    max_grau = max(graus.values())

    betweenness_norm = {
        n: (b / max_betweenness if max_betweenness > 0 else 0)
        for n, b in betweenness.items()
    }
    grau_norm = {n: (g / max_grau if max_grau > 0 else 0) for n, g in graus.items()}

    # Normalizar percolação (se disponível)
    if percolacao_por_no and "todos_nos" in percolacao_por_no:
        todos_nos_perc = percolacao_por_no["todos_nos"]
        max_percolacao = max(
            p["fragmentacao_percentual"] for p in todos_nos_perc.values()
        )
        percolacao_norm = {
            int(n): (
                p["fragmentacao_percentual"] / max_percolacao
                if max_percolacao > 0
                else 0
            )
            for n, p in todos_nos_perc.items()
        }
    else:
        percolacao_norm = {n: 0.0 for n in grafo.nodes()}

    # Calcular score combinado 4D
    scores = {}
    for no in grafo.nodes():
        is_articulacao = 1.0 if no in pontos_articulacao else 0.0

        # Score 4D com pesos fundamentados
        score_4d = (
            0.30 * percolacao_norm[no]
            + 0.30 * is_articulacao
            + 0.25 * betweenness_norm[no]
            + 0.15 * grau_norm[no]
        )

        scores[no] = {
            "no": no,
            "score_total": round(score_4d, 4),
            "betweenness": round(betweenness[no], 6),
            "betweenness_norm": round(betweenness_norm[no], 4),
            "grau": graus[no],
            "grau_norm": round(grau_norm[no], 4),
            "eh_articulacao": is_articulacao == 1.0,
            "percolacao_fragmentacao": (
                round(
                    percolacao_por_no["todos_nos"][str(no)]["fragmentacao_percentual"],
                    2,
                )
                if (
                    percolacao_por_no
                    and "todos_nos" in percolacao_por_no
                    and str(no) in percolacao_por_no["todos_nos"]
                )
                else 0.0
            ),
            "percolacao_norm": round(percolacao_norm.get(no, 0.0), 4),
        }

    # Ordenar por score (mais crítico primeiro)
    ranking = sorted(scores.values(), key=lambda x: x["score_total"], reverse=True)

    print(f"   ✓ Scores 4D calculados para {len(ranking)} nós")

    return ranking


def simular_adicao_redundancia(
    grafo, no_critico, k_arestas=3, betweenness_precalc=None, pontos_art_precalc=None
):
    """
    Simula adição de k arestas redundantes conectando nó crítico
    a outros nós estratégicos (hubs não-vizinhos).

    Avalia melhoria em:
    - Betweenness do nó (esperado: diminuir)
    - Conectividade algébrica (esperado: aumentar)
    - Articulação (esperado: pode deixar de ser ponto de articulação)

    OTIMIZAÇÃO: Recebe betweenness pré-calculado para evitar recalcular
    10x vezes (economia: ~20-30 minutos)
    """
    grafo_redundante = grafo.copy()

    # Identificar candidatos: nós de alto grau não conectados ao nó crítico
    vizinhos_atuais = set(grafo.neighbors(no_critico))
    graus = dict(grafo.degree())

    candidatos = [
        n
        for n in grafo.nodes()
        if n != no_critico
        and n not in vizinhos_atuais
        and graus[n] >= 4  # Apenas nós com grau >= 4
    ]

    # Ordenar por grau (conectar a hubs)
    candidatos.sort(key=lambda x: graus[x], reverse=True)

    # Adicionar k arestas
    arestas_adicionadas = []
    for candidato in candidatos[:k_arestas]:
        grafo_redundante.add_edge(no_critico, candidato)
        arestas_adicionadas.append((no_critico, candidato))

    if len(arestas_adicionadas) == 0:
        return None  # Não foi possível adicionar redundância

    # Métricas antes e depois
    # OTIMIZAÇÃO: Usar betweenness pré-calculado
    if betweenness_precalc is not None:
        bc_antes = betweenness_precalc[no_critico]
    else:
        bc_antes = nx.betweenness_centrality(grafo, normalized=True)[no_critico]

    # Calcular betweenness APENAS do grafo redundante (1 cálculo por nó)
    bc_depois_dict = nx.betweenness_centrality(grafo_redundante, normalized=True)
    bc_depois = bc_depois_dict[no_critico]

    # Articulação antes e depois
    if pontos_art_precalc is not None:
        era_articulacao = no_critico in pontos_art_precalc
    else:
        era_articulacao = no_critico in set(nx.articulation_points(grafo))

    eh_articulacao = no_critico in set(nx.articulation_points(grafo_redundante))

    return {
        "arestas_adicionadas": len(arestas_adicionadas),
        "detalhes_arestas": arestas_adicionadas,
        "betweenness_antes": round(bc_antes, 6),
        "betweenness_depois": round(bc_depois, 6),
        "reducao_betweenness": (
            round((bc_antes - bc_depois) / bc_antes * 100, 2) if bc_antes > 0 else 0
        ),
        "era_articulacao": era_articulacao,
        "eh_articulacao_apos": eh_articulacao,
        "eliminou_articulacao": era_articulacao and not eh_articulacao,
    }


def calcular_roi_mitigacao(score_criticidade, custo_base=100):
    """
    Calcula ROI (Return on Investment) estimado de mitigação

    ROI = (Redução de Vulnerabilidade / Custo Estimado) × 100

    Custo estimado:
    - Base: R$ 100 mil por nó
    - Multiplicador por grau (mais conexões = mais caro): grau × 10%
    - Bônus se elimina articulação: +50%
    """
    roi_analises = []

    for item in score_criticidade[:50]:  # Top 50
        no = item["no"]
        score = item["score_total"]
        grau = item["grau"]

        # Custo estimado (em milhares de R$)
        custo = custo_base * (1 + grau * 0.1)

        # Redução de vulnerabilidade (proporcional ao score)
        reducao_vulnerabilidade = score * 100  # Score [0,1] → [0,100]%

        # ROI básico
        roi = (reducao_vulnerabilidade / custo) * 100

        # Bônus se for articulação
        if item["eh_articulacao"]:
            roi *= 1.5

        roi_analises.append(
            {
                "no": no,
                "score_criticidade": round(score, 4),
                "reducao_vulnerabilidade_pct": round(reducao_vulnerabilidade, 2),
                "custo_estimado_mil": round(custo, 2),
                "roi": round(roi, 2),
                "prioridade": "ALTA" if roi > 50 else "MÉDIA" if roi > 20 else "BAIXA",
            }
        )

    # Ordenar por ROI
    roi_analises.sort(key=lambda x: x["roi"], reverse=True)

    return roi_analises


def definir_stakeholders_mitigacao(analises):
    """
    Define quem pode atuar na mitigação de cada tipo de nó

    Baseado em papel do nó (se disponível):
    - GERADOR → Operador de Geração + Regulador (ANEEL)
    - TRANSFORMADOR → Operador de Transmissão + Distribuidora
    - CONSUMIDOR → Distribuidora + Município
    - LINHA_TRANSMISSAO → Operador de Transmissão + ONS
    """
    papeis_disponiveis = analises.get("papeis") is not None

    if papeis_disponiveis:
        # Corrigido: campo correto é 'classificacao_completa'
        classificacao = analises["papeis"].get("classificacao_completa", {})
        papel_por_no = {int(no): item["papel"] for no, item in classificacao.items()}
    else:
        papel_por_no = {}

    matriz_stakeholders = {
        "GERADOR": {
            "responsavel_primario": "Operador de Geração",
            "responsavel_secundario": "ANEEL (Regulador)",
            "investidor": "Concessionária de Geração",
            "tempo_aprovacao": "6-12 meses",
            "complexidade": "ALTA",
        },
        "TRANSFORMADOR": {
            "responsavel_primario": "Operador de Transmissão",
            "responsavel_secundario": "Distribuidora Local",
            "investidor": "Concessionária de Transmissão",
            "tempo_aprovacao": "3-6 meses",
            "complexidade": "MÉDIA",
        },
        "CONSUMIDOR": {
            "responsavel_primario": "Distribuidora Local",
            "responsavel_secundario": "Município",
            "investidor": "Distribuidora",
            "tempo_aprovacao": "1-3 meses",
            "complexidade": "BAIXA",
        },
        "LINHA_TRANSMISSAO": {
            "responsavel_primario": "Operador de Transmissão",
            "responsavel_secundario": "ONS (Operador Nacional do Sistema)",
            "investidor": "Concessionária de Transmissão",
            "tempo_aprovacao": "3-6 meses",
            "complexidade": "MÉDIA",
        },
        "DESCONHECIDO": {
            "responsavel_primario": "A Definir (análise de campo)",
            "responsavel_secundario": "Operador Regional",
            "investidor": "A Definir",
            "tempo_aprovacao": "Indefinido",
            "complexidade": "INDEFINIDA",
        },
    }

    return {
        "matriz_stakeholders": matriz_stakeholders,
        "papel_por_no": papel_por_no if papeis_disponiveis else None,
    }


def gerar_plano_acao(
    ranking_criticos, roi_analises, stakeholders, classificacao_4d=None
):
    """
    Gera plano de ação priorizado para top 20 nós críticos (com suporte a 4D)
    """
    plano = []

    # Identificar nós 4D nível 1 se disponível
    nos_4d_nivel_1 = set()
    if classificacao_4d and "nivel_1_critico_maximo_4d" in classificacao_4d:
        nos_4d_nivel_1 = set(
            n["no"] for n in classificacao_4d["nivel_1_critico_maximo_4d"]["nos"]
        )

    for idx, item in enumerate(ranking_criticos[:20], 1):
        no = item["no"]

        # Encontrar ROI
        roi_item = next((r for r in roi_analises if r["no"] == no), None)

        # Identificar papel e stakeholder
        papel = (
            stakeholders["papel_por_no"].get(no, "DESCONHECIDO")
            if stakeholders["papel_por_no"]
            else "DESCONHECIDO"
        )
        stakeholder_info = stakeholders["matriz_stakeholders"][papel]

        # Ações baseadas em criticidade 4D
        is_4d_nivel_1 = no in nos_4d_nivel_1

        if is_4d_nivel_1:
            acoes = [
                "🔴 AÇÃO CRÍTICA 4D: Implementar redundância tripla (mínimo 3 rotas alternativas)",
                "Sistema de backup de energia com ativação automática (<100ms)",
                "Monitoramento 24/7 com alertas em tempo real + inspeção diária presencial",
                "Plano de contingência para falha total + equipe de resposta rápida dedicada",
                "Proteção física reforçada (cercamento, câmeras, sensores)",
                "Investimento prioritário em substituição de equipamentos críticos",
            ]
        elif item["eh_articulacao"]:
            acoes = [
                "Adicionar 3 conexões redundantes a hubs próximos",
                "Implementar sistema de backup de energia",
                "Monitoramento 24/7 com alertas em tempo real",
                "Plano de contingência para falha total",
            ]
        else:
            acoes = [
                "Adicionar 2 conexões redundantes",
                "Monitoramento preventivo",
                "Manutenção programada prioritária",
            ]

        plano.append(
            {
                "prioridade": idx,
                "no": no,
                "score_criticidade": item["score_total"],
                "papel": papel,
                "criticidade_4d_nivel_1": is_4d_nivel_1,
                "percolacao_fragmentacao": item.get("percolacao_fragmentacao", 0.0),
                "acoes_recomendadas": acoes,
                "responsavel_primario": stakeholder_info["responsavel_primario"],
                "responsavel_secundario": stakeholder_info["responsavel_secundario"],
                "investidor": stakeholder_info["investidor"],
                "tempo_estimado": stakeholder_info["tempo_aprovacao"],
                "complexidade": stakeholder_info["complexidade"],
                "roi": roi_item["roi"] if roi_item else 0,
                "custo_estimado_mil": roi_item["custo_estimado_mil"] if roi_item else 0,
            }
        )

    return plano


def main():
    print("=" * 80)
    print("ESTRATÉGIA DE MITIGAÇÃO DE INFRAESTRUTURA")
    print("=" * 80)

    print("\n[1/8] Carregando rede elétrica...")
    grafo = carregar_rede()

    print("\n[2/8] Carregando análises existentes...")
    analises = carregar_analises_existentes()

    print("\n[3/8] Carregando dados de percolação (4 dimensões)...")
    percolacao_por_no = None
    classificacao_criticidade = None
    try:
        caminho_percolacao = "../ui/public/analise_criticidade.json"
        with open(caminho_percolacao, "r", encoding="utf-8") as f:
            dados_percolacao = json.load(f)
            percolacao_por_no = dados_percolacao.get("percolacao_por_no", None)
            classificacao_criticidade = dados_percolacao.get(
                "classificacao_criticidade", None
            )
        if percolacao_por_no:
            total_nos_perc = len(percolacao_por_no.get("todos_nos", {}))
            print(
                f"   ✓ Dados de percolação carregados: {total_nos_perc} nós com métricas"
            )
            print(
                f"   ✓ Threshold top 5%: {percolacao_por_no.get('threshold_top_5_pct', 0)}% fragmentação"
            )
        if classificacao_criticidade:
            print(
                f"   ✓ Classificação 4D carregada: {len(classificacao_criticidade)} níveis de criticidade"
            )
    except FileNotFoundError:
        print(
            "   ⚠ analise_criticidade.json não encontrado - análise 4D não disponível"
        )
    except Exception as e:
        print(f"   ⚠ Erro ao carregar dados de percolação: {e}")

    print("\n[4/8] Obtendo betweenness e pontos de articulação...")
    # OTIMIZADO: Usa dados carregados ao invés de recalcular
    if analises.get("betweenness") and analises.get("pontos_articulacao"):
        betweenness = analises["betweenness"]
        pontos_articulacao = analises["pontos_articulacao"]
        print(
            f"   ✓ Betweenness carregado para {len(betweenness)} nós (economia: ~3 minutos)"
        )
        print(f"   ✓ {len(pontos_articulacao)} pontos de articulação carregados")
    else:
        print("   ⚠️  Dados não disponíveis em analise_criticidade.json")
        print("   ⏳ Recalculando betweenness (pode levar 2-3 minutos)...")
        import time

        inicio_bc = time.time()
        betweenness = nx.betweenness_centrality(grafo, normalized=True)
        tempo_bc = time.time() - inicio_bc
        print(f"   ✓ Betweenness concluído em {tempo_bc:.1f}s")

        pontos_articulacao = set(nx.articulation_points(grafo))
        print(f"   ✓ {len(pontos_articulacao)} pontos de articulação identificados")

    print("\n[5/8] Calculando ranking de criticidade (score multi-critério 4D)...")
    ranking_criticos = calcular_score_criticidade(
        grafo, betweenness, pontos_articulacao, percolacao_por_no
    )
    print(f"   ✓ {len(ranking_criticos)} nós ranqueados")

    print("\n[6/8] Simulando adição de redundância nos top 10 nós...")
    print("      (usando betweenness pré-calculado)")
    simulacoes_redundancia = []
    for item in tqdm(
        ranking_criticos[:10], desc="      Redundância", unit="nó", ncols=80, ascii=True
    ):
        sim = simular_adicao_redundancia(
            grafo,
            item["no"],
            k_arestas=3,
            betweenness_precalc=betweenness,
            pontos_art_precalc=pontos_articulacao,
        )
        if sim:
            simulacoes_redundancia.append({"no": item["no"], **sim})
    print(f"   ✓ {len(simulacoes_redundancia)} simulações concluídas")

    print("\n[7/8] Calculando ROI de mitigação...")
    roi_analises = calcular_roi_mitigacao(ranking_criticos)

    print("\n[8/8] Definindo stakeholders e gerando plano de ação...")
    stakeholders = definir_stakeholders_mitigacao(analises)
    plano_acao = gerar_plano_acao(
        ranking_criticos, roi_analises, stakeholders, classificacao_criticidade
    )

    # Compilar resultado
    resultado = {
        "resumo": {
            "total_nos_analisados": len(ranking_criticos),
            "nos_criticos_priorizados": 20,
            "investimento_total_estimado_mil": sum(
                p["custo_estimado_mil"] for p in plano_acao
            ),
            "roi_medio": round(np.mean([p["roi"] for p in plano_acao]), 2),
            "analise_4d_disponivel": percolacao_por_no is not None,
        },
        "ranking_criticidade": ranking_criticos[:50],
        "simulacoes_redundancia": simulacoes_redundancia,
        "analise_roi": roi_analises[:30],
        "matriz_stakeholders": stakeholders["matriz_stakeholders"],
        "plano_acao": plano_acao,
        "metodologia": {
            "score_criticidade_4d": "0.30×Percolação + 0.30×Articulação + 0.25×Betweenness + 0.15×Grau",
            "justificativa_teorica": {
                "percolacao_30": "Impacto empírico de fragmentação (teoria de percolação)",
                "articulacao_30": "Garantia de fragmentação (teoria de vértices de corte)",
                "betweenness_25": "Gargalo de fluxo com redundância (Lei de Kirchhoff)",
                "grau_15": "Sobrecarga local, facilmente mitigável",
            },
            "custo_base": "R$ 100 mil/nó + 10% por grau",
            "roi": "(Redução_Vulnerabilidade / Custo) × 100",
            "redundancia": "3 conexões a hubs não-vizinhos",
            "referencia": "Newman (2010), Watts & Strogatz (1998), Albert et al. (2000)",
        },
    }

    # Adicionar ranking 4D se disponível
    if classificacao_criticidade:
        resultado["ranking_criticidade_4d"] = {
            nivel: (
                [
                    item["no"]
                    for item in ranking_criticos
                    if item.get("criticidade_4d_nivel_1", False)
                ][:30]
                if "critico_maximo_4d" in nivel
                else []
            )
            for nivel in classificacao_criticidade.keys()
        }

    # Salvar JSON
    caminho_saida = "../ui/public/estrategia_mitigacao.json"
    with open(caminho_saida, "w", encoding="utf-8") as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("RESUMO EXECUTIVO")
    print("=" * 80)

    print("\n💰 Investimento:")
    print(
        f"   • Total estimado: R$ {resultado['resumo']['investimento_total_estimado_mil']:.0f} mil"
    )
    print(f"   • ROI médio: {resultado['resumo']['roi_medio']:.1f}%")

    print("\n🎯 Top 5 Prioridades:")
    for p in plano_acao[:5]:
        print(
            f"   {p['prioridade']}. Nó {p['no']} ({p['papel']}) - ROI: {p['roi']:.1f}%"
        )
        print(f"      Responsável: {p['responsavel_primario']}")
        print(
            f"      Custo: R$ {p['custo_estimado_mil']:.0f} mil | Prazo: {p['tempo_estimado']}"
        )

    print(f"\n✅ Resultado salvo em '{caminho_saida}'")
    print("=" * 80)


if __name__ == "__main__":
    main()
