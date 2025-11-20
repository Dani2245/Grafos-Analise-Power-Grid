import { ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import TooltipTermoTecnico from '../TooltipTermoTecnico';
import { GLOSSARIO } from '../../utils/glossario';

interface AbaBetweenessProps {
  analiseCriticidade: any;
}

const AbaBetweeness = ({ analiseCriticidade }: AbaBetweenessProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">
          📊 <TooltipTermoTecnico
            termo={GLOSSARIO.BETWEENNESS.termo}
            definicao={GLOSSARIO.BETWEENNESS.definicao}
            exemplo={GLOSSARIO.BETWEENNESS.exemplo}
          />
        </h2>
        <p className="text-slate-400 mb-4">
          Mede a importância de um nó como intermediário nos caminhos mais curtos da rede.
          Valores altos indicam nós críticos para o fluxo de energia.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-slate-400 text-sm">Média</div>
            <div className="text-2xl font-bold">{analiseCriticidade.centralidade_intermediacao.media.toFixed(6)}</div>
          </div>
          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-slate-400 text-sm">Top 5% Threshold</div>
            <div className="text-2xl font-bold">{analiseCriticidade.centralidade_intermediacao.threshold_top_5_pct.toFixed(6)}</div>
          </div>
          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-slate-400 text-sm">Máximo</div>
            <div className="text-2xl font-bold text-yellow-400">
              {analiseCriticidade.centralidade_intermediacao.top_50[0].betweenness.toFixed(6)}
            </div>
            <div className="text-xs text-slate-400">Nó {analiseCriticidade.centralidade_intermediacao.top_50[0].no}</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Top 50 Nós por Betweenness</h2>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-700 sticky top-0 bg-slate-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Nó</th>
                <th className="p-3">Betweenness</th>
                <th className="p-3">Grau</th>
                <th className="p-3">Ponto de Articulação</th>
              </tr>
            </thead>
            <tbody>
              {analiseCriticidade.centralidade_intermediacao.top_50.map((item: any, idx: number) => (
                <tr key={item.no} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-mono text-yellow-400">{item.no}</td>
                  <td className="p-3 font-mono text-yellow-400 font-bold">{item.betweenness.toFixed(6)}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300">{item.grau}</span>
                  </td>
                  <td className="p-3">
                    {item.eh_ponto_articulacao ? (
                      <span className="px-2 py-1 bg-red-900/50 rounded text-red-300">✓ SIM</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-700 rounded text-slate-400">NÃO</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Relação entre Grau e Betweenness (Top 50)</h2>
        <ScatterChart width={900} height={400}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="grau"
            name="Grau"
            stroke="#94a3b8"
            label={{ value: 'Grau', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
          />
          <YAxis
            dataKey="betweenness"
            name="Betweenness"
            stroke="#94a3b8"
            label={{ value: 'Betweenness', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter
            data={analiseCriticidade.centralidade_intermediacao.top_50}
            fill="#f59e0b"
          />
        </ScatterChart>
      </div>
    </div>
  );
};

export default AbaBetweeness;