# -*- coding: utf-8 -*-
"""
Script Simples - Executa todas as análises em sequência
"""

import subprocess
import sys

# Configurar encoding UTF-8
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

# Scripts na ordem de execução
SCRIPTS = [
    "gerar_analise_base.py",
    "gerar_analise_avancada.py",
    "gerar_analise_comunidades.py",
    "gerar_analise_robustez.py",
    "gerar_analise_ataques.py",
    "gerar_inferencia_papeis.py",
    # "gerar_estrategia_mitigacao.py",
    "gerar_analise_direcionada.py",
    "gerar_analise_novo_dataset.py",
    "gerar_simulacao_falhas_novo.py",
    "gerar_comparacao_datasets.py",
    "gerar_grafos_2d.py"
]

print("=" * 80)
print("EXECUTANDO TODAS AS ANÁLISES")
print("=" * 80)

for idx, script in enumerate(SCRIPTS, 1):
    print(f"\n[{idx}/{len(SCRIPTS)}] Executando {script}...")
    print("-" * 80)

    resultado = subprocess.run([sys.executable, script])

    if resultado.returncode != 0:
        print(f"\nERRO em {script}")
        resposta = input("Continuar? [s/N]: ")
        if resposta.lower() != 's':
            break
    else:
        print(f"\n{script} concluído")

print("\n" + "=" * 80)
print("CONCLUÍDO")
print("=" * 80)
