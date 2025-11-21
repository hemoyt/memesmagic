import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
      setFileName(file.name);
    }
  }, [onImageUpload]);

  return (
    <div>
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 hover:bg-gray-700 transition-colors">
          <UploadIcon />
          <p className="mt-2 font-semibold text-purple-400">
            {fileName ? 'Change Image' : 'Upload an Image'}
          </p>
          <p className="text-xs text-gray-400">
            {fileName || 'PNG, JPG, GIF up to 10MB'}
          </p>
        </div>
      </label>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept="image/png, image/jpeg, image/gif"
        onChange={handleFileChange}
      />
    </div>
  );
};
