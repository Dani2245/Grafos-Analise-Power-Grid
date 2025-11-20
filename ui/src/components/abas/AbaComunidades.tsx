import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Network, Activity, GitBranch, Home } from 'lucide-react';
import CartaoMetrica from '../CartaoMetrica';

interface AbaComunidadesProps {
  analiseComunidades: any;
}

const AbaComunidades = ({ analiseComunidades }: AbaComunidadesProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-900/30 to-slate-800 rounded-lg p-6 border-l-4 border-green-500">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Network className="text-green-400" />
          Detecção de Comunidades
        </h2>
        <p className="text-slate-300 mb-4">
          Identificação de grupos de nós densamente conectados internamente e com poucas conexões externas (algoritmo Greedy Modularity).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CartaoMetrica
          icon={<Network size={24} />}
          titulo="Total de Comunidades"
          valor={analiseComunidades.estatisticas_gerais.num_comunidades}
          subtitulo="Grupos detectados"
        />
        <CartaoMetrica
          icon={<Activity size={24} />}
          titulo="Modularidade"
          valor={analiseComunidades.estatisticas_gerais.modularidade.toFixed(4)}
          subtitulo="Qualidade da divisão (0-1)"
        />
        <CartaoMetrica
          icon={<GitBranch size={24} />}
          titulo="Tamanho Médio"
          valor={analiseComunidades.estatisticas_gerais.tamanho_medio_comunidade.toFixed(1)}
          subtitulo="Nós por comunidade"
        />
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">📊 Top 10 Maiores Comunidades</h3>
        <BarChart width={900} height={350} data={analiseComunidades.comunidades.slice(0, 10)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="id"
            stroke="#94a3b8"
            label={{ value: 'ID da Comunidade', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
          />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
          <Legend />
          <Bar dataKey="tamanho" fill="#10b981" name="Tamanho (nós)" />
        </BarChart>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">🔝 Top 10 Maiores Comunidades - Detalhes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left p-3">Ranking</th>
                <th className="text-left p-3">Comunidade</th>
                <th className="text-left p-3">Tamanho</th>
                <th className="text-left p-3">% da Rede</th>
                <th className="text-left p-3">Densidade</th>
                <th className="text-left p-3">Grau Médio</th>
              </tr>
            </thead>
            <tbody>
              {analiseComunidades.comunidades.slice(0, 10).map((item: any, idx: number) => (
                <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 text-slate-400">#{idx + 1}</td>
                  <td className="p-3 font-mono text-green-400">{item.id}</td>
                  <td className="p-3 font-bold text-green-300">{item.tamanho.toLocaleString()} nós</td>
                  <td className="p-3">{item.percentual_rede.toFixed(2)}%</td>
                  <td className="p-3 text-slate-300">{item.densidade.toFixed(4)}</td>
                  <td className="p-3 text-slate-300">{item.grau_medio.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-green-900/20 rounded border border-green-700">
          <p className="text-sm text-green-200">
            <strong>Interpretação:</strong> {analiseComunidades.estatisticas_gerais.interpretacao_modularidade}
          </p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">🔗 Conexões entre Comunidades</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <CartaoMetrica
            icon={<GitBranch size={24} />}
            titulo="Pares de Comunidades Conectadas"
            valor={analiseComunidades.conexoes_intercomunidades.total_conexoes}
            subtitulo="Relações entre grupos"
          />
          <CartaoMetrica
            icon={<Network size={24} />}
            titulo="Arestas Intercomunidades"
            valor={analiseComunidades.conexoes_intercomunidades.total_arestas_intercomunidades}
            subtitulo="Conexões entre grupos"
          />
          <CartaoMetrica
            icon={<Activity size={24} />}
            titulo="Percentual de Arestas Externas"
            valor={`${analiseComunidades.conexoes_intercomunidades.percentual_arestas_intercomunidades}%`}
            subtitulo="Do total da rede"
          />
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">👥 Grupos de Consumidores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <CartaoMetrica
            icon={<Home size={24} />}
            titulo="Total de Consumidores (Grau 1)"
            valor={analiseComunidades.grupos_consumidores.total_consumidores.toLocaleString()}
            subtitulo={`${analiseComunidades.grupos_consumidores.percentual_rede}% da rede`}
          />
          <CartaoMetrica
            icon={<Network size={24} />}
            titulo="Comunidades com Consumidores"
            valor={analiseComunidades.grupos_consumidores.grupos.length}
            subtitulo="Distribuição na rede"
          />
        </div>

        <div className="mt-4">
          <h4 className="font-semibold mb-3 text-lg">Top 10 Comunidades por Concentração de Consumidores</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left p-3">Comunidade</th>
                  <th className="text-left p-3">Tamanho Total</th>
                  <th className="text-left p-3">Consumidores</th>
                  <th className="text-left p-3">% Consumidores</th>
                  <th className="text-left p-3">Hub Principal</th>
                </tr>
              </thead>
              <tbody>
                {analiseComunidades.grupos_consumidores.grupos.slice(0, 10).map((grupo: any) => (
                  <tr key={grupo.comunidade_id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-3 font-mono text-green-400">{grupo.comunidade_id}</td>
                    <td className="p-3">{grupo.tamanho_comunidade} nós</td>
                    <td className="p-3 font-bold text-yellow-400">{grupo.num_consumidores}</td>
                    <td className="p-3">{grupo.percentual_consumidores.toFixed(1)}%</td>
                    <td className="p-3 font-mono text-slate-300">
                      {grupo.hub_principal} (grau {grupo.grau_hub_principal})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbaComunidades;