import React from 'react';

interface AdPlaceholderProps {
  className?: string;
  text?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ 
  className = "", 
  text = "Advertisement" 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-gray-800/40 border border-dashed border-gray-600 rounded-lg p-4 text-center overflow-hidden ${className}`}>
      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1">Sponsored</span>
      <span className="text-gray-400 text-sm font-medium">{text}</span>
    </div>
  );
};