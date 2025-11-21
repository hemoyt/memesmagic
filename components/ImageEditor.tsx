import React, { useState } from 'react';
import { EditIcon } from './icons';

interface ImageEditorProps {
  onEdit: (prompt: string) => void;
  isLoading: boolean;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ onEdit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onEdit(prompt);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300 mb-1">
          Describe your edit (e.g., "add a retro filter", "make it a cartoon")
        </label>
        <input
          id="edit-prompt"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Add a pirate hat..."
          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-900 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <EditIcon />
        )}
        <span>{isLoading ? 'Editing...' : 'Apply Edit'}</span>
      </button>
    </form>
  );
};
