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

    if grafo.number_of_nodes() == 0:
        print("❌ ERRO: Grafo vazio!")
        sys.exit(1)

    print(
        f"✓ Rede carregada: {grafo.number_of_nodes()} nós, {grafo.number_of_edges()} arestas")

    return grafo


def carregar_analises_existentes():
    """Carrega análises já computadas para enriquecer decisão"""
    analises = {}

    arquivos = {
        'criticidade': '../ui/public/analise_criticidade.json',
        'papeis': '../ui/public/inferencia_papeis.json',
        'comunidades': '../ui/public/analise_comunidades.json'
    }

    for nome, caminho in arquivos.items():
        if os.path.exists(caminho):
            with open(caminho, 'r', encoding='utf-8') as f:
                analises[nome] = json.load(f)
                print(f"   ✓ Carregado: {nome}")
        else:
            print(f"   ⚠️  Não encontrado: {nome} (usando defaults)")
            analises[nome] = None

    return analises


def calcular_score_criticidade(grafo, betweenness, pontos_articulacao):
    """
    Calcula score multi-critério de criticidade para cada nó

    Score = 0.4 × Betweenness_norm + 0.3 × IsArticulation + 0.3 × Degree_norm

    Pesos baseados em impacto:
    - Betweenness (40%): Fluxo crítico
    - Articulation (30%): Fragmentação estrutural  
    - Degree (30%): Conexões afetadas
    """
    print("   Calculando scores multi-critério...")

    graus = dict(grafo.degree())

    # Normalizar métricas [0, 1]
    max_betweenness = max(betweenness.values())
    max_grau = max(graus.values())

    betweenness_norm = {n: (b / max_betweenness if max_betweenness > 0 else 0)
                        for n, b in betweenness.items()}
    grau_norm = {n: (g / max_grau if max_grau > 0 else 0)
                 for n, g in graus.items()}

    # Calcular score combinado
    scores = {}
    for no in grafo.nodes():
        is_articulacao = 1.0 if no in pontos_articulacao else 0.0

        score = (0.4 * betweenness_norm[no] +
                 0.3 * is_articulacao +
                 0.3 * grau_norm[no])

        scores[no] = {
            'no': no,
            'score_total': round(score, 4),
            'betweenness': round(betweenness[no], 6),
            'betweenness_norm': round(betweenness_norm[no], 4),
            'grau': graus[no],
            'grau_norm': round(grau_norm[no], 4),
            'eh_articulacao': is_articulacao == 1.0
        }

    # Ordenar por score (mais crítico primeiro)
    ranking = sorted(
        scores.values(), key=lambda x: x['score_total'], reverse=True)

    print(f"   ✓ Scores calculados para {len(ranking)} nós")

    return ranking


