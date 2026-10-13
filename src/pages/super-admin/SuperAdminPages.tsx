import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Wrench, ScrollText, Shield, Key, Lock,
  LogIn, Activity, Landmark, Database, Server, Search, Users,
  ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, Eye,
} from 'lucide-react';
import { mockSuperAdmin } from '@/api/mock';
import { queryKeys } from '@/lib/query';
import {
  Card, StatCard, PageHeader, Badge, LoadingState, ErrorState,
  EmptyState, Avatar, DataTable, Pagination,
} from '@/components/ui';
import { formatCurrency, formatDate, formatDateTime, relativeTime, statusColor } from '@/lib/format';
import { GenericListPage, GenericDashboardPage, GenericFormPage, GenericDetailPage } from '@/components/GenericPages';
import { useState } from 'react';
import type { SystemMetric } from '@/types';

export function SuperAdminDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.superAdminDashboard, queryFn: () => mockSuperAdmin.dashboard(),
  });
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load dashboard" onRetry={refetch} />;
  const d = data!;
  return (
    <div>
      <PageHeader title="Super Admin Dashboard" subtitle="System monitoring and administration" icon={<LayoutDashboard size={20} />} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={d.total_users} icon={<Users size={18} />} />
        <StatCard label="Online Now" value={d.online_users} icon={<Activity size={18} />} color="success" />
        <StatCard label="Total Members" value={d.total_members} icon={<Users size={18} />} color="secondary" />
        <StatCard label="Pending Alerts" value={d.pending_alerts} icon={<AlertTriangle size={18} />} color="warning" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3">System Health</h3>
          <div className="space-y-2">
            {d.system_health.slice(0, 5).map((m: SystemMetric, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                <span className="text-sm text-neutral-600">{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-800">{m.value}</span>
                  <span className={`w-2 h-2 rounded-full ${m.status === 'healthy' ? 'bg-success-500' : m.status === 'warning' ? 'bg-warning-500' : 'bg-error-500'}`} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3">Recent Logins</h3>
          <div className="space-y-2">
            {d.recent_logins.map((l: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                <div><p className="text-sm font-medium text-neutral-700">{l.user}</p><p className="text-xs text-neutral-400">{l.device}</p></div>
                <Badge status={l.status}>{l.status}</Badge>
              </div>
            ))}
          </div>
          <Link to="/super-admin/login-activity" className="mt-3 flex items-center gap-1 text-sm text-primary-700 font-medium">View all <ArrowRight size={14} /></Link>
        </Card>
      </div>
    </div>
  );
}

export function SuperAdminMemberDetail() {
  const { memberId = '' } = useParams();
  const navigate = useNavigate();
  const { data: member, isLoading } = useQuery({
    queryKey: queryKeys.superAdminMember(memberId), queryFn: () => mockSuperAdmin.getMemberDetail(memberId),
  });
  if (isLoading) return <LoadingState />;
  if (!member) return <ErrorState message="Member not found" />;
  return (
    <GenericDetailPage
      title={member.name} subtitle={member.member_number} icon={Users}
      onBack={() => navigate('/super-admin')}
      sections={[
        { label: 'Email', value: member.email }, { label: 'Phone', value: member.phone },
        { label: 'Role', value: member.role }, { label: 'Status', value: <Badge status={member.status}>{member.status}</Badge> },
        { label: 'County', value: member.county }, { label: 'Workplace', value: member.workplace },
        { label: 'Contributions', value: formatCurrency(member.contributions_total) },
        { label: 'Joined', value: formatDate(member.joined_date) },
      ]}
    />
  );
}

export function SystemTroubleshooting() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.superAdminTroubleshooting, queryFn: () => mockSuperAdmin.getTroubleshooting() });
  if (isLoading) return <LoadingState />;
  const d = data!;
  return (
    <div>
      <PageHeader title="System Troubleshooting" subtitle="Diagnose and resolve system issues" icon={<Wrench size={20} />} />
      <Card className="p-5 mb-4">
        <h3 className="text-sm font-bold mb-3">Active Issues</h3>
        <div className="space-y-3">
          {d.issues.map((issue: any) => (
            <div key={issue.id} className="flex items-start gap-3 p-4 rounded-xl border border-neutral-100">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${issue.severity === 'critical' ? 'bg-error-50 text-error-600' : issue.severity === 'warning' ? 'bg-warning-50 text-warning-600' : 'bg-secondary-50 text-secondary-600'}`}>
                <AlertTriangle size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-800">{issue.module}: {issue.description}</p>
                <p className="text-xs text-neutral-400 mt-1">{formatDate(issue.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-bold mb-3">Diagnostics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {d.diagnostics.map((m: SystemMetric, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50">
              <span className="text-sm text-neutral-600">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{m.value}</span>
                <span className={`w-2 h-2 rounded-full ${m.status === 'healthy' ? 'bg-success-500' : m.status === 'warning' ? 'bg-warning-500' : 'bg-error-500'}`} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AuditLogs() {
  return <GenericListPage config={{
    title: 'Audit Logs', subtitle: 'Security and audit trail', icon: ScrollText,
    fetchFn: (p) => mockSuperAdmin.getAuditLogs(p.page), queryKey: (p) => queryKeys.superAdminAuditLogs(p.page),
    exportFilename: 'audit-logs.csv',
    columns: [
      { key: 'date', label: 'Date', render: r => formatDateTime(r.date) },
      { key: 'user', label: 'User' },
      { key: 'action', label: 'Action', render: r => <span className="font-mono text-xs">{r.action}</span> },
      { key: 'module', label: 'Module' },
      { key: 'ip', label: 'IP', render: r => <span className="font-mono text-xs text-neutral-500">{r.ip}</span> },
      { key: 'details', label: 'Details' },
    ],
  }} />;
}

export function SecuritySettings() {
  return <GenericFormPage
    title="Security Settings" subtitle="Configure system security" icon={Shield}
    fields={[
      { key: 'two_factor', label: 'Two-Factor Authentication', type: 'text', value: 'Disabled' },
      { key: 'min_length', label: 'Min Password Length', type: 'number', value: '8' },
      { key: 'session_timeout', label: 'Session Timeout (min)', type: 'number', value: '60' },
      { key: 'ip_whitelist', label: 'IP Whitelist (comma-separated)', value: '' },
    ]}
    onSubmit={async (data) => { await mockSuperAdmin.updateSecuritySettings(data); }}
  />;
}

export function PasswordManagement() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.superAdminPasswords, queryFn: () => mockSuperAdmin.getPasswordManagement() });
  if (isLoading) return <LoadingState />;
  return (
    <GenericDashboardPage
      title="Password Management" subtitle="Password policies and resets" icon={Key}
      stats={[
        { label: 'Expired Passwords', value: data!.expired_passwords, icon: Key, color: 'warning' },
        { label: 'Forced Resets', value: data!.forced_resets, icon: Key, color: 'error' },
      ]}
      sections={[{ title: 'Password Policies', content: (
        <div className="space-y-2">
          {data!.policies.map((p: SystemMetric, i: number) => (
            <div key={i} className="flex justify-between text-sm py-2 border-b border-neutral-50 last:border-0">
              <span className="text-neutral-600">{p.label}</span>
              <span className="font-semibold">{p.value}</span>
            </div>
          ))}
        </div>
      )}]}
    />
  );
}

export function AccessControl() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.superAdminAccessControl, queryFn: () => mockSuperAdmin.getAccessControl() });
  if (isLoading) return <LoadingState />;
  return (
    <div>
      <PageHeader title="Access Control" subtitle="Manage roles and permissions" icon={<Lock size={20} />} />
      <div className="space-y-3">
        {(data || []).map((role: any) => (
          <Card key={role.id} className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div><h3 className="text-sm font-bold text-neutral-900">{role.name}</h3><p className="text-xs text-neutral-400">{role.description}</p></div>
              <Badge>{role.users_count} users</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {role.permissions.map((p: string, i: number) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-100 text-xs text-neutral-600 font-mono">{p}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function OnlineUsers() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.superAdminOnlineUsers, queryFn: () => mockSuperAdmin.getOnlineUsers() });
  if (isLoading) return <LoadingState />;
  return (
    <div>
      <PageHeader title="Online Users" subtitle={`${(data || []).length} users currently active`} icon={<Users size={20} />} />
      <Card className="p-4">
        <div className="space-y-2">
          {(data || []).map((u: any) => (
            <div key={u.id} className="flex items-center justify-between py-3 border-b border-neutral-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar name={u.name} size="md" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 rounded-full border-2 border-white" />
                </div>
                <div><p className="text-sm font-semibold text-neutral-800">{u.name}</p><p className="text-xs text-neutral-400">{u.device}</p></div>
              </div>
              <div className="text-right"><p className="text-xs text-neutral-500">{u.last_activity}</p><p className="text-xs text-neutral-400 font-mono">{u.ip}</p></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function LoginActivity() {
  return <GenericListPage config={{
    title: 'Login Activity', subtitle: 'User login history and failures', icon: LogIn,
    fetchFn: (p) => mockSuperAdmin.getLoginActivity(p.page), queryKey: (p) => queryKeys.superAdminLoginActivity(p.page),
    exportFilename: 'login-activity.csv',
    statusFilters: [{ value: 'success', label: 'Success' }, { value: 'failed', label: 'Failed' }],
    columns: [
      { key: 'date', label: 'Date', render: r => formatDateTime(r.date) },
      { key: 'user', label: 'User' },
      { key: 'email', label: 'Email' },
      { key: 'ip', label: 'IP', render: r => <span className="font-mono text-xs">{r.ip}</span> },
      { key: 'device', label: 'Device' },
      { key: 'status', label: 'Status', render: r => <Badge status={r.status}>{r.status}</Badge> },
    ],
  }} />;
}

export function SystemMonitoring() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.superAdminMonitoring, queryFn: () => mockSuperAdmin.getSystemMonitoring() });
  if (isLoading) return <LoadingState />;
  const d = data!;
  return (
    <div>
      <PageHeader title="System Monitoring" subtitle="Real-time system health" icon={<Activity size={20} />} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {d.metrics.map((m: SystemMetric, i: number) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-neutral-400">{m.label}</p>
              <span className={`w-2.5 h-2.5 rounded-full ${m.status === 'healthy' ? 'bg-success-500' : m.status === 'warning' ? 'bg-warning-500' : 'bg-error-500'}`} />
            </div>
            <p className="text-lg font-bold text-neutral-900">{m.value}</p>
            {m.detail && <p className="text-xs text-neutral-400 mt-0.5">{m.detail}</p>}
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <h3 className="text-sm font-bold mb-3">Services</h3>
        <div className="space-y-2">
          {d.services.map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
              <span className="text-sm font-medium text-neutral-700">{s.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">{s.uptime}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${s.status === 'healthy' ? 'bg-success-500' : 'bg-warning-500'}`} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function SuperAdminBank() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.superAdminBank, queryFn: () => mockSuperAdmin.getBank() });
  if (isLoading) return <LoadingState />;
  const d = data!;
  return (
    <GenericDashboardPage
      title="Bank Configuration" subtitle="Bank integration health and settings" icon={Landmark}
      stats={[
        { label: 'Connection', value: d.connected ? 'Active' : 'Disconnected', icon: d.connected ? CheckCircle : AlertTriangle, color: d.connected ? 'success' : 'error' },
        { label: 'Last Sync', value: relativeTime(d.last_sync), icon: Landmark },
        { label: 'Accounts', value: d.accounts.length, icon: Landmark },
        { label: 'Total Balance', value: formatCurrency(d.accounts.reduce((s: number, a: any) => s + a.balance, 0)), icon: Landmark, color: 'secondary' },
      ]}
      sections={[{ title: 'Bank Accounts', content: (
        <div className="space-y-2">
          {d.accounts.map((a: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
              <div><p className="text-sm font-medium text-neutral-700">{a.name}</p><p className="text-xs text-neutral-400 font-mono">{a.number}</p></div>
              <div className="flex items-center gap-3"><span className="text-sm font-semibold">{formatCurrency(a.balance)}</span><Badge status={a.status}>{a.status}</Badge></div>
            </div>
          ))}
        </div>
      )}]}
    />
  );
}

export function SuperAdminDatabase() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.superAdminDatabase, queryFn: () => mockSuperAdmin.getDatabase() });
  if (isLoading) return <LoadingState />;
  const d = data!;
  return (
    <GenericDashboardPage
      title="Database" subtitle="Database diagnostics and health" icon={Database}
      stats={[
        { label: 'Size', value: d.size, icon: Database },
        { label: 'Tables', value: d.tables, icon: Database, color: 'secondary' },
        { label: 'Connections', value: d.connections, icon: Database },
        { label: 'Slow Queries', value: d.slow_queries, icon: AlertTriangle, color: d.slow_queries > 0 ? 'warning' : 'success' },
      ]}
      sections={[{ title: 'Backup Information', content: <p className="text-sm text-neutral-600">Last backup: {formatDateTime(d.backup_last)}</p> }]}
    />
  );
}

