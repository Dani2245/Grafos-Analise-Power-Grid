import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertTriangle } from 'lucide-react';

interface AbaSimulacaoAtaquesProps {
  analiseAtaques: any;
}

const AbaSimulacaoAtaques: React.FC<AbaSimulacaoAtaquesProps> = ({ analiseAtaques }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-700/50 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-red-400" size={32} />
          Simulação de Ataques à Rede
        </h2>
        <p className="text-slate-300 mb-4">
          Comparação entre ataques aleatórios e direcionados (targeted). Ataques direcionados focam nos nós
          mais importantes (grau alto, betweenness alto, pontos de articulação).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/80 p-4 rounded">
            <div className="text-slate-400 text-sm">Estratégia Mais Eficaz</div>
            <div className="text-2xl font-bold text-red-400">
              {analiseAtaques.analise_comparativa.estrategia_mais_eficaz}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Fragmenta com {analiseAtaques.analise_comparativa.ponto_critico_betweenness.toFixed(1)}% de remoções
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded">
            <div className="text-slate-400 text-sm">Nível de Robustez</div>
            <div className={`text-2xl font-bold ${
              analiseAtaques.analise_comparativa.nivel_robustez === 'ALTA' ? 'text-green-400' :
              analiseAtaques.analise_comparativa.nivel_robustez === 'MÉDIA' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {analiseAtaques.analise_comparativa.nivel_robustez}
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded">
            <div className="text-slate-400 text-sm">Ataque Aleatório</div>
            <div className="text-2xl font-bold text-blue-400">
              {analiseAtaques.analise_comparativa.ponto_critico_aleatorio.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Ponto crítico</div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded">
            <div className="text-slate-400 text-sm">Diferença</div>
            <div className="text-2xl font-bold text-purple-400">
              {analiseAtaques.analise_comparativa.diferenca_aleatorio_direcionado.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Aleatório vs Direcionado</div>
          </div>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-400 mb-2">📊 Interpretação</h3>
          <p className="text-slate-300 text-sm">
            {analiseAtaques.analise_comparativa.descricao_robustez}
          </p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Curvas de Fragmentação</h2>
        <p className="text-slate-400 mb-4 text-sm">
          Evolução da fragmentação conforme nós são removidos progressivamente. Fragmentação = 1 - (tamanho maior componente / total nós).
        </p>
        <LineChart width={900} height={400}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="percentual_removido"
            stroke="#94a3b8"
            label={{ value: '% de Nós Removidos', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
          />
          <YAxis
            stroke="#94a3b8"
            label={{ value: 'Fragmentação da Rede', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
            formatter={(value: any) => value.toFixed(3)}
          />
          <Legend />
          <Line
            data={analiseAtaques.comparacao_estrategias.ataque_aleatorio.curva}
            type="monotone"
            dataKey="fragmentacao"
            stroke="#3b82f6"
            name="Ataque Aleatório"
            strokeWidth={2}
          />
          <Line
            data={analiseAtaques.comparacao_estrategias.ataque_grau.curva}
            type="monotone"
            dataKey="fragmentacao"
            stroke="#f59e0b"
            name="Ataque por Grau"
            strokeWidth={2}
          />
          <Line
            data={analiseAtaques.comparacao_estrategias.ataque_betweenness.curva}
            type="monotone"
            dataKey="fragmentacao"
            stroke="#ef4444"
            name="Ataque por Betweenness"
            strokeWidth={2}
          />
          <Line
            data={analiseAtaques.comparacao_estrategias.ataque_articulacao.curva}
            type="monotone"
            dataKey="fragmentacao"
            stroke="#8b5cf6"
            name="Ataque a Pontos de Articulação"
            strokeWidth={2}
          />
        </LineChart>
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Vulnerabilidades Críticas</h2>
        <p className="text-slate-400 mb-4">
          Impacto da remoção simultânea de grupos de nós estratégicos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4 border border-blue-700/50">
            <h3 className="font-semibold text-blue-400 mb-3">Top 10 Hubs</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Componentes criados:</span>
                <span className="font-mono text-blue-300">
                  {analiseAtaques.vulnerabilidades_criticas.remocao_top_10_hubs.impacto.num_componentes}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fragmentação:</span>
                <span className="font-mono text-blue-300">
                  {(analiseAtaques.vulnerabilidades_criticas.remocao_top_10_hubs.impacto.fragmentacao * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Maior componente:</span>
                <span className="font-mono text-blue-300">
                  {analiseAtaques.vulnerabilidades_criticas.remocao_top_10_hubs.impacto.percentual_maior_componente.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4 border border-orange-700/50">
            <h3 className="font-semibold text-orange-400 mb-3">Top 10 Pontos de Articulação</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Componentes criados:</span>
                <span className="font-mono text-orange-300">
                  {analiseAtaques.vulnerabilidades_criticas.remocao_top_10_articulacao.impacto.num_componentes}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fragmentação:</span>
                <span className="font-mono text-orange-300">
                  {(analiseAtaques.vulnerabilidades_criticas.remocao_top_10_articulacao.impacto.fragmentacao * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Maior componente:</span>
                <span className="font-mono text-orange-300">
                  {analiseAtaques.vulnerabilidades_criticas.remocao_top_10_articulacao.impacto.percentual_maior_componente.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4 border border-red-700/50">
            <h3 className="font-semibold text-red-400 mb-3">Combinação (Hubs + Articulação)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Componentes criados:</span>
                <span className="font-mono text-red-300">
                  {analiseAtaques.vulnerabilidades_criticas.remocao_combinada.impacto.num_componentes}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fragmentação:</span>
                <span className="font-mono text-red-300">
                  {(analiseAtaques.vulnerabilidades_criticas.remocao_combinada.impacto.fragmentacao * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Maior componente:</span>
                <span className="font-mono text-red-300">
                  {analiseAtaques.vulnerabilidades_criticas.remocao_combinada.impacto.percentual_maior_componente.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbaSimulacaoAtaques;
