import React from 'react';

interface ProcessingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  isVisible,
  message = 'Procesando pago seguro con el banco emisor...',
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-stone-100 flex flex-col items-center">
        {/* Spinner animado con branding */}
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-stone-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#1a3d2f] border-t-transparent animate-spin"></div>
          <span className="text-2xl">🔒</span>
        </div>

        <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
          {message}
        </h3>

        <p className="text-xs text-stone-500 mb-6 leading-relaxed">
          Por favor no cierres ni actualices la ventana. Estamos tokenizando tu transacción de forma segura y reservando tus productos agrícolas en Supabase.
        </p>

        {/* Sellos de Seguridad Bancaria */}
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-stone-100 w-full text-[10px] text-stone-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <span className="text-emerald-600">✓</span> PCI-DSS
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="text-emerald-600">✓</span> 256-BIT SSL
          </span>
          <span>·</span>
          <span>REDEBAN / PASARELA</span>
        </div>
      </div>
    </div>
  );
};

