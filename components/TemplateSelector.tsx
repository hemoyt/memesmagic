import React, { useState } from 'react';
import type { Template } from '../types';
import { GalleryIcon } from './icons';

const templates: Template[] = [
  { id: 1, name: 'Doge', url: 'https://picsum.photos/id/58/500/500' },
  { id: 2, name: 'Distracted BF', url: 'https://picsum.photos/id/102/500/500' },
  { id: 3, name: 'Success Kid', url: 'https://picsum.photos/id/103/500/500' },
  { id: 4, name: 'Woman Yelling at Cat', url: 'https://picsum.photos/id/237/500/500' },
  { id: 5, name: 'Surprised Pikachu', url: 'https://picsum.photos/id/1084/500/500' },
  { id: 6, name: 'Thinking Guy', url: 'https://picsum.photos/id/100/500/500' },
  { id: 7, name: 'Drake Hotline', url: 'https://picsum.photos/id/64/500/500' },
  { id: 8, name: 'Two Buttons', url: 'https://picsum.photos/id/96/500/500' },
  { id: 9, name: 'Change My Mind', url: 'https://picsum.photos/id/129/500/500' },
  { id: 10, name: 'Disaster Girl', url: 'https://picsum.photos/id/146/500/500' },
  { id: 11, name: 'Batman Slapping', url: 'https://picsum.photos/id/211/500/500' },
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
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-bold text-center px-1">{template.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};