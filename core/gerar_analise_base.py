import csv
import json
from collections import defaultdict

def analisar_topologia_rede():
    """Analisa a estrutura da rede e gera JSON com estatísticas"""
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
    for grau in sorted(distribuicao_graus.keys())[:20]:
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
            {'grau': grau, 'quantidade': quantidade, 'percentual': round(quantidade/len(graus)*100, 2)}
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

if __name__ == '__main__':
    analisar_topologia_rede()
