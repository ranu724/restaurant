import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { PaymentMethod } from '../types';
import { Building2 as Store, ArrowRightLeft, Landmark, History, ArrowUpRight } from 'lucide-react';
import Swal from 'sweetalert2'; // 🔴 SweetAlert2 ইমপোর্ট করা হলো

const FundManagement: React.FC = () => {
  const { sales, expenses, transfers, selectedBranchId, addTransfer } = useRestaurant();

  const [transactionType, setTransactionType] = useState<'TRANSFER' | 'CASHOUT'>('TRANSFER');

  const [transferData, setTransferData] = useState({
    amount: '',
    from_method: PaymentMethod.CASH as string,
    to_method: PaymentMethod.BANK as string,
    reference: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Filter data by selected branch
  const currentBranchSales = useMemo(() => 
    selectedBranchId === 'all' ? sales : sales.filter(s => s.branch_id === selectedBranchId),
  [sales, selectedBranchId]);

  const currentBranchExpenses = useMemo(() => 
    selectedBranchId === 'all' ? expenses : expenses.filter(e => e.branch_id === selectedBranchId),
  [expenses, selectedBranchId]);

  const currentBranchTransfers = useMemo(() => 
    selectedBranchId === 'all' ? transfers : transfers.filter(t => t.branch_id === selectedBranchId),
  [transfers, selectedBranchId]);

  // Calculate specific method balance
  const calculateBalance = (method: string) => {
    const methodSales = currentBranchSales.filter(s => s.payment_method === method).reduce((sum, s) => sum + Number(s.total_price), 0);
    const methodExpenses = currentBranchExpenses.filter(e => e.payment_method === method).reduce((sum, e) => sum + Number(e.amount), 0);
    
    const transfersIn = currentBranchTransfers.filter(t => t.to_method === method).reduce((sum, t) => sum + Number(t.amount), 0);
    const transfersOut = currentBranchTransfers.filter(t => t.from_method === method).reduce((sum, t) => sum + Number(t.amount), 0);

    return methodSales + transfersIn - methodExpenses - transfersOut;
  };

  const balances = {
    cash: calculateBalance(PaymentMethod.CASH),
    card: calculateBalance(PaymentMethod.CARD),
    bkash: calculateBalance(PaymentMethod.BKASH),
    nagad: calculateBalance(PaymentMethod.NAGAD),
    bank: calculateBalance(PaymentMethod.BANK)
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const customPopupClass = { popup: 'rounded-[2rem]' };

    if (selectedBranchId === 'all') {
      return Swal.fire({
        icon: 'warning',
        title: 'Global Mode Restricted',
        text: 'Please select a specific branch to perform a transaction.',
        confirmButtonColor: '#f59e0b',
        customClass: customPopupClass
      });
    }
    
    if (transactionType === 'TRANSFER' && transferData.from_method === transferData.to_method) {
      return Swal.fire({
        icon: 'warning',
        title: 'Invalid Transfer',
        text: 'Cannot transfer to the same account.',
        confirmButtonColor: '#f59e0b',
        customClass: customPopupClass
      });
    }

    const amount = Number(transferData.amount);
    if (amount <= 0) {
      return Swal.fire({
        icon: 'error',
        title: 'Invalid Amount',
        text: 'Please enter a valid amount greater than 0.',
        confirmButtonColor: '#f59e0b',
        customClass: customPopupClass
      });
    }

    const currentBalance = calculateBalance(transferData.from_method);
    if (amount > currentBalance) {
      return Swal.fire({
        icon: 'error',
        title: 'Insufficient Funds',
        text: `Not enough balance in ${transferData.from_method}. Current balance is $${currentBalance.toFixed(2)}`,
        confirmButtonColor: '#f59e0b',
        customClass: customPopupClass
      });
    }

    // 🔴 প্রফেশনাল SweetAlert2 কনফার্মেশন পপ-আপ 🔴
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: transactionType === 'CASHOUT' 
        ? `Do you want to withdraw $${amount} from ${transferData.from_method}?`
        : `Transfer $${amount} from ${transferData.from_method} to ${transferData.to_method}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: transactionType === 'CASHOUT' ? '#f43f5e' : '#f59e0b', // রোজ বা অ্যাম্বার কালার
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Confirm!',
      cancelButtonText: 'Cancel',
      customClass: customPopupClass
    });

    if (!result.isConfirmed) return;

    setIsProcessing(true);
    try {
      await addTransfer({
        date: new Date().toISOString(),
        amount: amount,
        from_method: transferData.from_method,
        to_method: transactionType === 'CASHOUT' ? 'Cash Out' : transferData.to_method,
        reference: transferData.reference || (transactionType === 'CASHOUT' ? 'Owner Withdrawal' : 'Internal Transfer'),
        branch_id: selectedBranchId
      });

      setTransferData({
        amount: '',
        from_method: PaymentMethod.CASH,
        to_method: PaymentMethod.BANK,
        reference: ''
      });
      
      // 🔴 সাকসেস অ্যানিমেশন
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: transactionType === 'CASHOUT' ? "Cash Out successful!" : "Transfer completed successfully!",
        timer: 2000,
        showConfirmButton: false,
        customClass: customPopupClass
      });

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Transaction Failed',
        text: 'Something went wrong. Please try again.',
        confirmButtonColor: '#f59e0b',
        customClass: customPopupClass
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedBranchId === 'all') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-white rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Store className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-2">Global Mode Restricted</h2>
        <p className="text-slate-500 font-bold text-sm tracking-wide">Please select a specific branch from the top menu to manage funds.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <Landmark className="w-8 h-8 text-amber-500" />
        <div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight">Fund Management</h1>
           <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-1">Track & Transfer Balances</p>
        </div>
      </div>

      {/* BALANCE CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Cash In Drawer', amount: balances.cash, color: 'emerald' },
          { label: 'Bank Balance', amount: balances.bank, color: 'blue' },
          { label: 'Card / POS', amount: balances.card, color: 'indigo' },
          { label: 'bKash', amount: balances.bkash, color: 'pink' },
          { label: 'Nagad', amount: balances.nagad, color: 'orange' },
        ].map((item, index) => (
          <div key={index} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
            <p className={`text-[10px] font-black text-${item.color}-500 uppercase tracking-widest mb-2`}>{item.label}</p>
            <p className="text-2xl font-black text-slate-800">${item.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ACTION AREA (Transfer / Cash Out) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-500"><ArrowRightLeft size={20} /></div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Action</h2>
          </div>

          <div className="flex p-1 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
            <button
              type="button"
              onClick={() => setTransactionType('TRANSFER')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                transactionType === 'TRANSFER' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('CASHOUT')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                transactionType === 'CASHOUT' ? 'bg-white text-rose-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Cash Out
            </button>
          </div>

          <form onSubmit={handleTransfer} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Withdraw From</label>
              <select 
                required
                value={transferData.from_method}
                onChange={e => setTransferData({...transferData, from_method: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 font-bold focus:ring-2 focus:ring-amber-500/20 appearance-none"
              >
                {Object.values(PaymentMethod).filter(m => m !== PaymentMethod.OTHER).map(m => (
                  <option key={m} value={m}>{m} (${calculateBalance(m).toFixed(2)})</option>
                ))}
              </select>
            </div>

            {transactionType === 'TRANSFER' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Transfer To</label>
                <select 
                  required
                  value={transferData.to_method}
                  onChange={e => setTransferData({...transferData, to_method: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 font-bold focus:ring-2 focus:ring-amber-500/20 appearance-none"
                >
                  {Object.values(PaymentMethod).filter(m => m !== PaymentMethod.OTHER).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Amount ($)</label>
              <input 
                type="number" 
                min="0.01" 
                step="0.01"
                required
                value={transferData.amount}
                onChange={e => setTransferData({...transferData, amount: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-amber-600 font-black focus:ring-2 focus:ring-amber-500/20 text-xl"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                {transactionType === 'CASHOUT' ? 'Reason / Note' : 'Reference / Note'}
              </label>
              <input 
                type="text" 
                value={transferData.reference}
                onChange={e => setTransferData({...transferData, reference: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 font-bold focus:ring-2 focus:ring-amber-500/20"
                placeholder={transactionType === 'CASHOUT' ? 'e.g. Owner profit withdrawal' : 'e.g. Daily bank deposit'}
              />
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
                transactionType === 'CASHOUT' 
                  ? 'bg-rose-500 text-white shadow-rose-200 hover:bg-rose-600' 
                  : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
              } disabled:opacity-50`}
            >
              {isProcessing ? 'Processing...' : (transactionType === 'CASHOUT' ? <><ArrowUpRight size={16} /> Confirm Cash Out</> : 'Confirm Transfer')}
            </button>
          </form>
        </div>

        {/* TRANSACTION HISTORY */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[calc(100vh-14rem)]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 shrink-0">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-500"><History size={20} /></div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Transaction History</h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {currentBranchTransfers.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50 space-y-4">
                  <History size={48} />
                  <p className="font-bold text-sm uppercase tracking-widest">No transactions found</p>
               </div>
            ) : (
              <div className="space-y-3">
                {currentBranchTransfers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(transfer => (
                  <div key={transfer.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-4">
                      {transfer.to_method === 'Cash Out' ? (
                        <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-500 shrink-0"><ArrowUpRight size={20} /></div>
                      ) : (
                        <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 shrink-0"><ArrowRightLeft size={20} /></div>
                      )}
                      
                      <div>
                        <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                          {transfer.to_method === 'Cash Out' ? (
                             <span className="text-rose-600 font-black uppercase tracking-widest text-[10px] bg-rose-50 px-2 py-1 rounded-md">CASH OUT</span>
                          ) : (
                             <>
                               {transfer.from_method} <ArrowRightLeft className="w-3 h-3 text-slate-300" /> {transfer.to_method}
                             </>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-1">{new Date(transfer.date).toLocaleString()}</p>
                        {transfer.reference && <p className="text-xs text-slate-500 mt-1 italic">"{transfer.reference}"</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${transfer.to_method === 'Cash Out' ? 'text-rose-500' : 'text-amber-500'}`}>${transfer.amount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundManagement;