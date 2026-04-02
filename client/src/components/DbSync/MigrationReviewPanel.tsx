import React from 'react';
import { MigrationHistoryList } from './MigrationHistoryList';

interface MigrationPlan {
  _id: string;
  sqlStatements: string[];
  riskWarnings: string[];
  status: 'draft' | 'approved' | 'applied' | 'failed';
  createdAt?: string;
}

interface MigrationReviewPanelProps {
  plan: MigrationPlan | null;
  isLoading: boolean;
  error?: string | null;
  history?: MigrationPlan[];
  onApprove: () => Promise<void>;
  onApply: () => Promise<void>;
  onClose: () => void;
}

export const MigrationReviewPanel: React.FC<MigrationReviewPanelProps> = ({
  plan,
  isLoading,
  error,
  history = [],
  onApprove,
  onApply,
  onClose,
}) => {
  if (!plan) return null;

  const canApply = plan.status === 'approved';

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[520px] z-[110] bg-[#0f0f1a] border-l border-white/5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest">Migration Plan</p>
          <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
            style={{
              backgroundColor: plan.status === 'applied' ? 'rgba(16,185,129,0.2)' : plan.status === 'failed' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)',
              color: plan.status === 'applied' ? '#34d399' : plan.status === 'failed' ? '#f87171' : '#facc15',
            }}
          >
            {plan.status}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="p-5 space-y-4 overflow-y-auto h-[calc(100%-140px)]">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-slate-400">Statements</h3>
          <pre className="mt-2 text-xs whitespace-pre-wrap rounded-lg p-3"
            style={{ backgroundColor: '#11111c', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {(plan.sqlStatements || []).join('\n') || '-- No changes detected'}
          </pre>
        </div>

        {(plan.riskWarnings || []).length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-widest text-amber-400">Risk Warnings</h3>
            <ul className="mt-2 space-y-2">
              {plan.riskWarnings.map((warning, index) => (
                <li
                  key={`${warning}-${index}`}
                  className="text-xs rounded-md px-3 py-2"
                  style={{ backgroundColor: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}
                >
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <div className="text-xs text-red-400">{error}</div>}

        {history.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-widest text-slate-400">History</h3>
            <div className="mt-2">
              <MigrationHistoryList plans={history} />
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-white/5 flex gap-2">
        <button
          onClick={onApprove}
          disabled={isLoading || plan.status !== 'draft'}
          className="px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-widest"
          style={{ background: '#1d4ed8', color: '#e2e8f0' }}
        >
          Approve
        </button>
        <button
          onClick={onApply}
          disabled={isLoading || !canApply}
          className="px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-widest"
          style={{ background: '#14b8a6', color: '#09090b' }}
        >
          Apply to Database
        </button>
      </div>
    </div>
  );
};
