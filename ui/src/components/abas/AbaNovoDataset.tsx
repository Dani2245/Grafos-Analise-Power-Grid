import React, { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Zap, TrendingUp, Clock, PlayCircle, PauseCircle, SkipBack, SkipForward } from 'lucide-react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import TooltipTermoTecnico from '../TooltipTermoTecnico';
import { GLOSSARIO } from '../../utils/glossario';

// Registrar layout dagre
cytoscape.use(dagre);

interface AbaNovoDatasetProps {
    dados: any;
    comparacao: any;
}

const AbaNovoDataset: React.FC<AbaNovoDatasetProps> = ({ dados, comparacao }) => {
    const cyRef = useRef<HTMLDivElement>(null);
    const cyInstance = useRef<cytoscape.Core | null>(null);

    const [timestampAtual, setTimestampAtual] = useState(0);
    const [reproduzindo, setReproduzindo] = useState(false);
    const [velocidade, setVelocidade] = useState(500); // ms entre frames

    // Controle de animação
    useEffect(() => {
        if (!reproduzindo || !dados?.series_temporais?.timestamps) return;

        const interval = setInterval(() => {
            setTimestampAtual(prev => {
                const maxIdx = (dados.series_temporais.timestamps?.length || 1) - 1;
                if (prev >= maxIdx) {
                    setReproduzindo(false);
                    return maxIdx;
                }
                return prev + 1;
            });
        }, velocidade);

        return () => clearInterval(interval);
    }, [reproduzindo, velocidade, dados]);

    // Inicializar Cytoscape
    useEffect(() => {
        if (!cyRef.current || !dados?.metricas_direcionadas || cyInstance.current) return;

        // Construir elementos do grafo
        const nodes = Array.from({ length: 10 }, (_, i) => ({
            data: {
                id: `${i + 1}`,
                label: `Nó ${i + 1}`,
                pagerank: dados.metricas_direcionadas.pagerank[i + 1] || 0
            }
        }));

        const edges: any[] = [];
        if (dados.metricas_ponderadas?.matriz_fluxo) {
            dados.metricas_ponderadas.matriz_fluxo.forEach((row: any, origem: number) => {
                row.forEach((peso: number, destino: number) => {
                    if (origem !== destino && peso > 0.1) {
                        edges.push({
                            data: {
                                id: `e${origem + 1}-${destino + 1}`,
                                source: `${origem + 1}`,
                                target: `${destino + 1}`,
                                weight: peso
                            }
                        });
                    }
                });
            });
        }

        const cy = cytoscape({
            container: cyRef.current,
            elements: [...nodes, ...edges],
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': (ele: any) => {
                            const pr = ele.data('pagerank');
                            // Escala de cores baseada no PageRank
                            if (pr > 0.15) return '#ef4444'; // red-500
                            if (pr > 0.12) return '#f97316'; // orange-500
                            if (pr > 0.10) return '#eab308'; // yellow-500
                            if (pr > 0.08) return '#3b82f6'; // blue-500
                            return '#10b981'; // green-500
                        },
                        'label': 'data(label)',
                        'color': '#ffffff',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '14px',
                        'font-weight': 'bold',
                        'width': 50,
                        'height': 50,
                        'border-width': 3,
                        'border-color': '#fbbf24',
                        'text-outline-color': '#1e293b',
                        'text-outline-width': 2
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': (ele: any) => Math.max(1.5, Math.min(4, ele.data('weight') / 15)),
                        'line-color': '#475569',
                        'target-arrow-color': '#64748b',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'arrow-scale': 1.2,
                        'opacity': 0.4,
                        'line-style': 'solid',
                        'line-dash-pattern': [6, 3],
                        'line-dash-offset': 24
                    }
                },
                {
                    selector: 'edge:selected',
                    style: {
                        'line-color': '#fbbf24',
                        'target-arrow-color': '#fbbf24',
                        'width': 4,
                        'opacity': 1
                    }
                },
                {
                    selector: 'node:selected',
                    style: {
                        'border-width': 5,
                        'border-color': '#fbbf24'
                    }
                }
            ],
            layout: {
                name: 'circle',
                animate: false,
                radius: 200,
                startAngle: 0,
                sweep: 2 * Math.PI,
                clockwise: true,
                spacingFactor: 1.5
            } as any
        });

        cyInstance.current = cy;

        // Animar fluxo das arestas
        let offset = 24;
        const animateEdges = () => {
            offset -= 0.5;
            if (offset <= 0) offset = 24;

            cy.edges().forEach((edge: any) => {
                edge.style('line-dash-offset', offset);
            });

            requestAnimationFrame(animateEdges);
        };
        animateEdges();

        return () => {
            if (cyInstance.current) {
                cyInstance.current.destroy();
                cyInstance.current = null;
            }
        };
    }, [dados]);

    // Atualizar tamanhos dos nós E ARESTAS baseado na carga do timestamp atual
    useEffect(() => {
        if (!cyInstance.current || !dados?.series_temporais?.load_por_no) return;

        // Iterar sobre os nós 1-10
        for (let no = 1; no <= 10; no++) {
            const nodeId = `${no}`;
            const node = cyInstance.current?.getElementById(nodeId);
            const chaveCarga = `${no}`;

            if (node && dados.series_temporais.load_por_no[chaveCarga] && Array.isArray(dados.series_temporais.load_por_no[chaveCarga])) {
                const carga = dados.series_temporais.load_por_no[chaveCarga][timestampAtual];
                if (carga !== undefined) {
                    // Mapear carga (50-500 MW) para tamanho (30-70 px)
                    const tamanho = 30 + ((carga - 50) / 450) * 40;

                    node.style({
                        'width': tamanho,
                        'height': tamanho,
                        'border-width': carga > 400 ? 5 : 3,
                        'border-color': carga > 400 ? '#ef4444' : '#fbbf24'
                    });

                    // Armazenar carga no data do nó para uso nas arestas
                    node.data('currentLoad', carga);
                }
            }
        }

        // Atualizar arestas baseado na carga dos nós conectados
        cyInstance.current.edges().forEach((edge: any) => {
            const sourceNode = edge.source();
            const targetNode = edge.target();
            const sourceLoad = sourceNode.data('currentLoad') || 0;
            const targetLoad = targetNode.data('currentLoad') || 0;

            // Fluxo estimado como média das cargas dos nós conectados
            const fluxoEstimado = (sourceLoad + targetLoad) / 2;

            // Mapear fluxo (50-500) para espessura (1-5px) e opacidade (0.3-0.8)
            const espessura = 1 + ((fluxoEstimado - 50) / 450) * 4;
            const opacidade = 0.3 + ((fluxoEstimado - 50) / 450) * 0.5;

            // Cor baseada na intensidade do fluxo
            let corLinha = '#475569'; // cinza padrão
            if (fluxoEstimado > 400) {
                corLinha = '#ef4444'; // vermelho (alta carga)
            } else if (fluxoEstimado > 350) {
                corLinha = '#f97316'; // laranja
            } else if (fluxoEstimado > 300) {
                corLinha = '#eab308'; // amarelo
            } else if (fluxoEstimado > 250) {
                corLinha = '#3b82f6'; // azul
            }

            edge.style({
                'width': espessura,
                'opacity': opacidade,
                'line-color': corLinha,
                'target-arrow-color': corLinha
            });
        });
    }, [timestampAtual, dados]);

    if (!dados) {
        return (
            <div className="text-center py-12">
                <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Carregando dados do novo dataset...</p>
            </div>
        );
    }

    // Preparar dados das séries temporais para gráficos
    const timestamps = dados.series_temporais?.timestamps || [];
    const dadosSeriesTemporal = timestamps.map((_: any, idx: number) => {
        const ponto: any = { idx };

        // Acessar arrays de carga para cada nó (1-10)
        for (let no = 1; no <= 10; no++) {
            const chaveCarga = `${no}`;
            if (dados.series_temporais?.load_por_no?.[chaveCarga] && Array.isArray(dados.series_temporais.load_por_no[chaveCarga])) {
                ponto[`No_${no}`] = dados.series_temporais.load_por_no[chaveCarga][idx];
            }
        }

        return ponto;
    });

    // Dados de voltage e frequency
    const dadosOperacionais = timestamps.map((_: any, idx: number) => ({
        idx,
        voltage: dados.series_temporais?.voltage?.[idx],
        frequency: dados.series_temporais?.frequency?.[idx],
        fault_detected: dados.series_temporais?.fault_detected?.[idx],
        grid_status: dados.series_temporais?.grid_status?.[idx]
    }));

    // Top 20 edges
    const top20Edges = dados.metricas_ponderadas?.top_arestas || [];

    const maxTimestamp = timestamps.length - 1 || 0;

    // Calcular carga total média somando todas as cargas médias dos 10 nós
    let cargaTotalMedia = 0;
    let nosValidos = 0;

    for (let no = 1; no <= 10; no++) {
        const chaveCarga = `${no}`;
        const loadMedia = dados.metricas_temporais?.metricas_por_no?.[chaveCarga]?.load_media;

        if (loadMedia !== undefined && !isNaN(loadMedia)) {
            cargaTotalMedia += loadMedia;
            nosValidos++;
        }
    }

    // Validar se conseguimos dados de todos os 10 nós
    const cargaTotalValida = nosValidos === 10;

    return (
        <div className="space-y-6">
            {/* Aviso metodológico */}
            <div className="bg-blue-900/30 border-l-4 border-blue-400 rounded-lg p-6">
                <div className="flex items-start gap-3">
                    <Activity className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-semibold text-blue-300 mb-2">Dataset Operacional Temporal</h3>
                        <p className="text-slate-300 mb-2">{dados.AVISO_METODOLOGICO}</p>
                        <div className="bg-blue-900/20 border border-blue-800 rounded p-3 mt-3 mb-3">
                            <p className="text-sm text-slate-300 mb-2">
                                <span className="font-semibold text-blue-400">Diferença Fundamental:</span> Enquanto o dataset original (4.941 nós) é uma
                                <span className="font-semibold"> fotografia estática</span> da topologia da rede, este dataset de <span className="font-mono text-yellow-400">10 nós</span> é
                                um <span className="font-semibold">filme temporal</span> com {dados.info_dataset.total_timestamps} quadros (timestamps),
                                mostrando como <span className="font-semibold text-yellow-400">carga, tensão, frequência e falhas</span> variam ao longo do tempo.
                            </p>
                            <p className="text-sm text-slate-300">
                                <span className="font-semibold text-blue-400">Objetivo:</span> Analisar <span className="font-semibold">comportamento operacional dinâmico</span>,
                                não apenas estrutura estática. Permite identificar padrões temporais, correlações entre variáveis,
                                e simular cenários de falha com dados realistas.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                                <span className="text-slate-400">Tipo:</span>
                                <span className="ml-2 text-white font-semibold">Direcionado e Ponderado</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Nós:</span>
                                <span className="ml-2 text-white font-semibold">{dados.info_dataset.total_nos}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Timestamps:</span>
                                <span className="ml-2 text-white font-semibold">{dados.info_dataset.total_timestamps}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Período:</span>
                                <span className="ml-2 text-white font-semibold">
                                    {dados.info_dataset.periodo?.inicio} a {dados.info_dataset.periodo?.fim}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Métricas temporais agregadas */}
            <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Métricas Operacionais (Agregadas de {dados.info_dataset?.total_timestamps || 1000} Timestamps)</h3>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-300 mb-2">
                        <span className="font-semibold text-yellow-400">Interpretação das Médias:</span> Estes valores representam o <span className="font-semibold">comportamento típico</span> da rede
                        ao longo do período analisado. Uma <span className="font-semibold text-red-400">taxa de falhas de {dados.metricas_temporais?.estatisticas_globais?.taxa_falhas?.toFixed(1)}%</span> indica
                        que em aproximadamente {Math.round((dados.metricas_temporais?.estatisticas_globais?.taxa_falhas || 0) / 100 * (dados.info_dataset?.total_timestamps || 1000))} timestamps
                        o sistema detectou falhas ou instabilidade.
                    </p>
                    <p className="text-sm text-slate-300">
                        <span className="font-semibold text-yellow-400">Faixas Operacionais:</span> Tensão normal: 0.95-1.05 pu • Frequência normal: 49.5-50.5 Hz.
                        Valores próximos à média indicam <span className="font-semibold text-green-400">operação estável</span> dentro dos limites aceitáveis.
                    </p>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-yellow-400">
                        <div className="flex items-center justify-between mb-2">
                            <Zap className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                            {cargaTotalValida ? cargaTotalMedia.toFixed(1) : 'N/A'} MW
                        </div>
                        <div className="text-sm text-slate-400">
                            <TooltipTermoTecnico
                                termo={GLOSSARIO.CARGA.termo}
                                definicao={GLOSSARIO.CARGA.definicao}
                                exemplo={GLOSSARIO.CARGA.exemplo}
                            />{' '}
                            Total Média
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {cargaTotalValida
                                ? `Soma das cargas médias dos ${nosValidos} nós`
                                : 'Dados incompletos'}
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-blue-400">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                            {dados.metricas_temporais?.estatisticas_globais?.voltage_media?.toFixed(3) || '1.000'} pu
                        </div>
                        <div className="text-sm text-slate-400">
                            <TooltipTermoTecnico
                                termo={GLOSSARIO.TENSAO.termo}
                                definicao={GLOSSARIO.TENSAO.definicao}
                                exemplo={GLOSSARIO.TENSAO.exemplo}
                            />{' '}
                            Média
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {dados.metricas_temporais?.estatisticas_globais?.voltage_min?.toFixed(3)} - {dados.metricas_temporais?.estatisticas_globais?.voltage_max?.toFixed(3)} pu
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-green-400">
                        <div className="flex items-center justify-between mb-2">
                            <Activity className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                            {dados.metricas_temporais?.estatisticas_globais?.frequency_media?.toFixed(2) || '50.00'} Hz
                        </div>
                        <div className="text-sm text-slate-400">
                            <TooltipTermoTecnico
                                termo={GLOSSARIO.FREQUENCIA.termo}
                                definicao={GLOSSARIO.FREQUENCIA.definicao}
                                exemplo={GLOSSARIO.FREQUENCIA.exemplo}
                            />{' '}
                            Média
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {dados.metricas_temporais?.estatisticas_globais?.frequency_min?.toFixed(2)} - {dados.metricas_temporais?.estatisticas_globais?.frequency_max?.toFixed(2)} Hz
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-red-400">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-6 h-6 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                            {dados.metricas_temporais?.estatisticas_globais?.taxa_falhas?.toFixed(1) || '0.0'}%
                        </div>
                        <div className="text-sm text-slate-400">Taxa de Falhas</div>
                        <div className="text-xs text-slate-500 mt-1">
                            {dados.metricas_temporais?.estatisticas_globais?.total_timestamps} timestamps
                        </div>
                    </div>
                </div>
            </div>

            {/* Visualização do grafo com controles de animação */}
            <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Grafo Direcionado e Ponderado (Temporal)</h3>

                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-300 mb-2">
                        <span className="font-semibold text-yellow-400">Visualização Simplificada:</span> Os 10 nós estão dispostos em <span className="font-semibold">círculo</span>.
                        O <span className="font-semibold text-orange-400">tamanho varia com a carga</span> no timestamp selecionado.
                        Cores refletem <span className="font-semibold text-blue-400">PageRank</span>:
                        <span className="text-red-400"> Vermelho</span> = alta importância,
                        <span className="text-green-400"> Verde</span> = baixa importância.
                    </p>
                    <p className="text-sm text-slate-300">
                        <span className="font-semibold text-yellow-400">Arestas Animadas:</span> A <span className="font-semibold text-orange-400">espessura, cor e opacidade</span> das arestas
                        variam em tempo real baseado na <span className="font-semibold">carga dos nós conectados</span> no timestamp atual.
                        <span className="text-red-400"> Vermelho</span> = fluxo intenso (&gt;400 MW),
                        <span className="text-yellow-400"> Amarelo</span> = fluxo moderado (~300 MW),
                        <span className="text-blue-400"> Azul</span> = fluxo baixo (&lt;250 MW).
                    </p>
                </div>                {/* Controles de animação */}
                <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-4 mb-3">
                        <button
                            onClick={() => setTimestampAtual(0)}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                            title="Voltar ao início"
                        >
                            <SkipBack className="w-5 h-5 text-white" />
                        </button>

                        <button
                            onClick={() => setReproduzindo(!reproduzindo)}
                            className="p-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-colors"
                            title={reproduzindo ? "Pausar" : "Reproduzir"}
                        >
                            {reproduzindo ? (
                                <PauseCircle className="w-5 h-5 text-white" />
                            ) : (
                                <PlayCircle className="w-5 h-5 text-white" />
                            )}
                        </button>

                        <button
                            onClick={() => setTimestampAtual(maxTimestamp)}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                            title="Ir para o final"
                        >
                            <SkipForward className="w-5 h-5 text-white" />
                        </button>

                        <div className="flex-1">
                            <input
                                type="range"
                                min="0"
                                max={maxTimestamp}
                                value={timestampAtual}
                                onChange={(e) => setTimestampAtual(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                        </div>

                        <div className="text-sm text-slate-300 font-mono min-w-[180px]">
                            Timestamp {timestampAtual + 1} / {timestamps.length}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>Velocidade:</span>
                        <button
                            onClick={() => setVelocidade(1000)}
                            className={`px-3 py-1 rounded ${velocidade === 1000 ? 'bg-yellow-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                        >
                            1x
                        </button>
                        <button
                            onClick={() => setVelocidade(500)}
                            className={`px-3 py-1 rounded ${velocidade === 500 ? 'bg-yellow-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                        >
                            2x
                        </button>
                        <button
                            onClick={() => setVelocidade(250)}
                            className={`px-3 py-1 rounded ${velocidade === 250 ? 'bg-yellow-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                        >
                            4x
                        </button>
                    </div>
                </div>

                {/* Container do Cytoscape */}
                <div
                    ref={cyRef}
                    className="w-full bg-slate-900 rounded-lg border border-slate-700"
                    style={{ height: '600px' }}
                />

                <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-slate-400">PageRank &gt; 0.15</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                        <span className="text-slate-400">PageRank 0.12-0.15</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                        <span className="text-slate-400">PageRank 0.10-0.12</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span className="text-slate-400">PageRank 0.08-0.10</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-slate-400">PageRank &lt; 0.08</span>
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    * Tamanho dos nós varia conforme a carga no timestamp selecionado. Borda vermelha indica carga &gt; 400 MW.
                </p>
            </div>

            {/* Séries temporais de carga */}
            <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Séries Temporais de Carga por Nó</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={dadosSeriesTemporal}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="idx"
                            stroke="#9ca3af"
                            tick={{ fontSize: 11 }}
                            interval={Math.floor(dadosSeriesTemporal.length / 10)}
                        />
                        <YAxis stroke="#9ca3af" label={{ value: 'Carga (MW)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                            labelStyle={{ color: '#f1f5f9' }}
                        />
                        <Legend />
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((no, idx) => {
                            const cores = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];
                            return (
                                <Line
                                    key={no}
                                    type="monotone"
                                    dataKey={`No_${no}`}
                                    stroke={cores[idx % cores.length]}
                                    dot={false}
                                    strokeWidth={1.5}
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Métricas operacionais */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-white">Tensão e Frequência</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dadosOperacionais}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="idx"
                                stroke="#9ca3af"
                                tick={{ fontSize: 10 }}
                                interval={Math.floor(dadosOperacionais.length / 8)}
                            />
                            <YAxis yAxisId="left" stroke="#3b82f6" />
                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                                labelStyle={{ color: '#f1f5f9' }}
                            />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="#3b82f6" name="Tensão (pu)" dot={false} />
                            <Line yAxisId="right" type="monotone" dataKey="frequency" stroke="#10b981" name="Frequência (Hz)" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-white">Top 20 Arestas por Fluxo de Potência</h3>
                    <div className="overflow-auto max-h-[300px]">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-slate-900">
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-2 px-3 text-slate-400">Origem</th>
                                    <th className="text-left py-2 px-3 text-slate-400">Destino</th>
                                    <th className="text-right py-2 px-3 text-slate-400">Fluxo (MW)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top20Edges.map((edge: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                        <td className="py-2 px-3 text-yellow-400 font-mono">{edge.origem}</td>
                                        <td className="py-2 px-3 text-yellow-400 font-mono">{edge.destino}</td>
                                        <td className="py-2 px-3 text-right text-white font-semibold">{edge.fluxo_medio.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Métricas Direcionadas */}
            <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Métricas de Centralidade (Grafo Direcionado)</h3>

                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-700 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">PageRank Médio</h4>
                        <div className="text-2xl font-bold text-white">
                            {dados.metricas_direcionadas?.pagerank
                                ? ((Object.values(dados.metricas_direcionadas.pagerank) as number[]).reduce((a, b) => a + b, 0) / 10).toFixed(4)
                                : 'N/A'}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Mede a "importância" de cada nó baseada em suas conexões recebidas (in-degree ponderado).
                        </p>
                    </div>

                    <div className="bg-slate-700 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">Betweenness Centrality</h4>
                        <div className="text-2xl font-bold text-white">
                            {dados.metricas_direcionadas?.betweenness
                                ? ((Object.values(dados.metricas_direcionadas.betweenness) as number[])[0] || 0).toFixed(4)
                                : '0.0000'}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Mede quantas vezes um nó atua como "ponte" em caminhos mais curtos entre outros nós.
                        </p>
                    </div>

                    <div className="bg-slate-700 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-green-400 mb-2">Densidade</h4>
                        <div className="text-2xl font-bold text-white">
                            {dados.metricas_direcionadas?.densidade?.toFixed(2) || 'N/A'}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Proporção de conexões existentes vs. possíveis (1.0 = grafo completo).
                        </p>
                    </div>
                </div>

                <div className="bg-blue-900/30 border-l-4 border-blue-400 p-4 rounded">
                    <h4 className="text-sm font-semibold text-blue-300 mb-2">🔍 Por que Betweenness = 0 neste dataset?</h4>
                    <p className="text-xs text-slate-300 mb-2">
                        Neste dataset, todos os 10 nós estão <strong>conectados diretamente entre si</strong> (densidade = {dados.metricas_direcionadas?.densidade?.toFixed(2) || '1.0'}, próximo de grafo completo).
                        Em grafos completos ou muito densos, <strong>não existem "pontes" ou intermediários</strong>, pois qualquer nó pode alcançar qualquer outro nó diretamente em apenas 1 passo.
                    </p>
                    <p className="text-xs text-slate-400">
                        <strong>Interpretação:</strong> Betweenness = 0 significa que <em>nenhum nó é crítico como intermediário</em>, diferente do dataset original (4.941 nós esparsos) onde alguns nós têm betweenness alto (até 0.288) pois são passagens obrigatórias em caminhos longos.
                    </p>
                </div>
            </div>

            {/* Análise de Falhas e Correlações */}
            {dados.analise_falhas && (
                <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-white">Análise de Falhas e Estabilidade da Rede</h3>

                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
                        <p className="text-sm text-slate-300 mb-2">
                            <span className="font-semibold text-red-400">🔴 Alta Instabilidade Detectada:</span> A rede opera em condição
                            <span className="font-semibold text-red-400"> instável em {dados.analise_falhas.comparacao_por_estabilidade.instavel.percentual}%</span> dos timestamps
                            ({dados.analise_falhas.comparacao_por_estabilidade.instavel.quantidade} de {dados.info_dataset.total_timestamps} timestamps).
                            Apenas <span className="font-semibold text-green-400">{dados.analise_falhas.comparacao_por_estabilidade.estavel.percentual}%</span> do tempo
                            a rede está em condição estável (grid_status=0).
                        </p>
                        <p className="text-sm text-slate-300">
                            <span className="font-semibold text-red-400">Correlação Falha-Instabilidade:</span> {(dados.analise_falhas.correlacao_falha_instabilidade * 100).toFixed(1)}%
                            de correlação entre <span className="font-semibold">fault_detected</span> e <span className="font-semibold">grid_status</span>.
                            Isso indica que <span className="font-semibold text-yellow-400">falhas detectadas não são o único fator de instabilidade</span> —
                            sobrecarga e desequilíbrios também contribuem.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Comparação por Falha */}
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-orange-400 mb-3">Comparação: Com vs Sem Falha Detectada</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Com Falha:</span>
                                    <span className="text-red-400 font-semibold">
                                        {dados.analise_falhas.comparacao_por_falha.com_falha.quantidade} timestamps
                                        ({dados.analise_falhas.comparacao_por_falha.com_falha.percentual}%)
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 ml-4">→ Taxa Instabilidade:</span>
                                    <span className="text-white font-mono">{dados.analise_falhas.comparacao_por_falha.com_falha.taxa_instabilidade}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 ml-4">→ Tensão Média:</span>
                                    <span className="text-white font-mono">{dados.analise_falhas.comparacao_por_falha.com_falha.voltage_media.toFixed(4)} pu</span>
                                </div>

                                <div className="border-t border-slate-700 my-2"></div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Sem Falha:</span>
                                    <span className="text-green-400 font-semibold">
                                        {dados.analise_falhas.comparacao_por_falha.sem_falha.quantidade} timestamps
                                        ({dados.analise_falhas.comparacao_por_falha.sem_falha.percentual}%)
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 ml-4">→ Taxa Instabilidade:</span>
                                    <span className="text-white font-mono">{dados.analise_falhas.comparacao_por_falha.sem_falha.taxa_instabilidade}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 ml-4">→ Tensão Média:</span>
                                    <span className="text-white font-mono">{dados.analise_falhas.comparacao_por_falha.sem_falha.voltage_media.toFixed(4)} pu</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-3 italic">
                                ⚠ Mesmo sem falhas detectadas, {dados.analise_falhas.comparacao_por_falha.sem_falha.taxa_instabilidade}% dos timestamps
                                apresentam instabilidade, indicando problemas estruturais de capacidade.
                            </p>
                        </div>

                        {/* Comparação por Estabilidade */}
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-blue-400 mb-3">Comparação: Estável vs Instável</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Estável (grid_status=0):</span>
                                    <span className="text-green-400 font-semibold">
                                        {dados.analise_falhas.comparacao_por_estabilidade.estavel.quantidade} timestamps
                                        ({dados.analise_falhas.comparacao_por_estabilidade.estavel.percentual}%)
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 ml-4">→ Taxa Falhas:</span>
                                    <span className="text-white font-mono">{dados.analise_falhas.comparacao_por_estabilidade.estavel.taxa_falhas}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 ml-4">→ Tensão Média:</span>
                                    <span className="text-white font-mono">{dados.analise_falhas.comparacao_por_estabilidade.estavel.voltage_media.toFixed(4)} pu</span>
                                </div>

                                <div className="border-t border-slate-700 my-2"></div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Instável (grid_status=1):</span>
                                    <span className="text-red-400 font-semibold">
                                        {dados.analise_falhas.comparacao_por_estabilidade.instavel.quantidade} timestamps
                                        ({dados.analise_falhas.comparacao_por_estabilidade.instavel.percentual}%)
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 ml-4">→ Taxa Falhas:</span>
                                    <span className="text-white font-mono">{dados.analise_falhas.comparacao_por_estabilidade.instavel.taxa_falhas}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 ml-4">→ Tensão Média:</span>
                                    <span className="text-white font-mono">{dados.analise_falhas.comparacao_por_estabilidade.instavel.voltage_media.toFixed(4)} pu</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-3 italic">
                                🔍 Quando instável, {dados.analise_falhas.comparacao_por_estabilidade.instavel.taxa_falhas}% dos casos apresentam
                                falhas detectadas, confirmando relação causal.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Comparação com dataset original */}
            {comparacao && (
                <div className="bg-slate-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-white">Comparação com Dataset Original</h3>

                    <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4 mb-4">
                        <p className="text-sm text-slate-300 mb-2">
                            <span className="font-semibold text-orange-400">⚠ Comparação Não Direta:</span> Estes dois datasets têm <span className="font-semibold">escalas e propósitos diferentes</span>.
                            O original (4.941 nós) analisa <span className="font-semibold text-yellow-400">topologia de grande escala</span> (Western States Power Grid),
                            enquanto este (10 nós) analisa <span className="font-semibold text-blue-400">operação temporal detalhada</span> de um subsistema menor.
                        </p>
                        <p className="text-sm text-slate-300">
                            <span className="font-semibold text-orange-400">Interpretação dos Índices Normalizados:</span> Valores mais altos (próximos de 100) indicam maior
                            <span className="font-semibold"> densidade/conectividade/centralização</span>. O dataset novo tem índices muito maiores porque é
                            <span className="font-semibold text-yellow-400"> quase um grafo completo</span> (densidade ~1.0), enquanto o original é
                            <span className="font-semibold text-blue-400"> esparso</span> (densidade ~0.0005).
                        </p>
                    </div>                        <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <h4 className="text-lg font-semibold text-yellow-400 mb-3">Dataset Original (Topológico)</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Nós:</span>
                                    <span className="text-white font-mono">{comparacao.metricas_dataset_original.total_nos.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Arestas:</span>
                                    <span className="text-white font-mono">{comparacao.metricas_dataset_original.total_arestas.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Densidade:</span>
                                    <span className="text-white font-mono">{comparacao.metricas_dataset_original.densidade.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Clustering:</span>
                                    <span className="text-white font-mono">{comparacao.metricas_dataset_original.clustering_medio.toFixed(6)}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold text-yellow-400 mb-3">Dataset Novo (Operacional)</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Nós:</span>
                                    <span className="text-white font-mono">{comparacao.metricas_dataset_novo.total_nos}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Arestas:</span>
                                    <span className="text-white font-mono">{comparacao.metricas_dataset_novo.total_arestas}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Densidade:</span>
                                    <span className="text-white font-mono">{comparacao.metricas_dataset_novo.densidade.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Clustering:</span>
                                    <span className="text-white font-mono">{comparacao.metricas_dataset_novo.clustering_medio.toFixed(6)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Índices normalizados */}
                    <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-white mb-3">Índices Normalizados (0-100)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(comparacao.indices_normalizados.dataset_original).map(([key, valor]: [string, any]) => {
                                const valorNovo = (comparacao.indices_normalizados.dataset_novo as any)[key];
                                const label = key.replace(/_/g, ' ').replace('indice', '').trim();

                                return (
                                    <div key={key} className="space-y-1">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span className="capitalize">{label}</span>
                                            <span>Original: {valor} | Novo: {valorNovo}</span>
                                        </div>
                                        <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="absolute h-full bg-yellow-600/50"
                                                style={{ width: `${valor}%` }}
                                            />
                                            <div
                                                className="absolute h-full bg-blue-600/70"
                                                style={{ width: `${valorNovo}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-4 mt-3 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-yellow-600/50"></div>
                                <span className="text-slate-400">Dataset Original</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-blue-600/70"></div>
                                <span className="text-slate-400">Dataset Novo</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AbaNovoDataset;
