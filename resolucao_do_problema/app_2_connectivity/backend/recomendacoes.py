from flask import Flask, request, jsonify
import json

app = Flask(__name__)

###############################################################################
# LÓGICA DE NEGÓCIO - ALGORITMOS DE ANÁLISE
###############################################################################

def gerar_solucoes_detalhadas(diagnostico_data):
    """
    Gera recomendações estratégicas baseadas no diagnóstico da rede.
    Trabalha apenas com dados já processados - não recarrega o grafo.
    """
    diagnostico = diagnostico_data['diagnostico']
    tipo_no = diagnostico_data['tipo_no']
    
    solucoes = []
    
    # 1. Componentes isolados - rede fragmentada
    if diagnostico["num_componentes"] > 1:
        solucoes.append({
            "id": "comp_isolados",
            "tipo": "componente",
            "prioridade": "alta",
            "titulo": "Componentes Isolados na Rede",
            "descricao": f"A rede está dividida em {diagnostico['num_componentes']} componentes desconectados. {diagnostico['tamanho_maior_componente']} consumidores estão no componente principal.",
            "acao": "Conectar os componentes menores ao componente principal através de novas linhas de transmissão.",
            "beneficio": "Garantir fornecimento para 100% dos consumidores",
            "complexidade": "media"
        })
    
    # 2. Pontos de articulação - falha divide a rede
    if diagnostico["num_articulacoes"] > 0:
        solucoes.append({
            "id": "articulacoes",
            "tipo": "articulacao", 
            "prioridade": "alta",
            "titulo": "Pontos de Articulação Críticos",
            "descricao": f"Existem {diagnostico['num_articulacoes']} pontos de articulação na rede. A falha em qualquer um deles divide a rede.",
            "acao": "Adicionar conexões alternativas para bypassar estes pontos críticos, especialmente transformadores.",
            "beneficio": f"Reduzir vulnerabilidade em {diagnostico['num_articulacoes']} pontos estratégicos",
            "complexidade": "alta"
        })
    
    # 3. Pontes - linhas únicas entre componentes
    if diagnostico["num_pontes"] > 0:
        solucoes.append({
            "id": "pontes",
            "tipo": "ponte",
            "prioridade": "alta", 
            "titulo": "Linhas de Transmissão Críticas",
            "descricao": f"Existem {diagnostico['num_pontes']} pontes (linhas únicas entre componentes). A falha em qualquer uma isola partes da rede.",
            "acao": "Duplicar estas linhas ou criar rotas alternativas paralelas.",
            "beneficio": "Aumentar redundância e confiabilidade do fornecimento",
            "complexidade": "media"
        })
    
    # 4. Consumidores vulneráveis
    consumidores_totais = tipo_no.get('Consumidor', 0)
    consumidores_em_articulacao = diagnostico["articulacoes_tipo"].get('Consumidor', 0)
    
    if consumidores_em_articulacao > 0:
        # Consumidores em locais críticos da rede
        solucoes.append({
            "id": "consumidores_criticos",
            "tipo": "consumidor",
            "prioridade": "alta",
            "titulo": "Consumidores em Pontos Críticos",
            "descricao": f"{consumidores_em_articulacao} consumidores estão localizados em pontos de articulação (locais críticos da rede).",
            "acao": "Criar alimentadores alternativos para estes consumidores estratégicos.",
            "beneficio": "Proteger consumidores em locais vulneráveis da rede",
            "complexidade": "media"
        })
    elif consumidores_totais > 1000:
        # Rede com muitos consumidores - atenção geral
        solucoes.append({
            "id": "consumidores_rede",
            "tipo": "consumidor", 
            "prioridade": "media",
            "titulo": "Grande Quantidade de Consumidores",
            "descricao": f"A rede atende {consumidores_totais} consumidores. Consumidores com grau 1 são mais vulneráveis a falhas.",
            "acao": "Monitorar consumidores com conexão única e considerar redundância para consumidores essenciais.",
            "beneficio": "Aumentar confiabilidade do fornecimento",
            "complexidade": "baixa"
        })
    
    return solucoes

###############################################################################
# API ENDPOINTS - COMUNICAÇÃO COM FRONTEND
###############################################################################

@app.route('/recomendacoes', methods=['POST'])
def gerar_recomendacoes():
    """
    Endpoint: gera recomendações instantâneas baseadas no diagnóstico.
    Não processa o grafo novamente - usa dados pré-computados.
    """
    dados_diagnostico = request.form.get('diagnostico') # Recebe o JSON de diagnostico
    
    if not dados_diagnostico:
        return jsonify({"erro": "Diagnóstico não fornecido"}), 400
    
    # Converte JSON do diagnóstico
    diagnostico_data = json.loads(dados_diagnostico) # Converte para dicionário
    
    # Gera recomendações baseadas nas métricas
    solucoes = gerar_solucoes_detalhadas(diagnostico_data)
    
    resposta = {
        "status": "sucesso",
        "solucoes": solucoes,
        "resumo": {
            "total_recomendacoes": len(solucoes),
            "prioridade_alta": len([s for s in solucoes if s['prioridade'] == 'alta']),
            "prioridade_media": len([s for s in solucoes if s['prioridade'] == 'media'])
        }
    }
    
    return jsonify(resposta)

@app.route('/health', methods=['GET'])
def health_check():
    """Verifica se serviço está online."""
    return jsonify({"status": "online", "servico": "recomendacoes"})

###############################################################################
# INICIALIZAÇÃO DO SERVIÇO
###############################################################################

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=False)