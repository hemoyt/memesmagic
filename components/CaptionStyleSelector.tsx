import React from 'react';

export const CAPTION_STYLES = [
  { id: 'funny', label: '😂 Funny', prompt: 'funny and witty' },
  { id: 'sarcastic', label: '🙄 Sarcastic', prompt: 'sarcastic, cynical, and dry' },
  { id: 'wholesome', label: '🥰 Wholesome', prompt: 'wholesome, heartwarming, and positive' },
  { id: 'edgy', label: '😎 Edgy', prompt: 'edgy, bold, and slightly dark' },
  { id: 'intellectual', label: '🧐 Intellectual', prompt: 'intellectual, verbose, and overly logical' },
];

interface CaptionStyleSelectorProps {
  selectedStyleId: string;
  onSelect: (id: string) => void;
}

export const CaptionStyleSelector: React.FC<CaptionStyleSelectorProps> = ({ selectedStyleId, onSelect }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">Caption Style</label>
      <div className="flex flex-wrap gap-2">
        {CAPTION_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              selectedStyleId === style.id
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg scale-105'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
            }`}
            type="button"
          >
            {style.label}
          </button>
        ))}
      </div>
    </div>
  );
};
