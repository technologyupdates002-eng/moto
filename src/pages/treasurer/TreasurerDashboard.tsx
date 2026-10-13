import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, AlertTriangle, FileCheck, Landmark, Scale } from 'lucide-react';
import { mockTreasurer } from '@/api/mock';
import { queryKeys } from '@/lib/query';
import { Card, StatCard, LoadingState, ErrorState, PageHeader, Badge } from '@/components/ui';
import { formatCurrency, formatCurrencyShort, formatDate } from '@/lib/format';

export default function TreasurerDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.treasurerDashboard,
    queryFn: () => mockTreasurer.dashboard(),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load dashboard" onRetry={refetch} />;

  const stats = data!;
  const maxAmount = Math.max(...stats.monthly_contributions.map(m => m.amount), 1);

  return (
    <div>
      <PageHeader title="Treasurer Dashboard" subtitle="Financial overview and wallet balances" icon={<Wallet size={20} />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Operational Wallet" value={formatCurrencyShort(stats.operational_balance)} icon={<Wallet size={18} />} color="primary" />
        <StatCard label="Contributions Wallet" value={formatCurrencyShort(stats.contributions_balance)} icon={<TrendingUp size={18} />} color="success" />
        <StatCard label="Penalty Wallet" value={formatCurrencyShort(stats.penalty_balance)} icon={<AlertTriangle size={18} />} color="warning" />
        <StatCard label="Donation Wallet" value={formatCurrencyShort(stats.donation_balance)} icon={<Wallet size={18} />} color="secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Monthly Contributions Trend</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {stats.monthly_contributions.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-primary-600 hover:bg-primary-700 transition-colors" style={{ height: `${(m.amount / maxAmount) * 100}%` }} title={formatCurrency(m.amount)} />
                <span className="text-xs text-neutral-400">{m.month}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Scale size={16} className="text-primary-600" />
              <h3 className="text-sm font-bold text-neutral-900">Reconciliation</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-neutral-500">Book Balance</span><span className="font-semibold text-neutral-800">{formatCurrency(stats.book_balance)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-neutral-500">Bank Balance</span><span className="font-semibold text-neutral-800">{formatCurrency(stats.bank_balance)}</span></div>
              <div className="flex justify-between text-sm pt-2 border-t border-neutral-100"><span className="text-neutral-500">Difference</span><Badge status={stats.reconciliation_diff === 0 ? 'healthy' : 'warning'}>{formatCurrency(stats.reconciliation_diff)}</Badge></div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck size={16} className="text-primary-600" />
              <h3 className="text-sm font-bold text-neutral-900">Pending Actions</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-neutral-500">Withdrawal Approvals</span><Badge status="pending">{stats.pending_withdrawals}</Badge></div>
              <div className="flex justify-between text-sm"><span className="text-neutral-500">Expense Approvals</span><Badge status="pending">{stats.pending_expenses}</Badge></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