def simular_adicao_redundancia(grafo, no_critico, k_arestas=3):
    """
    Simula adição de k arestas redundantes conectando nó crítico
    a outros nós estratégicos (hubs não-vizinhos).

    Avalia melhoria em:
    - Betweenness do nó (esperado: diminuir)
    - Conectividade algébrica (esperado: aumentar)
    - Articulação (esperado: pode deixar de ser ponto de articulação)
    """
    grafo_redundante = grafo.copy()

    # Identificar candidatos: nós de alto grau não conectados ao nó crítico
    vizinhos_atuais = set(grafo.neighbors(no_critico))
    graus = dict(grafo.degree())

    candidatos = [
        n for n in grafo.nodes()
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
    bc_antes = nx.betweenness_centrality(grafo, normalized=True)[no_critico]
    bc_depois = nx.betweenness_centrality(
        grafo_redundante, normalized=True)[no_critico]

    era_articulacao = no_critico in set(nx.articulation_points(grafo))
    eh_articulacao = no_critico in set(
        nx.articulation_points(grafo_redundante))

    return {
        'arestas_adicionadas': len(arestas_adicionadas),
        'detalhes_arestas': arestas_adicionadas,
        'betweenness_antes': round(bc_antes, 6),
        'betweenness_depois': round(bc_depois, 6),
        'reducao_betweenness': round((bc_antes - bc_depois) / bc_antes * 100, 2) if bc_antes > 0 else 0,
        'era_articulacao': era_articulacao,
        'eh_articulacao_apos': eh_articulacao,
        'eliminou_articulacao': era_articulacao and not eh_articulacao
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
        no = item['no']
        score = item['score_total']
        grau = item['grau']

        # Custo estimado (em milhares de R$)
        custo = custo_base * (1 + grau * 0.1)

        # Redução de vulnerabilidade (proporcional ao score)
        reducao_vulnerabilidade = score * 100  # Score [0,1] → [0,100]%

        # ROI básico
        roi = (reducao_vulnerabilidade / custo) * 100

        # Bônus se for articulação
        if item['eh_articulacao']:
            roi *= 1.5

        roi_analises.append({
            'no': no,
            'score_criticidade': round(score, 4),
            'reducao_vulnerabilidade_pct': round(reducao_vulnerabilidade, 2),
            'custo_estimado_mil': round(custo, 2),
            'roi': round(roi, 2),
            'prioridade': 'ALTA' if roi > 50 else 'MÉDIA' if roi > 20 else 'BAIXA'
        })

    # Ordenar por ROI
    roi_analises.sort(key=lambda x: x['roi'], reverse=True)

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
    papeis_disponiveis = analises.get('papeis') is not None

    if papeis_disponiveis:
        papel_por_no = {item['no']: item['papel']
                        for item in analises['papeis']['analise_detalhada']}
    else:
        papel_por_no = {}

    matriz_stakeholders = {
        'GERADOR': {
            'responsavel_primario': 'Operador de Geração',
            'responsavel_secundario': 'ANEEL (Regulador)',
            'investidor': 'Concessionária de Geração',
            'tempo_aprovacao': '6-12 meses',
            'complexidade': 'ALTA'
        },
        'TRANSFORMADOR': {
            'responsavel_primario': 'Operador de Transmissão',
            'responsavel_secundario': 'Distribuidora Local',
            'investidor': 'Concessionária de Transmissão',
            'tempo_aprovacao': '3-6 meses',
            'complexidade': 'MÉDIA'
        },
        'CONSUMIDOR': {
            'responsavel_primario': 'Distribuidora Local',
            'responsavel_secundario': 'Município',
            'investidor': 'Distribuidora',
            'tempo_aprovacao': '1-3 meses',
            'complexidade': 'BAIXA'
        },
        'LINHA_TRANSMISSAO': {
            'responsavel_primario': 'Operador de Transmissão',
            'responsavel_secundario': 'ONS (Operador Nacional do Sistema)',
            'investidor': 'Concessionária de Transmissão',
            'tempo_aprovacao': '3-6 meses',
            'complexidade': 'MÉDIA'
        },
        'DESCONHECIDO': {
            'responsavel_primario': 'A Definir (análise de campo)',
            'responsavel_secundario': 'Operador Regional',
            'investidor': 'A Definir',
            'tempo_aprovacao': 'Indefinido',
            'complexidade': 'INDEFINIDA'
        }
    }

    return {
        'matriz_stakeholders': matriz_stakeholders,
        'papel_por_no': papel_por_no if papeis_disponiveis else None
    }


def gerar_plano_acao(ranking_criticos, roi_analises, stakeholders):
    """
    Gera plano de ação priorizado para top 20 nós críticos
    """
    plano = []

    for idx, item in enumerate(ranking_criticos[:20], 1):
        no = item['no']

        # Encontrar ROI
        roi_item = next((r for r in roi_analises if r['no'] == no), None)

        # Identificar papel e stakeholder
        papel = stakeholders['papel_por_no'].get(
            no, 'DESCONHECIDO') if stakeholders['papel_por_no'] else 'DESCONHECIDO'
        stakeholder_info = stakeholders['matriz_stakeholders'][papel]

        plano.append({
            'prioridade': idx,
            'no': no,
            'score_criticidade': item['score_total'],
            'papel': papel,
            'acoes_recomendadas': [
                'Adicionar 3 conexões redundantes a hubs próximos',
                'Implementar sistema de backup de energia',
                'Monitoramento 24/7 com alertas em tempo real',
                'Plano de contingência para falha total'
            ] if item['eh_articulacao'] else [
                'Adicionar 2 conexões redundantes',
                'Monitoramento preventivo',
                'Manutenção programada prioritária'
            ],
            'responsavel_primario': stakeholder_info['responsavel_primario'],
            'responsavel_secundario': stakeholder_info['responsavel_secundario'],
            'investidor': stakeholder_info['investidor'],
            'tempo_estimado': stakeholder_info['tempo_aprovacao'],
            'complexidade': stakeholder_info['complexidade'],
            'roi': roi_item['roi'] if roi_item else 0,
            'custo_estimado_mil': roi_item['custo_estimado_mil'] if roi_item else 0
        })

    return plano


def main():
    print("=" * 80)
    print("ESTRATÉGIA DE MITIGAÇÃO DE INFRAESTRUTURA")
    print("=" * 80)

    print("\n[1/7] Carregando rede elétrica...")
    grafo = carregar_rede()

    print("\n[2/7] Carregando análises existentes...")
    analises = carregar_analises_existentes()

    print("\n[3/7] Calculando betweenness e pontos de articulação...")
    betweenness = nx.betweenness_centrality(grafo, normalized=True)
    pontos_articulacao = set(nx.articulation_points(grafo))
    print(f"   ✓ {len(pontos_articulacao)} pontos de articulação identificados")

    print("\n[4/7] Calculando ranking de criticidade (score multi-critério)...")
    ranking_criticos = calcular_score_criticidade(
        grafo, betweenness, pontos_articulacao)

    print("\n[5/7] Simulando adição de redundância nos top 10 nós...")
    simulacoes_redundancia = []
    for item in ranking_criticos[:10]:
        sim = simular_adicao_redundancia(grafo, item['no'], k_arestas=3)
        if sim:
            simulacoes_redundancia.append({
                'no': item['no'],
                **sim
            })
    print(f"   ✓ {len(simulacoes_redundancia)} simulações concluídas")

    print("\n[6/7] Calculando ROI de mitigação...")
    roi_analises = calcular_roi_mitigacao(ranking_criticos)

    print("\n[7/7] Definindo stakeholders e gerando plano de ação...")
    stakeholders = definir_stakeholders_mitigacao(analises)
    plano_acao = gerar_plano_acao(ranking_criticos, roi_analises, stakeholders)

    # Compilar resultado
    resultado = {
        'resumo': {
            'total_nos_analisados': len(ranking_criticos),
            'nos_criticos_priorizados': 20,
            'investimento_total_estimado_mil': sum(p['custo_estimado_mil'] for p in plano_acao),
            'roi_medio': round(np.mean([p['roi'] for p in plano_acao]), 2)
        },
        'ranking_criticidade': ranking_criticos[:50],
        'simulacoes_redundancia': simulacoes_redundancia,
        'analise_roi': roi_analises[:30],
        'matriz_stakeholders': stakeholders['matriz_stakeholders'],
        'plano_acao': plano_acao,
        'metodologia': {
            'score_criticidade': '0.4×Betweenness + 0.3×Articulacao + 0.3×Grau',
            'custo_base': 'R$ 100 mil/nó + 10% por grau',
            'roi': '(Redução_Vulnerabilidade / Custo) × 100',
            'redundancia': '3 conexões a hubs não-vizinhos'
        }
    }

    # Salvar JSON
    caminho_saida = '../ui/public/estrategia_mitigacao.json'
    with open(caminho_saida, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("RESUMO EXECUTIVO")
    print("=" * 80)

    print("\n💰 Investimento:")
    print(
        f"   • Total estimado: R$ {resultado['resumo']['investimento_total_estimado_mil']:.0f} mil")
    print(f"   • ROI médio: {resultado['resumo']['roi_medio']:.1f}%")

    print("\n🎯 Top 5 Prioridades:")
    for p in plano_acao[:5]:
        print(
            f"   {p['prioridade']}. Nó {p['no']} ({p['papel']}) - ROI: {p['roi']:.1f}%")
        print(f"      Responsável: {p['responsavel_primario']}")
        print(
            f"      Custo: R$ {p['custo_estimado_mil']:.0f} mil | Prazo: {p['tempo_estimado']}")

    print(f"\n✅ Resultado salvo em '{caminho_saida}'")
    print("=" * 80)


if __name__ == '__main__':
    main()
