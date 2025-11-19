import React from 'react';
import { X } from 'lucide-react';

interface ModalGrafoProps {
  aberto: boolean;
  arquivo: string;
  titulo: string;
  onFechar: () => void;
}

const ModalGrafo: React.FC<ModalGrafoProps> = ({ aberto, arquivo, titulo, onFechar }) => {
  if (!aberto) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onFechar}
    >
      <div 
        className="bg-slate-800 rounded-lg max-w-6xl w-full flex flex-col shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700 flex-shrink-0">
          <h3 className="text-xl font-bold text-yellow-400">{titulo}</h3>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Conteúdo do Modal - iframe com o grafo */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={`/${arquivo}`}
            className="w-full h-full min-h-[610px] border-0"
            title={titulo}
          />
        </div>
      </div>
    </div>
  );
};

export default ModalGrafo;
