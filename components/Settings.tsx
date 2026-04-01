import React, { useState, useEffect } from 'react';
import { Branch, User, StorePayment, UserRole } from '../types';
import { useRestaurant } from '../context/RestaurantContext';
import { supabase } from '../lib/supabase';
import { 
  Settings as SettingsIcon, Building2 as StoreIcon, CreditCard, Lock, Plus, 
  Trash2, Edit2, X, AlertCircle, CheckCircle2, CalendarClock, Clock, RefreshCw, Download, Upload 
} from 'lucide-react';

const Settings: React.FC = () => {
  const { 
    branches, payments, currentUser, 
    addBranch, updateBranch, deleteBranch, 
    updatePayment, updateUser, 
    exportBackup, importBackup 
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'hubs' | 'billing' | 'security'>('hubs');
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [localPayments, setLocalPayments] = useState<any[]>([]);
  const [backingUpBranchId, setBackingUpBranchId] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const fetchPayments = async () => {
    setIsSyncing(true);
    try {
      const { data } = await supabase.from('store_payments').select('*').order('paymentDate', { ascending: false });
      if (data) setLocalPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (payments.length > 0) {
      setLocalPayments(payments);
    }
  }, [payments]);

  useEffect(() => {
    if (activeTab === 'billing') {
      fetchPayments();
    }
  }, [activeTab]);

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.target as HTMLFormElement;
    
    const branchPayload = {
      name: form.branchName.value,
      location: form.branchLocation.value,
      monthlyFee: parseFloat(form.monthlyFee.value) || 0,
      billingStartMonth: form.billingStartMonth.value
    };

    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, branchPayload);
        alert("Branch updated successfully.");
      } else {
        await addBranch(branchPayload);
        alert("New branch registered.");
      }
      setIsBranchModalOpen(false);
    } catch (error: any) {
      alert(`Operation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadClick = async (branchId: string, branchName: string) => {
    if(window.confirm(`Download full database backup for "${branchName}"?`)) {
      setBackingUpBranchId(branchId);
      await exportBackup(branchId, branchName);
      setBackingUpBranchId(null);
    }
  };

  const handleUploadClick = (branchId: string, branchName: string) => {
    if(window.confirm(`⚠️ WARNING! Restoring backup for "${branchName}" will overwrite current branch data. Proceed?`)) {
        document.getElementById(`backup-upload-${branchId}`)?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, branchId: string, branchName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const json = event.target?.result as string;
      await importBackup(branchId, branchName, json);
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handleApprovePayment = async (paymentId: string) => {
    if (!window.confirm("Approve this transaction?")) return;
    const { data } = await supabase.from('store_payments').update({ status: 'PAID' }).eq('id', paymentId).select().single();
    if (data) {
      setLocalPayments(prev => prev.map(p => p.id === paymentId ? data : p));
      updatePayment(paymentId, { status: 'PAID' });
      alert("Payment Approved!");
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!window.confirm("Reject this transaction?")) return;
    const { data } = await supabase.from('store_payments').update({ status: 'REJECTED' }).eq('id', paymentId).select().single();
    if (data) {
      setLocalPayments(prev => prev.map(p => p.id === paymentId ? data : p));
      updatePayment(paymentId, { status: 'REJECTED' });
      alert("Payment Rejected!");
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) return alert("New passwords do not match!");
    if (currentUser?.password && passwordData.current !== currentUser.password) return alert("Current password is incorrect!");

    setIsUpdatingPassword(true);
    try {
      if (currentUser) {
        await updateUser(currentUser.id, { password: passwordData.new });
        alert("Password updated successfully!");
        setPasswordData({ current: '', new: '', confirm: '' });
      }
    } catch (error: any) {
      alert(`Failed to update password: ${error.message}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const pendingPayments = localPayments.filter(p => p.status === 'PENDING');

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <SettingsIcon className="w-8 h-8 text-amber-500" />
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Settings</h1>
      </div>

      <div className="flex flex-wrap gap-4">
        <button onClick={() => setActiveTab('hubs')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'hubs' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
          <div className="flex items-center gap-2"><StoreIcon className="w-4 h-4" /> Branch Hubs</div>
        </button>
        <button onClick={() => setActiveTab('billing')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'billing' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
          <div className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Billing Requests</div>
        </button>
        <button onClick={() => setActiveTab('security')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
          <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> Security</div>
        </button>
      </div>

      {/* ======================= BRANCH HUBS ======================= */}
      {activeTab === 'hubs' && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Registered Branches</h2>
            {isSuperAdmin && (
              <button onClick={() => { setEditingBranch(null); setIsBranchModalOpen(true); }} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors text-xs uppercase tracking-widest shadow-lg">
                <Plus className="w-4 h-4" /> Add Branch
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map(branch => (
              <div key={branch.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-white text-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <StoreIcon size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">{branch.name}</h3>
                  <p className="text-xs text-slate-500 font-bold mb-4">{branch.location}</p>
                  <div className="flex gap-2 mb-4">
                    <div className="bg-white px-4 py-2 rounded-xl inline-block shadow-sm border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Monthly Fee</p>
                      <p className="text-amber-500 font-black">${branch.monthlyFee || 0}</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl inline-block shadow-sm border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Billing Starts</p>
                      <p className="text-emerald-500 font-black">{branch.billingStartMonth || 'Not Set'}</p>
                    </div>
                  </div>
                </div>
                
                {/* 🔴 Buttons are now permanently visible (opacity-100) 🔴 */}
                {isSuperAdmin && (
                  <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
                    <button onClick={() => handleDownloadClick(branch.id, branch.name)} disabled={backingUpBranchId === branch.id} title={`Download Backup for ${branch.name}`} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-xl transition-colors">
                      {backingUpBranchId === branch.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                    
                    <button onClick={() => handleUploadClick(branch.id, branch.name)} title={`Restore Backup to ${branch.name}`} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl transition-colors">
                      <Upload className="w-4 h-4" />
                    </button>
                    <input type="file" id={`backup-upload-${branch.id}`} accept=".json" className="hidden" onChange={(e) => handleFileChange(e, branch.id, branch.name)} />
                    
                    <button onClick={() => { setEditingBranch(branch); setIsBranchModalOpen(true); }} className="p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 rounded-xl transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    
                    {branches.length > 1 && (
                      <button onClick={() => deleteBranch(branch.id)} className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= BILLING / SUBSCRIPTIONS ======================= */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3"><CalendarClock className="w-6 h-6 text-amber-500" /><h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Pending Approvals</h2></div>
               <button onClick={fetchPayments} disabled={isSyncing} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-200 transition-colors">
                 <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Data
               </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-5">Branch Name</th>
                    <th className="px-6 py-5 text-center">Month</th>
                    <th className="px-6 py-5 text-center">Amount</th>
                    <th className="px-6 py-5 text-center">TrxID</th>
                    <th className="px-6 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingPayments.map(payment => {
                    const branch = branches.find(b => b.id === payment.branch_id);
                    return (
                      <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 font-bold text-slate-800 text-sm">{branch?.name || 'Unknown Branch'}</td>
                        <td className="px-6 py-5 text-center font-black text-amber-600 uppercase tracking-widest text-[10px]">{new Date(payment.monthYear + "-01").toLocaleString('default', { month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-5 text-center font-black text-slate-800">${payment.amountPaid}</td>
                        <td className="px-6 py-5 text-center font-black text-emerald-600 tracking-widest">{payment.trxId}</td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleApprovePayment(payment.id)} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors">Approve</button>
                            <button onClick={() => handleRejectPayment(payment.id)} className="bg-rose-100 text-rose-700 hover:bg-rose-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors">Reject</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pendingPayments.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No pending payment requests</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <StoreIcon className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">
                Branch Status ({new Date(currentMonthYear + "-01").toLocaleString('en-GB', { month: 'long', year: 'numeric' })})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-5">Branch Name</th>
                    <th className="px-6 py-5 text-center">Monthly Fee</th>
                    <th className="px-6 py-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.map(branch => {
                    const branchPayments = localPayments.filter(p => p.branch_id === branch.id && p.monthYear === currentMonthYear);
                    const isPaid = branchPayments.some(p => p.status === 'PAID');
                    const isPending = branchPayments.some(p => p.status === 'PENDING');
                    const status = isPaid ? 'PAID' : (isPending ? 'PENDING' : 'DUE');
                    
                    return (
                      <tr key={branch.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 font-bold text-slate-800 text-sm">{branch.name}</td>
                        <td className="px-6 py-5 text-center font-black text-slate-600">${branch.monthlyFee || 0}</td>
                        <td className="px-6 py-5 text-center">
                           {status === 'PAID' && <span className="bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block w-24">PAID</span>}
                           {status === 'PENDING' && <span className="bg-amber-100 text-amber-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block w-24">PENDING</span>}
                           {status === 'DUE' && <span className="bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block w-24">DUE</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= SECURITY ======================= */}
      {activeTab === 'security' && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
             <div className="p-3 bg-amber-50 rounded-2xl"><Lock className="w-6 h-6 text-amber-500" /></div>
             <div>
               <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Account Security</h2>
               <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Update your login password</p>
             </div>
          </div>
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Current Password</label><input type="password" required value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 font-bold focus:ring-2 focus:ring-amber-500/20 transition-all" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">New Password</label><input type="password" required minLength={6} value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 font-bold focus:ring-2 focus:ring-amber-500/20 transition-all" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Confirm New Password</label><input type="password" required minLength={6} value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 font-bold focus:ring-2 focus:ring-amber-500/20 transition-all" /></div>
            <button type="submit" disabled={isUpdatingPassword} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black mt-4 hover:bg-amber-500 transition-colors uppercase tracking-widest text-xs disabled:opacity-50 shadow-lg">{isUpdatingPassword ? 'Updating...' : 'Update Password'}</button>
          </form>
        </div>
      )}

      {/* ======================= ADD/EDIT BRANCH MODAL ======================= */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
             <button onClick={() => setIsBranchModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">{editingBranch ? 'Update Branch' : 'Register Branch'}</h2>
             
             <form onSubmit={handleBranchSubmit} className="space-y-5">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Branch Name</label><input name="branchName" required defaultValue={editingBranch?.name} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 font-bold focus:ring-2 focus:ring-amber-500/20 transition-all" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Location</label><input name="branchLocation" required defaultValue={editingBranch?.location} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-800 font-bold focus:ring-2 focus:ring-amber-500/20 transition-all" /></div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Billing Start Month</label>
                  <input name="billingStartMonth" type="month" required defaultValue={editingBranch?.billingStartMonth || currentMonthYear} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-emerald-600 font-black focus:ring-2 focus:ring-amber-500/20 transition-all" />
                </div>

                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Monthly Subscription Fee ($)</label><input name="monthlyFee" type="number" step="0.01" required defaultValue={editingBranch?.monthlyFee || 0} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-amber-600 font-black focus:ring-2 focus:ring-amber-500/20 transition-all" /></div>

                <button type="submit" disabled={isLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-5 rounded-[2rem] font-black mt-4 transition-colors uppercase tracking-widest text-xs disabled:opacity-50 shadow-lg shadow-amber-200">{isLoading ? 'Processing...' : 'Save Configuration'}</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;