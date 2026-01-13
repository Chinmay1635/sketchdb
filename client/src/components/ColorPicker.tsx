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
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Table Color
      </label>
      <div className="grid grid-cols-8 gap-2 p-3 bg-gray-50 rounded-lg border">
        {TABLE_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
              currentColor === color 
                ? 'border-gray-600 ring-2 ring-blue-500 ring-offset-2' 
                : 'border-gray-300 hover:border-gray-500'
            }`}
            style={{ backgroundColor: color }}
            title={`Change table color to ${color}`}
            aria-label={`Change table color to ${color}`}
          />
        ))}
      </div>
      
      {/* Custom Color Input */}
      <div className="mt-3 flex items-center gap-2">
        <label className="text-xs text-gray-600">Custom:</label>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-8 h-8 border-2 border-gray-300 rounded cursor-pointer hover:border-gray-500 transition-colors"
          title="Choose custom color"
          aria-label="Choose custom color"
        />
        <span className="text-xs text-gray-500 font-mono">
          {currentColor.toUpperCase()}
        </span>
      </div>
    </div>
  );
};