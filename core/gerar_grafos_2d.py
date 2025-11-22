# -*- coding: utf-8 -*-
"""
Geração de Visualizações 2D dos Hubs da Rede
Cria grafos interativos com PyVis
"""

import json
import csv
import random
from collections import defaultdict
from pyvis.network import Network
import sys

# Configurar encoding UTF-8 para output no Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass


def ajustar_cor_fundo_html(caminho_arquivo):
    """Ajusta a cor de fundo do HTML para #222222 e remove bordas claras"""
    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
        conteudo = f.read()

    # Ajustar a cor de fundo do body no HTML
    conteudo = conteudo.replace(
        '<body>', '<body style="background-color: #222222; margin: 0; padding: 0;">')

    # Ajustar a borda do container do grafo
    conteudo = conteudo.replace(
        'border: 1px solid lightgray;',
        'border: 1px solid #222222;')

    # Ajustar a borda do card
    conteudo = conteudo.replace(
        '<div class="card" style="width: 100%">',
        '<div class="card" style="width: 100%; border: 0px;">')

    with open(caminho_arquivo, 'w', encoding='utf-8') as f:
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
    with open('powergrid.edgelist.csv', 'r', encoding='utf-8') as arquivo:
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
        print(
            f"  Grau {grau}: {quantidade} nós ({quantidade/len(graus)*100:.1f}%)")

    # Encontrar nós de alto grau (hubs)
    limiar_alto_grau = 8
    hubs = [no for no, grau in contagem_grau.items() if grau >=
            limiar_alto_grau]
    hubs.sort(key=lambda x: contagem_grau[x], reverse=True)

    print(f"\nNúmero de hubs (grau >= {limiar_alto_grau}): {len(hubs)}")
    print("Top 10 hubs:")
    for i, hub in enumerate(hubs[:10]):
        print(f"  Nó {hub}: grau {contagem_grau[hub]}")

    # Gerar dados para JSON
    dados_analise = {
        'estatisticas': {
            'total_nos': len(nos),
            'total_arestas': len(arestas),
            'grau_medio': round(grau_medio, 2),
            'grau_maximo': grau_maximo,
            'grau_minimo': grau_minimo
        },
        'distribuicao_graus': [
            {'grau': grau, 'quantidade': quantidade,
                'percentual': round(quantidade / len(graus) * 100, 2)}
            for grau, quantidade in sorted(distribuicao_graus.items())
        ],
        'top_hubs': [
            {'no': hub, 'grau': contagem_grau[hub]}
            for hub in hubs[:20]
        ],
        'todos_nos': [
            {'no': no, 'grau': contagem_grau[no]}
            for no in sorted(nos)
        ]
    }

    # Salvar em JSON
    with open('../ui/public/analise_basica.json', 'w', encoding='utf-8') as f:
        json.dump(dados_analise, f, indent=2, ensure_ascii=False)

    print("\n✅ Análise básica salva em '../ui/public/analise_basica.json'")

    return arestas, contagem_grau, hubs


def criar_grafos_vizinhanca_geradores(
        arestas,
        contagem_grau,
        hubs,
        tamanho_vizinhanca=2):
    """Cria grafos centrados nos geradores/usinas (nós de alto grau)"""

    # Construir lista de adjacência
    grafo = defaultdict(set)
    for origem, destino in arestas:
        grafo[origem].add(destino)
        grafo[destino].add(origem)

    def obter_vizinhanca(no_central, saltos_maximos=2):
        """Obtém nós dentro de saltos_maximos a partir do no_central"""
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
            if not nivel_atual:  # Não há mais nós para explorar
                break

        return vizinhanca

    grafos_criados = 0
    max_grafos = 20  # Limitar número de grafos a criar

    for i, hub in enumerate(hubs[:max_grafos]):
        print(
            f"Criando grafo para gerador/usina {hub} (grau {contagem_grau[hub]})...")

        # Obter vizinhança ao redor deste gerador
        vizinhanca = obter_vizinhanca(hub, tamanho_vizinhanca)

        if len(vizinhanca) > 200:  # Ainda muito grande
            # Amostrar a vizinhança
            vizinhanca = set(random.sample(list(vizinhanca), 200))
            vizinhanca.add(hub)  # Sempre incluir o gerador

        # Criar rede para esta vizinhança
        rede = Network(
            height="600px",
            width="100%",
            bgcolor="#222222",
            font_color="white")
        rede.set_options("""
        var options = {
          "physics": {
            "enabled": true,
            "stabilization": {"iterations": 100}
          }
        }
        """)

        # Adicionar nós com cores diferentes baseadas no grau
        for id_no in vizinhanca:
            grau = contagem_grau[id_no]
            cor, tamanho = obter_cor_tamanho_por_grau(grau)

            # Destacar o hub central
            if id_no == hub:
                rotulo = f'⚡ HUB {id_no}\n(Grau: {grau})'
                rede.add_node(id_no, label=rotulo, color='#FF0000', size=30,
                              title=f'Hub Principal - Grau: {grau}')
            else:
                rotulo = f'Nó {id_no}\n(Grau: {grau})'
                rede.add_node(id_no, label=rotulo, color=cor, size=tamanho,
                              title=f'Nó {id_no} - Grau: {grau}')

        # Adicionar arestas dentro desta vizinhança
        arestas_adicionadas = 0
        for origem, destino in arestas:
            if origem in vizinhanca and destino in vizinhanca:
                rede.add_edge(origem, destino)
                arestas_adicionadas += 1

        # Salvar o grafo
        nome_arquivo = f'../ui/public/rede_hub_{hub}_grau_{contagem_grau[hub]}.html'
        rede.save_graph(nome_arquivo)
        ajustar_cor_fundo_html(nome_arquivo)
        print(
            f"  Criado {nome_arquivo} com {len(vizinhanca)} nós e {arestas_adicionadas} arestas")
        grafos_criados += 1

    return grafos_criados


def criar_grafo_rede():
    """Função principal para analisar e criar grafos da rede"""
    print("Analisando topologia da rede...")
    arestas, contagem_grau, hubs = analisar_topologia_rede()

    print("\nCriando grafos centrados em hubs...")
    criar_grafos_vizinhanca_geradores(arestas, contagem_grau, hubs)


if __name__ == '__main__':
    criar_grafo_rede()
