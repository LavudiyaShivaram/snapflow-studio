import React from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Users,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

export const ReportsView: React.FC = () => {
  const { events, payments, expenses, teamMembers, activeTenant } = useTenant();

  const currencySymbol = activeTenant?.currency_symbol || '₹';

  const totalContracted = events.reduce((sum, e) => sum + e.total_package_price, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const netProfit = totalCollected - totalExpenses;
  const marginPercent = totalCollected > 0 ? Math.round((netProfit / totalCollected) * 100) : 0;

  // Breakdown by event category
  const categories = ['wedding', 'reception', 'haldi_mehendi', 'pre_wedding'];
  const categoryStats = categories.map((cat) => {
    const catEvents = events.filter((e) => e.event_type === cat);
    const catRevenue = catEvents.reduce((sum, e) => sum + e.total_package_price, 0);
    return {
      category: cat.replace('_', ' '),
      count: catEvents.length,
      revenue: catRevenue,
      percent: totalContracted > 0 ? Math.round((catRevenue / totalContracted) * 100) : 0,
    };
  });

  // Monthly Revenue projection bars (Simulated Q3/Q4)
  const monthlyData = [
    { month: 'Aug 2026', revenue: 14500, expenses: 2200 },
    { month: 'Sep 2026', revenue: 18200, expenses: 3100 },
    { month: 'Oct 2026', revenue: 24700, expenses: 4400 },
    { month: 'Nov 2026', revenue: 31200, expenses: 5800 },
    { month: 'Dec 2026', revenue: 22000, expenses: 3900 },
  ];

  const maxMonthly = Math.max(...monthlyData.map((d) => d.revenue));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            Executive Performance & Ledger Analytics · {activeTenant?.name}
          </div>
          <h1 className="text-2xl font-display font-semibold text-zinc-100 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>Studio Financial & Crew Utilization Reports</span>
          </h1>
        </div>
      </div>

      {/* Top Ledger Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 uppercase">Gross Contracted</span>
          <div className="text-2xl font-bold text-zinc-100 tabular-nums mt-1">
            {currencySymbol}{totalContracted.toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-300 font-sans mt-1 block">Lifetime studio pipeline</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 uppercase">Cash Realized</span>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums mt-1">
            {currencySymbol}{totalCollected.toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-300 font-sans mt-1 block">Deposits and settlements</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 uppercase">Operating Margin</span>
          <div className="text-2xl font-bold text-amber-400 tabular-nums mt-1">
            {marginPercent}%
          </div>
          <span className="text-[11px] text-zinc-300 font-sans mt-1 block">Net after gear & labor</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 uppercase">Avg Shoot Turnover</span>
          <div className="text-2xl font-bold text-zinc-100 tabular-nums mt-1">
            18 Days
          </div>
          <span className="text-[11px] text-zinc-300 font-sans mt-1 block">Culling to master album</span>
        </div>
      </div>

      {/* Monthly Cashflow Bar Chart */}
      <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Monthly Revenue vs. Direct Production Expenses</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Booking payments received versus equipment hire and crew payouts.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded bg-amber-400" />
              <span>Revenue</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-500">
              <span className="w-2.5 h-2.5 rounded bg-zinc-600" />
              <span>Expenses</span>
            </span>
          </div>
        </div>

        <div className="pt-6 pb-2 space-y-4">
          {monthlyData.map((d) => (
            <div key={d.month} className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-zinc-300">{d.month}</span>
                <span className="text-zinc-100 font-bold tabular-nums">
                  {currencySymbol}{d.revenue.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden flex gap-0.5 border border-zinc-800">
                <div
                  className="bg-amber-400 h-full rounded-l-full"
                  style={{ width: `${(d.revenue / maxMonthly) * 80}%` }}
                />
                <div
                  className="bg-zinc-600 h-full rounded-r-full"
                  style={{ width: `${(d.expenses / maxMonthly) * 80}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown & Crew Utilization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Contribution */}
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400">
            Booking Volume by Shoot Type
          </h3>
          <div className="space-y-3">
            {categoryStats.map((cs) => (
              <div key={cs.category} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="capitalize text-zinc-200">{cs.category}</span>
                  <span className="font-mono text-zinc-300 tabular-nums">
                    {cs.count} Shoots · {currencySymbol}{cs.revenue.toLocaleString()} ({cs.percent}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${cs.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crew Utilization */}
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400">
            Staff & Freelancer Utilization
          </h3>
          <div className="space-y-3 text-xs">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-zinc-200">{member.name}</div>
                  <div className="text-[11px] text-zinc-400 capitalize">
                    {member.role} {member.is_freelancer ? '(Freelancer)' : '(Staff)'}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-emerald-400 font-semibold">92% Availability</div>
                  <div className="text-[10px] text-zinc-300">Avg Rating: {member.rating || 5.0} ★</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
