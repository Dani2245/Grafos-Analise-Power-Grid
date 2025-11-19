"""
Inferência de Papéis dos Nós na Rede Elétrica
Classifica nós como: Geradores, Transformadores, Linhas de Transmissão, Consumidores
Baseado em métricas topológicas: grau, betweenness, clustering, posição na comunidade
"""

import networkx as nx
import csv
import json
from typing import Dict, List


def carregar_grafo(arquivo: str) -> nx.Graph:
    """Carrega o grafo a partir do arquivo CSV"""
    grafo = nx.Graph()
    with open(arquivo, 'r', encoding='utf-8') as f:
        leitor_csv = csv.reader(f)
        for linha in leitor_csv:
            origem, destino = int(linha[0]), int(linha[1])
            grafo.add_edge(origem, destino)
    return grafo


def carregar_comunidades(arquivo: str) -> Dict:
    """Carrega análise de comunidades do JSON"""
    with open(arquivo, 'r', encoding='utf-8') as f:
        return json.load(f)


def carregar_criticidade(arquivo: str) -> Dict:
    """Carrega análise de criticidade do JSON"""
    with open(arquivo, 'r', encoding='utf-8') as f:
        return json.load(f)


def inferir_papel_no(grau: int, betweenness: float,
                     clustering: float, eh_articulacao: bool,
                     eh_hub_comunidade: bool) -> str:
    """
    Infere o papel do nó baseado em suas características topológicas

    Lógica de classificação:
    - CONSUMIDOR: grau = 1 (nó terminal)
    - GERADOR: grau alto (≥8), hub da comunidade, alta betweenness
    - TRANSFORMADOR: grau moderado (4-7), ponto de articulação ou alta betweenness
    - LINHA_TRANSMISSAO: grau baixo (2-3), baixo clustering, não é articulação
    """

    # CONSUMIDOR: nó terminal (grau 1)
    if grau == 1:
        return 'CONSUMIDOR'

    # GERADOR: hub altamente conectado e central
    if grau >= 8 and (eh_hub_comunidade or betweenness > 0.01):
        return 'GERADOR'

    # TRANSFORMADOR: grau moderado com função crítica
    if grau >= 4 and grau <= 7:
        # Se é ponto de articulação ou tem alta betweenness, provavelmente é transformador
        if eh_articulacao or betweenness > 0.005:
            return 'TRANSFORMADOR'
        # Se tem clustering moderado, pode ser subestação
        if clustering > 0.1:
            return 'TRANSFORMADOR'

    # LINHA_TRANSMISSAO: grau baixo, função de conexão simples
    if grau >= 2 and grau <= 3:
        # Baixo clustering indica que não forma triângulos (característica de linha)
        if clustering < 0.1:
            return 'LINHA_TRANSMISSAO'
        # Se tem clustering mas não é crítico, ainda pode ser linha
        if not eh_articulacao and betweenness < 0.001:
            return 'LINHA_TRANSMISSAO'

    # TRANSFORMADOR por padrão para casos intermediários
    # (grau 4-7, ou grau 2-3 com características especiais)
    return 'TRANSFORMADOR'


def classificar_nos(grafo: nx.Graph, analise_comunidades: Dict) -> Dict[int, Dict]:
    """Classifica todos os nós do grafo"""
    print("🔍 Calculando métricas necessárias...")

    # Métricas básicas
    graus = dict(grafo.degree())

    # Betweenness centrality
    print("  - Calculando betweenness centrality...")
    betweenness = nx.betweenness_centrality(grafo, normalized=True)

    # Clustering coefficient
    print("  - Calculando clustering coefficient...")
    clustering = nx.clustering(grafo)

    # Pontos de articulação
    print("  - Identificando pontos de articulação...")
    pontos_articulacao = set(nx.articulation_points(grafo))

    # Mapeia nós para comunidades e identifica hubs
    print("  - Mapeando comunidades e hubs...")
    no_para_comunidade = {}
    hubs_comunidades = set()

    for comunidade in analise_comunidades['comunidades']:
        com_id = comunidade['id']
        # Pega top 3 hubs de cada comunidade
        for hub_info in comunidade['top_hubs'][:3]:
            no = hub_info['no']
            hubs_comunidades.add(no)
            no_para_comunidade[no] = com_id

        # Mapeia todos os nós da comunidade
        for no in comunidade['nos']:
            if no not in no_para_comunidade:
                no_para_comunidade[no] = com_id

    # Classifica cada nó
    print("  - Classificando nós...")
    classificacao = {}

    for no in grafo.nodes():
        papel = inferir_papel_no(
            grau=graus[no],
            betweenness=betweenness.get(no, 0.0),
            clustering=clustering.get(no, 0.0),
            eh_articulacao=(no in pontos_articulacao),
            eh_hub_comunidade=(no in hubs_comunidades),
        )

        classificacao[no] = {
            'papel': papel,
            'grau': graus[no],
            'betweenness': betweenness.get(no, 0.0),
            'clustering': clustering.get(no, 0.0),
            'eh_articulacao': (no in pontos_articulacao),
            'eh_hub_comunidade': (no in hubs_comunidades),
            'comunidade_id': no_para_comunidade.get(no, -1)
        }

    return classificacao


