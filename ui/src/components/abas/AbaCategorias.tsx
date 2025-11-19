import { Home, Radio, Cpu, Zap } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface AbaCategoriasProps {
  analiseBasica: any;
}

const AbaCategorias = ({ analiseBasica }: AbaCategoriasProps) => {
  return (
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
        <LineChart width={900} height={400} data={analiseBasica.distribuicao_graus.slice(0, 15)}>
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
  );
};

export default AbaCategorias;