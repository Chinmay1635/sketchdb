import React from 'react';

interface LoadingDialogProps {
  isOpen: boolean;
  message?: string;
  onCancel?: () => void;
}

export const LoadingDialog: React.FC<LoadingDialogProps> = ({
  isOpen,
  message = "Parsing to SQL...",
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="
        absolute top-1/2 left-1/2 -translate-x-1/2
        -translate-y-1/2
        z-[100] bg-slate-800 border-2 border-indigo-500/50
        rounded-lg shadow-xl p-6 sm:p-8 w-[calc(100%-2rem)] sm:w-auto sm:min-w-[400px] lg:min-w-[500px] max-w-[90vw]
        text-center
      "
    >
      {/* Loading Spinner */}
      <div
        className="
          w-8 h-8 sm:w-10 sm:h-10 border-4 border-slate-600 
          border-t-indigo-500 rounded-full 
          animate-spin mx-auto mb-4 sm:mb-5
        "
      ></div>

      {/* Loading Message */}
      <h3 className="text-indigo-400 mt-0 mb-2 text-base sm:text-lg font-bold">
        {message}
      </h3>

      <p
        className={`
          text-slate-400 text-xs sm:text-sm mb-${onCancel ? "4 sm:mb-5" : "0"}
        `}
      >
        Please wait while we generate your SQL schema...
      </p>

      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="cursor-pointer
            bg-slate-600 text-white px-4 py-2 
            rounded-md text-sm hover:bg-slate-500 transition-colors
          "
        >
          Cancel
        </button>
      )}
    </div>
  );
};
