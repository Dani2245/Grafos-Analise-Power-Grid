import React from 'react';

interface CartaoMetricaProps {
  icon: React.ReactNode;
  titulo: string;
  valor: string | number;
  subtitulo: string;
  destaque?: boolean;
}

const CartaoMetrica: React.FC<CartaoMetricaProps> = ({ 
  icon, 
  titulo, 
  valor, 
  subtitulo, 
  destaque = false 
}) => (
  <div className={`bg-slate-800 rounded-lg p-6 border-l-4 ${destaque ? 'border-red-500' : 'border-yellow-400'}`}>
    <div className="flex items-start justify-between mb-2">
      <div className={destaque ? 'text-red-400' : 'text-yellow-400'}>{icon}</div>
    </div>
    <div className="text-3xl font-bold mb-1">{valor}</div>
    <div className="text-sm text-slate-400">{titulo}</div>
    <div className="text-xs text-slate-500 mt-1">{subtitulo}</div>
  </div>
);

export default CartaoMetrica;
