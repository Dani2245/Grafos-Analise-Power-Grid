import { BookOpen, Search } from 'lucide-react';
import { useState } from 'react';
import { GLOSSARIO } from '../../utils/glossario';

const AbaGlossario = () => {
    const [busca, setBusca] = useState('');

    // Organizar termos por categoria
    const categorias = {
        'Conceitos Básicos de Grafos': ['GRAFO', 'NO', 'ARESTA', 'GRAU'],
        'Métricas de Centralidade': ['BETWEENNESS', 'CLOSENESS', 'PAGERANK'],
        'Propriedades Estruturais': ['DENSIDADE', 'CLUSTERING', 'DIAMETRO', 'CAMINHO_MEDIO'],
        'Vulnerabilidade e Robustez': ['PONTO_ARTICULACAO', 'COMPONENTE_CONECTADO', 'SCALE_FREE'],
        'Análise de Redes Elétricas': ['CARGA', 'TENSAO', 'FREQUENCIA', 'GRID_STATUS', 'FLUXO_POTENCIA'],
        'Análise Temporal': ['TIMESTAMP', 'TAXA_FALHAS', 'TAXA_INSTABILIDADE']
    };

    // Filtrar termos baseado na busca
    const filtrarTermos = (categoria: string, termos: string[]) => {
        if (!busca) return termos;

        return termos.filter(key => {
            const termo = GLOSSARIO[key as keyof typeof GLOSSARIO];
            const textoBusca = busca.toLowerCase();
            return (
                termo.termo.toLowerCase().includes(textoBusca) ||
                termo.definicao.toLowerCase().includes(textoBusca) ||
                (termo.exemplo && termo.exemplo.toLowerCase().includes(textoBusca))
            );
        });
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-l-4 border-blue-400 p-6 rounded-lg">
                <div className="flex items-start gap-4">
                    <BookOpen className="text-blue-400 flex-shrink-0" size={32} />
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Glossário de Termos Técnicos</h2>
                        <p className="text-slate-300">
                            Este glossário reúne <strong>23 termos técnicos</strong> utilizados na análise de redes elétricas
                            com Teoria dos Grafos. Cada definição inclui explicação conceitual e exemplo prático para
                            facilitar a compreensão.
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                            💡 <strong>Dica:</strong> Use a busca abaixo para encontrar termos específicos rapidamente.
                        </p>
                    </div>
                </div>
            </div>

            {/* Barra de Busca */}
            <div className="bg-slate-800 rounded-lg p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar termo, definição ou exemplo... (ex: betweenness, centralidade, vulnerabilidade)"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                </div>
                {busca && (
                    <div className="mt-2 text-sm text-slate-400">
                        {Object.keys(categorias).reduce((total, cat) =>
                            total + filtrarTermos(cat, categorias[cat as keyof typeof categorias]).length, 0
                        )} termo(s) encontrado(s)
                    </div>
                )}
            </div>

            {/* Categorias e Termos */}
            {Object.entries(categorias).map(([nomeCategoria, termos]) => {
                const termosFiltrados = filtrarTermos(nomeCategoria, termos);

                // Não mostrar categoria vazia quando há busca ativa
                if (busca && termosFiltrados.length === 0) return null;

                return (
                    <div key={nomeCategoria} className="bg-slate-800 rounded-lg p-6">
                        <h3 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
                            {nomeCategoria === 'Conceitos Básicos de Grafos' && '🔹'}
                            {nomeCategoria === 'Métricas de Centralidade' && '📊'}
                            {nomeCategoria === 'Propriedades Estruturais' && '🏗️'}
                            {nomeCategoria === 'Vulnerabilidade e Robustez' && '🛡️'}
                            {nomeCategoria === 'Análise de Redes Elétricas' && '⚡'}
                            {nomeCategoria === 'Análise Temporal' && '⏱️'}
                            {nomeCategoria}
                        </h3>

                        <div className="space-y-4">
                            {termosFiltrados.map(key => {
                                const termo = GLOSSARIO[key as keyof typeof GLOSSARIO];
                                return (
                                    <div
                                        key={key}
                                        className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-slate-600 hover:border-yellow-400 transition-colors"
                                    >
                                        <h4 className="text-lg font-semibold text-white mb-2">
                                            {termo.termo}
                                        </h4>
                                        <p className="text-slate-300 mb-3 leading-relaxed">
                                            {termo.definicao}
                                        </p>
                                        {termo.exemplo && (
                                            <div className="bg-slate-800/50 rounded p-3 border-l-2 border-blue-400">
                                                <p className="text-sm text-slate-400">
                                                    <span className="font-semibold text-blue-400">💡 Exemplo:</span>{' '}
                                                    {termo.exemplo}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Mensagem quando busca não retorna resultados */}
            {busca && Object.keys(categorias).every(cat =>
                filtrarTermos(cat, categorias[cat as keyof typeof categorias]).length === 0
            ) && (
                    <div className="bg-slate-800 rounded-lg p-8 text-center">
                        <Search className="mx-auto mb-4 text-slate-500" size={48} />
                        <p className="text-slate-400 text-lg">
                            Nenhum termo encontrado para "{busca}"
                        </p>
                        <p className="text-slate-500 text-sm mt-2">
                            Tente buscar por: betweenness, centralidade, clustering, carga, densidade, etc.
                        </p>
                    </div>
                )}

            {/* Rodapé Informativo */}
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-300">
                    <strong>📖 Como usar este glossário:</strong> Os termos estão organizados por categoria para facilitar
                    navegação. Ao longo das outras abas da aplicação, você encontrará ícones de ajuda (❓) que, ao passar
                    o mouse, exibem essas mesmas definições diretamente no contexto.
                </p>
            </div>
        </div>
    );
};

export default AbaGlossario;
