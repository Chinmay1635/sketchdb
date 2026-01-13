import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/storage-context';
import { useLocalConfig } from '../context/local-config-context';

interface AutoSaveIndicatorProps {
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ className = '' }) => {
  const { currentDiagram } = useStorage();
  const { autoSaveEnabled, autoSaveInterval } = useLocalConfig();
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  // Mock saving state for demonstration
  useEffect(() => {
    if (!autoSaveEnabled || !currentDiagram) {
      return;
    }

    const timer = setInterval(() => {
      setSaving(true);
      setTimeout(() => {
        setLastSaveTime(new Date());
        setSaving(false);
      }, 500); // Mock save duration
    }, autoSaveInterval * 1000);

    return () => clearInterval(timer);
  }, [autoSaveEnabled, autoSaveInterval, currentDiagram]);

  if (!autoSaveEnabled || !currentDiagram) {
    return null;
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${saving ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
      <span>
        {saving ? 'Saving...' : lastSaveTime ? `Saved at ${formatTime(lastSaveTime)}` : 'Auto-save enabled'}
      </span>
    </div>
  );
};