import { Network, GitBranch, Activity, Zap, Eye } from 'lucide-react';
import { useState } from 'react';
import CartaoMetrica from '../CartaoMetrica';
import ModalGrafo from '../ModalGrafo';

interface AbaVisaoGeralProps {
  analiseBasica: any;
  analiseCriticidade: any;
}

const AbaVisaoGeral = ({ analiseBasica, analiseCriticidade }: AbaVisaoGeralProps) => {
  const [modalGrafo, setModalGrafo] = useState<{ aberto: boolean; arquivo: string; titulo: string }>({
    aberto: false,
    arquivo: '',
    titulo: ''
  });

  // Verificações de segurança
  if (!analiseBasica || !analiseCriticidade) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Carregando dados da análise...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CartaoMetrica
          icon={<Network size={24} />}
          titulo="Total de Nós"
          valor={analiseBasica.estatisticas.total_nos.toLocaleString()}
          subtitulo="Elementos da rede"
        />
        <CartaoMetrica
          icon={<GitBranch size={24} />}
          titulo="Total de Conexões"
          valor={analiseBasica.estatisticas.total_arestas.toLocaleString()}
          subtitulo="Linhas de transmissão"
        />
        <CartaoMetrica
          icon={<Activity size={24} />}
          titulo="Grau Médio"
          valor={analiseBasica.estatisticas.grau_medio.toFixed(2)}
          subtitulo="Conexões por nó"
        />
        <CartaoMetrica
          icon={<Zap size={24} />}
          titulo="Grau Máximo"
          valor={analiseBasica.estatisticas.grau_maximo}
          subtitulo={`Nó ${analiseBasica.top_hubs[0].no}`}
          destaque={true}
        />
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Resumo da Rede</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">Topologia</h3>
            <ul className="space-y-2 text-slate-300">
              <li>• Total de Nós: {analiseBasica.estatisticas.total_nos.toLocaleString()}</li>
              <li>• Total de Arestas: {analiseBasica.estatisticas.total_arestas.toLocaleString()}</li>
              <li>• Grau Médio: {analiseBasica.estatisticas.grau_medio.toFixed(2)}</li>
              <li>• Grau Máximo: {analiseBasica.estatisticas.grau_maximo}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">Criticidade (4 Dimensões)</h3>
            <ul className="space-y-2 text-slate-300">
              <li>• <span className="text-red-400">🔴 Pontos de Articulação:</span> {analiseCriticidade.pontos_articulacao?.total || 0} ({analiseCriticidade.pontos_articulacao?.percentual_rede || 0}%)</li>
              <li>• <span className="text-orange-400">🟠 Crítico Máximo (4D):</span> {analiseCriticidade.classificacao_criticidade?.nivel_1_critico_maximo_4d?.total || 0} nós</li>
              <li>• <span className="text-yellow-400">🟡 Betweenness Média:</span> {analiseCriticidade.centralidade_intermediacao?.media?.toFixed(6) || '0.000000'}</li>
              <li>• <span className="text-purple-400">🟣 Percolação Máxima:</span> {analiseCriticidade.analise_percolacao?.impacto_maximo_fragmentacao || 'N/A'}%</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Top 10 Hubs da Rede</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="text-left p-3">Posição</th>
                <th className="text-left p-3">Nó</th>
                <th className="text-left p-3">Grau</th>
                <th className="text-left p-3">Betweenness</th>
                <th className="text-left p-3">Ponto de Articulação</th>
                <th className="text-left p-3">Visualizar</th>
              </tr>
            </thead>
            <tbody>
              {analiseBasica.top_hubs?.slice(0, 10).map((hub: any, idx: number) => (
                <tr key={hub.no} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 text-slate-400">#{idx + 1}</td>
                  <td className="p-3 font-mono text-yellow-400">{hub.no}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300">{hub.grau}</span>
                  </td>
                  <td className="p-3 font-mono text-sm">
                    {analiseCriticidade.centralidade_intermediacao?.todos_nos?.[hub.no]?.toFixed(6) || '0.000000'}
                  </td>
                  <td className="p-3">
                    {analiseCriticidade.pontos_articulacao?.lista_completa?.includes(hub.no) ? (
                      <span className="px-2 py-1 bg-red-900/50 rounded text-red-300">✓ SIM</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-700 rounded text-slate-400">NÃO</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setModalGrafo({
                        aberto: true,
                        arquivo: `grafos/hubs/rede_hub_${hub.no}_grau_${hub.grau}.html`,
                        titulo: `Hub ${hub.no} (Grau ${hub.grau})`
                      })}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded flex items-center gap-2 text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Grafo
                    </button>
                  </td>
                </tr>
              )) || []}
            </tbody>
          </table>
        </div>
      </div>

      <ModalGrafo
        aberto={modalGrafo.aberto}
        arquivo={modalGrafo.arquivo}
        titulo={modalGrafo.titulo}
        onFechar={() => setModalGrafo({ aberto: false, arquivo: '', titulo: '' })}
      />
    </div>
  );
};

export default AbaVisaoGeral;