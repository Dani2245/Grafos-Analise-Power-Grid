interface AbaNiveisCriticidadeProps {
  analiseCriticidade: any;
}

const AbaNiveisCriticidade = ({ analiseCriticidade }: AbaNiveisCriticidadeProps) => {
  return (
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
  );
};

export default AbaNiveisCriticidade;