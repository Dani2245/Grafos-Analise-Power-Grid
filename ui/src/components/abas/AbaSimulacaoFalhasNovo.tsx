import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Zap, TrendingDown, Shield, Eye } from 'lucide-react';
import TooltipTermoTecnico from '../TooltipTermoTecnico';
import ModalGrafo from '../ModalGrafo';
import { GLOSSARIO } from '../../utils/glossario';

interface AbaSimulacaoFalhasNovoProps {
    dados: any;
}

const AbaSimulacaoFalhasNovo: React.FC<AbaSimulacaoFalhasNovoProps> = ({ dados }) => {
    const [modalGrafo, setModalGrafo] = useState<{ aberto: boolean; arquivo: string; titulo: string }>({
        aberto: false,
        arquivo: '',
        titulo: ''
    });

    if (!dados) {
        return (
            <div className="text-center py-12">
                <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Carregando simulações de falhas...</p>
            </div>
        );
    }

    const simulacoesRemocao = dados.simulacoes_remocao?.resultados || [];
    const estatisticas = dados.simulacoes_remocao?.estatisticas || {};
    const analiseThreshold = dados.analise_threshold || {};
    const simulacoesSobrecarga = dados.simulacoes_sobrecarga_localizada?.resultados || [];
    const simulacoesCascata = dados.simulacoes_cascata?.resultados || [];

    // Preparar dados para gráfico de barras (remoção de nós)
    const dadosGraficoRemocao = simulacoesRemocao.map((sim: any) => ({
        no: `Nó ${sim.no_removido}`,
        fragmentacao: sim.fragmentacao_percentual,
        perda_carga: sim.perda_carga_percentual
    }));

    // Cores para criticidade
    const cores = ['#10b981', '#eab308', '#f97316', '#ef4444', '#991b1b'];

    return (
        <div className="space-y-6">
            {/* Aviso */}
            <div className="bg-orange-900/30 border-l-4 border-orange-400 rounded-lg p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-orange-400 mt-1 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-semibold text-orange-300 mb-2">
                            Simulação de Falhas e{' '}
                            <TooltipTermoTecnico
                                termo="Robustez"
                                definicao="Capacidade da rede de manter funcionalidade sob falhas. Medida pela resistência a remoção de nós ou arestas."
                                exemplo="Rede robusta mantém conectividade mesmo após múltiplas falhas de componentes."
                            />
                        </h3>
                        <p className="text-slate-300">{dados.AVISO_METODOLOGICO}</p>
                        {dados.info_simulacao && (
                            <div className="mt-2 text-sm text-slate-400">
                                <span className="font-mono">
                                    {dados.info_simulacao.total_nos} nós • {dados.info_simulacao.total_arestas} arestas •{' '}
                                    <TooltipTermoTecnico
                                        termo={GLOSSARIO.CARGA.termo}
                                        definicao={GLOSSARIO.CARGA.definicao}
                                        exemplo={GLOSSARIO.CARGA.exemplo}
                                    />{' '}
                                    total média: {dados.info_simulacao.carga_total_media?.toFixed(2)} MW
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Análise de Threshold */}
            {analiseThreshold.recomendacao && (
                <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-blue-400">
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-blue-400" />
                        Análise de Threshold de Sobrecarga
                    </h3>
                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-4">
                        <p className="text-slate-300 text-sm mb-2">
                            <span className="font-semibold text-blue-400">Metodologia Baseada em Dados:</span> O threshold de sobrecarga foi calculado
                            analisando <span className="font-mono text-yellow-400">933 timestamps</span> onde o sistema apresentou instabilidade
                            (<span className="font-mono text-red-400">grid_status=1</span>), ao invés de usar valores arbitrários.
                        </p>
                        <p className="text-slate-300 text-sm">
                            <span className="font-semibold text-blue-400">Interpretação:</span> O valor recomendado de <span className="font-mono text-yellow-400">{analiseThreshold.recomendacao.toFixed(2)} MW</span> representa
                            a carga média nos nós durante períodos de instabilidade. Cargas acima deste limite têm alta probabilidade de causar falhas no sistema.
                            Isso é <span className="font-semibold text-yellow-400">45% mais sensível</span> que um threshold arbitrário de 500 MW,
                            revelando vulnerabilidades que passariam despercebidas.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="text-sm text-slate-400 mb-1">Threshold Recomendado</div>
                            <div className="text-3xl font-bold text-blue-400">{analiseThreshold.recomendacao.toFixed(2)} MW</div>
                            <div className="text-xs text-slate-500 mt-1">Baseado em média de timestamps instáveis</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="text-sm text-slate-400 mb-1">Percentil 75 (Instável)</div>
                            <div className="text-2xl font-bold text-orange-400">{analiseThreshold.threshold_percentil_75?.toFixed(2) || 0} MW</div>
                            <div className="text-xs text-slate-500 mt-1">75% das cargas durante instabilidade</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="text-sm text-slate-400 mb-1">Carga Máxima Estável</div>
                            <div className="text-2xl font-bold text-green-400">{analiseThreshold.carga_maxima_estavel?.toFixed(2) || 0} MW</div>
                            <div className="text-xs text-slate-500 mt-1">Maior carga observada em estado estável</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-4">
                            <div className="text-sm text-slate-400 mb-1">Carga Mínima Instável</div>
                            <div className="text-2xl font-bold text-red-400">{analiseThreshold.carga_minima_instavel?.toFixed(2) || 0} MW</div>
                            <div className="text-xs text-slate-500 mt-1">Menor carga durante instabilidade</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Estatísticas gerais */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-red-400">
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        Nó {estatisticas.no_mais_critico}
                    </div>
                    <div className="text-sm text-slate-400">Nó Mais Crítico</div>
                    <div className="text-xs text-slate-500 mt-1">
                        Maior impacto na rede
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-orange-400">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingDown className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {estatisticas.fragmentacao_media?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-400">Fragmentação Média</div>
                    <div className="text-xs text-slate-500 mt-1">
                        Média de todos os nós
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-yellow-400">
                    <div className="flex items-center justify-between mb-2">
                        <Zap className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {estatisticas.perda_carga_media?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-400">Perda de Carga Média</div>
                    <div className="text-xs text-slate-500 mt-1">
                        Capacidade perdida
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-blue-400">
                    <div className="flex items-center justify-between mb-2">
                        <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {estatisticas.fragmentacao_maxima?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-400">Fragmentação Máxima</div>
                    <div className="text-xs text-slate-500 mt-1">
                        Pior cenário
                    </div>
                </div>
            </div>

            {/* Simulações de remoção de nós */}
            <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Impacto da Remoção de Cada Nó</h3>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4">
                    <p className="text-slate-300 text-sm mb-2">
                        <span className="font-semibold text-yellow-400">Análise de Vulnerabilidade:</span> Esta simulação remove cada um dos 10 nós
                        e mede o impacto na rede. <span className="font-semibold text-red-400">Nó {estatisticas.no_mais_critico}</span> é o mais crítico,
                        com perda de carga de <span className="font-mono text-orange-400">{simulacoesRemocao.find((s: any) => s.no_removido === estatisticas.no_mais_critico)?.perda_carga_percentual.toFixed(2)}%</span>.
                    </p>
                    <p className="text-slate-300 text-sm">
                        <span className="font-semibold text-yellow-400">Observação Importante:</span> A fragmentação é <span className="font-mono text-green-400">0%</span> para
                        todos os nós porque a rede de 10 nós é <span className="font-semibold">totalmente conectada</span> (cada nó conectado a todos os outros).
                        Mesmo removendo um nó, os 9 restantes permanecem conectados. O impacto real é medido pela <span className="font-semibold text-orange-400">perda de capacidade de carga</span> (~10% por nó).
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={dadosGraficoRemocao}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="no" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" label={{ value: 'Percentual (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                            labelStyle={{ color: '#f1f5f9' }}
                        />
                        <Legend />
                        <Bar dataKey="fragmentacao" fill="#ef4444" name="Fragmentação (%)" />
                        <Bar dataKey="perda_carga" fill="#f97316" name="Perda de Carga (%)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Tabela detalhada de remoção */}
            <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Detalhes das Simulações de Remoção</h3>
                    <button
                        onClick={() => setModalGrafo({
                            aberto: true,
                            arquivo: 'grafos/novo_dataset/rede_novo_dataset_completo.html',
                            titulo: 'Grafo Completo - Novo Dataset (10 Nós)'
                        })}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm flex items-center gap-2 transition-colors"
                        title="Ver grafo completo com todos os 10 nós"
                    >
                        <Eye size={16} />
                        Ver Grafo Completo
                    </button>
                </div>
                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-3 px-4 text-slate-400">Nó Removido</th>
                                <th className="text-right py-3 px-4 text-slate-400">Fragmentação (%)</th>
                                <th className="text-right py-3 px-4 text-slate-400">Perda de Carga (MW)</th>
                                <th className="text-right py-3 px-4 text-slate-400">Perda (%)</th>
                                <th className="text-right py-3 px-4 text-slate-400">Arestas Perdidas</th>
                                <th className="text-right py-3 px-4 text-slate-400">Componentes</th>
                                <th className="text-center py-3 px-4 text-slate-400">Ver Grafo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {simulacoesRemocao.map((sim: any) => {
                                const criticidade =
                                    sim.fragmentacao_percentual >= 15 ? 4 :
                                        sim.fragmentacao_percentual >= 10 ? 3 :
                                            sim.fragmentacao_percentual >= 5 ? 2 :
                                                sim.fragmentacao_percentual >= 1 ? 1 : 0;

                                return (
                                    <tr
                                        key={sim.no_removido}
                                        className="border-b border-slate-700/50 hover:bg-slate-700/30"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: cores[criticidade] }}
                                                />
                                                <span className="text-yellow-400 font-mono">Nó {sim.no_removido}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right text-white font-semibold">
                                            {sim.fragmentacao_percentual.toFixed(2)}%
                                        </td>
                                        <td className="py-3 px-4 text-right text-white">
                                            {sim.perda_carga_MW.toFixed(1)} MW
                                        </td>
                                        <td className="py-3 px-4 text-right text-orange-400 font-semibold">
                                            {sim.perda_carga_percentual.toFixed(2)}%
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-300">
                                            {sim.arestas_perdidas}
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-300">
                                            {sim.num_componentes}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setModalGrafo({
                                                        aberto: true,
                                                        arquivo: `grafos/novo_dataset/rede_novo_dataset_node_${sim.no_removido}.html`,
                                                        titulo: `Grafo Novo Dataset - Nó ${sim.no_removido}`
                                                    });
                                                }}
                                                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 rounded text-white text-xs flex items-center gap-1 transition-colors mx-auto"
                                                title="Ver grafo interativo"
                                            >
                                                <Eye size={14} />
                                                Ver Grafo
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Legenda de cores */}
                <div className="flex gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-slate-400">Baixo impacto (&lt;1%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-slate-400">Impacto moderado (1-5%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-slate-400">Alto impacto (5-10%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-slate-400">Impacto crítico (10-15%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-900"></div>
                        <span className="text-slate-400">Impacto severo (&gt;15%)</span>
                    </div>
                </div>
            </div>

            {/* Simulações de sobrecarga localizada */}
            <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                    Cenários de Sobrecarga Localizada
                </h3>
                <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4 mb-4">
                    <p className="text-slate-300 text-sm mb-2">
                        <span className="font-semibold text-orange-400">Cenários Realistas:</span> Ao contrário de aumentar a carga em todos os nós
                        simultaneamente (+100%, cenário catastrófico), estas simulações testam <span className="font-semibold">aumentos localizados</span> de
                        30-75% em nós específicos, refletindo situações operacionais plausíveis como picos de demanda ou redistribuição após falhas.
                    </p>
                    <p className="text-slate-300 text-sm">
                        <span className="font-semibold text-orange-400">Resultado Crítico:</span> Threshold usado de <span className="font-mono text-yellow-400">{analiseThreshold.recomendacao?.toFixed(2) || 272.24} MW</span>.
                        Mesmo aumentos moderados (30-40%) já causam sobrecarga em múltiplos nós, indicando <span className="font-semibold text-red-400">baixa margem de segurança operacional</span>.
                        A rede opera próxima ao limite de capacidade.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {simulacoesSobrecarga.map((sim: any, idx: number) => {
                        const qtdSobrecarga = sim.quantidade_sobrecarga || 0;
                        const nosAfetados = sim.nos_afetados_inicial || [];
                        const nosEmSobrecarga = sim.nos_em_sobrecarga || [];

                        return (
                            <div key={idx} className="bg-slate-900/50 rounded-lg p-5 border-l-4 border-orange-400">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-lg font-semibold text-yellow-400">{sim.nome_cenario}</h4>
                                        <p className="text-xs text-slate-400 mt-1">{sim.cenario}</p>
                                    </div>
                                    <span className={`text-xs px-3 py-1 rounded font-semibold ${qtdSobrecarga === 0 ? 'bg-green-900/50 text-green-300' :
                                        qtdSobrecarga <= 2 ? 'bg-yellow-900/50 text-yellow-300' :
                                            'bg-red-900/50 text-red-300'
                                        }`}>
                                        {qtdSobrecarga === 0 ? '✓ Estável' :
                                            qtdSobrecarga <= 2 ? '⚠ Atenção' : '✖ Crítico'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="bg-slate-800/50 rounded p-3">
                                        <div className="text-xs text-slate-400 mb-1">Aumento de Carga</div>
                                        <div className="text-xl font-bold text-orange-400">+{sim.percentual_aumento}%</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded p-3">
                                        <div className="text-xs text-slate-400 mb-1">Nós Sobrecarregados</div>
                                        <div className="text-xl font-bold text-red-400">{qtdSobrecarga}</div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Nós Afetados:</span>
                                        <span className="text-white font-mono">{nosAfetados.join(', ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Carga Total:</span>
                                        <span className="text-white">{sim.carga_total_depois?.toFixed(1) || 0} MW</span>
                                    </div>
                                    {qtdSobrecarga > 0 && (
                                        <div className="pt-2 border-t border-slate-700">
                                            <div className="text-xs text-red-400 mb-2 font-semibold">⚠ Nós em sobrecarga (&gt;{sim.threshold_usado?.toFixed(1)} MW):</div>
                                            <div className="flex flex-wrap gap-1">
                                                {nosEmSobrecarga.map((no: number) => (
                                                    <span key={no} className="bg-red-900/70 text-red-200 px-2 py-1 rounded text-xs font-mono border border-red-700">
                                                        Nó {no}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Simulação de Cascata de Falhas */}
            {simulacoesCascata.length > 0 && (
                <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-red-500">
                    <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        Simulação de Cascata de Falhas
                    </h3>
                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-slate-300 text-sm mb-2">
                            <span className="font-semibold text-red-400">Efeito Dominó:</span> Quando um nó falha, sua carga é redistribuída para os nós vizinhos (predecessores).
                            Se essa redistribuição exceder o threshold de {analiseThreshold.recomendacao?.toFixed(2)} MW, os vizinhos também falham,
                            propagando o problema em cascata até a rede colapsar ou estabilizar.
                        </p>
                        <p className="text-slate-300 text-sm">
                            <span className="font-semibold text-red-400">Descoberta Crítica:</span> A rede de 10 nós demonstra <span className="font-semibold text-red-400">vulnerabilidade extrema</span>.
                            Qualquer falha inicial nos nós mais críticos (9, 6, ou 2) resulta em <span className="font-semibold">colapso total</span> em apenas
                            <span className="font-mono text-yellow-400">1-2 iterações</span>. Todos os 10 nós falham sequencialmente, fragmentando 100% da rede.
                            Isso revela <span className="font-semibold">ausência de redundância</span> e necessidade urgente de sistemas de proteção.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {simulacoesCascata.map((cascata: any, idx: number) => {
                            const colapsouTotal = cascata.rede_colapsou;
                            const iteracoes = cascata.iteracoes_ate_estabilizar;
                            const totalFalhos = cascata.total_nos_falhos;

                            return (
                                <div key={idx} className={`bg-slate-900/50 rounded-lg p-5 border-2 ${colapsouTotal ? 'border-red-500' : 'border-orange-500'
                                    }`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-semibold text-yellow-400">
                                                Cascata: Falha Inicial no Nó {cascata.no_inicial}
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Threshold usado: {cascata.threshold_usado?.toFixed(2)} MW
                                            </p>
                                        </div>
                                        <span className={`px-4 py-2 rounded font-bold text-sm ${colapsouTotal
                                            ? 'bg-red-900 text-red-200 border-2 border-red-600'
                                            : 'bg-orange-900 text-orange-200 border-2 border-orange-600'
                                            }`}>
                                            {colapsouTotal ? '💥 COLAPSO TOTAL' : `⚠ ${cascata.fragmentacao_percentual}% Fragmentação`}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div className="bg-slate-800/50 rounded p-3">
                                            <div className="text-xs text-slate-400 mb-1">Nós Falhos</div>
                                            <div className="text-2xl font-bold text-red-400">{totalFalhos}</div>
                                            <div className="text-xs text-slate-500">de 10 nós</div>
                                        </div>
                                        <div className="bg-slate-800/50 rounded p-3">
                                            <div className="text-xs text-slate-400 mb-1">Fragmentação</div>
                                            <div className="text-2xl font-bold text-orange-400">{cascata.fragmentacao_percentual}%</div>
                                            <div className="text-xs text-slate-500">da rede</div>
                                        </div>
                                        <div className="bg-slate-800/50 rounded p-3">
                                            <div className="text-xs text-slate-400 mb-1">Iterações</div>
                                            <div className="text-2xl font-bold text-yellow-400">{iteracoes}</div>
                                            <div className="text-xs text-slate-500">até {colapsouTotal ? 'colapso' : 'estabilizar'}</div>
                                        </div>
                                        <div className="bg-slate-800/50 rounded p-3">
                                            <div className="text-xs text-slate-400 mb-1">Componentes</div>
                                            <div className="text-2xl font-bold text-blue-400">{cascata.num_componentes_final}</div>
                                            <div className="text-xs text-slate-500">finais</div>
                                        </div>
                                    </div>

                                    {/* Histórico de cascata */}
                                    {cascata.historico_cascata && cascata.historico_cascata.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-700">
                                            <h5 className="text-sm font-semibold text-slate-300 mb-3">Histórico da Cascata:</h5>
                                            <div className="space-y-2">
                                                {cascata.historico_cascata.map((hist: any, histIdx: number) => (
                                                    <div key={histIdx} className="bg-slate-800/50 rounded p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-semibold text-yellow-400">Iteração {hist.iteracao}</span>
                                                            <span className="text-xs text-slate-400">
                                                                {hist.novos_falhos?.length || 0} novos falhos • {hist.nos_restantes} nós restantes
                                                            </span>
                                                        </div>
                                                        {hist.novos_falhos && hist.novos_falhos.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {hist.novos_falhos.map((no: number) => (
                                                                    <span key={no} className="bg-red-900/50 text-red-300 px-2 py-0.5 rounded text-xs font-mono">
                                                                        Nó {no}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Nós falhos por sobrecarga */}
                                    {cascata.nos_por_sobrecarga && cascata.nos_por_sobrecarga.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-700">
                                            <div className="text-sm text-slate-400 mb-2">
                                                Nós que falharam por sobrecarga ({cascata.nos_por_sobrecarga.length}):
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {cascata.nos_por_sobrecarga.map((no: number) => (
                                                    <span key={no} className="bg-orange-900/50 text-orange-300 px-2 py-1 rounded text-xs font-mono border border-orange-700">
                                                        Nó {no}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Conclusão sobre vulnerabilidade */}
                    <div className="mt-6 bg-red-900/20 border-l-4 border-red-500 rounded-lg p-5">
                        <h4 className="text-md font-semibold text-red-400 mb-2">⚠ Vulnerabilidade Crítica Identificada</h4>
                        <p className="text-sm text-slate-300 mb-3">
                            A rede de 10 nós demonstra <span className="font-semibold text-red-400">extrema vulnerabilidade ao efeito cascata</span>.
                            Qualquer falha inicial em nós críticos (9, 6, ou 2) resulta em <span className="font-semibold">colapso total da rede</span> em apenas {simulacoesCascata[0]?.iteracoes_ate_estabilizar || 1}-2 iterações.
                        </p>
                        <p className="text-sm text-slate-300 mb-3">
                            <span className="font-semibold text-yellow-400">Por que isso acontece?</span> A redistribuição de carga dos nós falhos (~275 MW)
                            dividida entre os 9 nós restantes (~30 MW por nó) empurra todos acima do threshold de {analiseThreshold.recomendacao?.toFixed(2)} MW.
                            Como a rede está <span className="font-semibold">operando próxima à capacidade máxima</span>, qualquer carga adicional causa sobrecarga imediata.
                        </p>
                        <div className="bg-slate-800/50 rounded p-3 mt-3">
                            <p className="text-sm text-slate-300">
                                <span className="font-semibold text-orange-400">Recomendações Urgentes:</span>
                            </p>
                            <ul className="text-sm text-slate-300 mt-2 space-y-1 list-disc list-inside">
                                <li><span className="font-semibold">Redundância:</span> Adicionar rotas alternativas e nós de backup</li>
                                <li><span className="font-semibold">Load Balancing:</span> Distribuir carga mais uniformemente (reduzir picos de 275+ MW)</li>
                                <li><span className="font-semibold">Sistemas de Proteção:</span> Implementar circuit breakers automáticos antes do threshold</li>
                                <li><span className="font-semibold">Capacidade Adicional:</span> Aumentar margem operacional para absorver redistribuições</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <ModalGrafo
                aberto={modalGrafo.aberto}
                arquivo={modalGrafo.arquivo}
                titulo={modalGrafo.titulo}
                onFechar={() => setModalGrafo({ aberto: false, arquivo: '', titulo: '' })}
            />
        </div>
    );
};

export default AbaSimulacaoFalhasNovo;
