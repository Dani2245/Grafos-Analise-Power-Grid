import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import TooltipTermoTecnico from '../TooltipTermoTecnico';
import { GLOSSARIO } from '../../utils/glossario';

interface AbaPontosArticulacaoProps {
  analiseCriticidade: any;
  analiseBasica: any;
}

const AbaPontosArticulacao = ({ analiseCriticidade, analiseBasica }: AbaPontosArticulacaoProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-red-700">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-red-400" />
          <TooltipTermoTecnico
            termo={GLOSSARIO.PONTO_ARTICULACAO.termo}
            definicao={GLOSSARIO.PONTO_ARTICULACAO.definicao}
            exemplo={GLOSSARIO.PONTO_ARTICULACAO.exemplo}
          />
        </h2>
        <p className="text-slate-400 mb-6">
          Nós cuja remoção desconectaria a rede. São pontos de falha críticos que podem fragmentar o sistema.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-900/20 p-4 rounded border border-red-700/50">
            <div className="text-3xl font-bold text-red-400">
              {analiseCriticidade.pontos_articulacao.total}
            </div>
            <div className="text-sm text-slate-300 mt-1">Total de Pontos</div>
            <div className="text-xs text-slate-400 mt-1">
              {analiseCriticidade.pontos_articulacao.percentual_rede}% da rede
            </div>
          </div>

          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-2xl font-bold">
              {analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_1.quantidade}
            </div>
            <div className="text-sm text-slate-300 mt-1">Grau 1</div>
            <div className="text-xs text-slate-400">Nós terminais</div>
          </div>

          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-2xl font-bold">
              {analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_2_3.quantidade}
            </div>
            <div className="text-sm text-slate-300 mt-1">Grau 2-3</div>
            <div className="text-xs text-slate-400">Mais vulneráveis</div>
          </div>

          <div className="bg-slate-700/30 p-4 rounded">
            <div className="text-2xl font-bold">
              {analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_4_7.quantidade +
                analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_8_plus.quantidade}
            </div>
            <div className="text-sm text-slate-300 mt-1">Grau 4+</div>
            <div className="text-xs text-slate-400">Hubs críticos</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Distribuição por Grau</h2>
        <PieChart width={500} height={300}>
          <Pie
            data={[
              {
                name: `Grau 1 (${analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_1.quantidade})`,
                value: analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_1.quantidade
              },
              {
                name: `Grau 2-3 (${analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_2_3.quantidade})`,
                value: analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_2_3.quantidade
              },
              {
                name: `Grau 4-7 (${analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_4_7.quantidade})`,
                value: analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_4_7.quantidade
              },
              {
                name: `Grau 8+ (${analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_8_plus.quantidade})`,
                value: analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_8_plus.quantidade
              }
            ]}
            cx={250}
            cy={150}
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'].map((cor, index) => (
              <Cell key={`cell-${index}`} fill={cor} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
        </PieChart>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">⚠️ Análise de Impacto</h2>
        <div className="space-y-4">
          <div className="p-4 bg-red-900/20 rounded border border-red-700/50">
            <h4 className="font-semibold text-red-300 mb-2">
              🔴 Alto Risco ({analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_2_3.quantidade} {analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_2_3.quantidade === 1 ? 'nó' : 'nós'})
            </h4>
            <p className="text-sm text-slate-300">
              Pontos de articulação com grau baixo (2-3). Sua falha causaria desconexão da rede com poucas alternativas.
              Representam {((analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_2_3.quantidade / analiseCriticidade.pontos_articulacao.total) * 100).toFixed(1)}% dos pontos críticos.
            </p>
          </div>

          <div className="p-4 bg-orange-900/20 rounded border border-orange-700/50">
            <h4 className="font-semibold text-orange-300 mb-2">
              🟠 Médio Risco ({analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_4_7.quantidade} {analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_4_7.quantidade === 1 ? 'nó' : 'nós'})
            </h4>
            <p className="text-sm text-slate-300">
              Pontos de articulação com grau intermediário (4-7). Falha causa fragmentação mas com mais opções de reconexão.
            </p>
          </div>

          <div className="p-4 bg-blue-900/20 rounded border border-blue-700/50">
            <h4 className="font-semibold text-blue-300 mb-2">
              🔵 Monitoramento ({analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_8_plus.quantidade} {analiseCriticidade.pontos_articulacao.distribuicao_por_grau.grau_8_plus.quantidade === 1 ? 'nó' : 'nós'})
            </h4>
            <p className="text-sm text-slate-300">
              Pontos de articulação com alto grau (8+). São hubs críticos mas com mais redundância na rede.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🎯 Top 100 Pontos de Articulação Mais Críticos</h2>
        <p className="text-slate-400 mb-4">
          Pontos de articulação ordenados por criticidade (combinação de grau e betweenness centrality).
          São os nós cuja falha teria maior impacto na fragmentação da rede.
        </p>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-700 sticky top-0 bg-slate-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Nó</th>
                <th className="p-3">Grau</th>
                <th className="p-3">Betweenness</th>
                <th className="p-3">Categoria de Risco</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Criar array com todos os pontos de articulação e suas métricas
                const pontosComMetricas = analiseCriticidade.pontos_articulacao.lista_completa
                  .map((nodeId: number) => {
                    const nodeData = analiseBasica.todos_nos.find((n: any) => n.no === nodeId);
                    return {
                      no: nodeId,
                      grau: nodeData?.grau || 0,
                      betweenness: analiseCriticidade.centralidade_intermediacao.todos_nos[nodeId] || 0
                    };
                  })
                  // Ordenar por criticidade: primeiro por betweenness (peso 0.6) e depois por grau (peso 0.4)
                  .sort((a: any, b: any) => {
                    const scoreA = (a.betweenness * 0.6) + (a.grau * 0.4);
                    const scoreB = (b.betweenness * 0.6) + (b.grau * 0.4);
                    return scoreB - scoreA;
                  })
                  .slice(0, 100);

                return pontosComMetricas.map((ponto: any, idx: number) => {
                  // Determinar categoria de risco
                  let risco = '';
                  let corRisco = '';
                  if (ponto.grau >= 8) {
                    risco = 'CRÍTICO - Hub';
                    corRisco = 'bg-red-900/50 text-red-300';
                  } else if (ponto.grau >= 4) {
                    risco = 'ALTO - Gargalo';
                    corRisco = 'bg-orange-900/50 text-orange-300';
                  } else if (ponto.grau >= 2) {
                    risco = 'MÉDIO - Ponte';
                    corRisco = 'bg-yellow-900/50 text-yellow-300';
                  } else {
                    risco = 'BAIXO - Terminal';
                    corRisco = 'bg-blue-900/50 text-blue-300';
                  }

                  return (
                    <tr key={ponto.no} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="p-3 text-slate-400">#{idx + 1}</td>
                      <td className="p-3 font-mono text-yellow-400 font-bold">{ponto.no}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300">{ponto.grau}</span>
                      </td>
                      <td className="p-3 font-mono text-sm">{ponto.betweenness.toFixed(6)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${corRisco}`}>
                          {risco}
                        </span>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-slate-700/30 rounded">
          <h4 className="font-semibold text-yellow-400 mb-2">💡 Legenda de Risco</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs">CRÍTICO</span>
              <span className="text-slate-400">Grau ≥ 8</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-900/50 text-orange-300 rounded text-xs">ALTO</span>
              <span className="text-slate-400">Grau 4-7</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded text-xs">MÉDIO</span>
              <span className="text-slate-400">Grau 2-3</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs">BAIXO</span>
              <span className="text-slate-400">Grau 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbaPontosArticulacao;