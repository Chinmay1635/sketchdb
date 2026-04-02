import React, { useState } from 'react';

interface MigrationPlanSummary {
  _id: string;
  status: 'draft' | 'approved' | 'applied' | 'failed';
  sqlStatements: string[];
  createdAt?: string;
}

interface MigrationHistoryListProps {
  plans: MigrationPlanSummary[];
  onSelectPlan?: (planId: string) => void;
}

export const MigrationHistoryList: React.FC<MigrationHistoryListProps> = ({ plans, onSelectPlan }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!plans.length) {
    return <p className="text-xs text-slate-400">No migration history yet.</p>;
  }

  return (
    <div className="space-y-2">
      {plans.map((plan) => {
        const isOpen = expanded === plan._id;
        return (
          <div key={plan._id} className="rounded-md border border-white/5 bg-[#11111c]">
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300"
              onClick={() => {
                setExpanded(isOpen ? null : plan._id);
                onSelectPlan?.(plan._id);
              }}
            >
              <span>{plan.createdAt ? new Date(plan.createdAt).toLocaleString() : 'Unknown date'}</span>
              <span className="text-[10px] uppercase tracking-widest">{plan.status}</span>
            </button>
            {isOpen && (
              <pre className="px-3 pb-3 text-[11px] whitespace-pre-wrap text-slate-400">
                {(plan.sqlStatements || []).join('\n') || '-- No statements'}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
};
