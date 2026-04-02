import React, { useState, useMemo } from 'react';
import { MenuItem, PaymentMethod } from '../types';
import { useRestaurant } from '../context/RestaurantContext';
import { 
  DollarSign, Wallet, TrendingUp, CreditCard, ShoppingCart, 
  Trash2, Plus, Minus, Search, Building2 as Store 
} from 'lucide-react';
import Swal from 'sweetalert2'; // 🔴 SweetAlert2 ইমপোর্ট করা হলো

interface POSProps {
  menuItems: MenuItem[];
  onAddSale: (menuItemId: string, quantity: number, paymentMethod: PaymentMethod | string, discount?: number) => void;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

const POS: React.FC<POSProps> = ({ menuItems, onAddSale }) => {
  const { sales, expenses, selectedBranchId } = useRestaurant();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🔴 নতুন: ক্যাটাগরি ফিল্টার স্টেট 🔴
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | string>(PaymentMethod.CASH);
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // ==========================================
  // TODAY's STATS CALCULATION (আপনার অরিজিনাল কোড)
  // ==========================================
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const todaysSales = sales.filter(s => s.sold_at.startsWith(today));
    const todaysExpenses = expenses.filter(e => e.date.startsWith(today));

    const revenue = todaysSales.reduce((sum, s) => sum + Number(s.total_price), 0);
    const cogs = todaysSales.reduce((sum, s) => sum + Number(s.total_cost), 0);
    const expenseAmount = todaysExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const profit = revenue - cogs - expenseAmount;
    
    const cashSales = todaysSales.filter(s => s.payment_method === 'Cash' || s.payment_method === PaymentMethod.CASH).reduce((sum, s) => sum + Number(s.total_price), 0);
    const cardSales = todaysSales.filter(s => s.payment_method === 'Card' || s.payment_method === PaymentMethod.CARD).reduce((sum, s) => sum + Number(s.total_price), 0);
    const bkashSales = todaysSales.filter(s => s.payment_method === 'bKash' || s.payment_method === PaymentMethod.BKASH).reduce((sum, s) => sum + Number(s.total_price), 0);
    const nagadSales = todaysSales.filter(s => s.payment_method === 'Nagad' || s.payment_method === PaymentMethod.NAGAD).reduce((sum, s) => sum + Number(s.total_price), 0);

    return { revenue, expenseAmount, profit, cashSales, cardSales, bkashSales, nagadSales };
  }, [sales, expenses, selectedBranchId]);

  // ==========================================
  // 🔴 নতুন: ডাইনামিক ক্যাটাগরি লিস্ট তৈরি 🔴
  // ==========================================
  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(item => item.category || 'General'));
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  // ==========================================
  // CART LOGIC & CALCULATION
  // ==========================================
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };
  
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.menuItem.id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.menuItem.id !== id));

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.menuItem.selling_price * item.quantity), 0);
  const safeDiscount = Number(discountAmount) || 0;
  const finalTotal = Math.max(0, cartSubtotal - safeDiscount);

  // 🔴 SweetAlert2 দিয়ে প্রফেশনাল চেকআউট লজিক 🔴
  const handleCheckout = async () => {
    if (cart.length === 0) {
      return Swal.fire({
        icon: 'warning',
        title: 'Cart is Empty',
        text: 'Please add items to cart before checking out.',
        confirmButtonColor: '#f59e0b',
        customClass: { popup: 'rounded-[2rem]' }
      });
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Complete order for $${finalTotal.toFixed(2)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Confirm', // 🔴 'Yes' বাদ দিয়ে শুধু Confirm রাখা হয়েছে
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (!result.isConfirmed) return;

    setIsProcessing(true);
    try {
      cart.forEach(item => {
        const itemTotal = item.menuItem.selling_price * item.quantity;
        const proportion = cartSubtotal > 0 ? itemTotal / cartSubtotal : 0;
        const itemDiscountShare = safeDiscount * proportion;

        onAddSale(item.menuItem.id, item.quantity, paymentMethod, itemDiscountShare);
      });
      setCart([]);
      setDiscountAmount('');
      
      Swal.fire({
        icon: 'success',
        title: 'Order Completed!',
        text: 'Receipt generated successfully.',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-[2rem]' }
      });
    } catch(e) {
      Swal.fire({
        icon: 'error',
        title: 'Checkout Failed',
        text: 'Error processing sale.',
        confirmButtonColor: '#f59e0b',
        customClass: { popup: 'rounded-[2rem]' }
      });
    } finally {
        setIsProcessing(false);
    }
  };

  // 🔴 নতুন: ছবি লোড করার সিকিউর ফাংশন (যাতে ছবি গায়েব না হয়)
  const getImageUrl = (item: any) => {
    return item.image || item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
  };

  // 🔴 নতুন: ক্যাটাগরি ও সার্চ মিলিয়ে ফিল্টার করা
  const filteredMenu = useMemo(() => {
    return menuItems.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || (m.category || 'General') === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);


  // ==========================================
  // 🔴 নতুন: গ্লোবাল ব্রাঞ্চ রেস্ট্রিকশন 🔴
  // ==========================================
  if (selectedBranchId === 'all') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-white rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Store className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-2">Global Mode Restricted</h2>
        <p className="text-slate-500 font-bold text-sm tracking-wide">Please select a specific branch from the top menu to access the POS terminal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      
      {/* TOP STATS CARDS (আপনার অরিজিনাল ডিজাইন) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><DollarSign size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Sale</p>
            <p className="text-2xl font-black text-slate-800">${todayStats.revenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Wallet size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Expense</p>
            <p className="text-2xl font-black text-slate-800">${todayStats.expenseAmount.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className={`p-3 rounded-2xl ${todayStats.profit >= 0 ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Profit</p>
            <p className={`text-2xl font-black ${todayStats.profit >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
              ${todayStats.profit.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><CreditCard size={24} /></div>
          <div className="w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1 mb-1">Payment Split</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-black">
              <span className="text-slate-500 flex justify-between">Cash: <span className="text-emerald-500">${todayStats.cashSales.toFixed(2)}</span></span>
              <span className="text-slate-500 flex justify-between">Card: <span className="text-blue-500">${todayStats.cardSales.toFixed(2)}</span></span>
              <span className="text-slate-500 flex justify-between">bKash: <span className="text-pink-500">${todayStats.bkashSales.toFixed(2)}</span></span>
              <span className="text-slate-500 flex justify-between">Nagad: <span className="text-orange-500">${todayStats.nagadSales.toFixed(2)}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* POS MAIN AREA */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left: Menu Items Grid */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-0">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search menu items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none text-slate-700 font-bold focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
            
            {/* 🔴 নতুন: ক্যাটাগরি ফিল্টার বাটনগুলো 🔴 */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 text-amber-400 shadow-md' 
                      : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMenu.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => addToCart(item)}
                  className="bg-white border border-slate-200 p-3 rounded-2xl hover:border-amber-400 hover:shadow-md transition-all text-left group flex flex-col h-full active:scale-95"
                >
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100 flex items-center justify-center">
                    {/* 🔴 আপডেট করা ইমেজ সোর্স */}
                    <img 
                      src={getImageUrl(item)} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      loading="lazy"
                    />
                  </div>
                  
                  <h3 className="font-black text-slate-800 text-sm leading-tight mb-1 flex-1 line-clamp-2">{item.name}</h3>
                  <p className="text-amber-600 font-black">${item.selling_price.toFixed(2)}</p>
                </button>
              ))}
              {filteredMenu.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-400 font-bold">No items found in this category.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart & Checkout Panel (আপনার অরিজিনাল ডিজাইন) */}
        <div className="w-full lg:w-96 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden shrink-0">
          <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black tracking-widest uppercase">Current Order</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.map(item => (
              <div key={item.menuItem.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center gap-2">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm">{item.menuItem.name}</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">${(item.menuItem.selling_price * item.quantity).toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1">
                  <button onClick={() => updateQuantity(item.menuItem.id, -1)} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Minus size={14} /></button>
                  <span className="font-black text-slate-700 w-4 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.menuItem.id, 1)} className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"><Plus size={14} /></button>
                </div>

                <button onClick={() => removeFromCart(item.menuItem.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors ml-2">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            {cart.length === 0 && (
              <div className="text-center py-10 opacity-50">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Cart is empty</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <div className="space-y-3 mb-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Method</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {Object.values(PaymentMethod).filter(m => m !== PaymentMethod.OTHER).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      paymentMethod === method ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-6 bg-white p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-bold text-xs uppercase tracking-widest">Subtotal</span>
                <span className="font-black text-sm">${cartSubtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-rose-500 uppercase tracking-widest">Discount ($)</span>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={discountAmount} 
                  onChange={e => setDiscountAmount(e.target.value === '' ? '' : Number(e.target.value))} 
                  placeholder="0.00"
                  className="w-24 px-3 py-1.5 bg-slate-50 border border-rose-200 rounded-lg text-right font-black text-rose-600 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-slate-800 font-black uppercase tracking-widest text-sm">Total Due</span>
                <span className="text-3xl font-black text-slate-800">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || isProcessing}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95"
            >
              {isProcessing ? 'Processing...' : 'Complete Checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;