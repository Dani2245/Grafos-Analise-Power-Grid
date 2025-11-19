import { Network } from 'lucide-react';

interface AbaVisualizacoesProps {
  setModalGrafo: (modal: { aberto: boolean; arquivo: string; titulo: string }) => void;
}

const AbaVisualizacoes = ({ setModalGrafo }: AbaVisualizacoesProps) => {
  const hubs = [
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
  ];

  return (
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
              {hubs.map((hub) => (
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
  );
};

export default AbaVisualizacoes;