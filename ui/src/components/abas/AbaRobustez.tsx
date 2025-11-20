import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface AbaRobustezProps {
  analiseRobustez: any;
}

const AbaRobustez: React.FC<AbaRobustezProps> = ({ analiseRobustez }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🛡️ Métricas de Robustez Estrutural</h2>
        <p className="text-slate-400 mb-6">
          Robustez mede a capacidade da rede de manter funcionalidade sob falhas.
          Métricas baseadas em teoria de grafos e álgebra linear.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-slate-400 text-sm">Conectividade Algébrica</div>
            <div className="text-3xl font-bold text-yellow-400">
              {analiseRobustez.metricas_robustez.algebraic_connectivity.toFixed(4)}
            </div>
            <div className="text-xs text-slate-500 mt-1">2º menor autovalor Laplaciana</div>
          </div>

          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-slate-400 text-sm">Eficiência Global</div>
            <div className="text-3xl font-bold text-blue-400">
              {analiseRobustez.metricas_robustez.eficiencia_global.toFixed(4)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Média de 1/distância</div>
          </div>

          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-slate-400 text-sm">Eficiência Local</div>
            <div className="text-3xl font-bold text-green-400">
              {analiseRobustez.metricas_robustez.eficiencia_local.toFixed(4)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Coesão dos vizinhos</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-slate-400 text-sm">Node Connectivity</div>
            <div className="text-3xl font-bold text-purple-400">
              {analiseRobustez.metricas_robustez.node_connectivity}
            </div>
            <div className="text-xs text-slate-500 mt-1">Min nós para desconectar</div>
          </div>

          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-slate-400 text-sm">Edge Connectivity</div>
            <div className="text-3xl font-bold text-pink-400">
              {analiseRobustez.metricas_robustez.edge_connectivity}
            </div>
            <div className="text-xs text-slate-500 mt-1">Min arestas para desconectar</div>
          </div>

          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-slate-400 text-sm">Assortativity</div>
            <div className="text-3xl font-bold text-orange-400">
              {analiseRobustez.metricas_robustez.assortativity.toFixed(3)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Correlação de graus</div>
          </div>
        </div>

        <div className="bg-slate-700/20 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-400 mb-2">📋 Interpretação</h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {analiseRobustez.interpretacao.map((linha: string, idx: number) => (
              <li key={idx}>{linha}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Métricas de Caminho</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-4 rounded border border-blue-700/50">
            <div className="text-blue-300 text-sm">Average Path Length</div>
            <div className="text-4xl font-bold text-blue-400">
              {analiseRobustez.metricas_robustez.avg_path_length.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Média de saltos entre nós</div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-4 rounded border border-purple-700/50">
            <div className="text-purple-300 text-sm">Diâmetro</div>
            <div className="text-4xl font-bold text-purple-400">
              {analiseRobustez.metricas_robustez.diameter}
            </div>
            <div className="text-xs text-slate-400 mt-1">Maior caminho mínimo</div>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 p-4 rounded border border-green-700/50">
            <div className="text-green-300 text-sm">Raio</div>
            <div className="text-4xl font-bold text-green-400">
              {analiseRobustez.metricas_robustez.radius}
            </div>
            <div className="text-xs text-slate-400 mt-1">Menor excentricidade</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🔄 Análise de Resiliência</h2>
        <p className="text-slate-400 mb-4">
          Capacidade de recuperação após falha dos top 10 hubs. Simulação de recuperação gradual.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-900/20 p-4 rounded border border-green-700/50">
            <div className="text-green-300 text-sm">Tempo de Recuperação (90%)</div>
            <div className="text-3xl font-bold text-green-400">
              {analiseRobustez.analise_resiliencia.tempo_recuperacao_90.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">% de nós para atingir 90% da eficiência</div>
          </div>

          <div className="bg-orange-900/20 p-4 rounded border border-orange-700/50">
            <div className="text-orange-300 text-sm">Perda de Eficiência</div>
            <div className="text-3xl font-bold text-orange-400">
              {analiseRobustez.analise_resiliencia.impacto_remocao.perda_eficiencia.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">Impacto da remoção dos top 10 hubs</div>
          </div>

          <div className="bg-blue-900/20 p-4 rounded border border-blue-700/50">
            <div className="text-blue-300 text-sm">Eficiência Original</div>
            <div className="text-3xl font-bold text-blue-400">
              {analiseRobustez.analise_resiliencia.eficiencia_original.toFixed(4)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Antes da falha</div>
          </div>
        </div>

        <LineChart width={900} height={350}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="percentual_recuperado"
            stroke="#94a3b8"
            label={{ value: '% de Nós Recuperados', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
          />
          <YAxis
            stroke="#94a3b8"
            label={{ value: 'Eficiência Global', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
            formatter={(value: any) => value.toFixed(4)}
          />
          <Line
            data={analiseRobustez.analise_resiliencia.curva_recuperacao}
            type="monotone"
            dataKey="eficiencia_global"
            stroke="#10b981"
            name="Eficiência durante recuperação"
            strokeWidth={3}
          />
        </LineChart>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">📊 Comparação com Redes Teóricas</h2>
        <p className="text-slate-400 mb-4">
          Comparação das métricas com modelos teóricos: Erdős-Rényi (aleatório) e Barabási-Albert (scale-free).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="p-3">Métrica</th>
                <th className="p-3">Rede Real</th>
                <th className="p-3">Erdős-Rényi</th>
                <th className="p-3">Barabási-Albert</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700/50">
                <td className="p-3 text-slate-400">Eficiência Global</td>
                <td className="p-3 font-mono text-yellow-400">
                  {analiseRobustez.comparacao_teorica.rede_real.eficiencia_global.toFixed(4)}
                </td>
                <td className="p-3 font-mono text-blue-400">
                  {analiseRobustez.comparacao_teorica.erdos_renyi.eficiencia_global.toFixed(4)}
                </td>
                <td className="p-3 font-mono text-purple-400">
                  {analiseRobustez.comparacao_teorica.barabasi_albert.eficiencia_global.toFixed(4)}
                </td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="p-3 text-slate-400">Clustering</td>
                <td className="p-3 font-mono text-yellow-400">
                  {analiseRobustez.comparacao_teorica.rede_real.clustering.toFixed(4)}
                </td>
                <td className="p-3 font-mono text-blue-400">
                  {analiseRobustez.comparacao_teorica.erdos_renyi.clustering.toFixed(4)}
                </td>
                <td className="p-3 font-mono text-purple-400">
                  {analiseRobustez.comparacao_teorica.barabasi_albert.clustering.toFixed(4)}
                </td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="p-3 text-slate-400">Assortativity</td>
                <td className="p-3 font-mono text-yellow-400">
                  {analiseRobustez.comparacao_teorica.rede_real.assortativity.toFixed(4)}
                </td>
                <td className="p-3 font-mono text-blue-400">
                  {analiseRobustez.comparacao_teorica.erdos_renyi.assortativity.toFixed(4)}
                </td>
                <td className="p-3 font-mono text-purple-400">
                  {analiseRobustez.comparacao_teorica.barabasi_albert.assortativity.toFixed(4)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 bg-slate-700/20 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-400 mb-2">💡 Interpretação</h3>
          <p className="text-slate-300 text-sm">
            Similaridade com Erdős-Rényi: <strong>{analiseRobustez.comparacao_teorica.interpretacao.similaridade_ER}</strong>
            {' | '}
            Similaridade com Barabási-Albert: <strong>{analiseRobustez.comparacao_teorica.interpretacao.similaridade_BA}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AbaRobustez;
