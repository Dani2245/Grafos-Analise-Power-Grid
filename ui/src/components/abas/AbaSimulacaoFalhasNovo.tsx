import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Zap, TrendingDown, Shield } from 'lucide-react';
import TooltipTermoTecnico from '../TooltipTermoTecnico';
import { GLOSSARIO } from '../../utils/glossario';

interface AbaSimulacaoFalhasNovoProps {
    dados: any;
}

const AbaSimulacaoFalhasNovo: React.FC<AbaSimulacaoFalhasNovoProps> = ({ dados }) => {
    const [noSelecionado, setNoSelecionado] = useState<number | null>(null);

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
    const simulacoesSobrecarga = dados.simulacoes_sobrecarga?.resultados || [];

    // Preparar dados para gráfico de barras (remoção de nós)
    const dadosGraficoRemocao = simulacoesRemocao.map((sim: any) => ({
        no: `Nó ${sim.no_removido}`,
        fragmentacao: sim.fragmentacao_percentual,
        perda_carga: sim.perda_carga_percentual
    }));

    // Dados para gráfico de sobrecarga
    const dadosGraficoSobrecarga = simulacoesSobrecarga.map((sim: any) => ({
        cenario: `+${sim.percentual_aumento}%`,
        nos_sobrecarregados: sim.quantidade_sobrecarga || 0,
        carga_total: sim.carga_total_apos_aumento || 0
    }));

    // Cores para criticidade
    const cores = ['#10b981', '#eab308', '#f97316', '#ef4444', '#991b1b'];

    // Detalhes do nó selecionado
    const detalhesNo = noSelecionado !== null
        ? simulacoesRemocao.find((s: any) => s.no_removido === noSelecionado)
        : null;

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
                <h3 className="text-xl font-bold mb-4 text-white">Detalhes das Simulações de Remoção</h3>
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
                                <th className="text-center py-3 px-4 text-slate-400">Ação</th>
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
                                        className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer"
                                        onClick={() => setNoSelecionado(sim.no_removido)}
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
                                                className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNoSelecionado(sim.no_removido);
                                                }}
                                            >
                                                Detalhes
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

            {/* Detalhes do nó selecionado */}
            {detalhesNo && (
                <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-yellow-400">
                    <h3 className="text-xl font-bold mb-4 text-white">Detalhes: Remoção do Nó {detalhesNo.no_removido}</h3>

                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-slate-400 mb-1">Fragmentação da Rede</div>
                            <div className="text-2xl font-bold text-red-400">{detalhesNo.fragmentacao_percentual.toFixed(2)}%</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {detalhesNo.tamanho_maior_componente} nós no maior componente
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-slate-400 mb-1">Perda de Capacidade</div>
                            <div className="text-2xl font-bold text-orange-400">{detalhesNo.perda_carga_MW.toFixed(1)} MW</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {detalhesNo.perda_carga_percentual.toFixed(2)}% da carga total
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-slate-400 mb-1">Arestas Perdidas</div>
                            <div className="text-2xl font-bold text-yellow-400">{detalhesNo.arestas_perdidas}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                De {detalhesNo.arestas_antes} arestas originais
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400">Componentes Conectados:</span>
                                <span className="ml-2 text-white font-semibold">
                                    {detalhesNo.num_componentes}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400">Nós no Maior Componente:</span>
                                <span className="ml-2 text-white font-semibold">{detalhesNo.tamanho_maior_componente}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Simulações de sobrecarga */}
            <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-white">Simulações de Sobrecarga</h3>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dadosGraficoSobrecarga}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="cenario" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                                    labelStyle={{ color: '#f1f5f9' }}
                                />
                                <Legend />
                                <Bar dataKey="nos_sobrecarregados" fill="#ef4444" name="Nós Sobrecarregados" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div>
                        <h4 className="text-md font-semibold text-white mb-3">Detalhes dos Cenários</h4>
                        <div className="space-y-3">
                            {simulacoesSobrecarga.map((sim: any, idx: number) => {
                                const nosArray = Array.isArray(sim.nos_em_sobrecarga)
                                    ? sim.nos_em_sobrecarga
                                    : (typeof sim.nos_em_sobrecarga === 'string' && sim.nos_em_sobrecarga.trim())
                                        ? sim.nos_em_sobrecarga.trim().split(' ').filter((s: string) => s)
                                        : [];
                                const qtdSobrecarga = sim.quantidade_sobrecarga || 0;

                                return (
                                    <div key={idx} className="bg-slate-900/50 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-yellow-400 font-semibold">Cenário: +{sim.percentual_aumento}%</span>
                                            <span className={`text-xs px-2 py-1 rounded ${qtdSobrecarga === 0 ? 'bg-green-900/50 text-green-300' :
                                                qtdSobrecarga <= 3 ? 'bg-yellow-900/50 text-yellow-300' :
                                                    'bg-red-900/50 text-red-300'
                                                }`}>
                                                {qtdSobrecarga === 0 ? 'Estável' :
                                                    qtdSobrecarga <= 3 ? 'Atenção' : 'Crítico'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-slate-400">Carga Total:</span>
                                                <span className="ml-2 text-white">{sim.carga_total_apos_aumento?.toFixed(1) || 0} MW</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Sobrecarregados:</span>
                                                <span className="ml-2 text-white">{qtdSobrecarga} nós</span>
                                            </div>
                                        </div>

                                        {qtdSobrecarga > 0 && nosArray.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-slate-700">
                                                <div className="text-xs text-slate-400 mb-1">Nós sobrecarregados (&gt;500 MW):</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {nosArray.map((no: string) => (
                                                        <span key={no} className="bg-red-900/50 text-red-300 px-2 py-0.5 rounded text-xs font-mono">
                                                            Nó {no}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AbaSimulacaoFalhasNovo;
