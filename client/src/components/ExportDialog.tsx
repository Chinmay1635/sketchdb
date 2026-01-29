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
    backgroundColor: '#0a0a0f',
    includeTitle: true,
    paperSize: 'a4',
    orientation: 'landscape'
  });

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(format, options);
    onClose();
  };

  const selectStyle = {
    backgroundColor: 'rgba(10, 10, 15, 0.8)',
    border: '1px solid #2a2a3a',
    color: '#c0c0d0',
    fontFamily: "'JetBrains Mono', monospace",
    padding: '8px 12px',
    width: '100%',
    outline: 'none'
  };

  const labelStyle = {
    color: '#8a8a9a',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    marginBottom: '8px',
    display: 'block'
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div 
        className="max-w-md w-full"
        style={{
          backgroundColor: 'rgba(13, 13, 20, 0.95)',
          border: '1px solid #2a2a3a',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.1), 0 0 80px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Top accent line */}
        <div 
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #00ffff, #ff00ff, transparent)' }}
        />
        
        <div className="p-6">
          <h2 
            className="text-lg font-bold mb-6 uppercase tracking-wider"
            style={{ 
              color: '#00ffff',
              fontFamily: "'Orbitron', sans-serif",
              textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
            }}
          >
            Export Options
          </h2>
          
          {/* Format Selection */}
          <div className="mb-4">
            <label style={labelStyle}>// Format</label>
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value as 'png' | 'pdf')}
              style={selectStyle}
            >
              <option value="png">PNG Image</option>
              <option value="pdf">PDF Document</option>
            </select>
          </div>

          {/* Quality */}
          <div className="mb-4">
            <label style={labelStyle}>// Quality</label>
            <select 
              value={options.quality} 
              onChange={(e) => setOptions({...options, quality: Number(e.target.value)})}
              style={selectStyle}
            >
              <option value={1}>Standard (1x)</option>
              <option value={2}>High (2x)</option>
              <option value={3}>Ultra (3x)</option>
            </select>
          </div>

          {/* Background Color */}
          <div className="mb-4">
            <label style={labelStyle}>// Background Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={options.backgroundColor}
                onChange={(e) => setOptions({...options, backgroundColor: e.target.value})}
                className="w-12 h-10 cursor-pointer"
                style={{ 
                  backgroundColor: 'transparent',
                  border: '1px solid #2a2a3a'
                }}
              />
              <span 
                className="text-xs"
                style={{ 
                  color: '#8a8a9a',
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                {options.backgroundColor}
              </span>
            </div>
          </div>

          {/* Include Title */}
          <div className="mb-4">
            <label 
              className="flex items-center gap-2 cursor-pointer"
              style={{ 
                color: '#c0c0d0',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px'
              }}
            >
              <input
                type="checkbox"
                checked={options.includeTitle}
                onChange={(e) => setOptions({...options, includeTitle: e.target.checked})}
                className="w-4 h-4"
                style={{ accentColor: '#00ffff' }}
              />
              Include title in export
            </label>
          </div>

          {/* PDF specific options */}
          {format === 'pdf' && (
            <>
              <div className="mb-4">
                <label style={labelStyle}>// Paper Size</label>
                <select 
                  value={options.paperSize} 
                  onChange={(e) => setOptions({...options, paperSize: e.target.value as any})}
                  style={selectStyle}
                >
                  <option value="a4">A4</option>
                  <option value="a3">A3</option>
                  <option value="letter">Letter</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label style={labelStyle}>// Orientation</label>
                <select 
                  value={options.orientation} 
                  onChange={(e) => setOptions({...options, orientation: e.target.value as any})}
                  style={selectStyle}
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleExport}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-300"
              style={{ 
                background: 'linear-gradient(135deg, #00ffff, #0088ff)',
                color: '#0a0a0f',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
              }}
            >
              Export {format.toUpperCase()}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-300"
              style={{ 
                backgroundColor: 'rgba(42, 42, 58, 0.8)',
                color: '#c0c0d0',
                border: '1px solid rgba(42, 42, 58, 0.8)',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};