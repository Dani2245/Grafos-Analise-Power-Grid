import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ScatterChart, Scatter, LineChart, Line } from 'recharts';
import { AlertCircle, Zap, Activity, GitBranch, Network, Cpu, Radio, Home, AlertTriangle, X } from 'lucide-react';

const AnaliseRedeEletrica = () => {
  const [abaAtiva, setAbaAtiva] = useState('visao-geral');
  const [analiseBasica, setAnaliseBasica] = useState<any>(null);
  const [analiseCriticidade, setAnaliseCriticidade] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalGrafo, setModalGrafo] = useState<{ aberto: boolean; arquivo: string; titulo: string }>({
    aberto: false,
    arquivo: '',
    titulo: ''
  });

  const CartaoMetrica = ({ icon, titulo, valor, subtitulo, destaque = false }: any) => (
    <div className={`bg-slate-800 rounded-lg p-6 border-l-4 ${destaque ? 'border-red-500' : 'border-yellow-400'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className={destaque ? 'text-red-400' : 'text-yellow-400'}>{icon}</div>
      </div>
      <div className="text-3xl font-bold mb-1">{valor}</div>
      <div className="text-sm text-slate-400">{titulo}</div>
      <div className="text-xs text-slate-500 mt-1">{subtitulo}</div>
    </div>
  );

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resBasica, resCriticidade] = await Promise.all([
          fetch('/analise_basica.json'),
          fetch('/analise_criticidade.json')
        ]);
        
        setAnaliseBasica(await resBasica.json());
        setAnaliseCriticidade(await resCriticidade.json());
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    };
    carregarDados();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Activity className="animate-spin mx-auto mb-4" size={48} />
          <p>Carregando análise da rede elétrica...</p>
        </div>
      </div>
    );
  }

  if (!analiseBasica || !analiseCriticidade) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center text-red-400">
          <AlertCircle className="mx-auto mb-4" size={48} />
          <p>Erro ao carregar dados da análise</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Zap className="text-yellow-400" size={40} />
            Análise da Rede Elétrica
          </h1>
          <p className="text-slate-400">Análise Topológica da Rede de Distribuição Elétrica</p>
          <p className="text-slate-500 text-sm mt-1">
            Dataset: Western States Power Grid • {analiseBasica.estatisticas.total_nos.toLocaleString()} nós • {analiseBasica.estatisticas.total_arestas.toLocaleString()} conexões
          </p>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {[
            { id: 'visao-geral', label: 'Visão Geral' },
            { id: 'categorias', label: 'Categorias' },
            { id: 'graus', label: 'Análise por Grau' },
            { id: 'betweenness', label: 'Betweenness' },
            { id: 'articulacao', label: 'Pontos de Articulação' },
            { id: 'criticidade', label: 'Criticidade' },
            { id: 'visualizacoes', label: 'Visualizações' },
            { id: 'vulnerabilidades', label: 'Vulnerabilidades' }
          ].map(aba => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`px-4 py-2 font-medium transition-colors ${
                abaAtiva === aba.id
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>

        {/* Aba: Visão Geral */}
        {abaAtiva === 'visao-geral' && (
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
                  <h3 className="text-lg font-semibold mb-3 text-yellow-400">Criticidade</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li>• <span className="text-red-400">🔴 Pontos de Articulação:</span> {analiseCriticidade.pontos_articulacao.total} ({analiseCriticidade.pontos_articulacao.percentual_rede}%)</li>
                    <li>• <span className="text-orange-400">🟠 Nós Críticos (Nível 1-2):</span> {analiseCriticidade.classificacao_criticidade.nivel_1_critico_maximo.total + analiseCriticidade.classificacao_criticidade.nivel_2_critico_alto.total}</li>
                    <li>• <span className="text-yellow-400">🟡 Betweenness Média:</span> {analiseCriticidade.centralidade_intermediacao.media.toFixed(6)}</li>
                    <li>• <span className="text-green-400">🟢 Top 5% Threshold:</span> {analiseCriticidade.centralidade_intermediacao.threshold_top_5_pct.toFixed(6)}</li>
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
                    </tr>
                  </thead>
                  <tbody>
                    {analiseBasica.top_hubs.slice(0, 10).map((hub: any, idx: number) => (
                      <tr key={hub.no} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="p-3 text-slate-400">#{idx + 1}</td>
                        <td className="p-3 font-mono text-yellow-400">{hub.no}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300">{hub.grau}</span>
                        </td>
                        <td className="p-3 font-mono text-sm">
                          {analiseCriticidade.centralidade_intermediacao.todos_nos[hub.no]?.toFixed(6) || '0.000000'}
                        </td>
                        <td className="p-3">
                          {analiseCriticidade.pontos_articulacao.lista_completa.includes(hub.no) ? (
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
          </div>
        )}

        {/* Aba: Categorias */}
        {abaAtiva === 'categorias' && (
          <div className="space-y-6">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-yellow-400">⚠️ Nota Importante sobre Categorização</h2>
              <p className="text-slate-300 mb-4">
                As categorias apresentadas abaixo são <strong>interpretações hipotéticas</strong> baseadas exclusivamente no grau de cada nó. 
                Esta é uma abordagem simplificada que <strong>não reflete necessariamente a função real</strong> de cada elemento na rede elétrica.
              </p>
              <p className="text-slate-400 text-sm">
                Nesta análise, tratamos os nós como <strong>elementos abstratos da rede</strong>, e a categorização serve apenas para fins educacionais 
                e de visualização da distribuição de graus. Para análise de criticidade real, consulte as abas de Betweenness, Pontos de Articulação e Criticidade.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Classificação Hipotética por Grau</h2>
              <p className="text-slate-400 mb-6">
                Distribuição dos nós segundo seu grau de conexão (meramente ilustrativo):
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Grau 1 */}
                <div className="bg-slate-700 rounded-lg p-5 border-l-4 border-green-400">
                  <div className="flex items-center gap-3 mb-3">
                    <Home size={28} className="text-green-400" />
                    <h3 className="text-xl font-bold text-green-400">Nós de Grau 1</h3>
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <p><strong>Grau:</strong> 1</p>
                    <p><strong>Quantidade:</strong> {(() => {
                      const qtd = analiseBasica.distribuicao_graus.find((d: any) => d.grau === 1)?.quantidade || 0;
                      const pct = analiseBasica.distribuicao_graus.find((d: any) => d.grau === 1)?.percentual || 0;
                      return `${qtd.toLocaleString()} ${qtd === 1 ? 'nó' : 'nós'} (${pct.toFixed(1)}%)`;
                    })()}</p>
                    <p className="text-sm text-slate-400">Nós terminais conectados a apenas um ponto. Hipoteticamente poderiam representar pontos finais de consumo.</p>
                  </div>
                </div>

                {/* Grau 2-3 */}
                <div className="bg-slate-700 rounded-lg p-5 border-l-4 border-blue-400">
                  <div className="flex items-center gap-3 mb-3">
                    <Radio size={28} className="text-blue-400" />
                    <h3 className="text-xl font-bold text-blue-400">Nós de Grau 2-3</h3>
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <p><strong>Grau:</strong> 2-3</p>
                    <p><strong>Quantidade:</strong> {(() => {
                      const qtd = (analiseBasica.distribuicao_graus.find((d: any) => d.grau === 2)?.quantidade || 0) + 
                                  (analiseBasica.distribuicao_graus.find((d: any) => d.grau === 3)?.quantidade || 0);
                      return `${qtd} ${qtd === 1 ? 'nó' : 'nós'}`;
                    })()}</p>
                    <p className="text-sm text-slate-400">Nós intermediários que formam caminhos na rede, hipoteticamente linhas de transmissão.</p>
                  </div>
                </div>

                {/* Grau 4-7 */}
                <div className="bg-slate-700 rounded-lg p-5 border-l-4 border-orange-400">
                  <div className="flex items-center gap-3 mb-3">
                    <Cpu size={28} className="text-orange-400" />
                    <h3 className="text-xl font-bold text-orange-400">Nós de Grau 4-7</h3>
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <p><strong>Grau:</strong> 4-7</p>
                    <p><strong>Quantidade:</strong> {(() => {
                      const qtd = analiseBasica.distribuicao_graus
                        .filter((d: any) => d.grau >= 4 && d.grau <= 7)
                        .reduce((sum: number, d: any) => sum + d.quantidade, 0);
                      return `${qtd} ${qtd === 1 ? 'nó' : 'nós'}`;
                    })()}</p>
                    <p className="text-sm text-slate-400">Nós com grau moderado que redistribuem fluxo, hipoteticamente subestações.</p>
                  </div>
                </div>

                {/* Grau 8+ */}
                <div className="bg-slate-700 rounded-lg p-5 border-l-4 border-red-400">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap size={28} className="text-red-400" />
                    <h3 className="text-xl font-bold text-red-400">Nós de Grau 8+</h3>
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <p><strong>Grau:</strong> 8 ou mais</p>
                    <p><strong>Quantidade:</strong> {(() => {
                      const qtd = analiseBasica.distribuicao_graus
                        .filter((d: any) => d.grau >= 8)
                        .reduce((sum: number, d: any) => sum + d.quantidade, 0);
                      return `${qtd} ${qtd === 1 ? 'nó' : 'nós'}`;
                    })()}</p>
                    <p className="text-sm text-slate-400">Nós com alto grau de conexão, hubs da rede que hipoteticamente poderiam ser geradores.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Distribuição Visual por Grau</h2>
              <LineChart  width={900} height={400} data={analiseBasica.distribuicao_graus.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="grau" stroke="#9ca3af" label={{ value: 'Grau', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#9ca3af" label={{ value: 'Quantidade de Nós', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="quantidade" stroke="#3b82f6" name="Quantidade de Nós" />
              </LineChart>
            </div>
          </div>
        )}

        {/* Aba: Análise por Grau */}
        {abaAtiva === 'graus' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Top 20 Nós por Grau (com Centralidade de Intermediação)</h2>
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
        )}

        {/* Aba: Betweenness */}
        {abaAtiva === 'betweenness' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">📊 Centralidade de Intermediação (Betweenness Centrality)</h2>
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
        )}

        {/* Aba: Pontos de Articulação */}
        {abaAtiva === 'articulacao' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-red-700">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-400" />
                Pontos de Articulação (Cut Vertices)
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
        )}

        {/* Aba: Níveis de Criticidade */}
        {abaAtiva === 'criticidade' && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-2xl font-bold mb-4">Classificação de Criticidade (5 Níveis)</h2>
              <p className="text-slate-400 mb-6">
                Nós classificados por criticidade estrutural combinando Pontos de Articulação, Alto Grau e Alta Betweenness.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(analiseCriticidade.classificacao_criticidade).map(([key, nivel]: [string, any]) => {
                  const cores: any = {
                    nivel_1_critico_maximo: { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-400', emoji: '🔴' },
                    nivel_2_critico_alto: { bg: 'bg-orange-900/30', border: 'border-orange-700', text: 'text-orange-400', emoji: '🟠' },
                    nivel_3_critico_medio: { bg: 'bg-yellow-900/30', border: 'border-yellow-700', text: 'text-yellow-400', emoji: '🟡' },
                    nivel_4_atencao_gargalo: { bg: 'bg-blue-900/30', border: 'border-blue-700', text: 'text-blue-400', emoji: '🔵' },
                    nivel_5_atencao_hub: { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-400', emoji: '🟢' }
                  }[key];
                  
                  return (
                    <div key={key} className={`${cores.bg} p-4 rounded border ${cores.border}`}>
                      <div className={`${cores.text} text-2xl font-bold`}>{nivel.total}</div>
                      <div className="text-sm mt-1">{cores.emoji} {key.split('_').slice(1, 3).join(' ')}</div>
                      <div className="text-xs text-slate-400 mt-2 line-clamp-3">{nivel.descricao}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detalhamento de cada nível */}
            {Object.entries(analiseCriticidade.classificacao_criticidade).map(([key, nivel]: [string, any]) => {
              const config: any = {
                nivel_1_critico_maximo: { emoji: '🔴', cor: 'red', label: 'Nível 1 - Crítico Máximo' },
                nivel_2_critico_alto: { emoji: '🟠', cor: 'orange', label: 'Nível 2 - Crítico Alto' },
                nivel_3_critico_medio: { emoji: '🟡', cor: 'yellow', label: 'Nível 3 - Crítico Médio' },
                nivel_4_atencao_gargalo: { emoji: '🔵', cor: 'blue', label: 'Nível 4 - Atenção (Gargalo)' },
                nivel_5_atencao_hub: { emoji: '🟢', cor: 'green', label: 'Nível 5 - Atenção (Hub)' }
              }[key];

              return (
                <div key={key} className={`bg-slate-800 p-6 rounded-lg border border-${config.cor}-700`}>
                  <h3 className={`text-xl font-semibold mb-2 text-${config.cor}-400`}>
                    {config.emoji} {config.label} ({nivel.total} {nivel.total === 1 ? 'nó' : 'nós'})
                  </h3>
                  <p className="text-sm text-slate-300 mb-2"><strong>Impacto:</strong> {nivel.impacto}</p>
                  <p className="text-xs text-slate-400 mb-4">{nivel.descricao}</p>
                  
                  {nivel.nos.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 mb-2">
                        Exibindo {Math.min(50, nivel.nos.length) === 1 ? 'o' : 'os'} {Math.min(50, nivel.nos.length)} {Math.min(50, nivel.nos.length) === 1 ? 'nó mais crítico' : 'nós mais críticos'} de {nivel.nos.length} total
                      </p>
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-slate-700 sticky top-0 bg-slate-800">
                            <tr>
                              <th className="p-2 text-left">#</th>
                              <th className="p-2 text-left">Nó</th>
                              <th className="p-2 text-left">Grau</th>
                              <th className="p-2 text-left">Betweenness</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nivel.nos.slice(0, 50).map((no: any, idx: number) => (
                              <tr key={no.no} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                <td className="p-2 text-slate-400">{idx + 1}</td>
                                <td className="p-2 font-mono text-yellow-400">{no.no}</td>
                                <td className="p-2">
                                  <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300">{no.grau}</span>
                                </td>
                                <td className="p-2 font-mono">{no.betweenness.toFixed(6)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Aba: Visualizações */}
        {abaAtiva === 'visualizacoes' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">🌐 Visualizações Interativas da Rede</h2>
              <p className="text-slate-400 mb-6">
                Grafos interativos gerados com Plotly. Clique em um grafo para visualizá-lo em modal.
              </p>

              <div className="space-y-8">
                {/* Seção: Hubs da Rede */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-yellow-400">📍 Visualização dos Principais Hubs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { file: 'rede_hub_2553_grau_19.html', titulo: 'Hub 2553', grau: 19, descricao: 'Hub Principal da Rede' },
                      { file: 'rede_hub_4458_grau_18.html', titulo: 'Hub 4458', grau: 18, descricao: 'Segundo Maior Hub' },
                      { file: 'rede_hub_831_grau_14.html', titulo: 'Hub 831', grau: 14, descricao: 'Hub de Grau 14' },
                      { file: 'rede_hub_3468_grau_14.html', titulo: 'Hub 3468', grau: 14, descricao: 'Hub de Grau 14' },
                      { file: 'rede_hub_4345_grau_14.html', titulo: 'Hub 4345', grau: 14, descricao: 'Hub de Grau 14' },
                      { file: 'rede_hub_2382_grau_13.html', titulo: 'Hub 2382', grau: 13, descricao: 'Hub de Grau 13' },
                      { file: 'rede_hub_2542_grau_13.html', titulo: 'Hub 2542', grau: 13, descricao: 'Hub de Grau 13' },
                      { file: 'rede_hub_2575_grau_13.html', titulo: 'Hub 2575', grau: 13, descricao: 'Hub de Grau 13' },
                      { file: 'rede_hub_2585_grau_13.html', titulo: 'Hub 2585', grau: 13, descricao: 'Hub de Grau 13' },
                      { file: 'rede_hub_3895_grau_13.html', titulo: 'Hub 3895', grau: 13, descricao: 'Hub de Grau 13' },
                      { file: 'rede_hub_2434_grau_12.html', titulo: 'Hub 2434', grau: 12, descricao: 'Hub de Grau 12' },
                      { file: 'rede_hub_2439_grau_12.html', titulo: 'Hub 2439', grau: 12, descricao: 'Hub de Grau 12' },
                      { file: 'rede_hub_1224_grau_12.html', titulo: 'Hub 1224', grau: 12, descricao: 'Hub de Grau 12' },
                      { file: 'rede_hub_2617_grau_12.html', titulo: 'Hub 2617', grau: 12, descricao: 'Hub de Grau 12' },
                      { file: 'rede_hub_2662_grau_12.html', titulo: 'Hub 2662', grau: 12, descricao: 'Hub de Grau 12' },
                      { file: 'rede_hub_1005_grau_11.html', titulo: 'Hub 1005', grau: 11, descricao: 'Hub de Grau 11' },
                      { file: 'rede_hub_1309_grau_11.html', titulo: 'Hub 1309', grau: 11, descricao: 'Hub de Grau 11' },
                      { file: 'rede_hub_1334_grau_11.html', titulo: 'Hub 1334', grau: 11, descricao: 'Hub de Grau 11' },
                      { file: 'rede_hub_2282_grau_11.html', titulo: 'Hub 2282', grau: 11, descricao: 'Hub de Grau 11' },
                      { file: 'rede_hub_490_grau_11.html', titulo: 'Hub 490', grau: 11, descricao: 'Hub de Grau 11' }
                    ].map((hub) => (
                      <button
                        key={hub.file}
                        onClick={() => setModalGrafo({ aberto: true, arquivo: hub.file, titulo: `${hub.titulo} - ${hub.descricao}` })}
                        className="block bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors border border-slate-600 hover:border-yellow-400 text-left w-full"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-lg">{hub.titulo}</h4>
                          <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300 text-sm">
                            Grau {hub.grau}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{hub.descricao}</p>
                        <div className="mt-3 flex items-center gap-2 text-yellow-400 text-sm">
                          <Network size={16} />
                          <span>Abrir visualização →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">💡 Como Usar as Visualizações</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-yellow-400">Interações Disponíveis:</h3>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li>• <strong>Zoom:</strong> Scroll do mouse ou pinça no touchpad</li>
                    <li>• <strong>Pan:</strong> Clique e arraste para mover o grafo</li>
                    <li>• <strong>Hover:</strong> Passe o mouse sobre nós para ver detalhes</li>
                    <li>• <strong>Seleção:</strong> Clique em nós/arestas para destacar</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-yellow-400">Sobre os Grafos:</h3>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li>• Nós coloridos por grau de conexão</li>
                    <li>• Tamanho dos nós proporcional ao grau</li>
                    <li>• Visualizações 2D interativas</li>
                    <li>• Gerados com Plotly para máxima interatividade</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aba: Vulnerabilidades */}
        {abaAtiva === 'vulnerabilidades' && (
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
        )}
      </div>

      {/* Modal de Visualização de Grafos */}
      {modalGrafo.aberto && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setModalGrafo({ aberto: false, arquivo: '', titulo: '' })}
        >
          <div 
            className="bg-slate-800 rounded-lg max-w-6xl w-full flex flex-col shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between p-3 border-b border-slate-700 flex-shrink-0">
              <h3 className="text-xl font-bold text-yellow-400">{modalGrafo.titulo}</h3>
              <button
                onClick={() => setModalGrafo({ aberto: false, arquivo: '', titulo: '' })}
                className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Conteúdo do Modal - iframe com o grafo */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`/${modalGrafo.arquivo}`}
                className="w-full h-full min-h-[610px] border-0"
                title={modalGrafo.titulo}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnaliseRedeEletrica;
