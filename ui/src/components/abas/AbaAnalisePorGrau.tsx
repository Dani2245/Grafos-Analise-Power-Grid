import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import TooltipTermoTecnico from '../TooltipTermoTecnico';
import { GLOSSARIO } from '../../utils/glossario';

interface AbaAnalisePorGrauProps {
  analiseBasica: any;
  analiseCriticidade: any;
}

const AbaAnalisePorGrau = ({ analiseBasica, analiseCriticidade }: AbaAnalisePorGrauProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">
          Top 20 Nós por{' '}
          <TooltipTermoTecnico termo={GLOSSARIO.GRAU.termo} definicao={GLOSSARIO.GRAU.definicao} exemplo={GLOSSARIO.GRAU.exemplo} />{' '}
          (com{' '}
          <TooltipTermoTecnico termo={GLOSSARIO.BETWEENNESS.termo} definicao={GLOSSARIO.BETWEENNESS.definicao} exemplo={GLOSSARIO.BETWEENNESS.exemplo} />)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-3">#</th>
                <th className="p-3">Nó</th>
                <th className="p-3">Grau</th>
                <th className="p-3">Betweenness</th>
                <th className="p-3">Ponto de Articulação</th>
              </tr>
            </thead>
            <tbody>
              {analiseBasica.top_hubs.map((hub: any, idx: number) => {
                const betweenness = analiseCriticidade.centralidade_intermediacao.todos_nos[hub.no] || 0;
                const ehArticulacao = analiseCriticidade.pontos_articulacao.lista_completa.includes(hub.no);

                return (
                  <tr key={hub.no} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-3 text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono text-yellow-400">{hub.no}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300">{hub.grau}</span>
                    </td>
                    <td className="p-3 font-mono text-sm">{betweenness.toFixed(6)}</td>
                    <td className="p-3">
                      {ehArticulacao ? (
                        <span className="px-2 py-1 bg-red-900/50 rounded text-red-300">✓ SIM</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-700 rounded text-slate-400">NÃO</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Distribuição de Graus</h2>
          <BarChart width={900} height={400} data={analiseBasica.distribuicao_graus.slice(0, 15)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="grau" stroke="#9ca3af" label={{ value: 'Grau', position: 'insideBottom', offset: -5 }} />
            <YAxis stroke="#9ca3af" label={{ value: 'Quantidade de Nós', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Bar dataKey="quantidade" fill="#3b82f6" name="Quantidade de Nós" />
          </BarChart>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {analiseBasica.distribuicao_graus.map((item: any) => (
            <div key={item.grau} className="bg-slate-700/30 p-4 rounded">
              <div className="text-2xl font-bold text-blue-400">Grau {item.grau}</div>
              <div className="text-lg">{item.quantidade} {item.quantidade === 1 ? 'nó' : 'nós'}</div>
              <div className="text-sm text-slate-400">{item.percentual.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AbaAnalisePorGrau;