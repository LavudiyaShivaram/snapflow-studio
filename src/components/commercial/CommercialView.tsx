import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  ArrowUpRight,
  TrendingUp,
  FileText,
  DollarSign,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Payment, Expense, Quotation } from '../../lib/types';

export const CommercialView: React.FC = () => {
  const {
    packages,
    quotations,
    payments,
    expenses,
    events,
    clients,
    recordPayment,
    recordExpense,
    activeTenant,
  } = useTenant();

  const [activeTab, setActiveTab] = useState<'quotes' | 'payments' | 'expenses' | 'profitability'>('payments');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Payment Form state
  const [payEventId, setPayEventId] = useState<string>(events[0]?.id || '');
  const [payAmount, setPayAmount] = useState<number>(3000);
  const [payMethod, setPayMethod] = useState<Payment['payment_method']>('bank_transfer');
  const [payStage, setPayStage] = useState<Payment['payment_stage']>('mid_payment');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Expense Form state
  const [expEventId, setExpEventId] = useState<string>(events[0]?.id || '');
  const [expCategory, setExpCategory] = useState<Expense['category']>('gear_rental');
  const [expAmount, setExpAmount] = useState<number>(450);
  const [expRecipient, setExpRecipient] = useState('');
  const [expNotes, setExpNotes] = useState('');

  const currencySymbol = activeTenant?.currency_symbol || '₹';

  // Financial aggregates
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const netProfit = totalCollected - totalExpenses;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const event = events.find((ev) => ev.id === payEventId);
    if (!event) return;

    await recordPayment({
      event_id: payEventId,
      client_id: event.client_id,
      amount: Number(payAmount),
      payment_method: payMethod,
      payment_stage: payStage,
      reference_number: payRef || `PAY-${Date.now().toString().slice(-6)}`,
      paid_on: new Date().toISOString().split('T')[0],
      notes: payNotes,
    });

    setShowPaymentModal(false);
    setPayRef('');
    setPayNotes('');
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expRecipient || !expAmount) return;

    await recordExpense({
      event_id: expEventId || null,
      category: expCategory,
      amount: Number(expAmount),
      recipient_name: expRecipient,
      incurred_on: new Date().toISOString().split('T')[0],
      notes: expNotes,
    });

    setShowExpenseModal(false);
    setExpRecipient('');
    setExpNotes('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            Commercial & Financial Ledger · {activeTenant?.name}
          </div>
          <h1 className="text-2xl font-display font-semibold text-zinc-100 flex items-center gap-3">
            <Receipt className="w-6 h-6 text-amber-400" />
            <span>Commercial, Quotes & Profit Ledger</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5 text-red-400" />
            <span>Log Expense</span>
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Client Payment</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-mono text-zinc-400 uppercase">Total Collected</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {currencySymbol}{totalCollected.toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-300 mt-1 block">From verified client milestone receipts</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-mono text-zinc-400 uppercase">Operational Expenses</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-400 mt-1">
            {currencySymbol}{totalExpenses.toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-300 mt-1 block">Gear hires, permits & crew payouts</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <span className="text-[11px] font-mono text-zinc-400 uppercase">Gross Operating Margin</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
            {currencySymbol}{netProfit.toLocaleString()}
          </div>
          <span className="text-[11px] text-zinc-300 mt-1 block">
            {totalCollected > 0 ? Math.round((netProfit / totalCollected) * 100) : 0}% net studio margin
          </span>
        </div>
      </div>

      {/* Segmented Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-850 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'payments' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Client Payment Receipts ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('quotes')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'quotes' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Packages & Quotations ({packages.length + quotations.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'expenses' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Expense Book ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('profitability')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'profitability' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Shoot-Level Profitability
        </button>
      </div>

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Date & Ref</th>
                  <th className="py-3 px-4">Event Booking</th>
                  <th className="py-3 px-4">Milestone Stage</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {payments.map((p) => {
                  const evt = events.find((e) => e.id === p.event_id);
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-zinc-200">{p.paid_on}</div>
                        <div className="text-[10px] text-zinc-400">{p.reference_number}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-zinc-200">{evt?.title || 'Studio Booking'}</div>
                        <div className="text-[11px] text-zinc-400">{p.notes}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-zinc-300">
                        {p.payment_stage.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400 uppercase">
                        {p.payment_method.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm tabular-nums">
                        +{currencySymbol}{p.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quotes & Packages Tab */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">
          {/* Packages Catalog */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-3">
              Standardized Studio Packages
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-zinc-100 text-sm">{pkg.name}</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{pkg.description}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xl font-bold text-amber-400 tabular-nums">
                          {currencySymbol}{pkg.base_price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {pkg.items && (
                      <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-1.5 text-xs text-zinc-300">
                        {pkg.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between">
                            <span className="text-zinc-300">· {it.item_title}</span>
                            <span className="font-mono text-zinc-400 tabular-nums">
                              {currencySymbol}{it.unit_price.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quotations List */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-3">
              Issued Client Quotations
            </h3>
            <div className="space-y-3">
              {quotations.map((q) => {
                const client = clients.find((c) => c.id === q.client_id);
                return (
                  <div key={q.id} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">{q.quotation_number}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {q.status}
                        </span>
                      </div>
                      <div className="text-zinc-400 mt-1">
                        Client: {client?.first_name} {client?.last_name} · Valid until: {q.valid_until}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-zinc-100 tabular-nums">
                        {currencySymbol}{q.total_amount.toLocaleString()}
                      </div>
                      <button
                        onClick={() => setSelectedQuotation(q)}
                        className="text-[11px] text-amber-400 hover:underline mt-0.5 inline-block"
                      >
                        Print-Friendly View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Recipient / Vendor</th>
                  <th className="py-3 px-4">Expense Category</th>
                  <th className="py-3 px-4">Event Link</th>
                  <th className="py-3 px-4 text-right">Amount Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {expenses.map((ex) => {
                  const evt = events.find((e) => e.id === ex.event_id);
                  return (
                    <tr key={ex.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-zinc-300">{ex.incurred_on}</td>
                      <td className="py-3.5 px-4 font-medium text-zinc-200">{ex.recipient_name}</td>
                      <td className="py-3.5 px-4 capitalize text-zinc-400">
                        {ex.category.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">{evt?.title || 'General Studio Overhead'}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-red-400 text-sm tabular-nums">
                        -{currencySymbol}{ex.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shoot Profitability Tab */}
      {activeTab === 'profitability' && (
        <div className="space-y-4">
          {events.map((evt) => {
            const shootExpenses = expenses.filter((ex) => ex.event_id === evt.id);
            const shootExpensesTotal = shootExpenses.reduce((sum, ex) => sum + ex.amount, 0);
            const shootProfit = evt.total_paid - shootExpensesTotal;
            const margin = evt.total_paid > 0 ? Math.round((shootProfit / evt.total_paid) * 100) : 0;

            return (
              <div key={evt.id} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                  <div>
                    <div className="font-semibold text-zinc-100 text-sm">{evt.title}</div>
                    <div className="text-zinc-400 text-[11px] mt-0.5">{evt.primary_venue_name}</div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-zinc-400 uppercase">Gross Margin</span>
                    <div className="text-amber-400 font-bold text-base">{margin}%</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 font-mono text-xs">
                  <div>
                    <span className="text-zinc-400 text-[10px] block">COLLECTED REVENUE</span>
                    <span className="text-emerald-400 font-semibold tabular-nums">
                      {currencySymbol}{evt.total_paid.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] block">ALLOCATED COSTS</span>
                    <span className="text-red-400 font-semibold tabular-nums">
                      {currencySymbol}{shootExpensesTotal.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] block">NET SHOOT PROFIT</span>
                    <span className="text-zinc-100 font-semibold tabular-nums">
                      {currencySymbol}{shootProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100">Record Client Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Select Event Booking *</label>
                <select
                  value={payEventId}
                  onChange={(e) => setPayEventId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} (Balance: {currencySymbol}{e.outstanding_balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Milestone Stage</label>
                  <select
                    value={payStage}
                    onChange={(e) => setPayStage(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="advance">Date Retainer Advance</option>
                    <option value="mid_payment">Mid-Schedule Payment</option>
                    <option value="shoot_day">Shoot Day Settlement</option>
                    <option value="album_delivery">Album Delivery</option>
                    <option value="final_settlement">Final Settlement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="bank_transfer">Direct Bank Wire / ACH</option>
                  <option value="credit_card">Credit Card via Portal</option>
                  <option value="stripe">Stripe Online</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash Settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reference / Transaction Number</label>
                <input
                  type="text"
                  placeholder="e.g. WIRE-2026-9021"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100">Log Studio Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Recipient / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adorama Rental, Drone Pilot"
                  value={expRecipient}
                  onChange={(e) => setExpRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Expense Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="freelancer_payout">Freelancer Payout</option>
                    <option value="gear_rental">Camera / Lens Gear Rental</option>
                    <option value="travel_lodging">Travel & Transport</option>
                    <option value="props_location">Location Permits</option>
                    <option value="software_license">Editing Software & Storage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Link to Event (Optional)</label>
                <select
                  value={expEventId}
                  onChange={(e) => setExpEventId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="">General Studio Overhead (No shoot link)</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-zinc-950 font-semibold"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print-Friendly Quotation Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400">Formal Estimate Document</span>
                <h3 className="text-lg font-semibold text-zinc-100">{selectedQuotation.quotation_number}</h3>
              </div>
              <button onClick={() => setSelectedQuotation(null)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-4">
              <div className="flex justify-between border-b border-zinc-800 pb-3">
                <div>
                  <div className="font-semibold text-zinc-100 text-sm">{activeTenant?.name}</div>
                  <div className="text-zinc-400 text-[11px]">{activeTenant?.address}, {activeTenant?.city}</div>
                </div>
                <div className="text-right font-mono text-zinc-400">
                  <div>Valid: {selectedQuotation.valid_until}</div>
                  <div className="text-emerald-400 uppercase font-semibold">{selectedQuotation.status}</div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-zinc-300 uppercase font-mono text-[10px]">Service Items</span>
                {selectedQuotation.items?.map((it) => (
                  <div key={it.id} className="flex justify-between py-1 border-b border-zinc-900">
                    <span className="text-zinc-200">{it.service_name} (x{it.quantity})</span>
                    <span className="font-mono text-zinc-300">{currencySymbol}{it.total_price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-right font-mono space-y-1">
                <div className="text-zinc-400">Subtotal: {currencySymbol}{selectedQuotation.subtotal.toLocaleString()}</div>
                <div className="text-emerald-400">Discount: -{currencySymbol}{selectedQuotation.discount_amount.toLocaleString()}</div>
                <div className="text-zinc-400">Tax: +{currencySymbol}{selectedQuotation.tax_amount.toLocaleString()}</div>
                <div className="text-base font-bold text-amber-400 pt-1 border-t border-zinc-800">
                  Total: {currencySymbol}{selectedQuotation.total_amount.toLocaleString()}
                </div>
              </div>

              {selectedQuotation.terms_conditions && (
                <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 leading-relaxed">
                  <span className="font-semibold text-zinc-300 block mb-0.5">Payment Terms & Milestones:</span>
                  {selectedQuotation.terms_conditions}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedQuotation(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
