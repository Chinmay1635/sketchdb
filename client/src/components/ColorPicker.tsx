import React from 'react';
import { TABLE_COLORS } from '../utils/colorUtils';

interface ColorPickerProps {
  currentColor?: string;
  onColorChange: (color: string) => void;
}

// Neon color palette for cyberpunk theme
const NEON_COLORS = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#00ff88', // Green
  '#ff8800', // Orange
  '#ff3366', // Red
  '#0088ff', // Blue
  '#8855ff', // Purple
  '#ffff00', // Yellow
  '#00ffaa', // Teal
  '#ff6699', // Pink
  '#66ff00', // Lime
  '#ff4400', // Vermillion
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor = '#00ffff',
  onColorChange,
}) => {
  return (
    <div className="mt-3 sm:mt-4 mb-4">
      <label 
        className="block text-[10px] sm:text-xs font-semibold mb-2 uppercase tracking-widest"
        style={{ 
          color: '#00ffff',
          fontFamily: "'JetBrains Mono', monospace"
        }}
      >
        Table Color
      </label>
      <div 
        className="grid grid-cols-6 sm:grid-cols-6 gap-2 p-3 rounded"
        style={{
          backgroundColor: 'rgba(26, 26, 36, 0.5)',
          border: '1px solid rgba(42, 42, 58, 0.5)'
        }}
      >
        {NEON_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded transition-all duration-300 hover:scale-110"
            style={{ 
              backgroundColor: color,
              border: currentColor === color ? '2px solid #f0f0ff' : '2px solid transparent',
              boxShadow: currentColor === color 
                ? `0 0 15px ${color}80, inset 0 0 10px rgba(255,255,255,0.2)` 
                : `0 0 8px ${color}40`,
            }}
            title={`Change table color to ${color}`}
            aria-label={`Change table color to ${color}`}
          />
        ))}
      </div>
      
      {/* Custom Color Input */}
      <div className="mt-3 flex items-center gap-2">
        <label 
          className="text-[10px] sm:text-xs"
          style={{ 
            color: '#8a8a9a',
            fontFamily: "'JetBrains Mono', monospace"
          }}
        >
          Custom:
        </label>
        <div className="relative">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-7 h-7 sm:w-8 sm:h-8 cursor-pointer rounded"
            style={{
              border: '2px solid rgba(42, 42, 58, 0.8)',
              backgroundColor: 'transparent',
            }}
            title="Choose custom color"
            aria-label="Choose custom color"
          />
        </div>
        <span 
          className="text-[10px] sm:text-xs"
          style={{ 
            color: currentColor,
            fontFamily: "'JetBrains Mono', monospace",
            textShadow: `0 0 8px ${currentColor}60`
          }}
        >
          {currentColor.toUpperCase()}
        </span>
      </div>
    </div>
  );
};