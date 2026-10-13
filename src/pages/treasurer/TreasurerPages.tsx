import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GenericListPage, ImportPage } from '@/components/GenericPages';
import { mockTreasurer } from '@/api/mock';
import { queryKeys } from '@/lib/query';
import { Card, PageHeader, Badge, Button, Input, Textarea, Select, Tabs, LoadingState, EmptyState, Modal, ConfirmDialog } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { Landmark, Upload, Scale, BarChart3, Receipt, Plus, UserCheck, CheckCircle, XCircle } from 'lucide-react';
import type { PayoutType } from '@/types';

export function BankStatementPage() {
  return <GenericListPage config={{
    title: 'Bank Statement', subtitle: 'View imported bank transactions', icon: Landmark,
    fetchFn: (p) => mockTreasurer.getBankStatement(p.page), queryKey: (p) => queryKeys.treasurerBankStatement(p.page),
    exportFilename: 'bank-statement.csv',
    statusFilters: [{ value: 'matched', label: 'Matched' }, { value: 'unmatched', label: 'Unmatched' }],
    columns: [
      { key: 'date', label: 'Date', render: r => formatDate(r.date) },
      { key: 'description', label: 'Description' },
      { key: 'reference', label: 'Reference', render: r => <span className="font-mono text-xs text-neutral-500">{r.reference}</span> },
      { key: 'amount', label: 'Amount', render: r => <span className={r.type === 'credit' ? 'text-success-600 font-semibold' : 'text-error-600 font-semibold'}>{r.type === 'credit' ? '+' : '-'}{formatCurrency(r.amount)}</span> },
      { key: 'matched', label: 'Status', render: r => <Badge status={r.matched ? 'confirmed' : 'pending'}>{r.matched ? 'Matched' : 'Unmatched'}</Badge> },
    ],
  }} />;
}

export function BookBalanceImportPage() {
  return <ImportPage title="Import Book Balance" icon={Upload} onImport={(file) => mockTreasurer.importBookBalance(file)} />;
}

export function BookBalancePage() {
  return <GenericListPage config={{
    title: 'Book Balance', subtitle: 'Internal ledger balance and entries', icon: Scale,
    fetchFn: (p) => { void p; return mockTreasurer.getBookBalance().then(d => ({ data: d.entries, current_page: 1, last_page: 1, total: d.entries.length })); },
    queryKey: (p) => queryKeys.treasurerBookBalance,
    exportFilename: 'book-balance.csv',
    columns: [
      { key: 'description', label: 'Description' },
      { key: 'type', label: 'Type', render: r => <Badge status={r.type === 'credit' ? 'confirmed' : 'failed'}>{r.type}</Badge> },
      { key: 'amount', label: 'Amount', render: r => formatCurrency(r.amount) },
      { key: 'date', label: 'Date', render: r => formatDate(r.date) },
    ],
  }} />;
}

export function WalletReportsPage() {
  return <GenericListPage config={{
    title: 'Wallet Reports', subtitle: 'Summary reports for all wallets', icon: BarChart3,
    fetchFn: () => mockTreasurer.getWalletReports().then(d => ({ data: d, current_page: 1, last_page: 1, total: d.length })),
    queryKey: () => queryKeys.treasurerWalletReports,
    exportFilename: 'wallet-reports.csv',
    columns: [
      { key: 'wallet', label: 'Wallet' },
      { key: 'transactions', label: 'Transactions' },
      { key: 'balance', label: 'Balance', render: r => formatCurrency(r.balance) },
      { key: 'period', label: 'Period' },
    ],
  }} />;
}

const PAYOUT_TYPES: { value: PayoutType; label: string; relation: string }[] = [
  { value: 'wedding', label: 'Wedding', relation: 'Self' },
  { value: 'death_member', label: 'Death - Member', relation: 'Member' },
  { value: 'death_spouse', label: 'Death - Spouse', relation: 'Spouse' },
  { value: 'death_child', label: 'Death - Child', relation: 'Child' },
  { value: 'death_parent', label: 'Death - Parent', relation: 'Parent' },
  { value: 'retirement', label: 'Retirement', relation: 'Self' },
  { value: 'emergency', label: 'Emergency', relation: 'Self' },
];

const WALLET_TYPES = [
  { value: 'operational', label: 'Operational Wallet' },
  { value: 'donation', label: 'Donation Wallet' },
  { value: 'penalty', label: 'Penalty Wallet' },
];

