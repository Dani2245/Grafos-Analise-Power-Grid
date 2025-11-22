import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Zap, Activity, ChevronLeft, ChevronRight, Shield, Home, TrendingUp, AlertTriangle, Database } from 'lucide-react';
import ModalGrafo from './components/ModalGrafo';
import AbaSimulacaoAtaques from './components/abas/AbaSimulacaoAtaques';
import AbaRobustez from './components/abas/AbaRobustez';
import AbaPapeis from './components/abas/AbaPapeis';
import AbaComunidades from './components/abas/AbaComunidades';
import AbaScaleFree from './components/abas/AbaScaleFree';
import AbaVulnerabilidades from './components/abas/AbaVulnerabilidades';
import AbaVisualizacoes from './components/abas/AbaVisualizacoes';
import AbaPontosArticulacao from './components/abas/AbaPontosArticulacao';
import AbaPercolacao from './components/abas/AbaPercolacao';
import AbaVisaoGeral from './components/abas/AbaVisaoGeral';
import AbaAnalisePorGrau from './components/abas/AbaAnalisePorGrau';
import AbaBetweeness from './components/abas/AbaBetweeness';
import AbaClustering from './components/abas/AbaClustering';
import AbaNovoDataset from './components/abas/AbaNovoDataset';
import AbaSimulacaoFalhasNovo from './components/abas/AbaSimulacaoFalhasNovo';
import AbaGlossario from './components/abas/AbaGlossario';

// Estrutura de categorias hierárquicas
const CATEGORIAS = [
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    icone: Home,
    subAbas: [
      { id: 'visao-geral', label: 'Dashboard' },
      { id: 'papeis', label: 'Papéis dos Nós' },
      { id: 'scale-free', label: 'Scale-Free' },
      { id: 'comunidades', label: 'Comunidades' },
      { id: 'glossario', label: 'Glossário' }
      // { id: 'visualizacoes', label: 'Visualizações' }
    ]
  },
  {
    id: 'metricas',
    label: 'Métricas de Centralidade',
    icone: TrendingUp,
    subAbas: [
      { id: 'graus', label: 'Análise por Grau' },
      { id: 'betweenness', label: 'Betweenness' },
      { id: 'clustering', label: 'Clustering' }
    ]
  },
  {
    id: 'criticidade',
    label: 'Criticidade & Vulnerabilidade',
    icone: AlertTriangle,
    subAbas: [
      { id: 'articulacao', label: 'Pontos de Articulação' },
      { id: 'percolacao', label: 'Percolação' },
      { id: 'vulnerabilidades', label: 'Vulnerabilidades' },
      { id: 'ataques', label: 'Simulação de Ataques' },
    ]
  },
  // {
  //   id: 'propriedades',
  //   label: 'Propriedades da Rede',
  //   icone: Network,
  //   subAbas: [

  //   ]
  // },
  // {
  //   id: 'resiliencia',
  //   label: 'Resiliência & Ataques',
  //   icone: Shield,
  //   subAbas: [
  //     // { id: 'robustez', label: 'Robustez/Resiliência' },
  //   ]
  // },
  {
    id: 'novo-dataset',
    label: 'Novo Dataset (Temporal)',
    icone: Database,
    subAbas: [
      { id: 'novo-dataset', label: 'Análise Temporal' },
      { id: 'simulacao-falhas-novo', label: 'Simulação de Falhas' }
    ]
  }
];

