import { GitBranch, Network, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CartaoMetrica from '../CartaoMetrica';
import TooltipTermoTecnico from '../TooltipTermoTecnico';
import { GLOSSARIO } from '../../utils/glossario';

interface AbaClusteringProps {
  analiseCriticidade: any;
  analiseRobustez: any;
}

const AbaClustering = ({ analiseCriticidade, analiseRobustez }: AbaClusteringProps) => {
  // Dados de clustering vêm de analiseCriticidade (calculado em gerar_analise_avancada.py)
  const clustering = analiseCriticidade.analise_clustering;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900/30 to-slate-800 rounded-lg p-6 border-l-4 border-blue-500">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <GitBranch className="text-blue-400" />
          <TooltipTermoTecnico
            termo={GLOSSARIO.CLUSTERING.termo}
            definicao={GLOSSARIO.CLUSTERING.definicao}
            exemplo={GLOSSARIO.CLUSTERING.exemplo}
          />
        </h2>
        <p className="text-slate-300 mb-4">
          Mede a tendência dos vizinhos de um nó estarem conectados entre si. Valores altos indicam estrutura comunitária forte.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CartaoMetrica
          icon={<GitBranch size={24} />}
          titulo="Clustering Médio"
          valor={clustering.clustering_medio.toFixed(6)}
          subtitulo="Média dos coeficientes locais"
        />
        <CartaoMetrica
          icon={<Network size={24} />}
          titulo="Transitividade"
          valor={clustering.transitividade.toFixed(6)}
          subtitulo="Clustering global (fórmula alternativa)"
        />
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">📊 Distribuição de Clustering</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={clustering.distribuicao_clustering}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="range"
              stroke="#94a3b8"
              label={{ value: 'Faixa de Clustering', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
            />
            <YAxis
              stroke="#94a3b8"
              label={{ value: 'Número de Nós', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Quantidade de Nós" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-blue-900/20 rounded border border-blue-700">
          <p className="text-sm text-blue-200">
            <strong>Interpretação:</strong> {clustering.interpretacao}
          </p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Network className="text-blue-400" />
          Métricas Estruturais da Rede
        </h2>
        <p className="text-slate-300 mb-4">
          Propriedades estruturais complementares que indicam padrões de conectividade e organização.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CartaoMetrica
          icon={<Network size={24} />}
          titulo="Densidade da Rede"
          valor={analiseRobustez.metricas_robustez.densidade.toFixed(6)}
          subtitulo="Razão de conexões/possíveis"
        />
        <CartaoMetrica
          icon={<Activity size={24} />}
          titulo="Eficiência Local"
          valor={analiseRobustez.metricas_robustez.eficiencia_local.toFixed(4)}
          subtitulo="Eficiência de vizinhança"
        />
        <CartaoMetrica
          icon={<GitBranch size={24} />}
          titulo="Assortatividade"
          valor={analiseRobustez.metricas_robustez.assortativity.toFixed(4)}
          subtitulo="Correlação de graus"
        />
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">📏 Métricas de Distância</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-700/50 p-4 rounded">
            <div className="text-2xl font-bold text-blue-400">
              {analiseRobustez.metricas_robustez.avg_path_length.toFixed(2)}
            </div>
            <div className="text-sm text-slate-400 mt-1">Caminho Médio</div>
            <div className="text-xs text-slate-500">Distância típica</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded">
            <div className="text-2xl font-bold text-purple-400">
              {analiseRobustez.metricas_robustez.diameter}
            </div>
            <div className="text-sm text-slate-400 mt-1">Diâmetro</div>
            <div className="text-xs text-slate-500">Maior distância</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded">
            <div className="text-2xl font-bold text-green-400">
              {analiseRobustez.metricas_robustez.radius}
            </div>
            <div className="text-sm text-slate-400 mt-1">Raio</div>
            <div className="text-xs text-slate-500">Excentricidade mínima</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded">
            <div className="text-2xl font-bold text-yellow-400">
              {analiseRobustez.metricas_robustez.eficiencia_global.toFixed(4)}
            </div>
            <div className="text-sm text-slate-400 mt-1">Eficiência Global</div>
            <div className="text-xs text-slate-500">Média de eficiências</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">🔌 Conectividade</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 p-4 rounded">
            <div className="text-2xl font-bold text-red-400">
              {analiseRobustez.metricas_robustez.node_connectivity}
            </div>
            <div className="text-sm text-slate-400 mt-1">Node Connectivity</div>
            <div className="text-xs text-slate-500">Nós mínimos para desconexão</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded">
            <div className="text-2xl font-bold text-orange-400">
              {analiseRobustez.metricas_robustez.edge_connectivity}
            </div>
            <div className="text-sm text-slate-400 mt-1">Edge Connectivity</div>
            <div className="text-xs text-slate-500">Arestas mínimas para desconexão</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded">
            <div className="text-2xl font-bold text-blue-400">
              {analiseRobustez.metricas_robustez.algebraic_connectivity.toFixed(6)}
            </div>
            <div className="text-sm text-slate-400 mt-1">Conectividade Algébrica</div>
            <div className="text-xs text-slate-500">2º autovalor Laplaciano</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-900/20 rounded border border-blue-700">
          <p className="text-sm text-blue-200">
            <strong>Interpretação:</strong> Rede com baixa conectividade (node_connectivity=1) indica pontos únicos de falha.
            Conectividade algébrica baixa ({analiseRobustez.metricas_robustez.algebraic_connectivity.toFixed(6)}) sugere vulnerabilidade a particionamento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AbaClustering;