export function ExpensesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('expenses');
  const [expenseModal, setExpenseModal] = useState(false);
  const [payoutModal, setPayoutModal] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Operations' });
  const [payoutForm, setPayoutForm] = useState<{
    payoutType: PayoutType | '';
    memberId: string;
    amount: string;
    reason: string;
    phone: string;
    walletType: string;
  }>({ payoutType: '', memberId: '', amount: '', reason: '', phone: '', walletType: 'operational' });

  const { data: expensesData, isLoading: expLoading } = useQuery({
    queryKey: queryKeys.treasurerExpenses(1),
    queryFn: () => mockTreasurer.getExpenses(1),
  });
  const { data: payouts, isLoading: payLoading } = useQuery({
    queryKey: queryKeys.treasurerPayouts,
    queryFn: () => mockTreasurer.getPayouts(),
  });
  const { data: eligibleMembers, isLoading: eligLoading } = useQuery({
    queryKey: queryKeys.treasurerEligibleMembers(payoutForm.payoutType || 'wedding'),
    queryFn: () => mockTreasurer.getEligibleMembers(payoutForm.payoutType || 'wedding'),
    enabled: !!payoutForm.payoutType,
  });

  const createExpenseMut = useMutation({
    mutationFn: (data: any) => mockTreasurer.createExpense(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treasurer', 'expenses'] }); setExpenseModal(false); setExpenseForm({ description: '', amount: '', category: 'Operations' }); },
  });
  const createPayoutMut = useMutation({
    mutationFn: (data: any) => mockTreasurer.createPayout(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.treasurerPayouts }); setPayoutModal(false); resetPayoutForm(); },
  });
  const approveMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => mockTreasurer.approveExpense(id, action),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treasurer', 'expenses'] }); setApproveId(null); setRejectId(null); },
  });

  function resetPayoutForm() {
    setPayoutForm({ payoutType: '', memberId: '', amount: '', reason: '', phone: '', walletType: 'operational' });
  }

  function selectMember(m: any) {
    setPayoutForm(prev => ({ ...prev, memberId: m.id, phone: m.phone, amount: String(m.eligible_amount) }));
  }

  function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    createExpenseMut.mutate({ description: expenseForm.description, amount: Number(expenseForm.amount), category: expenseForm.category, status: 'pending' });
  }

  function submitPayout(e: React.FormEvent) {
    e.preventDefault();
    const pt = PAYOUT_TYPES.find(t => t.value === payoutForm.payoutType);
    createPayoutMut.mutate({
      member_id: payoutForm.memberId,
      payout_type: payoutForm.payoutType,
      relation: pt?.relation || 'Self',
      amount: Number(payoutForm.amount),
      reason: payoutForm.reason,
      phone: payoutForm.phone,
      wallet_type: payoutForm.walletType,
    });
  }

  const expenses = (expensesData as any)?.data || (expensesData as any[] | undefined) || [];
  const payoutList = (payouts as any[]) || [];

  return (
    <div>
      <PageHeader
        title="Expenses & Payouts"
        subtitle="Manage operational expenses and member benefit payouts"
        icon={<Receipt size={20} />}
        action={
          tab === 'expenses'
            ? <Button onClick={() => setExpenseModal(true)}><Plus size={16} /> New Expense</Button>
            : <Button onClick={() => setPayoutModal(true)}><Plus size={16} /> New Payout</Button>
        }
      />

      <Tabs
        tabs={[
          { key: 'expenses', label: 'Expenses', count: expenses.length },
          { key: 'payouts', label: 'Payouts', count: payoutList.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card className="p-4 mt-4">
        {tab === 'expenses' && (
          <>
            {expLoading ? <LoadingState /> : expenses.length === 0 ? (
              <EmptyState icon={<Receipt size={24} />} title="No expenses recorded" />
            ) : (
              <div className="divide-y divide-neutral-50">
                {expenses.map((ex: any) => (
                  <div key={ex.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{ex.description}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{ex.category} • {formatCurrency(ex.amount)} • {formatDate(ex.date)}</p>
                      {ex.approved_by && <p className="text-xs text-neutral-400 mt-0.5">Approved by {ex.approved_by}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge status={ex.status}>{ex.status}</Badge>
                      {ex.status === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setApproveId(ex.id)}><CheckCircle size={14} className="text-success-600" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejectId(ex.id)}><XCircle size={14} className="text-error-600" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'payouts' && (
          <>
            {payLoading ? <LoadingState /> : payoutList.length === 0 ? (
              <EmptyState icon={<UserCheck size={24} />} title="No payout requests" message="Create a member benefit payout to get started." />
            ) : (
              <div className="divide-y divide-neutral-50">
                {payoutList.map((po: any) => {
                  const pt = PAYOUT_TYPES.find(t => t.value === po.payout_type);
                  return (
                    <div key={po.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-neutral-800 truncate">{po.member_name}</p>
                          <span className="font-mono text-xs text-neutral-400">{po.reference}</span>
                        </div>
                        <p className="text-xs text-neutral-500">{pt?.label || po.payout_type} • {formatCurrency(po.amount)} • {po.wallet_type} wallet</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{po.reason}</p>
                        {po.signatories && (
                          <div className="flex gap-2 mt-1">
                            {po.signatories.map((sig: any, i: number) => (
                              <span key={i} className="text-xs text-neutral-400">
                                {sig.role}: <span className={sig.status === 'approved' ? 'text-success-600' : sig.status === 'rejected' ? 'text-error-600' : 'text-warning-600'}>{sig.status}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-neutral-400 mt-0.5">Requested {formatDate(po.created_at)}</p>
                      </div>
                      <Badge status={po.status}>{po.status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Expense Modal */}
      <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title="New Expense">
        <form onSubmit={submitExpense} className="space-y-4">
          <Input label="Description" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} required />
          <Input label="Amount (KES)" type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
          <Select label="Category" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
            <option value="Operations">Operations</option>
            <option value="Events">Events</option>
            <option value="Administrative">Administrative</option>
            <option value="Logistics">Logistics</option>
          </Select>
          {createExpenseMut.isError && <p className="text-sm text-error-600">Failed to create expense. Try again.</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setExpenseModal(false)}>Cancel</Button>
            <Button type="submit" disabled={createExpenseMut.isPending}>{createExpenseMut.isPending ? 'Saving...' : 'Create Expense'}</Button>
          </div>
        </form>
      </Modal>

      {/* Create Payout Modal */}
      <Modal open={payoutModal} onClose={() => setPayoutModal(false)} title="New Member Payout" size="lg">
        <form onSubmit={submitPayout} className="space-y-4">
          <Select
            label="Payout Type"
            value={payoutForm.payoutType}
            onChange={e => { const v = e.target.value as PayoutType; setPayoutForm(prev => ({ ...prev, payoutType: v, memberId: '', amount: '', phone: '' })); }}
            required
          >
            <option value="">Select payout type...</option>
            {PAYOUT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>

          {payoutForm.payoutType && (
            <>
              <div>
                <label className="label">Eligible Members</label>
                {eligLoading ? <LoadingState text="Loading eligible members..." /> : (
                  <div className="max-h-48 overflow-y-auto border border-neutral-100 rounded-xl divide-y divide-neutral-50">
                    {(eligibleMembers as any[])?.map((m: any) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => selectMember(m)}
                        className={`w-full text-left flex items-center justify-between p-3 transition-colors ${payoutForm.memberId === m.id ? 'bg-primary-50' : 'hover:bg-neutral-50'}`}
                      >
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{m.name}</p>
                          <p className="text-xs text-neutral-400">{m.member_number} • {m.phone}</p>
                        </div>
                        <span className="text-sm font-semibold text-neutral-700">{formatCurrency(m.eligible_amount)}</span>
                      </button>
                    ))}
                    {(eligibleMembers as any[])?.length === 0 && <p className="p-3 text-sm text-neutral-400">No eligible members for this payout type.</p>}
                  </div>
                )}
              </div>

              {payoutForm.memberId && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Amount (KES)" type="number" value={payoutForm.amount} onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })} required />
                    <Input label="Member Phone" value={payoutForm.phone} onChange={e => setPayoutForm({ ...payoutForm, phone: e.target.value })} required />
                  </div>
                  <Select label="Wallet" value={payoutForm.walletType} onChange={e => setPayoutForm({ ...payoutForm, walletType: e.target.value })}>
                    {WALLET_TYPES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                  </Select>
                  <Textarea label="Reason" rows={3} value={payoutForm.reason} onChange={e => setPayoutForm({ ...payoutForm, reason: e.target.value })} placeholder="Reason for payout..." required />
                </>
              )}
            </>
          )}

          {createPayoutMut.isError && <p className="text-sm text-error-600">Failed to create payout. Try again.</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setPayoutModal(false)}>Cancel</Button>
            <Button type="submit" disabled={createPayoutMut.isPending || !payoutForm.memberId}>
              {createPayoutMut.isPending ? 'Submitting...' : 'Submit Payout Request'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!approveId}
        onClose={() => setApproveId(null)}
        onConfirm={() => approveId && approveMut.mutate({ id: approveId, action: 'approve' })}
        title="Approve Expense"
        message="Approve this expense for payment?"
        confirmLabel="Approve"
      />
      <ConfirmDialog
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={() => rejectId && approveMut.mutate({ id: rejectId, action: 'reject' })}
        title="Reject Expense"
        message="Are you sure you want to reject this expense?"
        confirmLabel="Reject"
        danger
      />
    </div>
  );
}
