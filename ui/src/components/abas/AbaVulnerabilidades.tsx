import { AlertCircle, AlertTriangle, Network, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AbaVulnerabilidadesProps {
  analiseCriticidade: any;
  analiseBasica: any;
}

const AbaVulnerabilidades = ({ analiseCriticidade, analiseBasica }: AbaVulnerabilidadesProps) => {
  return (
    <div className="space-y-6">
      {/* Seção de Nós Mais Críticos */}
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-2 border-red-600 rounded-lg p-6">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <AlertCircle className="text-red-400" size={36} />
          🔴 Nós Mais Críticos da Rede
        </h2>
        <p className="text-slate-300 mb-6 text-lg">
          Os <strong className="text-red-400">{analiseCriticidade.classificacao_criticidade.nivel_1_critico_maximo.total} nós</strong> abaixo possuem as <strong>três dimensões de criticidade simultaneamente</strong>:
          são Pontos de Articulação (fragmentam a rede), têm Alto Grau (muitas conexões) e Alta Betweenness (muito tráfego passa por eles).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-900/40 p-4 rounded-lg border border-red-600">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-red-400" size={24} />
              <span className="text-red-300 font-semibold">Ponto de Articulação</span>
            </div>
            <p className="text-slate-300 text-sm">Remoção fragmenta a rede em componentes desconectados</p>
          </div>

          <div className="bg-orange-900/40 p-4 rounded-lg border border-orange-600">
            <div className="flex items-center gap-2 mb-2">
              <Network className="text-orange-400" size={24} />
              <span className="text-orange-300 font-semibold">Alto Grau (8+)</span>
            </div>
            <p className="text-slate-300 text-sm">Muitas conexões diretas - falha afeta diversos vizinhos</p>
          </div>

          <div className="bg-yellow-900/40 p-4 rounded-lg border border-yellow-600">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="text-yellow-400" size={24} />
              <span className="text-yellow-300 font-semibold">Alta Betweenness</span>
            </div>
            <p className="text-slate-300 text-sm">Muito fluxo passa por este nó - gargalo crítico</p>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg p-4 mb-6">
          <h3 className="text-xl font-bold text-red-300 mb-3">💥 Impacto da Falha</h3>
          <p className="text-slate-200">
            <strong className="text-red-400">Fragmentação + Sobrecarga + Isolamento:</strong> A falha de qualquer um destes nós
            causa <span className="text-red-400 font-semibold">desconexão da rede</span>, afeta <span className="text-orange-400 font-semibold">múltiplos pontos conectados</span> e
            interrompe <span className="text-yellow-400 font-semibold">fluxos críticos</span>. É o pior cenário possível.
          </p>
        </div>

        {/* Tabela de Nós Críticos Máximos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-red-900/50 border-b-2 border-red-600">
              <tr>
                <th className="p-3 font-semibold">Ranking</th>
                <th className="p-3 font-semibold">Nó</th>
                <th className="p-3 font-semibold">Grau</th>
                <th className="p-3 font-semibold">Betweenness</th>
                <th className="p-3 font-semibold">Criticidade</th>
              </tr>
            </thead>
            <tbody>
              {analiseCriticidade.classificacao_criticidade.nivel_1_critico_maximo.nos
                .sort((a: any, b: any) => b.betweenness - a.betweenness)
                .map((no: any, idx: number) => (
                  <tr
                    key={no.no}
                    className={`border-b border-slate-700 ${idx < 5 ? 'bg-red-900/20' : 'hover:bg-slate-700/30'}`}
                  >
                    <td className="p-3">
                      {idx < 5 && <span className="text-red-400 font-bold">⚠️ </span>}
                      {idx + 1}
                    </td>
                    <td className="p-3 font-mono font-bold text-yellow-400">{no.no}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-orange-900/40 rounded text-orange-300">
                        {no.grau}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-yellow-900/40 rounded text-yellow-300">
                        {no.betweenness.toFixed(6)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <span className="px-2 py-1 bg-red-800 rounded text-white text-xs">Articulação</span>
                        <span className="px-2 py-1 bg-orange-800 rounded text-white text-xs">Grau Alto</span>
                        <span className="px-2 py-1 bg-yellow-800 rounded text-white text-xs">Betw. Alta</span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-red-300 mb-2 flex items-center gap-2">
            <AlertTriangle size={20} />
            Recomendação Prioritária
          </h4>
          <p className="text-slate-300 text-sm">
            Estes {analiseCriticidade.classificacao_criticidade.nivel_1_critico_maximo.total} nós requerem <strong className="text-red-400">monitoramento 24/7</strong>,
            sistemas de <strong className="text-orange-400">redundância máxima</strong> e <strong className="text-yellow-400">planos de contingência imediatos</strong>.
            Considere investimentos prioritários em proteção, backup e rotas alternativas para estes pontos.
          </p>
        </div>
      </div>

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

      {/* Análise de Vulnerabilidades Estruturais */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="text-orange-400" />
          Análise de Vulnerabilidades Estruturais da Rede
        </h2>

        <div className="space-y-6">
          <div className="bg-slate-700 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-3 text-red-400">🔴 Nível 1 - Crítico Máximo</h3>
            <p className="text-slate-300 mb-2">
              <strong>{analiseCriticidade.classificacao_criticidade.nivel_1_critico_maximo.total} nós</strong> -
              {analiseCriticidade.classificacao_criticidade.nivel_1_critico_maximo.descricao}
            </p>
            <div className="bg-red-900/20 p-3 rounded mt-2">
              <p className="text-sm text-red-200">
                <strong>Impacto:</strong> {analiseCriticidade.classificacao_criticidade.nivel_1_critico_maximo.impacto}
              </p>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-3 text-orange-400">🟠 Nível 2 - Crítico Alto</h3>
            <p className="text-slate-300 mb-2">
              <strong>{analiseCriticidade.classificacao_criticidade.nivel_2_critico_alto.total} nós</strong> -
              {analiseCriticidade.classificacao_criticidade.nivel_2_critico_alto.descricao}
            </p>
            <div className="bg-orange-900/20 p-3 rounded mt-2">
              <p className="text-sm text-orange-200">
                <strong>Impacto:</strong> {analiseCriticidade.classificacao_criticidade.nivel_2_critico_alto.impacto}
              </p>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-3 text-yellow-400">🟡 Nível 3 - Crítico Médio</h3>
            <p className="text-slate-300 mb-2">
              <strong>{analiseCriticidade.classificacao_criticidade.nivel_3_critico_medio.total} nós</strong> -
              {analiseCriticidade.classificacao_criticidade.nivel_3_critico_medio.descricao}
            </p>
            <div className="bg-yellow-900/20 p-3 rounded mt-2">
              <p className="text-sm text-yellow-200">
                <strong>Impacto:</strong> {analiseCriticidade.classificacao_criticidade.nivel_3_critico_medio.impacto}
              </p>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-3 text-blue-400">🔵 Nível 4 - Atenção (Gargalo)</h3>
            <p className="text-slate-300 mb-2">
              <strong>{analiseCriticidade.classificacao_criticidade.nivel_4_atencao_gargalo.total} nós</strong> -
              {analiseCriticidade.classificacao_criticidade.nivel_4_atencao_gargalo.descricao}
            </p>
            <div className="bg-blue-900/20 p-3 rounded mt-2">
              <p className="text-sm text-blue-200">
                <strong>Impacto:</strong> {analiseCriticidade.classificacao_criticidade.nivel_4_atencao_gargalo.impacto}
              </p>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-3 text-green-400">🟢 Nível 5 - Atenção (Hub)</h3>
            <p className="text-slate-300 mb-2">
              <strong>{analiseCriticidade.classificacao_criticidade.nivel_5_atencao_hub.total} nós</strong> -
              {analiseCriticidade.classificacao_criticidade.nivel_5_atencao_hub.descricao}
            </p>
            <div className="bg-green-900/20 p-3 rounded mt-2">
              <p className="text-sm text-green-200">
                <strong>Impacto:</strong> {analiseCriticidade.classificacao_criticidade.nivel_5_atencao_hub.impacto}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg p-5 border border-yellow-600">
            <h3 className="text-xl font-semibold mb-4 text-yellow-400">📊 Resumo Estatístico de Criticidade</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">
                  {analiseCriticidade.classificacao_criticidade.nivel_1_critico_maximo.total}
                </div>
                <div className="text-xs text-slate-400 mt-1">Nível 1</div>
                <div className="text-xs text-slate-500">Crítico Máximo</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {analiseCriticidade.classificacao_criticidade.nivel_2_critico_alto.total}
                </div>
                <div className="text-xs text-slate-400 mt-1">Nível 2</div>
                <div className="text-xs text-slate-500">Crítico Alto</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {analiseCriticidade.classificacao_criticidade.nivel_3_critico_medio.total}
                </div>
                <div className="text-xs text-slate-400 mt-1">Nível 3</div>
                <div className="text-xs text-slate-500">Crítico Médio</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {analiseCriticidade.classificacao_criticidade.nivel_4_atencao_gargalo.total}
                </div>
                <div className="text-xs text-slate-400 mt-1">Nível 4</div>
                <div className="text-xs text-slate-500">Atenção Gargalo</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {analiseCriticidade.classificacao_criticidade.nivel_5_atencao_hub.total}
                </div>
                <div className="text-xs text-slate-400 mt-1">Nível 5</div>
                <div className="text-xs text-slate-500">Atenção Hub</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-600">
              <p className="text-slate-300 text-sm">
                <strong className="text-yellow-400">Total de nós críticos ou em atenção:</strong>{' '}
                {analiseCriticidade.classificacao_criticidade.nivel_1_critico_maximo.total +
                  analiseCriticidade.classificacao_criticidade.nivel_2_critico_alto.total +
                  analiseCriticidade.classificacao_criticidade.nivel_3_critico_medio.total +
                  analiseCriticidade.classificacao_criticidade.nivel_4_atencao_gargalo.total +
                  analiseCriticidade.classificacao_criticidade.nivel_5_atencao_hub.total} nós
                {' '}
                ({((
                  (analiseCriticidade.classificacao_criticidade.nivel_1_critico_maximo.total +
                    analiseCriticidade.classificacao_criticidade.nivel_2_critico_alto.total +
                    analiseCriticidade.classificacao_criticidade.nivel_3_critico_medio.total +
                    analiseCriticidade.classificacao_criticidade.nivel_4_atencao_gargalo.total +
                    analiseCriticidade.classificacao_criticidade.nivel_5_atencao_hub.total) /
                  analiseBasica.estatisticas.total_nos
                ) * 100).toFixed(2)}% da rede)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbaVulnerabilidades;
