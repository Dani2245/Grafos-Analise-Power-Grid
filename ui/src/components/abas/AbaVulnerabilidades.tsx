import { useState } from 'react';
import { AlertCircle, AlertTriangle, Network, Activity, Eye } from 'lucide-react';
import TooltipTermoTecnico from '../TooltipTermoTecnico';
import { GLOSSARIO } from '../../utils/glossario';
import ModalGrafo from '../ModalGrafo';

interface AbaVulnerabilidadesProps {
  analiseCriticidade: any;
  analiseBasica: any;
}

const AbaVulnerabilidades = ({ analiseCriticidade, analiseBasica }: AbaVulnerabilidadesProps) => {
  const [modalGrafo, setModalGrafo] = useState<{ aberto: boolean; arquivo: string; titulo: string }>({
    aberto: false,
    arquivo: '',
    titulo: ''
  });

  // Verificação de segurança
  if (!analiseCriticidade || !analiseBasica) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Carregando dados de vulnerabilidades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Análise de Vulnerabilidades Estruturais */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="text-orange-400" />
          Análise de Vulnerabilidades Estruturais da Rede
        </h2>

        <p className="text-slate-300 mb-4">
          A criticidade de um nó na rede elétrica é avaliada em <strong className="text-purple-400">4 dimensões independentes</strong>.
          Nós que combinam múltiplas dimensões são especialmente críticos:
        </p>

        <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg p-5 border border-yellow-600">
          <h3 className="text-xl font-semibold mb-4 text-yellow-400">📊 Resumo Estatístico de Criticidade</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">
                {analiseCriticidade.classificacao_criticidade?.nivel_1_critico_maximo_4d?.total || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Nível 1</div>
              <div className="text-xs text-slate-500">Crítico Máximo 4D</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">
                {analiseCriticidade.classificacao_criticidade?.nivel_2_critico_muito_alto?.total || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Nível 2</div>
              <div className="text-xs text-slate-500">Crítico Muito Alto</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {analiseCriticidade.classificacao_criticidade?.nivel_3_critico_alto?.total || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Nível 3</div>
              <div className="text-xs text-slate-500">Crítico Alto</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {analiseCriticidade.classificacao_criticidade?.nivel_4_critico_medio?.total || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Nível 4</div>
              <div className="text-xs text-slate-500">Crítico Médio</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {analiseCriticidade.classificacao_criticidade?.nivel_5_critico_basico?.total || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Nível 5</div>
              <div className="text-xs text-slate-500">Crítico Básico</div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-600">
            <p className="text-slate-300 text-sm">
              <strong className="text-yellow-400">Total de nós críticos:</strong>{' '}
              {(analiseCriticidade.classificacao_criticidade?.nivel_1_critico_maximo_4d?.total || 0) +
                (analiseCriticidade.classificacao_criticidade?.nivel_2_critico_muito_alto?.total || 0) +
                (analiseCriticidade.classificacao_criticidade?.nivel_3_critico_alto?.total || 0) +
                (analiseCriticidade.classificacao_criticidade?.nivel_4_critico_medio?.total || 0) +
                (analiseCriticidade.classificacao_criticidade?.nivel_5_critico_basico?.total || 0)} nós
              {' '}
              ({(((
                (analiseCriticidade.classificacao_criticidade?.nivel_1_critico_maximo_4d?.total || 0) +
                (analiseCriticidade.classificacao_criticidade?.nivel_2_critico_muito_alto?.total || 0) +
                (analiseCriticidade.classificacao_criticidade?.nivel_3_critico_alto?.total || 0) +
                (analiseCriticidade.classificacao_criticidade?.nivel_4_critico_medio?.total || 0) +
                (analiseCriticidade.classificacao_criticidade?.nivel_5_critico_basico?.total || 0)) /
                (analiseBasica?.estatisticas?.total_nos || 1)
              ) * 100).toFixed(2)}% da rede)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-900/20 p-4 rounded-lg border border-red-600">
            <h3 className="font-semibold text-red-300 mb-2 flex items-center gap-2">
              <span className="text-xl">①</span> Articulação Topológica
            </h3>
            <p className="text-sm text-slate-300 mb-2">
              <strong>Definição:</strong> Nó cuja remoção desconecta a rede em componentes separados.
            </p>
            <p className="text-sm text-slate-400">
              <strong>Total:</strong> {analiseCriticidade.pontos_articulacao.total} nós ({analiseCriticidade.pontos_articulacao.percentual_rede}% da rede)
            </p>
          </div>

          <div className="bg-orange-900/20 p-4 rounded-lg border border-orange-600">
            <h3 className="font-semibold text-orange-300 mb-2 flex items-center gap-2">
              <span className="text-xl">②</span> Alto Grau de Conectividade
            </h3>
            <p className="text-sm text-slate-300 mb-2">
              <strong>Definição:</strong> Nó com grau ≥ 8 (muitas conexões diretas).
            </p>
            <p className="text-sm text-slate-400">
              <strong>Impacto:</strong> Falha afeta diretamente múltiplos vizinhos simultaneamente.
            </p>
          </div>

          <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-600">
            <h3 className="font-semibold text-yellow-300 mb-2 flex items-center gap-2">
              <span className="text-xl">③</span> Alta Betweenness Centrality
            </h3>
            <p className="text-sm text-slate-300 mb-2">
              <strong>Definição:</strong> Nó no top 5% de betweenness (muitos caminhos passam por ele).
            </p>
            <p className="text-sm text-slate-400">
              <strong>Impacto:</strong> Gargalo crítico - interrompe fluxos essenciais da rede.
            </p>
          </div>

          <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-600">
            <h3 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
              <span className="text-xl">④</span> Alta Fragmentação por Percolação
            </h3>
            <p className="text-sm text-slate-300 mb-2">
              <strong>Definição:</strong> Nó cuja remoção causa fragmentação significativa (verificado por simulação).
            </p>
            <p className="text-sm text-slate-400">
              <strong>Impacto:</strong> Causa isolamento de múltiplos nós - impacto real medido.
            </p>
          </div>
        </div>
      </div>
      {/* Seção de Nós Mais Críticos */}
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-2 border-red-600 rounded-lg p-6">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <AlertCircle className="text-red-400" size={36} />
          🔴 Nós Mais Críticos da Rede
        </h2>
        <p className="text-slate-300 mb-6 text-lg">
          Os <strong className="text-red-400">{analiseCriticidade.classificacao_criticidade?.nivel_1_critico_maximo_4d?.total || 0} nós</strong> abaixo possuem as <strong>QUATRO dimensões de criticidade simultaneamente</strong>:
          são{' '}
          <TooltipTermoTecnico termo={GLOSSARIO.PONTO_ARTICULACAO.termo} definicao={GLOSSARIO.PONTO_ARTICULACAO.definicao} exemplo={GLOSSARIO.PONTO_ARTICULACAO.exemplo} />,
          têm Alto{' '}
          <TooltipTermoTecnico termo={GLOSSARIO.GRAU.termo} definicao={GLOSSARIO.GRAU.definicao} exemplo={GLOSSARIO.GRAU.exemplo} />,{' '}
          Alta{' '}
          <TooltipTermoTecnico termo={GLOSSARIO.BETWEENNESS.termo} definicao={GLOSSARIO.BETWEENNESS.definicao} exemplo={GLOSSARIO.BETWEENNESS.exemplo} />{' '}
          e causam <strong className="text-purple-400">Alta Fragmentação por Percolação</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <span className="text-orange-300 font-semibold">Alto Grau (≥8)</span>
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

          <div className="bg-purple-900/40 p-4 rounded-lg border border-purple-600">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-purple-400" size={24} />
              <span className="text-purple-300 font-semibold">Alta Percolação</span>
            </div>
            <p className="text-slate-300 text-sm">Remoção causa fragmentação significativa (top 5%)</p>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg p-4 mb-6">
          <h3 className="text-xl font-bold text-red-300 mb-3">💥 Impacto da Falha - Criticidade Máxima (4 Dimensões)</h3>
          <p className="text-slate-200">
            <strong className="text-red-400">Articulação + Grau Alto + Betweenness Alta + Percolação Alta:</strong> A falha de qualquer um destes nós:
          </p>
          <ul className="mt-3 space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold mt-1">1.</span>
              <span>Causa <span className="text-red-400 font-semibold">desconexão topológica</span> (ponto de articulação)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold mt-1">2.</span>
              <span>Afeta <span className="text-orange-400 font-semibold">múltiplos vizinhos diretos</span> (grau ≥8)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 font-bold mt-1">3.</span>
              <span>Interrompe <span className="text-yellow-400 font-semibold">caminhos críticos de fluxo</span> (betweenness alta)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold mt-1">4.</span>
              <span>Gera <span className="text-purple-400 font-semibold">fragmentação máxima verificada</span> (análise de percolação)</span>
            </li>
          </ul>
          <p className="text-slate-200 mt-3 pt-3 border-t border-slate-700">
            <strong className="text-red-400">É o pior cenário possível:</strong> impacto cascata em todas as métricas de vulnerabilidade.
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
                <th className="p-3 font-semibold">Percolação</th>
                <th className="p-3 font-semibold">4 Dimensões</th>
                <th className="p-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Função auxiliar para encontrar dados de percolação
                const getPercolacao = (nodeId: number) => {
                  if (!analiseCriticidade.analise_percolacao?.resultados) return null;
                  return analiseCriticidade.analise_percolacao.resultados.find(
                    (r: any) => r.no_removido === nodeId
                  );
                };

                return (analiseCriticidade.classificacao_criticidade?.nivel_1_critico_maximo_4d?.nos || [])
                  .sort((a: any, b: any) => b.betweenness - a.betweenness)
                  .map((no: any, idx: number) => {
                    const percData = getPercolacao(no.no);
                    return (
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
                          {percData ? (
                            <span className="px-2 py-1 bg-purple-900/40 rounded text-purple-300">
                              {percData.fragmentacao_percentual.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-1 bg-red-800 rounded text-white text-xs">Artic.</span>
                            <span className="px-2 py-1 bg-orange-800 rounded text-white text-xs">Grau</span>
                            <span className="px-2 py-1 bg-yellow-800 rounded text-white text-xs">Betw.</span>
                            <span className="px-2 py-1 bg-purple-800 rounded text-white text-xs">Perc.</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => setModalGrafo({
                              aberto: true,
                              arquivo: `grafos/nivel1/rede_nivel1_${no.no}_grau_${no.grau}_4d.html`,
                              titulo: `Grafo Nível 1 - Nó ${no.no} (4D Crítico)`
                            })}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm flex items-center gap-2 transition-colors"
                            title="Ver grafo interativo"
                          >
                            <Eye size={16} />
                            Ver Grafo
                          </button>
                        </td>
                      </tr>
                    );
                  });
              })()}
            </tbody>
          </table>
        </div>

        <div className="mt-4 bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <h4 className="font-semibold text-red-300 mb-2 flex items-center gap-2">
            <AlertTriangle size={20} />
            Recomendação Prioritária - Nível de Ameaça Máximo
          </h4>
          <p className="text-slate-300 text-sm mb-2">
            Estes {analiseCriticidade.classificacao_criticidade?.nivel_1_critico_maximo_4d?.total || 0} nós combinam <strong className="text-red-400">TODAS as 4 dimensões de criticidade</strong> identificadas pela análise:
          </p>
          <ul className="text-sm text-slate-300 space-y-1 ml-4 mb-2">
            <li>✓ Topologia: São pontos de articulação (fragmentam a rede)</li>
            <li>✓ Conectividade: Têm grau alto ≥8 (muitos vizinhos afetados)</li>
            <li>✓ Fluxo: Betweenness no top 5% (gargalos críticos)</li>
            <li>✓ Percolação: Fragmentação verificada por simulação (impacto real medido)</li>
          </ul>
          <p className="text-slate-300 text-sm">
            Requerem <strong className="text-red-400">monitoramento 24/7</strong>,
            sistemas de <strong className="text-orange-400">redundância máxima</strong>,
            <strong className="text-yellow-400">planos de contingência imediatos</strong> e
            <strong className="text-purple-400">rotas alternativas pré-estabelecidas</strong>.
            Considere investimentos prioritários em proteção física, backup de equipamentos e análise de fluxo de potência.
          </p>
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

export default AbaVulnerabilidades;
