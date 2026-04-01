import React, { useState, useMemo } from 'react';
import { Landmark, ArrowRightLeft, Wallet, CreditCard, Send, Plus } from 'lucide-react';
import { Sale, Expense, PaymentMethod, FundTransfer } from '../types';

interface FundManagementProps {
  sales: Sale[];
  expenses: Expense[];
  transfers: FundTransfer[]; // Context থেকে আসবে
  onAddTransfer: (transfer: Omit<FundTransfer, 'id'>) => void;
}

const accounts = ['Cash', 'Bank', 'bKash', 'Nagad', 'Card'];

const FundManagement: React.FC<FundManagementProps> = ({ sales, expenses, transfers, onAddTransfer }) => {
  const [showModal, setShowModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_account: 'Cash',
    to_account: 'Bank',
    amount: '',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });

  // ব্যালেন্স ক্যালকুলেশন
  const balances = useMemo(() => {
    let calcBalances: Record<string, number> = { 'Cash': 0, 'Bank': 0, 'bKash': 0, 'Nagad': 0, 'Card': 0 };

    // সেলস থেকে আয় যোগ করা
    sales.forEach(sale => {
      const method = sale.payment_method || 'Cash';
      if (calcBalances[method] !== undefined) {
        calcBalances[method] += Number(sale.total_price);
      }
    });

    // খরচ বাদ দেওয়া (ধরে নিচ্ছি খরচ ক্যাশ থেকে হয়, অথবা আপনি খরচেও পেমেন্ট মেথড যোগ করতে পারেন)
    expenses.forEach(expense => {
      calcBalances['Cash'] -= Number(expense.amount);
    });

    // ইন্টারনাল ট্রান্সফার ক্যালকুলেট করা (যেমন Cash -> Bank)
    transfers.forEach(t => {
      if (calcBalances[t.from_account] !== undefined) calcBalances[t.from_account] -= Number(t.amount);
      if (calcBalances[t.to_account] !== undefined) calcBalances[t.to_account] += Number(t.amount);
    });

    return calcBalances;
  }, [sales, expenses, transfers]);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.from_account === transferForm.to_account) {
      alert("From and To accounts cannot be the same.");
      return;
    }
    onAddTransfer({
      ...transferForm,
      amount: parseFloat(transferForm.amount),
    });
    setShowModal(false);
    setTransferForm({ ...transferForm, amount: '', reference: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fund Management</h2>
          <p className="text-sm text-slate-500">Track balances across Cash, Bank, and Mobile Banking</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg font-bold"
        >
          <ArrowRightLeft size={18} />
          <span>Transfer Funds</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {accounts.map(acc => (
          <div key={acc} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className={`p-3 rounded-full mb-3 ${acc === 'Bank' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {acc === 'Bank' ? <Landmark size={24} /> : <Wallet size={24} />}
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{acc}</p>
            <p className={`text-2xl font-black mt-1 ${balances[acc] < 0 ? 'text-rose-500' : 'text-slate-800'}`}>
              ${balances[acc].toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Transfer History</h3>
        <div className="space-y-3">
          {transfers.length > 0 ? transfers.map((t, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                  <ArrowRightLeft size={16} className="text-slate-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    <span className="text-rose-500">{t.from_account}</span> 
                    <span className="text-slate-400 mx-2">→</span> 
                    <span className="text-emerald-500">{t.to_account}</span>
                  </p>
                  <p className="text-xs text-slate-500">{t.date} • Ref: {t.reference || 'N/A'}</p>
                </div>
              </div>
              <div className="text-lg font-black text-slate-800">
                ${Number(t.amount).toFixed(2)}
              </div>
            </div>
          )) : (
            <p className="text-center py-6 text-slate-400 italic">No transfers recorded yet.</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Transfer Funds</h3>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">From</label>
                  <select className="w-full px-4 py-3 border rounded-xl" value={transferForm.from_account} onChange={e => setTransferForm({...transferForm, from_account: e.target.value})}>
                    {accounts.map(acc => <option key={acc}>{acc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">To</label>
                  <select className="w-full px-4 py-3 border rounded-xl" value={transferForm.to_account} onChange={e => setTransferForm({...transferForm, to_account: e.target.value})}>
                    {accounts.map(acc => <option key={acc}>{acc}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Amount ($)</label>
                <input required type="number" step="0.01" className="w-full px-4 py-3 border rounded-xl" value={transferForm.amount} onChange={e => setTransferForm({...transferForm, amount: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Reference / Note</label>
                <input className="w-full px-4 py-3 border rounded-xl" value={transferForm.reference} onChange={e => setTransferForm({...transferForm, reference: e.target.value})} placeholder="e.g. Bank Deposit" />
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200">Confirm Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundManagement;