import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, PackagePlus, ShoppingCart } from 'lucide-react';
import { Ingredient } from '../types';
import { useRestaurant } from '../context/RestaurantContext';

interface InventoryProps {
  ingredients: Ingredient[];
  onAdd: (ing: Omit<Ingredient, 'id' | 'restaurant_id'>) => void;
  onUpdate: (id: string, ing: Partial<Ingredient>) => void;
  onDelete: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ ingredients, onAdd, onUpdate, onDelete }) => {
  const { addPurchase } = useRestaurant(); // NEW: Access addPurchase context
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);

  // NEW: Stock In States
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [stockInItem, setStockInItem] = useState<Ingredient | null>(null);
  const [stockInForm, setStockInForm] = useState({ quantity: '', unit_cost: '', supplier_name: '', date: new Date().toISOString().split('T')[0] });

  const [formData, setFormData] = useState({
    name: '', unit: 'kg', stock_quantity: 0, unit_cost: 0, reorder_level: 0
  });

  const filtered = ingredients.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingIng(null);
    setFormData({ name: '', unit: 'kg', stock_quantity: 0, unit_cost: 0, reorder_level: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setEditingIng(ing);
    setFormData({ 
      name: ing.name, unit: ing.unit, stock_quantity: ing.stock_quantity, 
      unit_cost: ing.unit_cost, reorder_level: ing.reorder_level 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIng) {
      onUpdate(editingIng.id, formData);
    } else {
      onAdd(formData);
    }
    setIsModalOpen(false);
  };

  // NEW: Handle Stock IN form submission
  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInItem) return;
    
    const qty = parseFloat(stockInForm.quantity);
    const cost = parseFloat(stockInForm.unit_cost);
    
    addPurchase({
       ingredient_id: stockInItem.id,
       ingredient_name: stockInItem.name,
       quantity: qty,
       unit_cost: cost,
       total_cost: qty * cost,
       supplier_name: stockInForm.supplier_name,
       date: stockInForm.date
    });
    
    setIsStockInModalOpen(false);
    alert("Purchase successful! Auto-recorded to accounting expenses.");
  };

  const openStockInModal = (ing: Ingredient) => {
    setStockInItem(ing);
    setStockInForm({ 
      quantity: '', 
      unit_cost: ing.unit_cost.toString(), // Default to previous cost
      supplier_name: '', 
      date: new Date().toISOString().split('T')[0] 
    });
    setIsStockInModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search ingredients..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
        >
          <Plus size={18} />
          <span>New Material Profile</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingredient</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stock</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Cost</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(ing => (
              <tr key={ing.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800">{ing.name}</div>
                  <div className="text-xs text-slate-500">{ing.unit}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-mono text-slate-700 font-bold">{ing.stock_quantity.toFixed(2)} <span className="text-xs text-slate-400 ml-1">{ing.unit}</span></div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-700">${ing.unit_cost.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4">
                  {ing.stock_quantity <= ing.reorder_level ? (
                    <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full border border-rose-200">Low Stock</span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">Healthy</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => openStockInModal(ing)} 
                    title="Buy Material (Stock IN)"
                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-200"
                  >
                    <PackagePlus size={16} />
                  </button>
                  <button onClick={() => handleOpenEdit(ing)} className="p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors border border-transparent hover:border-amber-200"><Edit2 size={16} /></button>
                  <button onClick={() => onDelete(ing.id)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-200"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 italic">No ingredients found in the inventory.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Edit/Add Ingredient Profile */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800">{editingIng ? 'Edit Material Profile' : 'New Material Profile'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Material Name</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Flour, Rice, Chicken" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Unit Type</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 outline-none appearance-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option>kg</option><option>gm</option><option>ltr</option><option>ml</option><option>pcs</option><option>packet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Initial Stock</label>
                  <input type="number" step="0.01" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 outline-none" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cost per Unit ($)</label>
                  <input type="number" step="0.01" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 outline-none" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Reorder Alert At</label>
                  <input type="number" step="0.01" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 outline-none" value={formData.reorder_level} onChange={e => setFormData({...formData, reorder_level: parseFloat(e.target.value)})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors mt-6 shadow-lg shadow-slate-200">
                {editingIng ? 'Save Changes' : 'Create Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NEW MODAL: Stock IN / Purchase Material */}
      {isStockInModalOpen && stockInItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">Purchase Stock</h3>
                  <p className="text-sm font-semibold text-emerald-600">{stockInItem.name}</p>
                </div>
              </div>
              <button onClick={() => setIsStockInModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Buy Qty ({stockInItem.unit})</label>
                  <input required type="number" step="0.01" min="0.01" autoFocus
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-lg" 
                    value={stockInForm.quantity} 
                    onChange={e => setStockInForm({...stockInForm, quantity: e.target.value})} 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">New Unit Cost ($)</label>
                  <input required type="number" step="0.01" min="0"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-lg" 
                    value={stockInForm.unit_cost} 
                    onChange={e => setStockInForm({...stockInForm, unit_cost: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Supplier / Vendor Name (Optional)</label>
                <input type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 outline-none" 
                  value={stockInForm.supplier_name} 
                  onChange={e => setStockInForm({...stockInForm, supplier_name: e.target.value})} 
                  placeholder="e.g. City Fresh Market" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Purchase Date</label>
                <input required type="date"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-slate-700" 
                  value={stockInForm.date} 
                  onChange={e => setStockInForm({...stockInForm, date: e.target.value})} 
                />
              </div>

              <div className="bg-slate-900 rounded-xl p-4 flex justify-between items-center mt-6 shadow-inner border border-slate-800">
                 <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Expense:</span>
                 <span className="text-xl font-black text-emerald-400">
                    ${((parseFloat(stockInForm.quantity) || 0) * (parseFloat(stockInForm.unit_cost) || 0)).toFixed(2)}
                 </span>
              </div>
              <p className="text-[10px] text-slate-500 text-center italic mt-2">*This amount will auto-sync to the P&L Accounting Ledger.</p>

              <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 mt-2 flex justify-center items-center space-x-2">
                <PackagePlus size={20} />
                <span>Confirm Purchase & Sync</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;