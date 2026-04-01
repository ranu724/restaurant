import React, { useState, useMemo } from 'react';
import { DollarSign, Plus, FileText, PieChart, TrendingUp, Wallet, Search, Calendar, Download, X } from 'lucide-react';
import { Expense, Sale } from '../types';
import { useRestaurant } from '../context/RestaurantContext';

interface AccountingProps {
  expenses: Expense[];
  sales: Sale[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

const DEFAULT_CATEGORIES = ['Rent', 'Utilities', 'Salary', 'Inventory Purchase', 'Marketing', 'Maintenance'];

const Accounting: React.FC<AccountingProps> = ({ expenses, sales, onAddExpense }) => {
  const { restaurantName } = useRestaurant();
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('');
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [tempCategories, setTempCategories] = useState<string[]>([]); // Current session temporary categories

  const [formData, setFormData] = useState({
    category: 'Utilities',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // 🔴 Supabase থেকে আসা ডেটা থেকে ডাইনামিক ক্যাটাগরি এক্সট্রাক্ট করা (No Local Storage) 🔴
  const allCategories = useMemo(() => {
    const dbCategories = expenses.map(e => e.category);
    // ডিফল্ট ক্যাটাগরি, ডাটাবেসের ক্যাটাগরি এবং নতুন টাইপ করা ক্যাটাগরি একত্রিত করা হচ্ছে
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCategories, ...tempCategories]));
  }, [expenses, tempCategories]);

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      const cleanName = newCategoryName.trim();
      setTempCategories(prev => [...prev, cleanName]);
      setFormData({ ...formData, category: cleanName });
    }
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const filteredSales = useMemo(() => {
    if (!filterDate) return sales;
    return sales.filter(s => s.sold_at.startsWith(filterDate));
  }, [sales, filterDate]);

