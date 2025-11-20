import TooltipTermoTecnico from '../TooltipTermoTecnico';
import { GLOSSARIO } from '../../utils/glossario';
import { AlertCircle } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface AbaPercolacaoProps {
  analiseCriticidade: any;
}

const AbaPercolacao = ({ analiseCriticidade }: AbaPercolacaoProps) => {
  return (
    <div className="space-y-6">
      {/* Seção de Análise de Percolação */}
      {analiseCriticidade.analise_percolacao && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="text-purple-400" />
            Análise de Percolação da Rede
          </h2>
          <p className="text-slate-300 mb-4">
            Simulação do impacto da remoção de pontos de articulação críticos. Mostra como a rede fragmenta quando nós individuais são removidos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-900/30 p-4 rounded border border-purple-700">
              <div className="text-2xl font-bold text-purple-400">
                {analiseCriticidade.analise_percolacao.total_analisados}
              </div>
              <div className="text-sm text-slate-400 mt-1">Pontos Analisados</div>
              <div className="text-xs text-slate-500">Simulações realizadas</div>
            </div>
            <div className="bg-red-900/30 p-4 rounded border border-red-700">
              <div className="text-2xl font-bold text-red-400">
                {analiseCriticidade.analise_percolacao.impacto_maximo_fragmentacao}%
              </div>
              <div className="text-sm text-slate-400 mt-1">Fragmentação Máxima</div>
              <div className="text-xs text-slate-500">Pior caso (single node)</div>
            </div>
            <div className="bg-orange-900/30 p-4 rounded border border-orange-700">
              <div className="text-2xl font-bold text-orange-400">
                {analiseCriticidade.analise_percolacao.impacto_medio_fragmentacao}%
              </div>
              <div className="text-sm text-slate-400 mt-1">Fragmentação Média</div>
              <div className="text-xs text-slate-500">Média das simulações</div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-3 text-purple-300">📈 Curva de Fragmentação por Nó Removido</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analiseCriticidade.analise_percolacao.resultados.slice(0, 30)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="no_removido"
                  stroke="#94a3b8"
                  label={{ value: 'Nó Removido', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  label={{ value: 'Fragmentação (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  formatter={(value: any) => [`${value}%`, 'Fragmentação']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="fragmentacao_percentual"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 3 }}
                  name="Fragmentação da Rede (%)"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-2">
              * Mostrando top 30 nós mais impactantes. Cada ponto representa a fragmentação causada pela remoção de um único nó.
            </p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-purple-300">🎯 Top 10 Pontos Mais Críticos (Percolação)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-600/50">
                  <tr>
                    <th className="text-left p-3">Ranking</th>
                    <th className="text-left p-3">Nó</th>
                    <th className="text-left p-3">Grau</th>
                    <th className="text-left p-3">Fragmentação</th>
                    <th className="text-left p-3">Componentes Criados</th>
                    <th className="text-left p-3">Nós Isolados</th>
                  </tr>
                </thead>
                <tbody>
                  {analiseCriticidade.analise_percolacao.resultados.slice(0, 10).map((item: any, idx: number) => (
                    <tr key={item.no_removido} className="border-b border-slate-700/50 hover:bg-slate-600/30">
                      <td className="p-3">
                        <span className="text-red-400 font-bold">#{idx + 1}</span>
                      </td>
                      <td className="p-3 font-mono text-yellow-400 font-bold">{item.no_removido}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-900/40 rounded text-blue-300">
                          {item.grau_no}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-red-900/40 rounded text-red-300 font-bold">
                          {item.fragmentacao_percentual}%
                        </span>
                      </td>
                      <td className="p-3 text-orange-300">{item.componentes_criados}</td>
                      <td className="p-3 text-purple-300">{item.nos_isolados}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-300 mb-2">💡 Interpretação</h4>
            <p className="text-slate-300 text-sm">
              A análise de percolação identifica pontos únicos de falha que fragmentam significativamente a rede.
              Nós com alta fragmentação ({analiseCriticidade.analise_percolacao.impacto_maximo_fragmentacao}% no pior caso)
              são <strong className="text-red-400">extremamente críticos</strong> pois sua remoção isola grandes porções da rede.
              Estes nós requerem redundância máxima e monitoramento contínuo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbaPercolacao;