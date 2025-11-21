import React, { useState } from 'react';
import type { Template } from '../types';
import { GalleryIcon } from './icons';

const templates: Template[] = [
  { id: 1, name: 'Doge', url: 'https://api.memegen.link/images/doge/_/_.png' },
  { id: 2, name: 'Distracted BF', url: 'https://api.memegen.link/images/db/_/_.png' },
  { id: 3, name: 'Success Kid', url: 'https://api.memegen.link/images/success/_/_.png' },
  { id: 4, name: 'Woman Yelling at Cat', url: 'https://api.memegen.link/images/woman-cat/_/_.png' },
  { id: 5, name: 'Surprised Pikachu', url: 'https://api.memegen.link/images/pika/_/_.png' },
  { id: 6, name: 'Thinking Guy', url: 'https://api.memegen.link/images/rollsafe/_/_.png' },
  { id: 7, name: 'Drake Hotline', url: 'https://api.memegen.link/images/drake/_/_.png' },
  { id: 8, name: 'Two Buttons', url: 'https://api.memegen.link/images/dgb/_/_.png' },
  { id: 9, name: 'Change My Mind', url: 'https://api.memegen.link/images/cmm/_/_.png' },
  { id: 10, name: 'Disaster Girl', url: 'https://api.memegen.link/images/disaster/_/_.png' },
  { id: 11, name: 'Batman Slapping', url: 'https://api.memegen.link/images/bats/_/_.png' },
];

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect }) => {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleSelect = (template: Template) => {
        setSelectedId(template.id);
        onSelect(template);
    }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-purple-400"><GalleryIcon/> Select a Template</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleSelect(template)}
            className={`relative rounded-lg overflow-hidden border-4 transition-all ${selectedId === template.id ? 'border-purple-500 scale-105' : 'border-transparent hover:border-purple-400'}`}
          >
            <img
              src={template.url}
              alt={template.name}
              className="w-full h-full object-cover aspect-square"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-bold text-center px-1 drop-shadow-md">{template.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};