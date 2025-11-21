import React from 'react';
import { TextSettings } from './TextControls';
import { LogoIcon } from './icons';

interface MemeCanvasProps {
  imageUrl: string | null;
  caption: string | null;
  textSettings?: TextSettings;
  showWatermark?: boolean;
}

export const MemeCanvas: React.FC<MemeCanvasProps> = ({ 
  imageUrl, 
  caption, 
  textSettings = { 
    fontFamily: 'Impact', 
    fontSizeMultiplier: 1, 
    textColor: '#FFFFFF', 
    strokeColor: '#000000' 
  },
  showWatermark = true
}) => {
  const stroke = textSettings.strokeColor;
  const shadow = `2px 2px 0 ${stroke}, -2px -2px 0 ${stroke}, 2px -2px 0 ${stroke}, -2px 2px 0 ${stroke}, 2px 2px 5px ${stroke}`;

  return (
    <div className="relative w-full max-w-full aspect-square bg-gray-900 rounded-lg overflow-hidden group">
      {imageUrl && (
        <img src={imageUrl} alt="Meme canvas" className="w-full h-full object-contain" />
      )}
      {caption && (
        <div 
          className="absolute bottom-4 left-4 right-4 text-center p-2 font-extrabold break-words leading-tight"
          style={{
            fontFamily: textSettings.fontFamily,
            // Use calc to adjust size relative to the viewport width (responsive) multiplied by the user's setting
            fontSize: `calc(clamp(1.5rem, 6vw, 2.5rem) * ${textSettings.fontSizeMultiplier})`,
            color: textSettings.textColor,
            textShadow: shadow,
            WebkitTextStroke: `1px ${stroke}`,
          }}
        >
          {caption}
        </div>
      )}
      {/* Watermark Overlay */}
      {imageUrl && showWatermark && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-60 pointer-events-none">
           <LogoIcon className="w-5 h-5 sm:w-6 sm:h-6" />
           <span className="text-xs sm:text-sm font-bold text-white drop-shadow-md shadow-black tracking-wide">
             Meme Magic
           </span>
        </div>
      )}
    </div>
  );
};