export function SuperAdminSystem() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.superAdminSystem, queryFn: () => mockSuperAdmin.getSystem() });
  if (isLoading) return <LoadingState />;
  const d = data!;
  return (
    <div>
      <PageHeader title="System" subtitle="System information and features" icon={<Server size={20} />} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Version" value={d.version} icon={<Server size={18} />} />
        <StatCard label="Uptime" value={d.uptime} icon={<Activity size={18} />} color="success" />
        <StatCard label="Environment" value={d.environment} icon={<Server size={18} />} color="secondary" />
      </div>
      <Card className="p-5">
        <h3 className="text-sm font-bold mb-3">Feature Flags</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {d.features.map((f: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-50">
              <span className="text-sm text-neutral-700">{f.name}</span>
              <Badge status={f.enabled ? 'confirmed' : 'inactive'}>{f.enabled ? 'Enabled' : 'Disabled'}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function SuperAdminTrace() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.superAdminTrace, queryFn: () => mockSuperAdmin.getTrace() });
  if (isLoading) return <LoadingState />;
  return (
    <div>
      <PageHeader title="Debug Trace" subtitle="Request traces and performance" icon={<Search size={20} />} />
      <Card className="p-4">
        <DataTable
          data={data?.traces || []}
          columns={[
            { key: 'date', label: 'Time', render: r => formatDateTime(r.date) },
            { key: 'request', label: 'Request', render: r => <span className="font-mono text-xs">{r.request}</span> },
            { key: 'duration', label: 'Duration', render: r => <Badge status={parseInt(r.duration) < 200 ? 'confirmed' : 'warning'}>{r.duration}</Badge> },
            { key: 'status', label: 'Status', render: r => <Badge status={r.status < 400 ? 'confirmed' : 'failed'}>{r.status}</Badge> },
          ]}
        />
      </Card>
    </div>
  );
}
