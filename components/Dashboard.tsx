import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, Package, AlertTriangle, 
  Wallet, CheckCircle2, Clock, CreditCard, QrCode, X 
} from 'lucide-react';
import { Ingredient, Sale, Expense } from '../types';
import { useRestaurant } from '../context/RestaurantContext';

interface DashboardProps {
  ingredients: Ingredient[];
  sales: Sale[];
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({ ingredients, sales, expenses }) => {
  // Context থেকে ডেটা নেওয়া হচ্ছে (branches যুক্ত করা হয়েছে)
  const { selectedBranchId, payments, addPayment, branches } = useRestaurant();
  
  // পেমেন্ট মডালের স্টেট
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const bKashNumber = "01633334466";

  // 🔴 ১. স্টোর/ব্রাঞ্চ থেকে আসল মান্থলি ফি এবং শুরুর মাস বের করা 🔴
  const currentBranch = useMemo(() => 
    branches.find(b => b.id === selectedBranchId)
  , [branches, selectedBranchId]);

  const monthlyFee = currentBranch?.monthlyFee || 0;

  // 🔴 ২. বকেয়া (Due) মাসগুলো বের করার ডায়নামিক লজিক 🔴
  const billingStatus = useMemo(() => {
    if (!currentBranch || selectedBranchId === 'all') return null;

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startMonthStr = currentBranch.billingStartMonth || currentMonthStr;

    // শুরু থেকে বর্তমান মাস পর্যন্ত সবগুলো মাসের লিস্ট তৈরি
    const getMonthsBetween = (start: string, end: string) => {
      const months = [];
      let currentDate = new Date(start + "-01");
      const endDate = new Date(end + "-01");
      while (currentDate <= endDate) {
        months.push(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      return months;
    };

    const allMonths = getMonthsBetween(startMonthStr, currentMonthStr);
    const dueMonths: string[] = [];
    const pendingMonths: string[] = [];

    allMonths.forEach(month => {
      const payment = payments?.find(p => p.branch_id === selectedBranchId && p.monthYear === month);
      // যদি পেমেন্ট না থাকে অথবা রিজেক্টেড হয়, তবে সেটি Due
      if (!payment || payment.status === 'REJECTED') {
        dueMonths.push(month);
      } else if (payment.status === 'PENDING') {
        pendingMonths.push(month);
      }
    });

    return {
      dueMonths,
      pendingMonths,
      totalDueAmount: dueMonths.length * monthlyFee,
      oldestDueMonth: dueMonths.length > 0 ? dueMonths[0] : null, // সবচেয়ে পুরনো বকেয়া মাস
      status: dueMonths.length > 0 ? 'DUE' : (pendingMonths.length > 0 ? 'PENDING' : 'PAID')
    };
  }, [currentBranch, payments, selectedBranchId, monthlyFee]);

  // পেমেন্ট সাবমিট করার ফাংশন
  const submitPaymentTrx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim() || !billingStatus?.oldestDueMonth) return;
    
    setIsSubmitting(true);
    
    // ফেক ডিলে (Processing বোঝানোর জন্য)
    setTimeout(() => {
      addPayment({
        branch_id: selectedBranchId,
        monthYear: billingStatus.oldestDueMonth, // 🔴 সবসময় সবচেয়ে পুরনো বকেয়া মাস আগে পরিশোধ হবে
        amountPaid: monthlyFee, // এক মাসের বিল পে হচ্ছে
        paymentDate: new Date().toISOString(),
        status: 'PENDING',
        trxId: trxId.trim()
      });
      
      setIsPaymentModalOpen(false);
      setTrxId('');
      setIsSubmitting(false);
      
      const monthName = new Date(billingStatus.oldestDueMonth + "-01").toLocaleString('default', { month: 'long', year: 'numeric' });
      alert(`Payment submitted for ${monthName}! It is now under review.`);
    }, 1000);
  };

  // ড্যাশবোর্ডের বেসিক স্ট্যাটাস ক্যালকুলেশন
  const lowStock = ingredients.filter(i => i.stock_quantity <= i.reorder_level);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_price), 0);
  const totalCOGS = sales.reduce((sum, s) => sum + Number(s.total_cost), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalCOGS - totalExpenses;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 🔴 Billing System / Subscription Banner 🔴 */}
      {selectedBranchId !== 'all' && billingStatus && (
        <div className={`p-6 rounded-[2rem] border-2 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500 ${
          billingStatus.status === 'PAID' ? 'bg-emerald-50 border-emerald-200' : 
          billingStatus.status === 'PENDING' ? 'bg-amber-50 border-amber-200' : 
          'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${
              billingStatus.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 
              billingStatus.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 
              'bg-rose-100 text-rose-600'
            }`}>
              {billingStatus.status === 'PAID' ? <CheckCircle2 className="w-8 h-8" /> : 
               billingStatus.status === 'PENDING' ? <Clock className="w-8 h-8" /> : 
               <AlertTriangle className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Software Subscription</h2>
              <p className={`text-xs font-bold mt-1 uppercase tracking-widest ${
                billingStatus.status === 'PAID' ? 'text-emerald-600' : 
                billingStatus.status === 'PENDING' ? 'text-amber-600' : 
                'text-rose-600'
              }`}>
                {billingStatus.status === 'PAID' ? `ALL BILLS CLEARED` : 
                 billingStatus.status === 'PENDING' ? `${billingStatus.pendingMonths.length} MONTH(S) PENDING APPROVAL` : 
                 `${billingStatus.dueMonths.length} MONTH(S) DUE (Total: $${billingStatus.totalDueAmount})`}
              </p>
            </div>
          </div>

          {billingStatus.status === 'DUE' ? (
            <button 
              onClick={() => setIsPaymentModalOpen(true)} 
              className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-200 transition-all flex items-center gap-2 shrink-0"
            >
              <CreditCard className="w-5 h-5" /> Pay 1 Month (${monthlyFee})
            </button>
          ) : (
            <div className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border flex items-center gap-2 ${
              billingStatus.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
              'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
               {billingStatus.status === 'PAID' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
               {billingStatus.status === 'PAID' ? 'All Cleared' : 'In Review'}
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={totalRevenue} icon={<DollarSign size={24}/>} color="bg-amber-100 text-amber-600" />
        <StatCard title="Total COGS" value={totalCOGS} icon={<Package size={24}/>} color="bg-slate-100 text-slate-600" />
        <StatCard title="Total Expenses" value={totalExpenses} icon={<Wallet size={24}/>} color="bg-rose-100 text-rose-600" />
        <StatCard title="Net Profit" value={netProfit} icon={<TrendingUp size={24}/>} color="bg-emerald-100 text-emerald-600" />
      </div>

      {/* Inventory Alerts */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
          <AlertTriangle className="text-rose-500" size={20} />
          Low Stock Alerts
        </h3>
        <div className="space-y-3">
          {lowStock.length > 0 ? (
            lowStock.map(ing => (
              <div key={ing.id} className="flex justify-between items-center p-4 bg-rose-50 rounded-xl border border-rose-100">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{ing.name}</p>
                  <p className="text-xs text-rose-600 font-medium mt-1">Min required: {ing.reorder_level} {ing.unit}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-rose-600 text-lg">{ing.stock_quantity} {ing.unit}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="font-bold text-sm uppercase tracking-widest">All stock levels healthy ✨</p>
            </div>
          )}
        </div>
      </div>

      {/* 🔴 bKash Payment Modal 🔴 */}
      {isPaymentModalOpen && billingStatus?.oldestDueMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
             <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
               <CreditCard className="w-6 h-6 text-pink-500" /> bKash Payment
             </h2>
             
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center mb-6">
                <QrCode className="w-16 h-16 text-pink-500 mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Send Money to bKash</p>
                <p className="text-3xl font-black text-slate-800 tracking-widest">{bKashNumber}</p>
                <div className="mt-4 inline-block bg-pink-50 text-pink-600 px-4 py-3 rounded-xl border border-pink-100">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">
                    Paying For: {new Date(billingStatus.oldestDueMonth + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xl font-black">${monthlyFee}</p>
                </div>
             </div>

             <form onSubmit={submitPaymentTrx} className="space-y-4">
                <input 
                  type="text" required 
                  value={trxId} onChange={(e) => setTrxId(e.target.value.toUpperCase())} 
                  placeholder="Enter TrxID after payment" 
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none text-slate-700 font-bold uppercase tracking-widest focus:ring-2 focus:ring-pink-500 text-center" 
                />
                <button 
                  type="submit" disabled={isSubmitting} 
                  className="w-full bg-pink-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-pink-200 disabled:opacity-50 hover:bg-pink-600 transition-colors"
                >
                  {isSubmitting ? 'Verifying...' : 'Submit Transaction'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

// StatCard Component
const StatCard = ({ title, value, icon, color }: any) => (
  <div className="p-6 rounded-2xl shadow-sm border border-slate-100 bg-white">
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
    </div>
    <p className="text-3xl font-black text-slate-800">${Number(value).toFixed(2)}</p>
  </div>
);

export default Dashboard;