def gerar_estatisticas_papeis(classificacao: Dict[int, Dict]) -> Dict:
    """Gera estatísticas sobre a distribuição de papéis"""

    contagem_papeis = {
        'CONSUMIDOR': 0,
        'GERADOR': 0,
        'TRANSFORMADOR': 0,
        'LINHA_TRANSMISSAO': 0
    }

    # Lista de nós por papel
    nos_por_papel = {
        'CONSUMIDOR': [],
        'GERADOR': [],
        'TRANSFORMADOR': [],
        'LINHA_TRANSMISSAO': []
    }

    # Métricas por papel
    metricas_por_papel = {
        'CONSUMIDOR': {'graus': [], 'betweenness': [], 'clustering': []},
        'GERADOR': {'graus': [], 'betweenness': [], 'clustering': []},
        'TRANSFORMADOR': {'graus': [], 'betweenness': [], 'clustering': []},
        'LINHA_TRANSMISSAO': {'graus': [], 'betweenness': [], 'clustering': []}
    }

    for no, info in classificacao.items():
        papel = info['papel']
        contagem_papeis[papel] += 1
        nos_por_papel[papel].append(no)

        metricas_por_papel[papel]['graus'].append(info['grau'])
        metricas_por_papel[papel]['betweenness'].append(info['betweenness'])
        metricas_por_papel[papel]['clustering'].append(info['clustering'])

    # Calcula médias
    import numpy as np
    estatisticas = {}

    total_nos = len(classificacao)

    for papel in contagem_papeis.keys():
        quantidade = contagem_papeis[papel]
        percentual = (quantidade / total_nos * 100) if total_nos > 0 else 0

        graus = metricas_por_papel[papel]['graus']
        betweenness = metricas_por_papel[papel]['betweenness']
        clustering = metricas_por_papel[papel]['clustering']

        estatisticas[papel] = {
            'quantidade': quantidade,
            'percentual': percentual,
            'grau_medio': float(np.mean(graus)) if graus else 0.0,
            'grau_min': int(min(graus)) if graus else 0,
            'grau_max': int(max(graus)) if graus else 0,
            'betweenness_medio': float(np.mean(betweenness)) if betweenness else 0.0,
            'clustering_medio': float(np.mean(clustering)) if clustering else 0.0
        }

    return {
        'contagem': contagem_papeis,
        'estatisticas': estatisticas,
        'nos_por_papel': nos_por_papel
    }


def listar_top_nos_por_papel(classificacao: Dict[int, Dict],
                             papel: str, top_n: int = 20) -> List[Dict]:
    """Lista os top N nós de um determinado papel"""
    nos_papel = [(no, info) for no, info in classificacao.items()
                 if info['papel'] == papel]

    # Ordena por betweenness (importância)
    nos_papel.sort(key=lambda x: x[1]['betweenness'], reverse=True)

    resultado = []
    for no, info in nos_papel[:top_n]:
        resultado.append({
            'no': no,
            'grau': info['grau'],
            'betweenness': info['betweenness'],
            'clustering': info['clustering'],
            'eh_articulacao': info['eh_articulacao'],
            'comunidade_id': info['comunidade_id']
        })

    return resultado


