import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCheck, CheckCircle, XCircle } from 'lucide-react';
import { mockTreasurer } from '@/api/mock';
import { queryKeys } from '@/lib/query';
import { Card, PageHeader, Badge, Button, LoadingState, ErrorState, EmptyState, Modal, ConfirmDialog } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';

export default function WithdrawalApprovals() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);

  const { data: withdrawals, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.treasurerWithdrawals,
    queryFn: () => mockTreasurer.getWithdrawalApprovals(),
  });

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => mockTreasurer.approveWithdrawal(id, action),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.treasurerWithdrawals }); setSelected(null); setConfirmAction(null); },
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load withdrawal requests" onRetry={refetch} />;

  const pending = (withdrawals || []).filter((w: any) => w.status === 'pending');
  const processed = (withdrawals || []).filter((w: any) => w.status !== 'pending');

  return (
    <div>
      <PageHeader title="Withdrawal Approvals" subtitle="Review and approve member withdrawal requests" icon={<FileCheck size={20} />} />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4"><p className="text-xs text-neutral-400">Pending</p><p className="text-xl font-bold text-warning-600">{pending.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-neutral-400">Processed</p><p className="text-xl font-bold text-success-600">{processed.length}</p></Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-bold mb-3">Pending Requests</h3>
        {pending.length === 0 ? <EmptyState icon={<FileCheck size={24} />} title="No pending requests" /> : (
          <div className="space-y-3">
            {pending.map((w: any) => (
              <div key={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-neutral-100">
                <div>
                  <p className="font-semibold text-neutral-800">{w.member_name}</p>
                  <p className="text-sm text-neutral-500">{formatCurrency(w.amount)} • {w.reason}</p>
                  <p className="text-xs text-neutral-400 mt-1">Requested {formatDate(w.requested_date)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setSelected(w); setConfirmAction('approve'); }}><CheckCircle size={14} /> Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => { setSelected(w); setConfirmAction('reject'); }}><XCircle size={14} /> Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {processed.length > 0 && (
        <Card className="p-4 mt-4">
          <h3 className="text-sm font-bold mb-3">Processed</h3>
          <div className="space-y-2">
            {processed.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-neutral-700">{w.member_name}</span>
                  <span className="text-sm text-neutral-400 ml-2">{formatCurrency(w.amount)}</span>
                </div>
                <Badge status={w.status}>{w.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => selected && mutation.mutate({ id: selected.id, action: confirmAction! })}
        title={confirmAction === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
        message={`Are you sure you want to ${confirmAction} the withdrawal of ${selected ? formatCurrency(selected.amount) : ''} for ${selected?.member_name}?`}
        confirmLabel={confirmAction === 'approve' ? 'Approve' : 'Reject'}
        danger={confirmAction === 'reject'}
      />
    </div>
  );
}
