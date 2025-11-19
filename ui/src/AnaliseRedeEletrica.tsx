import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Zap, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import ModalGrafo from './components/ModalGrafo';
import AbaSimulacaoAtaques from './components/abas/AbaSimulacaoAtaques';
import AbaRobustez from './components/abas/AbaRobustez';
import AbaPapeis from './components/abas/AbaPapeis';
import AbaComunidades from './components/abas/AbaComunidades';
import AbaScaleFree from './components/abas/AbaScaleFree';
import AbaVulnerabilidades from './components/abas/AbaVulnerabilidades';
import AbaVisualizacoes from './components/abas/AbaVisualizacoes';
import AbaPontosArticulacao from './components/abas/AbaPontosArticulacao';
import AbaNiveisCriticidade from './components/abas/AbaNiveisCriticidade';
import AbaVisaoGeral from './components/abas/AbaVisaoGeral';
import AbaCategorias from './components/abas/AbaCategorias';
import AbaAnalisePorGrau from './components/abas/AbaAnalisePorGrau';
import AbaBetweeness from './components/abas/AbaBetweeness';
import AbaClustering from './components/abas/AbaClustering';

const AnaliseRedeEletrica = () => {
  const [abaAtiva, setAbaAtiva] = useState('visao-geral');
  const [analiseBasica, setAnaliseBasica] = useState<any>(null);
  const [analiseCriticidade, setAnaliseCriticidade] = useState<any>(null);
  const [analiseComunidades, setAnaliseComunidades] = useState<any>(null);
  const [analiseAtaques, setAnaliseAtaques] = useState<any>(null);
  const [analiseRobustez, setAnaliseRobustez] = useState<any>(null);
  const [inferencePapeis, setInferencePapeis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalGrafo, setModalGrafo] = useState<{ aberto: boolean; arquivo: string; titulo: string }>({
    aberto: false,
    arquivo: '',
    titulo: ''
  });
  const [mostrarScrollEsquerda, setMostrarScrollEsquerda] = useState(false);
  const [mostrarScrollDireita, setMostrarScrollDireita] = useState(false);
  const abasContainerRef = useRef<HTMLDivElement>(null);

  // Verificar se precisa mostrar botões de scroll
  const verificarScroll = () => {
    const container = abasContainerRef.current;
    if (container) {
      setMostrarScrollEsquerda(container.scrollLeft > 0);
      setMostrarScrollDireita(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  // Scroll para esquerda/direita
  const scrollAbas = (direcao: 'esquerda' | 'direita') => {
    const container = abasContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direcao === 'esquerda' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resBasica, resCriticidade, resComunidades, resAtaques, resRobustez, resPapeis] = await Promise.all([
          fetch('/analise_basica.json'),
          fetch('/analise_criticidade.json'),
          fetch('/analise_comunidades.json'),
          fetch('/analise_ataques.json'),
          fetch('/analise_robustez.json'),
          fetch('/inferencia_papeis.json')
        ]);

        setAnaliseBasica(await resBasica.json());
        setAnaliseCriticidade(await resCriticidade.json());
        setAnaliseComunidades(await resComunidades.json());
        setAnaliseAtaques(await resAtaques.json());
        setAnaliseRobustez(await resRobustez.json());
        setInferencePapeis(await resPapeis.json());
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    };
    carregarDados();
  }, []);

  useEffect(() => {
    // Verificar scroll ao carregar e redimensionar
    verificarScroll();
    window.addEventListener('resize', verificarScroll);
    return () => window.removeEventListener('resize', verificarScroll);
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

        {/* Abas com Navegação Melhorada */}
        <div className="relative mb-6">
          {/* Botão Scroll Esquerda */}
          {mostrarScrollEsquerda && (
            <button
              onClick={() => scrollAbas('esquerda')}
              className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-slate-900 via-slate-900 to-transparent px-2 flex items-center hover:from-slate-800"
              aria-label="Rolar para esquerda"
            >
              <ChevronLeft className="text-yellow-400" size={24} />
            </button>
          )}

          {/* Container de Abas */}
          <div
            ref={abasContainerRef}
            onScroll={verificarScroll}
            className="flex gap-2 border-b border-slate-700 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#475569 #1e293b'
            }}
          >
            {[
              { id: 'visao-geral', label: 'Visão Geral' },
              { id: 'categorias', label: 'Categorias' },
              { id: 'graus', label: 'Análise por Grau' },
              { id: 'betweenness', label: 'Betweenness' },
              { id: 'articulacao', label: 'Pontos de Articulação' },
              { id: 'criticidade', label: 'Criticidade' },
              { id: 'visualizacoes', label: 'Visualizações' },
              { id: 'vulnerabilidades', label: 'Vulnerabilidades' },
              { id: 'scale-free', label: 'Scale-Free' },
              { id: 'clustering', label: 'Clustering' },
              { id: 'comunidades', label: 'Comunidades' },
              { id: 'ataques', label: 'Simulação de Ataques' },
              { id: 'robustez', label: 'Robustez/Resiliência' },
              { id: 'papeis', label: 'Papéis dos Nós' }
            ].map(aba => (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`px-4 py-2 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${abaAtiva === aba.id
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                {aba.label}
              </button>
            ))}
          </div>

          {/* Botão Scroll Direita */}
          {mostrarScrollDireita && (
            <button
              onClick={() => scrollAbas('direita')}
              className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-slate-900 via-slate-900 to-transparent px-2 flex items-center hover:from-slate-800"
              aria-label="Rolar para direita"
            >
              <ChevronRight className="text-yellow-400" size={24} />
            </button>
          )}
        </div>

        {/* Aba: Visão Geral */}
        {abaAtiva === 'visao-geral' && (
          <AbaVisaoGeral
            analiseBasica={analiseBasica}
            analiseCriticidade={analiseCriticidade}
          />
        )}

        {/* Aba: Categorias */}
        {abaAtiva === 'categorias' && (
          <AbaCategorias analiseBasica={analiseBasica} />
        )}

        {/* Aba: Análise por Grau */}
        {abaAtiva === 'graus' && (
          <AbaAnalisePorGrau
            analiseBasica={analiseBasica}
            analiseCriticidade={analiseCriticidade}
          />
        )}

        {/* Aba: Betweenness */}
        {abaAtiva === 'betweenness' && (
          <AbaBetweeness analiseCriticidade={analiseCriticidade} />
        )}

        {/* Aba: Pontos de Articulação */}
        {abaAtiva === 'articulacao' && (
          <AbaPontosArticulacao
            analiseCriticidade={analiseCriticidade}
            analiseBasica={analiseBasica}
          />
        )}

        {/* Aba: Níveis de Criticidade */}
        {abaAtiva === 'criticidade' && (
          <AbaNiveisCriticidade analiseCriticidade={analiseCriticidade} />
        )}

        {/* Aba: Visualizações */}
        {abaAtiva === 'visualizacoes' && (
          <AbaVisualizacoes setModalGrafo={setModalGrafo} />
        )}

        {/* Aba: Vulnerabilidades */}
        {abaAtiva === 'vulnerabilidades' && (
          <AbaVulnerabilidades
            analiseCriticidade={analiseCriticidade}
            analiseBasica={analiseBasica}
          />
        )}

        {/* Aba: Scale-Free */}
        {abaAtiva === 'scale-free' && analiseBasica && (
          <AbaScaleFree analiseBasica={analiseBasica} />
        )}

        {/* Aba: Clustering */}
        {abaAtiva === 'clustering' && analiseCriticidade && analiseRobustez && (
          <AbaClustering analiseCriticidade={analiseCriticidade} analiseRobustez={analiseRobustez} />
        )}

        {/* Aba: Comunidades */}
        {abaAtiva === 'comunidades' && analiseComunidades && (
          <AbaComunidades analiseComunidades={analiseComunidades} />
        )}

        {/* Aba: Simulação de Ataques */}
        {abaAtiva === 'ataques' && analiseAtaques && (
          <AbaSimulacaoAtaques analiseAtaques={analiseAtaques} />
        )}

        {/* Aba: Robustez/Resiliência */}
        {abaAtiva === 'robustez' && analiseRobustez && (
          <AbaRobustez analiseRobustez={analiseRobustez} />
        )}

        {/* Aba: Papéis dos Nós */}
        {abaAtiva === 'papeis' && inferencePapeis && (
          <AbaPapeis inferencePapeis={inferencePapeis} />
        )}
      </div>

      {/* Modal de Visualização de Grafos */}
      <ModalGrafo
        aberto={modalGrafo.aberto}
        arquivo={modalGrafo.arquivo}
        titulo={modalGrafo.titulo}
        onFechar={() => setModalGrafo({ aberto: false, arquivo: '', titulo: '' })}
      />
    </div>
  );
};

export default AnaliseRedeEletrica;
