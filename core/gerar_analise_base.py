import csv
import json
from collections import defaultdict
import numpy as np
from scipy import stats

def analisar_scale_free(graus):
    """
    Verifica se a rede apresenta características scale-free (livre de escala)
    através da análise power-law da distribuição de graus.
    
    Redes scale-free: P(k) ~ k^(-γ)
    """
    print("\n   Analisando distribuição scale-free (power-law)...")
    
    # Contar frequência de cada grau
    unique_graus, counts = np.unique(graus, return_counts=True)
    
    # Filtrar graus com count > 0 para log
    mask = counts > 0
    x = unique_graus[mask]
    y = counts[mask]
    
    # Análise log-log: log(P(k)) = -gamma * log(k) + C
    log_x = np.log(x)
    log_y = np.log(y)
    
    # Regressão linear
    slope, _, r_value, p_value, _ = stats.linregress(log_x, log_y)
    
    gamma = -slope  # Expoente da power-law
    r_squared = r_value ** 2
    
    # Critério: R² > 0.8 indica boa aderência à power-law
    eh_scale_free = r_squared > 0.8
    
    print(f"   • Expoente γ (gamma): {gamma:.3f}")
    print(f"   • R² (ajuste): {r_squared:.3f}")
    print(f"   • P-value: {p_value:.6f}")
    print(f"   • Classificação: {'SCALE-FREE' if eh_scale_free else 'NÃO SCALE-FREE'}")
    
    return {
        "eh_scale_free": bool(eh_scale_free),
        "expoente_gamma": round(gamma, 4),
        "r_quadrado": round(r_squared, 4),
        "p_value": round(p_value, 6),
        "interpretacao": (
            f"Rede apresenta características SCALE-FREE com expoente γ={gamma:.2f}"
            if eh_scale_free
            else f"Rede NÃO apresenta características scale-free (R²={r_squared:.2f} < 0.8)"
        ),
        "dados_log_log": [
            {"grau": int(k), "frequencia": int(f), "log_grau": round(lk, 3), "log_freq": round(lf, 3)}
            for k, f, lk, lf in zip(x, y, log_x, log_y)
        ]
    }

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
    for idx, hub in enumerate(hubs[:10], 1):
        print(f"  {idx}. Nó {hub}: grau {contagem_grau[hub]}")
    
    # Análise Scale-Free
    print("\n" + "=" * 60)
    print("ANÁLISE SCALE-FREE (POWER-LAW)")
    print("=" * 60)
    analise_sf = analisar_scale_free(graus)
    
    # Gerar dados para JSON
    dados_analise = {
        'estatisticas': {
            'total_nos': len(nos),
            'total_arestas': len(arestas),
            'grau_medio': round(grau_medio, 2),
            'grau_maximo': grau_maximo,
            'grau_minimo': grau_minimo
        },
        'scale_free_analysis': analise_sf,
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
