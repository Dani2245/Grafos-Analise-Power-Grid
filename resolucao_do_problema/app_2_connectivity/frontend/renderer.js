const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const btnDiagnostico = document.getElementById('btnDiagnostico');
const btnRecomendacoes = document.getElementById('btnRecomendacoes');
const btnOtimizar = document.getElementById('btnOtimizar');
const btnDownload = document.getElementById('btnDownload');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultados = document.getElementById('resultados');
const resultadoOtimizacao = document.getElementById('resultadoOtimizacao');

let currentFile = null;
let diagnosticoData = null;
let grafoOtimizado = null;

fileInput.addEventListener('change', (event) => {
    currentFile = event.target.files[0];
    if (currentFile) {
        fileName.textContent = `Arquivo: ${currentFile.name}`;
        btnDiagnostico.disabled = false;
        btnRecomendacoes.disabled = true;
        btnOtimizar.disabled = true;
        resultados.classList.add('hidden');
        resultadoOtimizacao.classList.add('hidden');
        diagnosticoData = null;
        grafoOtimizado = null;
    }
});

btnDiagnostico.addEventListener('click', async () => {
    if (!currentFile) return;
    
    loadingOverlay.classList.remove('hidden');
    btnDiagnostico.disabled = true;
    
    const formData = new FormData();
    formData.append('arquivo', currentFile);
    
    const response = await fetch('http://127.0.0.1:5000/diagnostico', {
        method: 'POST',
        body: formData
    });
    
    diagnosticoData = await response.json();
    exibirDiagnostico(diagnosticoData);
    
    btnRecomendacoes.disabled = false;
    btnOtimizar.disabled = false;
    resultados.classList.remove('hidden');
    loadingOverlay.classList.add('hidden');
    btnDiagnostico.disabled = false;
});

