import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import MenuAndRecipes from './components/MenuAndRecipes';
import POS from './components/POS';
import Accounting from './components/Accounting';
import SmartInsights from './components/SmartInsights';
import FundManagement from './components/FundManagement';
import Wastage from './components/Wastage';
import Users from './components/Users';
import Settings from './components/Settings';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { View } from './types';
import { LogIn, Lock, Store, User as UserIcon } from 'lucide-react'; 

const AppContent: React.FC = () => {
  const [currentView, setView] = useState<View>(View.Dashboard);
  
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const { 
    ingredients, menuItems, sales, expenses, branches, transfers,
    isLoggedIn, restaurantName, currentAdminName,
    selectedBranchId, setSelectedBranchId,
    login, logout, addSale, addExpense, calculateMenuItemCost,
    addIngredient, updateIngredient, deleteIngredient,
    addMenuItem, deleteMenuItem, addTransfer
  } = useRestaurant();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(loginId, loginPassword)) {
      setLoginError(false);
      setLoginPassword('');
      setLoginId('');
      setView(View.Dashboard); // 🔴 ফিক্স ১: লগইন সফল হলে সবসময় ড্যাশবোর্ডে নিয়ে যাবে
    } else {
      setLoginError(true);
    }
  };

  // 🔴 ফিক্স ২: লগআউট করার সময়ও ভিউ রিসেট করে ড্যাশবোর্ড করে দেবে
  const handleLogout = () => {
    logout();
    setView(View.Dashboard);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
          <div className="bg-amber-500 p-10 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <Store size={32} />
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter">RestoAccrue</h1>
            <p className="text-amber-50 text-xs font-bold uppercase tracking-widest mt-2 opacity-80">Enterprise Management</p>
          </div>
          
          <div className="p-10">
            <form onSubmit={handleLogin} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">User ID or Phone</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Enter your name or phone"
                    className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all font-bold"
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Access Token</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-4 py-4 border ${loginError ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all text-lg tracking-widest`}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                  />
                </div>
                {loginError && <p className="text-rose-600 text-xs mt-3 font-semibold text-center bg-rose-50 py-2 rounded-lg">Access Denied. Invalid Credentials.</p>}
              </div>
              
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-3 shadow-xl hover:translate-y-[-2px] active:translate-y-[0px]"
              >
                <LogIn size={20} />
                <span>Secure Login</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case View.Dashboard: return <Dashboard ingredients={ingredients} sales={sales} expenses={expenses} />;
      case View.Inventory: return <Inventory ingredients={ingredients} onAdd={addIngredient} onUpdate={updateIngredient} onDelete={deleteIngredient} />;
      case View.Menu: return <MenuAndRecipes menuItems={menuItems} ingredients={ingredients} calculateCost={calculateMenuItemCost} onAdd={addMenuItem} onDelete={deleteMenuItem} />;
      case View.Sales: return <POS menuItems={menuItems} onAddSale={addSale} />;
      case View.Accounting: return <Accounting expenses={expenses} sales={sales} onAddExpense={addExpense} />;
      case View.FundManagement: return <FundManagement sales={sales} expenses={expenses} transfers={transfers} onAddTransfer={addTransfer} />;
      case View.Wastage: return <Wastage />;
      case View.SmartInsights: return <SmartInsights menuItems={menuItems} ingredients={ingredients} sales={sales} expenses={expenses} />;
      case View.Users: return <Users />;
      case View.Settings: return <Settings />;
      default: return <Dashboard ingredients={ingredients} sales={sales} expenses={expenses} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      setView={setView}
      restaurantName={restaurantName}
      adminName={currentAdminName}
      branches={branches}
      selectedBranchId={selectedBranchId}
      onSelectBranch={setSelectedBranchId}
      onLogout={handleLogout} /* 🔴 ফিক্স ৩: এখানে logout এর জায়গায় handleLogout দেওয়া হয়েছে */
    >
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => (
  <RestaurantProvider>
    <AppContent />
  </RestaurantProvider>
);

export default App;