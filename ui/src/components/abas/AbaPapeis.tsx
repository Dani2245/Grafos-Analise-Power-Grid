import React from 'react';
import { Home, Zap, Cpu, Radio } from 'lucide-react';

interface AbaPapeisProps {
  inferencePapeis: any;
}

const AbaPapeis: React.FC<AbaPapeisProps> = ({ inferencePapeis }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🏷️ Inferência de Papéis na Rede Elétrica</h2>
        <p className="text-slate-400 mb-6">
          Classificação dos nós baseada em métricas topológicas (grau, betweenness, clustering, posição na comunidade).
          <br />
          <strong>Nota:</strong> Esta é uma inferência hipotética baseada puramente em estrutura topológica, 
          sem dados reais sobre função dos nós.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-4 rounded border border-green-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Home className="text-green-400" size={24} />
              <div className="text-green-300 text-sm">Consumidores</div>
            </div>
            <div className="text-4xl font-bold text-green-400">
              {inferencePapeis.contagem_papeis.CONSUMIDOR}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {inferencePapeis.estatisticas_gerais.CONSUMIDOR.percentual.toFixed(1)}% da rede
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Grau = 1 (terminal)
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 p-4 rounded border border-yellow-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-yellow-400" size={24} />
              <div className="text-yellow-300 text-sm">Geradores</div>
            </div>
            <div className="text-4xl font-bold text-yellow-400">
              {inferencePapeis.contagem_papeis.GERADOR}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {inferencePapeis.estatisticas_gerais.GERADOR.percentual.toFixed(1)}% da rede
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Grau alto ≥8, hubs
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-4 rounded border border-blue-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="text-blue-400" size={24} />
              <div className="text-blue-300 text-sm">Transformadores</div>
            </div>
            <div className="text-4xl font-bold text-blue-400">
              {inferencePapeis.contagem_papeis.TRANSFORMADOR}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {inferencePapeis.estatisticas_gerais.TRANSFORMADOR.percentual.toFixed(1)}% da rede
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Grau 4-7, críticos
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-4 rounded border border-purple-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="text-purple-400" size={24} />
              <div className="text-purple-300 text-sm">Linhas Transmissão</div>
            </div>
            <div className="text-4xl font-bold text-purple-400">
              {inferencePapeis.contagem_papeis.LINHA_TRANSMISSAO}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {inferencePapeis.estatisticas_gerais.LINHA_TRANSMISSAO.percentual.toFixed(1)}% da rede
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Grau 2-3, baixo clustering
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Estatísticas por Papel</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="p-3">Papel</th>
                <th className="p-3">Quantidade</th>
                <th className="p-3">Grau Médio</th>
                <th className="p-3">Grau Min-Max</th>
                <th className="p-3">Betweenness Médio</th>
                <th className="p-3">Clustering Médio</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(inferencePapeis.estatisticas_gerais).map(([papel, stats]: [string, any]) => (
                <tr key={papel} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 font-semibold">
                    {papel === 'CONSUMIDOR' && <span className="text-green-400">🏠 Consumidor</span>}
                    {papel === 'GERADOR' && <span className="text-yellow-400">⚡ Gerador</span>}
                    {papel === 'TRANSFORMADOR' && <span className="text-blue-400">🔧 Transformador</span>}
                    {papel === 'LINHA_TRANSMISSAO' && <span className="text-purple-400">📡 Linha Transmissão</span>}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-slate-700 rounded">
                      {stats.quantidade}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{stats.grau_medio.toFixed(2)}</td>
                  <td className="p-3 font-mono text-xs">{stats.grau_min} - {stats.grau_max}</td>
                  <td className="p-3 font-mono text-xs">{stats.betweenness_medio.toFixed(6)}</td>
                  <td className="p-3 font-mono text-xs">{stats.clustering_medio.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">⚡ Top 20 Geradores</h2>
          <p className="text-slate-400 mb-4 text-sm">Nós com grau ≥8, hubs das comunidades.</p>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 sticky top-0 bg-slate-800">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Nó</th>
                  <th className="p-2">Grau</th>
                  <th className="p-2">Betweenness</th>
                  <th className="p-2">Articulação</th>
                </tr>
              </thead>
              <tbody>
                {inferencePapeis.top_geradores.map((no: any, idx: number) => (
                  <tr key={no.no} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-2 text-slate-400">{idx + 1}</td>
                    <td className="p-2 font-mono text-yellow-400 font-bold">{no.no}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-yellow-900/50 rounded text-yellow-300">
                        {no.grau}
                      </span>
                    </td>
                    <td className="p-2 font-mono">{no.betweenness.toFixed(4)}</td>
                    <td className="p-2 text-center">
                      {no.eh_articulacao ? '✓' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">🔧 Top 20 Transformadores</h2>
          <p className="text-slate-400 mb-4 text-sm">Nós com grau 4-7, função crítica.</p>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 sticky top-0 bg-slate-800">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Nó</th>
                  <th className="p-2">Grau</th>
                  <th className="p-2">Betweenness</th>
                  <th className="p-2">Articulação</th>
                </tr>
              </thead>
              <tbody>
                {inferencePapeis.top_transformadores.map((no: any, idx: number) => (
                  <tr key={no.no} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-2 text-slate-400">{idx + 1}</td>
                    <td className="p-2 font-mono text-blue-400 font-bold">{no.no}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300">
                        {no.grau}
                      </span>
                    </td>
                    <td className="p-2 font-mono">{no.betweenness.toFixed(4)}</td>
                    <td className="p-2 text-center">
                      {no.eh_articulacao ? '✓' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🔗 Matriz de Interações entre Papéis</h2>
        <p className="text-slate-400 mb-4 text-sm">
          Número de conexões (arestas) entre diferentes tipos de nós.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="p-3">De \ Para</th>
                <th className="p-3 text-green-400">Consumidor</th>
                <th className="p-3 text-yellow-400">Gerador</th>
                <th className="p-3 text-blue-400">Transformador</th>
                <th className="p-3 text-purple-400">Linha Transmissão</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(inferencePapeis.interacoes_papeis).map(([origem, destinos]: [string, any]) => (
                <tr key={origem} className="border-b border-slate-700/50">
                  <td className="p-3 font-semibold">
                    {origem === 'CONSUMIDOR' && <span className="text-green-400">Consumidor</span>}
                    {origem === 'GERADOR' && <span className="text-yellow-400">Gerador</span>}
                    {origem === 'TRANSFORMADOR' && <span className="text-blue-400">Transformador</span>}
                    {origem === 'LINHA_TRANSMISSAO' && <span className="text-purple-400">Linha Transmissão</span>}
                  </td>
                  <td className="p-3 font-mono text-center">{destinos.CONSUMIDOR}</td>
                  <td className="p-3 font-mono text-center">{destinos.GERADOR}</td>
                  <td className="p-3 font-mono text-center">{destinos.TRANSFORMADOR}</td>
                  <td className="p-3 font-mono text-center">{destinos.LINHA_TRANSMISSAO}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AbaPapeis;
