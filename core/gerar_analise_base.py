# -*- coding: utf-8 -*-
"""
Análise Básica da Rede Elétrica
Gera distribuição de graus e identifica hubs
"""

import csv
import json
from collections import defaultdict
import numpy as np
from scipy import stats
import sys

# Configurar encoding UTF-8 para output no Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass


def analisar_scale_free(graus):
    """
    Verifica se a rede apresenta características scale-free (livre de escala)
    através da análise power-law da distribuição de graus usando método rigoroso.

    Redes scale-free: P(k) ~ k^(-γ)

    Usa biblioteca powerlaw (Clauset-Shalizi-Newman algorithm) para detecção rigorosa.
    """
    print("\n   Analisando distribuição scale-free (power-law)...")

    # Contar frequência de cada grau
    unique_graus, counts = np.unique(graus, return_counts=True)

    # Filtrar graus com count > 0 para log
    mask = counts > 0
    x = unique_graus[mask]
    y = counts[mask]

    # === Método 1: Regressão Linear (método antigo, para comparação) ===
    log_x = np.log(x)
    log_y = np.log(y)
    slope, _, r_value, p_value, _ = stats.linregress(log_x, log_y)
    gamma_regressao = -slope
    r_squared = r_value ** 2

    # === Método 2: Powerlaw Library (rigoroso - Clauset-Shalizi-Newman) ===
    try:
        import powerlaw

        # Fit power-law aos dados
        fit = powerlaw.Fit(graus, discrete=True, verbose=False)

        # Expoente estimado
        gamma_powerlaw = fit.power_law.alpha

        # Valor mínimo (xmin) onde power-law começa
        xmin = fit.power_law.xmin

        # Teste de razão de verossimilhança: power-law vs exponencial
        R_exp, p_exp = fit.distribution_compare(
            'power_law', 'exponential', normalized_ratio=True)

        # Teste: power-law vs log-normal
        R_ln, p_ln = fit.distribution_compare(
            'power_law', 'lognormal', normalized_ratio=True)

        # Interpretação:
        # R > 0: power-law é melhor
        # R < 0: alternativa é melhor
        # p < 0.05: diferença significativa

        eh_scale_free_powerlaw = (R_exp > 0 and p_exp < 0.05)

        print(f"   • [Powerlaw] Expoente γ (alpha): {gamma_powerlaw:.3f}")
        print(f"   • [Powerlaw] xmin: {xmin}")
        print(f"   • [Powerlaw] R vs Exponencial: {R_exp:.3f} (p={p_exp:.4f})")
        print(f"   • [Powerlaw] R vs Log-Normal: {R_ln:.3f} (p={p_ln:.4f})")
        print(
            f"   • [Regressão Linear] Expoente γ: {gamma_regressao:.3f}, R²: {r_squared:.3f}")
        print(
            f"   • Classificação: {'SCALE-FREE (powerlaw)' if eh_scale_free_powerlaw else 'NÃO SCALE-FREE'}")

        powerlaw_disponivel = True

    except ImportError:
        print("   ⚠️  AVISO: Biblioteca 'powerlaw' não instalada. Usando método de regressão linear.")
        print("   💡 Recomendação: pip install powerlaw")
        powerlaw_disponivel = False
        eh_scale_free_powerlaw = r_squared > 0.8
        gamma_powerlaw = gamma_regressao
        xmin = min(graus)
        R_exp = None
        p_exp = None
        R_ln = None
        p_ln = None

    return {
        "metodo": "powerlaw_library" if powerlaw_disponivel else "regressao_linear",
        "eh_scale_free": bool(eh_scale_free_powerlaw),
        "expoente_gamma": round(gamma_powerlaw, 4),
        "xmin": int(xmin),
        "teste_vs_exponencial": {
            "R": round(R_exp, 4) if R_exp is not None else None,
            "p_value": round(p_exp, 4) if p_exp is not None else None,
            "powerlaw_melhor": bool(R_exp > 0) if R_exp is not None else None
        } if powerlaw_disponivel else None,
        "teste_vs_lognormal": {
            "R": round(R_ln, 4) if R_ln is not None else None,
            "p_value": round(p_ln, 4) if p_ln is not None else None,
            "powerlaw_melhor": bool(R_ln > 0) if R_ln is not None else None
        } if powerlaw_disponivel else None,
        "regressao_linear": {
            "expoente_gamma": round(gamma_regressao, 4),
            "r_quadrado": round(r_squared, 4),
            "p_value": round(p_value, 6)
        },
        "interpretacao": (
            f"Rede apresenta características SCALE-FREE (γ={gamma_powerlaw:.2f}, xmin={xmin})"
            if eh_scale_free_powerlaw
            else "Rede NÃO apresenta características scale-free clara (melhor ajuste: distribuição alternativa)"
        ),
        "dados_log_log": [
            {"grau": int(k), "frequencia": int(f), "log_grau": round(
                lk, 3), "log_freq": round(lf, 3)}
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
        print(
            f"  Grau {grau}: {quantidade} nós ({quantidade/len(graus)*100:.1f}%)")

    # Encontrar nós de alto grau (hubs)
    limiar_alto_grau = 8
    hubs = [no for no, grau in contagem_grau.items() if grau >=
            limiar_alto_grau]
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
            {'grau': grau, 'quantidade': quantidade,
                'percentual': round(quantidade/len(graus)*100, 2)}
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