def analisar_interacoes_papeis(grafo: nx.Graph, classificacao: Dict[int, Dict]) -> Dict:
    """Analisa como diferentes papéis interagem entre si"""

    interacoes = {
        'CONSUMIDOR': {'CONSUMIDOR': 0, 'GERADOR': 0, 'TRANSFORMADOR': 0, 'LINHA_TRANSMISSAO': 0},
        'GERADOR': {'CONSUMIDOR': 0, 'GERADOR': 0, 'TRANSFORMADOR': 0, 'LINHA_TRANSMISSAO': 0},
        'TRANSFORMADOR': {'CONSUMIDOR': 0, 'GERADOR': 0, 'TRANSFORMADOR': 0, 'LINHA_TRANSMISSAO': 0},
        'LINHA_TRANSMISSAO': {'CONSUMIDOR': 0, 'GERADOR': 0, 'TRANSFORMADOR': 0, 'LINHA_TRANSMISSAO': 0}
    }

    for origem, destino in grafo.edges():
        papel_origem = classificacao[origem]['papel']
        papel_destino = classificacao[destino]['papel']

        interacoes[papel_origem][papel_destino] += 1
        # Não conta duas vezes (grafo não direcionado)
        if papel_origem != papel_destino:
            interacoes[papel_destino][papel_origem] += 1

    return interacoes


def main():
    print("=" * 80)
    print("INFERÊNCIA DE PAPÉIS DOS NÓS NA REDE ELÉTRICA")
    print("=" * 80)

    # Carrega grafo
    print("\n📂 Carregando grafo...")
    grafo = carregar_grafo('powergrid.edgelist.csv')
    print(
        f"✓ Grafo carregado: {len(grafo.nodes())} nós, {len(grafo.edges())} arestas")

    # Carrega análises anteriores
    print("\n📂 Carregando análises anteriores...")
    analise_comunidades = carregar_comunidades(
        '../ui/public/analise_comunidades.json')

    # Classifica nós
    print("\n🏷️ Classificando nós por papel...")
    classificacao = classificar_nos(grafo, analise_comunidades)

    # Gera estatísticas
    print("\n📊 Gerando estatísticas...")
    estatisticas = gerar_estatisticas_papeis(classificacao)

    # Top nós por papel
    print("\n🏆 Listando top nós por papel...")
    top_geradores = listar_top_nos_por_papel(classificacao, 'GERADOR', 20)
    top_transformadores = listar_top_nos_por_papel(
        classificacao, 'TRANSFORMADOR', 20)
    top_linhas = listar_top_nos_por_papel(
        classificacao, 'LINHA_TRANSMISSAO', 20)

    # Analisa interações
    print("\n🔗 Analisando interações entre papéis...")
    interacoes = analisar_interacoes_papeis(grafo, classificacao)

    # Monta resultado
    # Converte classificacao para formato serializável
    classificacao_serializable = {
        str(no): info for no, info in classificacao.items()
    }

    resultado = {
        'total_nos': len(grafo.nodes()),
        'estatisticas_gerais': estatisticas['estatisticas'],
        'contagem_papeis': estatisticas['contagem'],
        'top_geradores': top_geradores,
        'top_transformadores': top_transformadores,
        'top_linhas_transmissao': top_linhas,
        'interacoes_papeis': interacoes,
        'classificacao_completa': classificacao_serializable
    }

    # Salva resultado
    caminho_saida = '../ui/public/inferencia_papeis.json'
    with open(caminho_saida, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("DISTRIBUIÇÃO DE PAPÉIS NA REDE")
    print("=" * 80)
    for papel, stats in estatisticas['estatisticas'].items():
        print(f"\n{papel}:")
        print(
            f"  - Quantidade: {stats['quantidade']} ({stats['percentual']:.1f}%)")
        print(
            f"  - Grau médio: {stats['grau_medio']:.2f} (min: {stats['grau_min']}, max: {stats['grau_max']})")
        print(f"  - Betweenness médio: {stats['betweenness_medio']:.6f}")
        print(f"  - Clustering médio: {stats['clustering_medio']:.4f}")

    print(f"\n✅ Inferência de papéis salva em '{caminho_saida}'")


if __name__ == '__main__':
    main()
