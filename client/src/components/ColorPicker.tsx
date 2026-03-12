import React from 'react';
import { TABLE_COLORS } from '../utils/colorUtils';

interface ColorPickerProps {
  currentColor?: string;
  onColorChange: (color: string) => void;
}

// Refined color palette for Obsidian Glass theme
const REFINED_COLORS = [
  '#14b8a6', // Teal (primary)
  '#0d9488', // Dark teal
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#71717a', // Gray (chrome)
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor = '#14b8a6',
  onColorChange,
}) => {
  return (
    <div className="mt-3 sm:mt-4 mb-4">
      <label 
        className="block text-[10px] sm:text-xs font-semibold mb-2 uppercase tracking-widest"
        style={{ 
          color: '#14b8a6',
          fontFamily: "'JetBrains Mono', monospace"
        }}
      >
        Table Color
      </label>
      <div 
        className="grid grid-cols-6 sm:grid-cols-6 gap-2 p-3 rounded-lg"
        style={{
          backgroundColor: 'rgba(17, 17, 20, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {REFINED_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-all duration-300 hover:scale-110"
            style={{ 
              backgroundColor: color,
              border: currentColor === color ? '2px solid #fafafa' : '2px solid transparent',
              boxShadow: currentColor === color 
                ? `0 4px 12px ${color}40` 
                : '0 2px 4px rgba(0,0,0,0.2)',
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
            color: '#71717a',
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
            className="w-7 h-7 sm:w-8 sm:h-8 cursor-pointer rounded-lg"
            style={{
              border: '2px solid rgba(255, 255, 255, 0.06)',
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
            fontFamily: "'JetBrains Mono', monospace"
          }}
        >
          {currentColor.toUpperCase()}
        </span>
      </div>
    </div>
  );
};