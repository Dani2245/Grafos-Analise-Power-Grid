import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Activity, AlertCircle, Network } from 'lucide-react';
import CartaoMetrica from '../CartaoMetrica';

interface AbaScaleFreeProps {
  analiseBasica: any;
}

const AbaScaleFree = ({ analiseBasica }: AbaScaleFreeProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/30 to-slate-800 rounded-lg p-6 border-l-4 border-purple-500">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Activity className="text-purple-400" />
          Propriedades Scale-Free da Rede
        </h2>
        <p className="text-slate-300 mb-4">
          Análise da distribuição de graus para verificar se a rede segue uma lei de potência (power-law), característica de redes scale-free.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CartaoMetrica
          icon={<Activity size={24} />}
          titulo="Classificação"
          valor={analiseBasica.scale_free_analysis.eh_scale_free ? "Scale-Free" : "Não Scale-Free"}
          subtitulo={`${analiseBasica.scale_free_analysis.eh_scale_free ? '✓' : '✗'} Análise estatística`}
        />
        <CartaoMetrica
          icon={<AlertCircle size={24} />}
          titulo="Expoente γ (Gamma)"
          valor={analiseBasica.scale_free_analysis.expoente_gamma.toFixed(4)}
          subtitulo="Lei de potência P(k) ~ k^(-γ)"
        />
        <CartaoMetrica
          icon={<Network size={24} />}
          titulo="Qualidade do Ajuste (R²)"
          valor={analiseBasica.scale_free_analysis.regressao_linear.r_quadrado.toFixed(4)}
          subtitulo="Coeficiente de determinação"
        />
      </div>

      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">📊 Distribuição de Graus (Escala Log-Log)</h3>
        <p className="text-slate-400 text-sm mb-4">
          Em redes scale-free, a distribuição de graus segue uma lei de potência P(k) ~ k^(-γ).
          No gráfico log-log abaixo, isso aparece como uma linha reta.
        </p>
        <ScatterChart width={900} height={400} data={analiseBasica.scale_free_analysis.dados_log_log}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="log_grau"
            stroke="#94a3b8"
            label={{ value: 'log(Grau)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
          />
          <YAxis
            dataKey="log_freq"
            stroke="#94a3b8"
            label={{ value: 'log(Frequência)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
            formatter={(value: any) => value.toFixed(3)}
          />
          <Scatter name="Dados observados" fill="#8b5cf6" />
        </ScatterChart>

        <div className="mt-4 p-4 bg-purple-900/20 rounded border border-purple-700">
          <p className="text-sm text-purple-200">
            <strong>Interpretação:</strong> {analiseBasica.scale_free_analysis.interpretacao}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Expoente γ = {analiseBasica.scale_free_analysis.expoente_gamma.toFixed(4)} |
            R² = {analiseBasica.scale_free_analysis.regressao_linear.r_quadrado.toFixed(4)} |
            p-value = {analiseBasica.scale_free_analysis.regressao_linear.p_value.toExponential(3)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AbaScaleFree;
