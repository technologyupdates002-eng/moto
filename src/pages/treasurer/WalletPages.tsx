import { GenericListPage } from '@/components/GenericPages';
import { mockTreasurer } from '@/api/mock';
import { queryKeys } from '@/lib/query';
import { Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { Wallet } from 'lucide-react';

const walletColumns = [
  { key: 'description', label: 'Description', render: (r: any) => <span className="font-medium text-neutral-800">{r.description}</span> },
  { key: 'type', label: 'Type', render: (r: any) => <Badge status={r.type === 'credit' ? 'confirmed' : 'failed'}>{r.type}</Badge> },
  { key: 'amount', label: 'Amount', render: (r: any) => <span className={r.type === 'credit' ? 'text-success-600 font-semibold' : 'text-error-600 font-semibold'}>{r.type === 'credit' ? '+' : '-'}{formatCurrency(r.amount)}</span> },
  { key: 'reference', label: 'Reference', render: (r: any) => <span className="font-mono text-xs text-neutral-500">{r.reference}</span> },
  { key: 'balance_after', label: 'Balance After', render: (r: any) => formatCurrency(r.balance_after) },
  { key: 'date', label: 'Date', render: (r: any) => formatDate(r.date) },
  { key: 'status', label: 'Status', render: (r: any) => <Badge status={r.status}>{r.status}</Badge> },
];

export function PenaltyWalletPage() {
  return <GenericListPage config={{
    title: 'Penalty Wallet', subtitle: 'Penalty collection transactions', icon: Wallet,
    fetchFn: (p) => mockTreasurer.getPenaltyWallet(p.page), queryKey: (p) => queryKeys.treasurerWallet('penalty', p.page),
    exportFilename: 'penalty-wallet.csv', columns: walletColumns,
  }} />;
}

export function DonationWalletPage() {
  return <GenericListPage config={{
    title: 'Donation Wallet', subtitle: 'Donation collection transactions', icon: Wallet,
    fetchFn: (p) => mockTreasurer.getDonationWallet(p.page), queryKey: (p) => queryKeys.treasurerWallet('donation', p.page),
    exportFilename: 'donation-wallet.csv', columns: walletColumns,
  }} />;
}

export function OperationalWalletPage() {
  return <GenericListPage config={{
    title: 'Operational Wallet', subtitle: 'Operational fund transactions', icon: Wallet,
    fetchFn: (p) => mockTreasurer.getOperationalWallet(p.page), queryKey: (p) => queryKeys.treasurerWallet('operational', p.page),
    exportFilename: 'operational-wallet.csv', columns: walletColumns,
  }} />;
}
