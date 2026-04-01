import React, { useState } from 'react';
import { Trash2, Search, AlertCircle, CheckCircle2, History, RotateCcw } from 'lucide-react';
import { Ingredient } from '../types';
import { useRestaurant } from '../context/RestaurantContext';

const Wastage: React.FC = () => {
  const { ingredients, expenses, currentAdminName, selectedBranchId, updateIngredient, addExpense } = useRestaurant();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [wasteQuantity, setWasteQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // শুধু বর্তমান ব্রাঞ্চের ইনগ্রেডিয়েন্টস দেখাবে
  const searchResults = ingredients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const wastageHistory = expenses
    .filter(e => e.category === 'Wastage')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || !wasteQuantity || wasteQuantity <= 0) return;

    if (wasteQuantity > selectedIngredient.stock_quantity) {
      alert("Error: Wastage quantity cannot be greater than current stock!");
      return;
    }

    const totalLoss = Number(wasteQuantity) * selectedIngredient.unit_cost;

    // ১. স্টক কমানো
    updateIngredient(selectedIngredient.id, {
      stock_quantity: selectedIngredient.stock_quantity - Number(wasteQuantity)
    });

    // ২. খরচের খাতায় Wastage যোগ করা
    addExpense({
      category: 'Wastage',
      amount: totalLoss,
      description: `Wastage: ${selectedIngredient.name} (${wasteQuantity}${selectedIngredient.unit} due to: ${reason || 'Damaged'}) by ${currentAdminName}`,
      date: new Date().toISOString().split('T')[0]
    });

    setSuccessMsg(`Successfully logged ${wasteQuantity}${selectedIngredient.unit} of ${selectedIngredient.name} as wastage.`);
    setSelectedIngredient(null);
    setWasteQuantity('');
    setSearchTerm('');
    setReason('');
    
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (selectedBranchId === 'all') {
    return (
      <div className="flex flex-col items-center justify-center h-64 opacity-50">
        <AlertCircle size={48} className="mb-4 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-700">Please select a specific branch from the header to log wastage.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-rose-100 rounded-2xl text-rose-600">
          <Trash2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Log Wastage</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Deduct damaged ingredients and view wastage history.</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <p className="text-sm font-bold">{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Search */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">1. Select Material</h2>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ingredient..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
            {searchTerm && searchResults.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedIngredient(p)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${selectedIngredient?.id === p.id ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-100 hover:border-slate-300'}`}
              >
                <div>
                  <p className="font-bold text-sm">{p.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black">Stock: {p.stock_quantity} {p.unit}</p>
                  <p className="text-[10px] text-slate-500">Cost: ${p.unit_cost.toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">2. Wastage Details</h2>
          {!selectedIngredient ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl opacity-70">
              <AlertCircle className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-widest">Select an ingredient</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Target Material</p>
                  <p className="text-sm font-black text-slate-800">{selectedIngredient.name}</p>
                </div>
                <button type="button" onClick={() => setSelectedIngredient(null)} className="p-2 text-slate-400 hover:text-slate-700"><RotateCcw className="w-4 h-4" /></button>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Wasted Quantity ({selectedIngredient.unit})</label>
                <input 
                  type="number" required min="0.01" step="0.01" max={selectedIngredient.stock_quantity}
                  value={wasteQuantity} onChange={(e) => setWasteQuantity(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl font-black focus:ring-2 focus:ring-rose-500 outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Reason (Optional)</label>
                <input 
                  type="text" placeholder="e.g., Expired, Spilled"
                  value={reason} onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 outline-none mt-1"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Loss Value</p>
                  <p className="text-xl font-black text-rose-500">${(Number(wasteQuantity) * selectedIngredient.unit_cost || 0).toFixed(2)}</p>
                </div>
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200 transition-all uppercase text-xs tracking-widest"
                >
                  Confirm Loss
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Wastage History */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <History className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Wastage History</h2>
        </div>
        <div className="space-y-3">
          {wastageHistory.length === 0 ? (
             <p className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">No wastage recorded yet</p>
          ) : (
            wastageHistory.map(w => (
              <div key={w.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{w.description}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{w.date}</p>
                </div>
                <div className="font-black text-rose-500 text-right">
                  -${Number(w.amount).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Wastage;