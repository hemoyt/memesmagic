import React from 'react';
import { RefreshIcon } from './icons';

interface CaptionSuggestionsProps {
  captions: string[];
  onSelect: (caption: string) => void;
  onRegenerate: (index: number) => void;
  isLoading: boolean;
  loadingIndices: number[];
}

export const CaptionSuggestions: React.FC<CaptionSuggestionsProps> = ({ 
  captions, 
  onSelect, 
  onRegenerate,
  isLoading,
  loadingIndices 
}) => {
  if (isLoading && captions.length === 0) {
    return (
        <div className="mt-4 space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-10 bg-gray-700 animate-pulse rounded-md"></div>
            ))}
        </div>
    );
  }
  
  if (captions.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3 text-purple-400">Choose a Caption:</h3>
      <div className="space-y-2">
        {captions.map((caption, index) => {
          const isRegenerating = loadingIndices.includes(index);
          return (
            <div key={index} className="flex items-center gap-2 group">
              <button
                onClick={() => onSelect(caption)}
                className="flex-grow text-left p-3 bg-gray-700 rounded-md hover:bg-purple-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 border border-transparent hover:border-purple-500"
              >
                "{caption}"
              </button>
              <button
                onClick={() => onRegenerate(index)}
                disabled={isRegenerating}
                className="flex-shrink-0 p-3 bg-gray-700 rounded-md hover:bg-gray-600 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate this caption"
              >
                <RefreshIcon className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};