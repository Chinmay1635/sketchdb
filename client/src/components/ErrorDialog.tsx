import React from 'react';

interface ErrorDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  title,
  message,
  details,
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
      <div className="bg-slate-800 rounded-xl p-5 sm:p-6 w-full max-w-[95vw] sm:max-w-[500px] max-h-[80vh] flex flex-col shadow-xl border-2 border-rose-500/50">
        {/* Header */}
        <div className="flex items-center mb-4 pb-3 border-b border-rose-900/50">
          <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold mr-3 text-sm">
            !
          </div>
          <h2 className="m-0 text-rose-400 text-base sm:text-lg font-semibold">
            {title}
          </h2>
        </div>
        
        {/* Main Message */}
        <div className="mb-4">
          <p className="m-0 text-slate-200 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Error Details */}
        {details && (
          <div className="mb-5">
            <details className="cursor-pointer">
              <summary className="text-slate-400 text-xs font-medium mb-2 select-none hover:text-slate-300">
                Show Error Details
              </summary>
              <div className="bg-slate-700 border border-slate-600 rounded-md p-3 font-mono text-[10px] sm:text-xs text-slate-200 max-h-36 overflow-auto whitespace-pre-wrap break-words">
                {details}
              </div>
            </details>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-auto">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 border border-indigo-500 rounded-md bg-slate-800 text-indigo-400 cursor-pointer text-sm font-medium hover:bg-indigo-900/30 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border-none rounded-md bg-rose-600 text-white cursor-pointer text-sm font-medium hover:bg-rose-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};