  const filteredExpenses = useMemo(() => {
    if (!filterDate) return expenses;
    return expenses.filter(e => e.date === filterDate);
  }, [expenses, filterDate]);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total_price), 0);
  const totalCOGS = filteredSales.reduce((sum, s) => sum + Number(s.total_cost), 0);
  
  const operatingExpenses = filteredExpenses.filter(e => e.category !== 'Inventory Purchase');
  const totalOpExpenses = operatingExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  
  const netProfit = totalRevenue - totalCOGS - totalOpExpenses;

  const handleDownloadReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Financial Report - ${restaurantName}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; }
            .date { color: #64748b; font-size: 14px; margin-top: 5px; }
            .stats-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-box { padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
            .stat-label { font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase; }
            .stat-value { font-size: 20px; font-weight: bold; margin-top: 5px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #f1f5f9; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .positive { color: #10b981; }
            .negative { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${restaurantName} - Profit & Loss Statement</h1>
            <p class="date">${filterDate ? 'For Date: ' + filterDate : 'Full History Report'} (Generated: ${new Date().toLocaleString()})</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-label">Gross Sales</div>
              <div class="stat-value">$${totalRevenue.toFixed(2)}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">COGS</div>
              <div class="stat-value">$${totalCOGS.toFixed(2)}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Expenses</div>
              <div class="stat-value">$${totalOpExpenses.toFixed(2)}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Net Profit</div>
              <div class="stat-value" style="color: ${netProfit >= 0 ? '#10b981' : '#ef4444'}">$${netProfit.toFixed(2)}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Daily Sales Log</div>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                ${filteredSales.map(s => `
                  <tr>
                    <td>${new Date(s.sold_at).toLocaleTimeString()}</td>
                    <td>${s.menu_item_name}</td>
                    <td>${s.quantity}</td>
                    <td>$${Number(s.total_price).toFixed(2)}</td>
                    <td>$${Number(s.total_cost).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Expense Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${filteredExpenses.map(e => `
                  <tr>
                    <td>${e.category}</td>
                    <td>${e.description || '-'}</td>
                    <td>${e.date}</td>
                    <td class="negative">-$${Number(e.amount).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense({
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date
    });
    setShowModal(false);
    setFormData({
      category: allCategories[0],
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
            <Wallet size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Financial P&L</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Professional profitability tracking</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="date" 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none text-sm font-bold text-slate-700 transition-all"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          
          <button 
            onClick={handleDownloadReport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest border border-slate-200"
          >
            <Download size={16} /> Report
          </button>

          <button 
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 text-white px-5 py-3 rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 font-black text-xs uppercase tracking-widest shrink-0"
          >
            <Plus size={16} /> Record Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Gross Sales" value={totalRevenue} color="text-slate-800" sub={filterDate ? `Sales for ${filterDate}` : `100% of Revenue`} />
        <SummaryCard title="COGS" value={totalCOGS} color="text-rose-500" sub={`${(totalRevenue > 0 ? (totalCOGS / totalRevenue) * 100 : 0).toFixed(1)}% Cost`} />
        <SummaryCard title="Op. Expenses" value={totalOpExpenses} color="text-amber-500" sub={`${((totalOpExpenses / (totalRevenue || 1)) * 100).toFixed(1)}% of Sales`} />
        <SummaryCard title="Net Profit" value={netProfit} color="text-emerald-500" highlight sub={`${(totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0).toFixed(1)}% Margin`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Wallet className="text-amber-500 w-5 h-5" /> Cash Flow vs Profit
                </h3>
             </div>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-600 font-black uppercase tracking-widest text-xs">Theoretical Profit Margin</span>
                  <div className="text-right">
                    <p className="font-black text-slate-800 text-xl">${(totalRevenue - totalCOGS).toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-5 border-2 border-dashed border-rose-100 rounded-2xl bg-rose-50/50">
                  <span className="text-rose-600 font-black uppercase tracking-widest text-xs">Actual Operating Cash Out</span>
                  <span className="font-black text-rose-500 text-xl">-${totalOpExpenses.toFixed(2)}</span>
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <FileText className="text-emerald-500 w-5 h-5" /> Transaction Log
              </h3>
              {filterDate && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-100">Date: {filterDate}</span>}
            </div>
            <div className="divide-y divide-slate-100">
               {filteredSales.length > 0 ? filteredSales.map(s => (
                 <div key={s.id} className="py-4 flex justify-between items-center hover:bg-slate-50 px-4 rounded-2xl transition-colors">
                   <div>
                     <p className="font-black text-slate-800 text-sm">{s.menu_item_name} <span className="text-amber-500 font-black ml-1">x{s.quantity}</span></p>
                     <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">{new Date(s.sold_at).toLocaleString()}</p>
                   </div>
                   <div className="text-right">
                     <div className="font-black text-emerald-500 text-lg">+${Number(s.total_price).toFixed(2)}</div>
                   </div>
                 </div>
               )) : (
                 <div className="text-center py-16 text-slate-400 flex flex-col items-center border-2 border-dashed border-slate-100 rounded-3xl mt-4 bg-slate-50/50">
                   <Search size={32} className="mb-3 opacity-30" />
                   <p className="font-bold uppercase tracking-widest text-xs">No transactions found</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm h-fit sticky top-24">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <PieChart className="text-rose-500 w-5 h-5" /> Expenditure Split
          </h3>
          <div className="space-y-3">
             {filteredExpenses.length > 0 ? filteredExpenses.map(e => (
               <div key={e.id} className="group flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100">
                 <div className="flex-1 min-w-0 pr-4">
                   <p className="font-black text-slate-800 text-sm truncate">{e.category}</p>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 truncate">{e.description || 'No description'}</p>
                 </div>
                 <div className="font-black text-rose-500 text-base shrink-0">-${Number(e.amount).toFixed(2)}</div>
               </div>
             )) : (
               <div className="text-center py-10 text-slate-400 flex flex-col items-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                 <p className="font-bold uppercase tracking-widest text-[10px]">No expenses recorded</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-500 rounded-xl"><Plus size={20} /></div>
              Record Expense
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category Selection / Addition */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                  {!isAddingCategory && (
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCategory(true)} 
                      className="text-[10px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-widest flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={12} /> Add Custom
                    </button>
                  )}
                </div>

                {isAddingCategory ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" autoFocus
                      placeholder="e.g. Transport..."
                      className="w-full px-5 py-3.5 border border-slate-200 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-500/20 outline-none font-bold text-sm text-slate-800 transition-all"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button type="button" onClick={handleAddNewCategory} className="bg-amber-500 text-white px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-600 transition-colors shadow-md">
                      Save
                    </button>
                    <button type="button" onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }} className="bg-slate-100 text-slate-500 px-4 rounded-2xl hover:bg-slate-200 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <select 
                    className="w-full px-5 py-3.5 border border-slate-200 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-500/20 outline-none font-bold text-slate-800 transition-all cursor-pointer"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Amount ($)</label>
                <input 
                  type="number" step="0.01" required
                  className="w-full px-5 py-3.5 border border-slate-200 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-500/20 outline-none font-black text-slate-800 transition-all"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Date</label>
                <input 
                  type="date" required
                  className="w-full px-5 py-3.5 border border-slate-200 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-500/20 outline-none font-bold text-slate-800 transition-all"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Context / Notes (Optional)</label>
                <textarea 
                  className="w-full px-5 py-3.5 border border-slate-200 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-500/20 outline-none font-bold text-sm text-slate-700 transition-all h-24 resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="What was this expense for?"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all font-black uppercase tracking-widest text-[10px]">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-4 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 font-black uppercase tracking-widest text-[10px]">
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, color, highlight, sub }: any) => (
  <div className={`p-6 rounded-[2rem] shadow-sm border ${highlight ? 'border-amber-400 bg-amber-50/50' : 'border-slate-100 bg-white'}`}>
    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">{title}</p>
    <p className={`text-3xl font-black tracking-tight ${color}`}>${Number(value).toFixed(2)}</p>
    <div className="mt-4 pt-4 border-t border-slate-100/60">
      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest bg-slate-50 inline-block px-2 py-1 rounded-md">{sub}</p>
    </div>
  </div>
);

export default Accounting;