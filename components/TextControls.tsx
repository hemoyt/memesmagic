import React from 'react';

export interface TextSettings {
  fontFamily: string;
  fontSizeMultiplier: number;
  textColor: string;
  strokeColor: string;
}

interface TextControlsProps {
  settings: TextSettings;
  onChange: (settings: TextSettings) => void;
}

const FONTS = [
  'Impact', 
  'Arial', 
  'Arial Black',
  'Comic Sans MS', 
  'Courier New', 
  'Times New Roman', 
  'Verdana', 
  'Brush Script MT'
];

export const TextControls: React.FC<TextControlsProps> = ({ settings, onChange }) => {
  const handleChange = (key: keyof TextSettings, value: string | number) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg mb-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Font Family */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-gray-300 mb-1">Font</label>
          <select
            value={settings.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded p-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {FONTS.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Size ({Math.round(settings.fontSizeMultiplier * 100)}%)
          </label>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={settings.fontSizeMultiplier}
            onChange={(e) => handleChange('fontSizeMultiplier', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Colors */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Text Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.textColor}
              onChange={(e) => handleChange('textColor', e.target.value)}
              className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="text-xs text-gray-400 font-mono">{settings.textColor}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Outline Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.strokeColor}
              onChange={(e) => handleChange('strokeColor', e.target.value)}
              className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="text-xs text-gray-400 font-mono">{settings.strokeColor}</span>
          </div>
        </div>
      </div>
    </div>
  );
};