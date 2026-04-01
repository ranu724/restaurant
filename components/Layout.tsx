import React from 'react';
import { 
  LayoutDashboard, Package, UtensilsCrossed, Receipt, Wallet, Landmark,
  Trash2, Sparkles, Settings as SettingsIcon, Users as UsersIcon,       
  Menu as MenuIcon, X, LogOut, Building
} from 'lucide-react';
import { View, Branch, UserRole } from '../types';
import { useRestaurant } from '../context/RestaurantContext';

interface LayoutProps {
  currentView: View;
  setView: (view: View) => void;
  restaurantName: string;
  adminName: string;
  branches: Branch[];
  selectedBranchId: string | 'all';
  onSelectBranch: (id: string | 'all') => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  currentView, setView, restaurantName, adminName, branches,
  selectedBranchId, onSelectBranch, onLogout, children 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { currentUser } = useRestaurant();

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const hasUserAccess = isSuperAdmin || currentUser?.permissions?.user_control_access;
  const hasSettingsAccess = isSuperAdmin || currentUser?.permissions?.settings_access;

  const navItems = [
    { id: View.Dashboard, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.Inventory, label: 'Inventory', icon: Package },
    { id: View.Menu, label: 'Menu & Recipes', icon: UtensilsCrossed },
    { id: View.Sales, label: 'Point of Sale', icon: Receipt },
    { id: View.Accounting, label: 'Accounting', icon: Wallet },
    { id: View.FundManagement, label: 'Fund Management', icon: Landmark },
    { id: View.Wastage, label: 'Wastage', icon: Trash2 },
    { id: View.SmartInsights, label: 'AI Insights', icon: Sparkles },
    ...(hasUserAccess ? [{ id: View.Users, label: 'Access Control', icon: UsersIcon }] : []),
    ...(hasSettingsAccess ? [{ id: View.Settings, label: 'Settings', icon: SettingsIcon }] : []),
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col z-50`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <span className={`${!isSidebarOpen && 'hidden'} font-bold text-sm leading-tight tracking-tight text-amber-400 uppercase`}>
            Building Developments & Technologies
          </span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded ml-2">
            {isSidebarOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                currentView === item.id ? 'bg-amber-500 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span className="ml-4 font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 flex flex-col space-y-2">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-2 p-3 text-slate-400 hover:text-rose-400 transition-colors w-full rounded-lg"
          >
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
          {isSidebarOpen && <p className="text-[10px] text-slate-600 text-center mt-2">v2.1 Enterprise BDT</p>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white shadow-sm h-16 flex items-center px-8 shrink-0 z-20">
          <h1 className="text-xl font-bold text-slate-800 capitalize">{currentView.replace('-', ' ')}</h1>
          
          <div className="ml-8 flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Building size={16} className="text-slate-400" />
            
            {isSuperAdmin ? (
              <select 
                className="bg-transparent text-sm font-black text-amber-600 outline-none cursor-pointer uppercase tracking-widest"
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
              >
                {/* 🔴 Global অপশন ফিরিয়ে আনা হয়েছে */}
                <option value="all">Global (Overview)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm font-black uppercase tracking-widest text-amber-600 px-2 py-1">
                {branches.find(b => b.id === currentUser?.branch_id)?.name || 'Assigned Branch'}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center space-x-4">
             <div className="text-right mr-4 hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{restaurantName}</p>
                <p className="text-xs text-slate-500 font-medium">{adminName}</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-amber-400 font-bold border-2 border-slate-100">
               {adminName.substring(0, 2).toUpperCase()}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;