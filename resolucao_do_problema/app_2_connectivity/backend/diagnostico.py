from flask import Flask, request, jsonify
import pandas as pd
import networkx as nx
import os
import tempfile
import json

app = Flask(__name__)

###############################################################################
# LÓGICA DE PROCESSAMENTO DE GRAFOS
###############################################################################

def carregar_grafo(conteudo_arquivo):
    """
    Carrega arquivo TXT e constrói grafo não-direcionado.
    Formato que esperamos de arquivo: duas colunas separadas por tabulação.
    """
    # Cria arquivo temporário para processamento
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as tmp:
        tmp.write(conteudo_arquivo)
        tmp_path = tmp.name
    
    try:
        # Lê dados e cria grafo
        df = pd.read_csv(tmp_path, sep="\t", header=None, names=["fonte", "alvo"])
        G = nx.Graph()
        G.add_edges_from(df.values)
        return G
    finally:
        os.unlink(tmp_path)  # Limpa arquivo temporário

def classificar_nos(G):
    """
    Classifica nós por função na rede baseado no grau (número de conexões).
    """
    graus = dict(G.degree())
    # 4 categorias baseadas na hierarquia de rede elétrica
    tipo_no = {"Consumidor": 0, "Transmissão": 0, "Transformador": 0, "Gerador/Usina": 0}
    
    for g in graus.values():
        if g == 1:
            tipo_no["Consumidor"] += 1        # Unidades consumidoras finais
        elif 2 <= g <= 3:
            tipo_no["Transmissão"] += 1       # Elementos de rede de distribuição
        elif 4 <= g <= 7:
            tipo_no["Transformador"] += 1     # Subestações transformadoras
        elif g >= 8:
            tipo_no["Gerador/Usina"] += 1     # Usinas geradoras
    
    return graus, tipo_no

def diagnostico(G, graus):
    """
    Analisa conectividade da rede identificando vulnerabilidades.
    """
    # Componentes conectados - verifica se rede está fragmentada
    num_componentes = nx.number_connected_components(G)
    componentes = list(nx.connected_components(G))
    maior_componente = max(componentes, key=len)
    Gcc = G.subgraph(maior_componente).copy()  # Foca no maior componente

    # Pontos de articulação - nós cuja remoção desconecta a rede
    articulacoes = list(nx.articulation_points(Gcc))
    articulacoes_tipo = {"Consumidor": 0, "Transmissão": 0, "Transformador": 0, "Gerador/Usina": 0}
    
    for no in articulacoes:
        g = graus[no]
        # Classifica cada ponto de articulação por tipo
        if g == 1:
            articulacoes_tipo["Consumidor"] += 1
        elif 2 <= g <= 3:
            articulacoes_tipo["Transmissão"] += 1
        elif 4 <= g <= 7:
            articulacoes_tipo["Transformador"] += 1
        elif g >= 8:
            articulacoes_tipo["Gerador/Usina"] += 1

    # Pontes - arestas cuja remoção desconecta a rede
    pontes = list(nx.bridges(Gcc))
    pontes_tipo = {"Consumidor": 0, "Transmissão": 0, "Transformador": 0, "Gerador/Usina": 0}
    
    for u, v in pontes:
        # Classifica ambos os nós de cada ponte
        for no in (u, v):
            g = graus[no]
            if g == 1:
                pontes_tipo["Consumidor"] += 1
            elif 2 <= g <= 3:
                pontes_tipo["Transmissão"] += 1
            elif 4 <= g <= 7:
                pontes_tipo["Transformador"] += 1
            elif g >= 8:
                pontes_tipo["Gerador/Usina"] += 1

    return {
        "num_componentes": num_componentes,
        "tamanho_maior_componente": len(maior_componente),
        "num_articulacoes": len(articulacoes),
        "articulacoes_tipo": articulacoes_tipo,
        "num_pontes": len(pontes),
        "pontes_tipo": pontes_tipo,
        "tamanhos_componentes": [len(comp) for comp in componentes]
    }

###############################################################################
# API ENDPOINTS - COMUNICAÇÃO COM FRONTEND
###############################################################################

@app.route('/diagnostico', methods=['POST'])
def executar_diagnostico():
    """
    Endpoint: recebe arquivo da rede e retorna diagnóstico completo.
    """
    try:
        if 'arquivo' not in request.files:
            return jsonify({"erro": "Nenhum arquivo enviado"}), 400
        
        arquivo = request.files['arquivo']
        if arquivo.filename == '':
            return jsonify({"erro": "Nome de arquivo vazio"}), 400
        
        # Processa arquivo e executa análise
        conteudo = arquivo.read().decode('utf-8')
        G = carregar_grafo(conteudo)
        graus, tipo_no = classificar_nos(G)
        diag = diagnostico(G, graus)
        
        # Monta resposta com todas as métricas
        resposta = {
            "status": "sucesso",
            "tipo_no": tipo_no,
            "diagnostico": diag,
            "estatisticas_gerais": {
                "total_nos": G.number_of_nodes(),
                "total_arestas": G.number_of_edges(),
                "densidade": nx.density(G)  # Mede quão conectada é a rede
            }
        }
        
        return jsonify(resposta)
        
    except Exception as e:
        return jsonify({"erro": f"Erro no processamento: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Verifica se serviço está online."""
    return jsonify({"status": "online", "servico": "diagnostico"})

###############################################################################
# INICIALIZAÇÃO DO SERVIÇO
###############################################################################

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)