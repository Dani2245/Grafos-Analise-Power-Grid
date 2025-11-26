// ============================================================
// PORTAS DO BACKEND
// ============================================================
const PORT_OTIMIZACAO = 5050;
const PORT_SIMULACAO  = 5051;

// ============================================================
// APP
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    const inputArquivo = document.getElementById('inputArquivo');
    const btnOtimizar = document.getElementById('btnOtimizar');
    const btnSimular = document.getElementById('btnSimular');
    const uploadArea = document.querySelector('.upload-area');
    const uploadText = uploadArea.querySelector('span');

    let arquivoCarregado = null;
    let resultadosOtimizacao = null;
    let grafoOtimizadoCompletoTexto = null;

    // Upload básico
    inputArquivo.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            arquivoCarregado = file;
            uploadText.textContent = `Arquivo carregado: ${file.name}`;
            uploadArea.style.borderColor = '#4CAF50';
            uploadArea.style.background = '#0B1F36';
            btnOtimizar.disabled = false;
            btnOtimizar.style.background = '#F77F00';
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.background = '#17385B';
        uploadArea.style.borderColor = '#5F8AA8';
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.style.background = '#10263F';
        uploadArea.style.borderColor = '#466A89';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.txt')) {
            inputArquivo.files = e.dataTransfer.files;
            arquivoCarregado = file;
            uploadText.textContent = `Arquivo carregado: ${file.name}`;
            uploadArea.style.borderColor = '#4CAF50';
            uploadArea.style.background = '#0B1F36';
            btnOtimizar.disabled = false;
            btnOtimizar.style.background = '#F77F00';
        } else {
            alert('Por favor, selecione um arquivo .TXT');
        }
    });

    // ============================================================
    // BOTÃO — OTIMIZAÇÃO
    // ============================================================
    btnOtimizar.addEventListener('click', async function() {
        if (!arquivoCarregado) {
            alert('Por favor, carregue um arquivo primeiro.');
            return;
        }

        btnOtimizar.textContent = 'Processando...';
        btnOtimizar.disabled = true;

        try {
            const formData = new FormData();
            formData.append('arquivo', arquivoCarregado);

            const response = await fetch(`http://127.0.0.1:${PORT_OTIMIZACAO}/otimizar`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

            const dados = await response.json();
            if (dados.erro) throw new Error(dados.erro);

            resultadosOtimizacao = dados;
            exibirResultadosOtimizacao(dados);

            btnSimular.disabled = false;
            btnSimular.style.background = '#C1121F';

        } catch (error) {
            console.error('Erro na otimização:', error);
            alert(`Erro ao processar otimização: ${error.message}`);
        } finally {
            btnOtimizar.textContent = 'Executar Otimização';
            btnOtimizar.disabled = false;
        }
    });

    // ============================================================
    // BOTÃO — SIMULAÇÃO
    // ============================================================
    btnSimular.addEventListener('click', async function() {
        if (!resultadosOtimizacao) {
            alert('Execute a otimização primeiro.');
            return;
        }
        await executarSimulacaoCompleta();
    });

    // ============================================================
    // EXIBIR RESULTADOS DA OTIMIZAÇÃO
    // ============================================================
    function exibirResultadosOtimizacao(dados) {
        let resultadosDiv = document.getElementById('resultadosOtimizacao');
        if (!resultadosDiv) {
            resultadosDiv = document.createElement('div');
            resultadosDiv.id = 'resultadosOtimizacao';
            resultadosDiv.className = 'resultados-area';
            document.querySelector('.card-otimizar').appendChild(resultadosDiv);
        }

        const tabela = gerarTabelaEstatisticas(dados.tabela_estatisticas);
        let html = `
            <h3>📊 Resultados da Otimização</h3>
            <div class="tabela-estatisticas">${tabela}</div>
            <h4>Ligações por Categoria</h4>
        `;

        for (const [categoria, ligacoes] of Object.entries(dados.novas_ligacoes)) {
            if (ligacoes.length > 0) {
                html += `
                    <div class="categoria-ligacoes">
                        <h5>${formatarCategoria(categoria)}: ${ligacoes.length} ligações</h5>
                        <div class="lista-ligacoes">
                `;
                ligacoes.slice(0, 5).forEach(lig => {
                    html += `<div class="ligacao">${lig[0]} ↔ ${lig[1]}</div>`;
                });
                if (ligacoes.length > 5) {
                    html += `<div class="mais-ligacoes">+ ${ligacoes.length - 5} outras ligações...</div>`;
                }
                html += `</div></div>`;
            }
        }

        html += `<button id="btnDownload" class="btn-download">📥 Download Grafo Otimizado</button>`;
        resultadosDiv.innerHTML = html;

        document.getElementById('btnDownload').addEventListener('click', baixarGrafoOtimizado);
    }

    function gerarTabelaEstatisticas(tabela) {
        if (!tabela) return '<div class="erro-tabela">Dados não disponíveis</div>';
        const n = tabela.Métrica.length;

        let html = `<table class="tabela-metricas">
            <thead><tr><th>Métrica</th><th>Original</th><th>Otimizado</th></tr></thead><tbody>`;

        for (let i = 0; i < n; i++) {
            html += `<tr>
                <td>${tabela.Métrica[i]}</td>
                <td>${tabela.Original[i]}</td>
                <td>${tabela.Otimizado[i]}</td>
            </tr>`;
        }

        html += `</tbody></table>`;
        return html;
    }

    // ============================================================
    // DOWNLOAD DO GRAFO
    // ============================================================
    async function obterGrafoOtimizadoCompleto(conteudoOriginal, novasLigacoes) {
        const response = await fetch(`http://127.0.0.1:${PORT_OTIMIZACAO}/download-grafo`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                conteudo_original: conteudoOriginal,
                novas_ligacoes: novasLigacoes
            })
        });

        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const dados = await response.json();
        if (dados.erro) throw new Error(dados.erro);

        grafoOtimizadoCompletoTexto = dados.conteudo;
        return dados.conteudo;
    }

    async function baixarGrafoOtimizado() {
        const conteudoOriginal = await lerArquivoComoTexto(arquivoCarregado);
        const conteudo = await obterGrafoOtimizadoCompleto(
            conteudoOriginal,
            resultadosOtimizacao.novas_ligacoes
        );

        const blob = new Blob([conteudo], {type: 'text/plain'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'grafo_otimizado_completo.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    function lerArquivoComoTexto(arquivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(arquivo);
        });
    }

    function formatarCategoria(categoria) {
        const nomes = {
            'hubs': 'Hubs Críticos',
            'geradores': 'Geradores',
            'transformadores': 'Transformadores',
            'grau': 'Nós de Alto Grau',
            'betweenness': 'Alta Betweenness',
            'articulacao': 'Pontos de Articulação',
            'percolacao': 'Pontos de Percolação',
            'prioridades': 'Prioridades'
        };
        return nomes[categoria] || categoria;
    }

    // ============================================================
    // SIMULAÇÃO COMPLETA
    // ============================================================
    async function executarSimulacaoCompleta() {
        try {
            btnSimular.textContent = 'Simulando...';
            btnSimular.disabled = true;

            const conteudoOriginal = await lerArquivoComoTexto(arquivoCarregado);
            const grafoFinal = await obterGrafoOtimizadoCompleto(
                conteudoOriginal,
                resultadosOtimizacao.novas_ligacoes
            );

            const payload = {
                grafo_original: conteudoOriginal,
                grafo_otimizado: grafoFinal
            };

            const response = await fetch(`http://127.0.0.1:${PORT_SIMULACAO}/simular`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

            const dados = await response.json();
            if (dados.erro) throw new Error(dados.erro);

            exibirResultadosSimulacao(dados);

        } catch (error) {
            console.error("Erro na simulação:", error);
            alert(`Erro ao executar simulação: ${error.message}`);
        } finally {
            btnSimular.textContent = 'Simular Falhas';
            btnSimular.disabled = false;
        }
    }

    // ============================================================
    // EXIBIR RESULTADOS DA SIMULAÇÃO
    // ============================================================
    function exibirResultadosSimulacao(dados) {
        let area = document.getElementById("resultadosSimulacao");
        if (!area) {
            area = document.createElement("div");
            area.id = "resultadosSimulacao";
            area.className = "resultados-area";
            document.querySelector('.card-simular').appendChild(area);
        }

        const tabela = dados.tabela_comparativa;
        
        let html = `
            <h3>⚡ ${tabela.titulo}</h3>
            <table class="tabela-metricas">
                <thead>
                    <tr>
                        ${tabela.colunas.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        tabela.linhas.forEach(linha => {
            html += `
                <tr>
                    <td>${linha.metrica}</td>
                    <td>${linha.original}</td>
                    <td>${linha.otimizado}</td>
                    <td class="${linha.diferenca > 0 ? 'diferenca-positiva' : linha.diferenca < 0 ? 'diferenca-negativa' : ''}">
                        ${linha.diferenca_formatada}
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;

        html += `
            <div class="info-simulacao">
                <h4>📋 Informações da Simulação</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Nós Críticos Afetados:</span>
                        <span class="info-value">${dados.configuracao_simulacao.nos_criticos_afetados}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Arestas Removidas (Original):</span>
                        <span class="info-value">${dados.configuracao_simulacao.arestas_removidas_original}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Arestas Removidas (Otimizado):</span>
                        <span class="info-value">${dados.configuracao_simulacao.arestas_removidas_otimizado}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Nível de Resiliência:</span>
                        <span class="info-value resiliencia-${dados.resumo.resiliência.toLowerCase()}">${dados.resumo.resiliência}</span>
                    </div>
                </div>
            </div>
        `;

        area.innerHTML = html;
    }

});