btnRecomendacoes.addEventListener('click', async () => {
    if (!currentFile || !diagnosticoData) return;
    
    loadingOverlay.classList.remove('hidden');
    btnRecomendacoes.disabled = true;
    
    const formData = new FormData();
    formData.append('arquivo', currentFile);
    formData.append('diagnostico', JSON.stringify(diagnosticoData));
    
    const response = await fetch('http://127.0.0.1:5001/recomendacoes', {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    exibirRecomendacoes(data);
    
    document.querySelector('[data-tab="recomendacoes"]').click();
    loadingOverlay.classList.add('hidden');
    btnRecomendacoes.disabled = false;
});

btnOtimizar.addEventListener('click', async () => {
    if (!currentFile || !diagnosticoData) return;
    
    loadingOverlay.classList.remove('hidden');
    btnOtimizar.disabled = true;
    
    const formData = new FormData();
    formData.append('arquivo', currentFile);
    formData.append('diagnostico', JSON.stringify(diagnosticoData));
    
    const response = await fetch('http://127.0.0.1:5002/otimizar', {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    exibirOtimizacao(data);
    
    document.querySelector('[data-tab="otimizacao"]').click();
    loadingOverlay.classList.add('hidden');
    btnOtimizar.disabled = false;
});

btnDownload.addEventListener('click', () => {
    if (!grafoOtimizado) return;
    
    const blob = new Blob([grafoOtimizado], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rede_otimizada.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Abas
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(`tab-${e.target.dataset.tab}`).classList.add('active');
    });
});

function exibirDiagnostico(data) {
    document.getElementById('estatisticas').innerHTML = `
        <div class="stat-item"><div class="stat-value">${data.estatisticas_gerais.total_nos}</div><div class="stat-label">Total de Nós</div></div>
        <div class="stat-item"><div class="stat-value">${data.estatisticas_gerais.total_arestas}</div><div class="stat-label">Total de Arestas</div></div>
        <div class="stat-item"><div class="stat-value">${data.diagnostico.num_componentes}</div><div class="stat-label">Componentes</div></div>
        <div class="stat-item"><div class="stat-value">${data.diagnostico.tamanho_maior_componente}</div><div class="stat-label">Maior Componente</div></div>
    `;
    
    document.getElementById('tiposNos').innerHTML = Object.entries(data.tipo_no)
        .map(([tipo, qtd]) => `<div class="type-item"><div class="type-value">${qtd}</div><div class="type-label">${tipo}</div></div>`)
        .join('');
    
    document.getElementById('pontosCriticos').innerHTML = `
        <div class="critical-item"><div class="critical-value">${data.diagnostico.num_articulacoes}</div><div class="critical-label">Articulações</div></div>
        <div class="critical-item"><div class="critical-value">${data.diagnostico.num_pontes}</div><div class="critical-label">Pontes</div></div>
        <div class="critical-item"><div class="critical-value">${data.diagnostico.articulacoes_tipo.Transformador}</div><div class="critical-label">Transformadores Críticos</div></div>
    `;
}

function exibirRecomendacoes(data) {
    const html = data.solucoes.map(sol => `
        <div class="recommendation-item">
            <div class="recommendation-header">
                <div class="recommendation-title">${sol.titulo}</div>
                <div class="priority-badge priority-${sol.prioridade}">${sol.prioridade}</div>
            </div>
            <div class="recommendation-desc">${sol.descricao}</div>
            <div class="recommendation-action">${sol.acao}</div>
        </div>
    `).join('');
    
    document.getElementById('recomendacoesList').innerHTML = html;
}

function exibirOtimizacao(data) {
    grafoOtimizado = data.grafo_otimizado;
    
    // Comparação de métricas
    document.getElementById('comparacaoMetricas').innerHTML = `
        <div class="comparison-item comparison-before">
            <div class="comparison-label">ANTES</div>
            <div class="comparison-value">${data.metricas_originais.articulacoes}</div>
            <div class="comparison-label">Pontos de Articulação</div>
        </div>
        <div class="comparison-item comparison-after">
            <div class="comparison-label">DEPOIS</div>
            <div class="comparison-value">${data.metricas_otimizadas.articulacoes}</div>
            <div class="comparison-label">Pontos de Articulação</div>
        </div>
        <div class="comparison-item comparison-before">
            <div class="comparison-label">ANTES</div>
            <div class="comparison-value">${data.metricas_originais.pontes}</div>
            <div class="comparison-label">Pontes Críticas</div>
        </div>
        <div class="comparison-item comparison-after">
            <div class="comparison-label">DEPOIS</div>
            <div class="comparison-value">${data.metricas_otimizadas.pontes}</div>
            <div class="comparison-label">Pontes Críticas</div>
        </div>
    `;
    
    // Conexões adicionadas
    document.getElementById('conexoesAdicionadas').innerHTML = data.conexoes_adicionadas
        .map(conexao => `
            <div class="connection-item">
                <div class="connection-text">${conexao}</div>
            </div>
        `).join('') || '<p>Nenhuma conexão adicional foi necessária.</p>';
    
    // Informações de download
    document.getElementById('totalConexoes').textContent = data.total_conexoes_novas;
    document.getElementById('nomeArquivoOtimizado').textContent = currentFile.name.replace('.txt', '_otimizado.txt');
    
    // Mostrar resultados
    resultadoOtimizacao.classList.remove('hidden');
    
    // Estatísticas adicionais
    if (data.estatisticas) {
        document.getElementById('comparacaoMetricas').innerHTML += `
            <div class="comparison-item comparison-before">
                <div class="comparison-label">ANTES</div>
                <div class="comparison-value">${data.estatisticas.arestas_originais}</div>
                <div class="comparison-label">Total de Arestas</div>
            </div>
            <div class="comparison-item comparison-after">
                <div class="comparison-label">DEPOIS</div>
                <div class="comparison-value">${data.estatisticas.arestas_otimizadas}</div>
                <div class="comparison-label">Total de Arestas</div>
            </div>
        `;
    }
}