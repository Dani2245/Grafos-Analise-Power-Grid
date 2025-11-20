import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface TooltipTermoTecnicoProps {
    termo: string;
    definicao: string;
    exemplo?: string;
}

const TooltipTermoTecnico = ({ termo, definicao, exemplo }: TooltipTermoTecnicoProps) => {
    const [mostrar, setMostrar] = useState(false);

    return (
        <span className="relative inline-flex items-baseline gap-1">
            <span>{termo}</span>
            <button
                type="button"
                onMouseEnter={() => setMostrar(true)}
                onMouseLeave={() => setMostrar(false)}
                onClick={() => setMostrar(!mostrar)}
                className="inline-flex align-baseline text-slate-400 hover:text-yellow-400 transition-colors"
                aria-label={`Explicação de ${termo}`}
            >
                <HelpCircle size={14} className="inline" />
            </button>

            {mostrar && (
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-slate-900 border border-yellow-400/50 rounded-lg shadow-xl z-50 p-4">
                    <div className="text-sm text-yellow-400 font-semibold mb-2">{termo}</div>
                    <div className="text-xs text-slate-300 mb-2">{definicao}</div>
                    {exemplo && (
                        <div className="text-xs text-slate-400 italic">
                            <strong>Exemplo:</strong> {exemplo}
                        </div>
                    )}
                    <div className="absolute -bottom-1 left-4 w-3 h-3 bg-slate-900 border-r border-b border-yellow-400/50 transform rotate-45"></div>
                </div>
            )}
        </span>
    );
};

export default TooltipTermoTecnico;
