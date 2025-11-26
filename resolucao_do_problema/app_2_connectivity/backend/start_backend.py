import subprocess
import sys
import time
import os

def start_backend(script_name, port):
    """Inicia um backend Flask em um processo separado"""
    try:
        print(f"Iniciando {script_name} na porta {port}...")
        
        # Usa o Python do sistema para executar o script
        process = subprocess.Popen([
            sys.executable, script_name
        ], cwd=os.path.dirname(os.path.abspath(__file__)))
        
        print(f"{script_name} iniciado (PID: {process.pid})")
        return process
    except Exception as e:
        print(f"Erro ao iniciar {script_name}: {e}")
        return None

def main():
    print("INICIANDO TODOS OS BACKENDS DO SISTEMA")
    print("=" * 50)
    
    # Lista de backends para iniciar
    backends = [
        {"script": "diagnostico.py", "port": 5000},
        {"script": "recomendacoes.py", "port": 5001},
        {"script": "otimizacao.py", "port": 5002}
    ]
    
    processes = []
    
    # Inicia cada backend
    for backend in backends:
        process = start_backend(backend["script"], backend["port"])
        if process:
            processes.append(process)
        time.sleep(2)  # Espera 2 segundos entre cada inicialização
    
    print("\n" + "=" * 50)
    print("TODOS OS BACKENDS INICIADOS")
    print("\nEndpoints disponíveis:")
    print("   • Diagnóstico:    http://127.0.0.1:5000/diagnostico")
    print("   • Recomendações:  http://127.0.0.1:5001/recomendacoes") 
    print("   • Otimização:     http://127.0.0.1:5002/otimizar")
    print("\nPressione Ctrl+C para parar todos os serviços")
    
    try:
        # Mantém o script rodando
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nParando todos os backends...")
        for process in processes:
            process.terminate()
        print("Backends finalizados!")

if __name__ == "__main__":
    main()