const AnaliseRedeEletrica = () => {
  const [categoriaAtiva, setCategoriaAtiva] = useState('visao-geral');
  const [subAbaAtiva, setSubAbaAtiva] = useState('visao-geral');
  const [analiseBasica, setAnaliseBasica] = useState<any>(null);
  const [analiseCriticidade, setAnaliseCriticidade] = useState<any>(null);
  const [analiseComunidades, setAnaliseComunidades] = useState<any>(null);
  const [analiseAtaques, setAnaliseAtaques] = useState<any>(null);
  const [analiseRobustez, setAnaliseRobustez] = useState<any>(null);
  const [inferencePapeis, setInferencePapeis] = useState<any>(null);
  const [analiseNovoDataset, setAnaliseNovoDataset] = useState<any>(null);
  const [simulacaoFalhasNovo, setSimulacaoFalhasNovo] = useState<any>(null);
  const [comparacaoDatasets, setComparacaoDatasets] = useState<any>(null);
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
        const [resBasica, resCriticidade, resComunidades, resAtaques, resRobustez, resPapeis, resNovoDataset, resSimulacaoFalhasNovo, resComparacaoDatasets] = await Promise.all([
          fetch('/analise_basica.json'),
          fetch('/analise_criticidade.json'),
          fetch('/analise_comunidades.json'),
          fetch('/analise_ataques.json'),
          fetch('/analise_robustez.json'),
          fetch('/inferencia_papeis.json'),
          fetch('/analise_novo_dataset.json').catch(() => null),
          fetch('/simulacao_falhas_novo.json').catch(() => null),
          fetch('/comparacao_datasets.json').catch(() => null)
        ]);

        setAnaliseBasica(await resBasica.json());
        setAnaliseCriticidade(await resCriticidade.json());
        setAnaliseComunidades(await resComunidades.json());
        setAnaliseAtaques(await resAtaques.json());
        setAnaliseRobustez(await resRobustez.json());
        setInferencePapeis(await resPapeis.json());

        // Novos datasets (podem não existir ainda)
        if (resNovoDataset && resNovoDataset.ok) setAnaliseNovoDataset(await resNovoDataset.json());
        if (resSimulacaoFalhasNovo && resSimulacaoFalhasNovo.ok) setSimulacaoFalhasNovo(await resSimulacaoFalhasNovo.json());
        if (resComparacaoDatasets && resComparacaoDatasets.ok) setComparacaoDatasets(await resComparacaoDatasets.json());

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

        {/* Navegação Hierárquica: Categorias Principais */}
        <div className="mb-6">
          {/* Categorias Principais */}
          <div className="flex gap-3 mb-4 flex-wrap">
            {CATEGORIAS.map(categoria => {
              const Icone = categoria.icone;
              const ativo = categoriaAtiva === categoria.id;
              return (
                <button
                  key={categoria.id}
                  onClick={() => {
                    setCategoriaAtiva(categoria.id);
                    // Ao trocar categoria, selecionar primeira sub-aba
                    setSubAbaAtiva(categoria.subAbas[0].id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${ativo
                    ? 'bg-yellow-400/20 text-yellow-400 border-2 border-yellow-400'
                    : 'bg-slate-800 text-slate-400 border-2 border-slate-700 hover:border-slate-600 hover:text-white'
                    }`}
                >
                  <Icone size={20} />
                  {categoria.label}
                </button>
              );
            })}
          </div>

          {/* Sub-Abas da Categoria Ativa */}
          <div className="relative">
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

            {/* Container de Sub-Abas */}
            <div
              ref={abasContainerRef}
              onScroll={verificarScroll}
              className="flex gap-2 border-b border-slate-700 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#475569 #1e293b'
              }}
            >
              {CATEGORIAS.find(cat => cat.id === categoriaAtiva)?.subAbas.map(subAba => (
                <button
                  key={subAba.id}
                  onClick={() => setSubAbaAtiva(subAba.id)}
                  className={`px-4 py-2 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${subAbaAtiva === subAba.id
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {subAba.label}
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
        </div>

        {/* Breadcrumb de Contexto */}
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
          <span className="font-semibold text-yellow-400">
            {CATEGORIAS.find(cat => cat.id === categoriaAtiva)?.label}
          </span>
          <ChevronRight size={16} />
          <span>
            {CATEGORIAS.find(cat => cat.id === categoriaAtiva)?.subAbas.find(sub => sub.id === subAbaAtiva)?.label}
          </span>
        </div>

        {/* Aba: Visão Geral */}
        {subAbaAtiva === 'visao-geral' && (
          <AbaVisaoGeral
            analiseBasica={analiseBasica}
            analiseCriticidade={analiseCriticidade}
          />
        )}

        {/* Aba: Análise por Grau */}
        {subAbaAtiva === 'graus' && (
          <AbaAnalisePorGrau
            analiseBasica={analiseBasica}
            analiseCriticidade={analiseCriticidade}
          />
        )}

        {/* Aba: Betweenness */}
        {subAbaAtiva === 'betweenness' && (
          <AbaBetweeness analiseCriticidade={analiseCriticidade} />
        )}

        {/* Aba: Pontos de Articulação */}
        {subAbaAtiva === 'articulacao' && (
          <AbaPontosArticulacao
            analiseCriticidade={analiseCriticidade}
            analiseBasica={analiseBasica}
          />
        )}

        {/* Aba: Percolação */}
        {subAbaAtiva === 'percolacao' && (
          <AbaPercolacao analiseCriticidade={analiseCriticidade} />
        )}

        {/* Aba: Visualizações */}
        {subAbaAtiva === 'visualizacoes' && (
          <AbaVisualizacoes setModalGrafo={setModalGrafo} />
        )}

        {/* Aba: Vulnerabilidades */}
        {subAbaAtiva === 'vulnerabilidades' && (
          <AbaVulnerabilidades
            analiseCriticidade={analiseCriticidade}
            analiseBasica={analiseBasica}
          />
        )}

        {/* Aba: Scale-Free */}
        {subAbaAtiva === 'scale-free' && analiseBasica && (
          <AbaScaleFree analiseBasica={analiseBasica} />
        )}

        {/* Aba: Clustering */}
        {subAbaAtiva === 'clustering' && analiseCriticidade && analiseRobustez && (
          <AbaClustering analiseCriticidade={analiseCriticidade} analiseRobustez={analiseRobustez} />
        )}

        {/* Aba: Comunidades */}
        {subAbaAtiva === 'comunidades' && analiseComunidades && (
          <AbaComunidades analiseComunidades={analiseComunidades} />
        )}

        {/* Aba: Simulação de Ataques */}
        {subAbaAtiva === 'ataques' && analiseAtaques && (
          <AbaSimulacaoAtaques analiseAtaques={analiseAtaques} />
        )}

        {/* Aba: Robustez/Resiliência */}
        {subAbaAtiva === 'robustez' && analiseRobustez && (
          <AbaRobustez analiseRobustez={analiseRobustez} />
        )}

        {/* Aba: Papéis dos Nós */}
        {subAbaAtiva === 'papeis' && inferencePapeis && analiseBasica && (
          <AbaPapeis inferencePapeis={inferencePapeis} analiseBasica={analiseBasica} />
        )}

        {/* Aba: Novo Dataset (Temporal) */}
        {subAbaAtiva === 'novo-dataset' && analiseNovoDataset && (
          <AbaNovoDataset
            dados={analiseNovoDataset}
            comparacao={comparacaoDatasets}
          />
        )}

        {/* Mensagem se dados não carregados */}
        {subAbaAtiva === 'novo-dataset' && !analiseNovoDataset && (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Dados do novo dataset não disponíveis</p>
            <p className="text-slate-500 text-sm">Execute o script Python: gerar_analise_novo_dataset.py</p>
          </div>
        )}

        {/* Aba: Simulação de Falhas Novo Dataset */}
        {subAbaAtiva === 'simulacao-falhas-novo' && simulacaoFalhasNovo && (
          <AbaSimulacaoFalhasNovo dados={simulacaoFalhasNovo} />
        )}

        {/* Mensagem se dados não carregados */}
        {subAbaAtiva === 'simulacao-falhas-novo' && !simulacaoFalhasNovo && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Dados de simulação não disponíveis</p>
            <p className="text-slate-500 text-sm">Execute o script Python: gerar_simulacao_falhas_novo.py</p>
          </div>
        )}

        {/* Aba: Glossário */}
        {subAbaAtiva === 'glossario' && (
          <AbaGlossario />
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
