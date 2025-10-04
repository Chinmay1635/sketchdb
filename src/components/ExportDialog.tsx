import React, { useState } from "react";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'png' | 'pdf', options: ExportOptions) => void;
}

interface ExportOptions {
  quality: number;
  backgroundColor: string;
  includeTitle: boolean;
  paperSize?: 'a4' | 'a3' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, onExport }) => {
  const [format, setFormat] = useState<'png' | 'pdf'>('png');
  const [options, setOptions] = useState<ExportOptions>({
    quality: 2,
    backgroundColor: '#ffffff',
    includeTitle: true,
    paperSize: 'a4',
    orientation: 'landscape'
  });

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(format, options);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Export Options</h2>
        
        {/* Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Format</label>
          <select 
            value={format} 
            onChange={(e) => setFormat(e.target.value as 'png' | 'pdf')}
            className="w-full p-2 border rounded"
          >
            <option value="png">PNG Image</option>
            <option value="pdf">PDF Document</option>
          </select>
        </div>

        {/* Quality */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Quality</label>
          <select 
            value={options.quality} 
            onChange={(e) => setOptions({...options, quality: Number(e.target.value)})}
            className="w-full p-2 border rounded"
          >
            <option value={1}>Standard (1x)</option>
            <option value={2}>High (2x)</option>
            <option value={3}>Ultra (3x)</option>
          </select>
        </div>

        {/* Background Color */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Background Color</label>
          <input
            type="color"
            value={options.backgroundColor}
            onChange={(e) => setOptions({...options, backgroundColor: e.target.value})}
            className="w-full h-10 border rounded"
          />
        </div>

        {/* Include Title */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeTitle}
              onChange={(e) => setOptions({...options, includeTitle: e.target.checked})}
              className="mr-2"
            />
            Include title in export
          </label>
        </div>

        {/* PDF specific options */}
        {format === 'pdf' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Paper Size</label>
              <select 
                value={options.paperSize} 
                onChange={(e) => setOptions({...options, paperSize: e.target.value as any})}
                className="w-full p-2 border rounded"
              >
                <option value="a4">A4</option>
                <option value="a3">A3</option>
                <option value="letter">Letter</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Orientation</label>
              <select 
                value={options.orientation} 
                onChange={(e) => setOptions({...options, orientation: e.target.value as any})}
                className="w-full p-2 border rounded"
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
          </>
        )}

        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Export {format.toUpperCase()}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};