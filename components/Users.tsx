import React, { useState } from 'react';
import { User, Branch, UserRole, UserPermissions } from '../types';
import { useRestaurant } from '../context/RestaurantContext';
import { 
  Users as UsersIcon, 
  Plus, 
  Trash2, 
  Shield, 
  Building2, 
  X, 
  Search, 
  UserPlus,
  Eye,
  EyeOff,
  Edit2,
  Check
} from 'lucide-react';

const PERMISSION_LIST: { key: keyof UserPermissions; label: string }[] = [
  { key: 'inventory_edit', label: 'Inventory: Edit' },
  { key: 'inventory_delete', label: 'Inventory: Delete' },
  { key: 'sales_delete', label: 'Sales: Delete' },
  { key: 'purchase_delete', label: 'Purchase: Delete' },
  { key: 'customers_edit', label: 'Customers: Edit' },
  { key: 'customers_delete', label: 'Customers: Delete' },
  { key: 'suppliers_edit', label: 'Suppliers: Edit' },
  { key: 'suppliers_delete', label: 'Suppliers: Delete' },
  { key: 'expenses_edit', label: 'Expenses: Edit' },
  { key: 'expenses_delete', label: 'Expenses: Delete' },
  { key: 'user_control_access', label: 'User Control Access' },
  { key: 'settings_access', label: 'Settings Access' }
];

const DEFAULT_PERMISSIONS: UserPermissions = {
  inventory_edit: false, inventory_delete: false, sales_delete: false, purchase_delete: false,
  customers_edit: false, customers_delete: false, suppliers_edit: false, suppliers_delete: false,
  expenses_edit: false, expenses_delete: false, user_control_access: false, settings_access: false
};

const Users: React.FC = () => {
  const { users, branches, addUser, updateUser, deleteUser, currentUser } = useRestaurant();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MANAGER);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.phone && u.phone.includes(searchTerm))
  );

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setPhone(user.phone || '');
      setPassword(user.password || '');
      setSelectedRole(user.role as UserRole);
      setSelectedBranchId(user.branch_id || '');
      setPermissions(user.permissions || DEFAULT_PERMISSIONS);
    } else {
      setEditingUser(null);
      setName('');
      setPhone('');
      setPassword('');
      setSelectedRole(UserRole.MANAGER);
      setSelectedBranchId(branches[0]?.id || '');
      setPermissions(DEFAULT_PERMISSIONS);
    }
    setIsModalOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === UserRole.SUPER_ADMIN) {
      const allPerms = { ...DEFAULT_PERMISSIONS };
      Object.keys(allPerms).forEach(k => allPerms[k as keyof UserPermissions] = true);
      setPermissions(allPerms);
    } else if (role === UserRole.SALESMAN) {
      setPermissions(DEFAULT_PERMISSIONS);
    }
  };

  const togglePermission = (key: keyof UserPermissions) => {
    if (selectedRole === UserRole.SUPER_ADMIN) return; 
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = {
        name,
        phone,
        password,
        role: selectedRole,
        branch_id: selectedRole === UserRole.SUPER_ADMIN ? undefined : selectedBranchId,
        permissions,
        avatar: editingUser?.avatar || `https://ui-avatars.com/api/?name=${name}&background=random`
      };

      if (editingUser) {
        updateUser(editingUser.id, userData);
      } else {
        addUser(userData);
      }

      setIsModalOpen(false);
    } catch (error) {
      alert("Something went wrong while saving the user.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete your own account!");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUser(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-400/10 text-amber-400 rounded-2xl">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Access Control</h1>
            <p className="text-slate-400 font-medium text-sm mt-1">Manage team roles and granular permissions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-amber-400 transition-colors w-full md:w-64"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-400/20 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map(user => {
          const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
          const assignedBranch = branches.find(b => b.id === user.branch_id);

          return (
            <div key={user.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-xl shadow-slate-200/20 relative group hover:border-amber-400 transition-all duration-300">
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(user)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                {!isSuperAdmin && (
                  <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-start gap-4">
                <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                <div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                      isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Shield className="w-3 h-3" /> {user.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Assigned Base</span>
                  <span className="font-black text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {isSuperAdmin ? 'Global Hub (All)' : (assignedBranch?.name || 'Unassigned')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                 {editingUser ? <Edit2 className="w-5 h-5 text-amber-500" /> : <UserPlus className="w-5 h-5 text-amber-500" />}
                 {editingUser ? 'Edit Authorization Profile' : 'Provision New Operator'}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             </div>

             <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Basic Info */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2">Identity Matrix</h3>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Full Name</label>
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-700 font-bold focus:border-amber-400 mt-1" placeholder="e.g. John Doe" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Phone</label>
                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-700 font-bold focus:border-amber-400 mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Access PIN / Password</label>
                        <div className="relative mt-1">
                          <input type={showPassword ? 'text' : 'password'} required={!editingUser} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-700 font-bold focus:border-amber-400" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2 mt-8">Deployment Details</h3>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Designation Level</label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {Object.values(UserRole).map(role => (
                          <button
                            key={role} type="button" onClick={() => handleRoleChange(role)}
                            className={`py-3 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all ${
                              selectedRole === role ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            {role.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedRole !== UserRole.SUPER_ADMIN && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Assigned Branch Base</label>
                        <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-700 font-bold focus:border-amber-400 mt-1">
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Right: Permissions */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Security Clearance</h3>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-md">12 Directives</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PERMISSION_LIST.map(perm => (
                        <button
                          key={perm.key} type="button" onClick={() => togglePermission(perm.key)}
                          disabled={selectedRole === UserRole.SUPER_ADMIN}
                          className={`flex items-center justify-between p-3 rounded-xl border bg-white transition-all text-left ${
                            permissions[perm.key] ? 'border-amber-400 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          } ${selectedRole === UserRole.SUPER_ADMIN ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest">{perm.label}</span>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            permissions[perm.key] ? 'bg-amber-400 border-amber-400 text-slate-950' : 'border-slate-300'
                          }`}>
                            {permissions[perm.key] && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button type="submit" disabled={isLoading} className="w-full bg-amber-400 text-slate-950 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-amber-400/20 hover:bg-amber-500 transition-all disabled:opacity-50">
                    {isLoading ? 'Processing...' : (editingUser ? 'Update Profile' : 'Provision User')}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;