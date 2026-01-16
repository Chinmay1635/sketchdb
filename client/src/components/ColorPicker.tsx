import React from 'react';
import { TABLE_COLORS } from '../utils/colorUtils';

interface ColorPickerProps {
  currentColor?: string;
  onColorChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor = '#0074D9',
  onColorChange,
}) => {
  return (
    <div className="mt-3 sm:mt-4">
      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
        Table Color
      </label>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 sm:gap-2 p-2 sm:p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        {TABLE_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
              currentColor === color 
                ? 'border-slate-400 ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-800' 
                : 'border-slate-600 hover:border-slate-400'
            }`}
            style={{ backgroundColor: color }}
            title={`Change table color to ${color}`}
            aria-label={`Change table color to ${color}`}
          />
        ))}
      </div>
      
      {/* Custom Color Input */}
      <div className="mt-2 sm:mt-3 flex items-center gap-2">
        <label className="text-[10px] sm:text-xs text-slate-400">Custom:</label>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-slate-600 rounded cursor-pointer hover:border-slate-400 transition-colors bg-slate-800"
          title="Choose custom color"
          aria-label="Choose custom color"
        />
        <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
          {currentColor.toUpperCase()}
        </span>
      </div>
    </div>
  );
};