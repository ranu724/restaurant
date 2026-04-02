import React, { useState } from 'react';
import { MenuItem, Ingredient, RecipeItem } from '../types';
import { 
  UtensilsCrossed, Plus, Trash2, Search, X, 
  ChefHat, Image as ImageIcon, AlertCircle 
} from 'lucide-react';
import Swal from 'sweetalert2'; // 🔴 SweetAlert2 ইমপোর্ট করা হলো

interface MenuAndRecipesProps {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  calculateCost: (item: MenuItem) => number;
  onAdd: (item: Omit<MenuItem, 'id' | 'restaurant_id'>) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES = [
  "Fast Food",
  "Main Course",
  "Appetizer",
  "Dessert",
  "Beverage",
  "Salad",
  "Soup",
  "Platter",
  "Other"
];

const MenuAndRecipes: React.FC<MenuAndRecipesProps> = ({ 
  menuItems, ingredients, calculateCost, onAdd, onDelete 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [image, setImage] = useState('');
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);

  const filteredMenuItems = menuItems.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🔴 Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        Swal.fire({
          icon: 'error',
          title: 'Image Too Large',
          text: 'Image size should be less than 2MB',
          confirmButtonColor: '#f59e0b',
          customClass: { popup: 'rounded-[2rem]' }
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addRecipeRow = () => {
    if (ingredients.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Inventory Empty',
        text: 'Please add some ingredients to your Inventory first!',
        confirmButtonColor: '#f59e0b',
        customClass: { popup: 'rounded-[2rem]' }
      });
      return;
    }
    setRecipe(prev => [
      ...prev, 
      { 
        ingredient_id: ingredients[0].id, 
        ingredient_name: ingredients[0].name, 
        quantity_required: 1,
        unit: ingredients[0].unit 
      }
    ]);
  };

  const updateRecipeRow = (index: number, field: keyof RecipeItem, value: any) => {
    setRecipe(prev => {
      const newRecipe = [...prev];
      if (field === 'ingredient_id') {
        const selectedIng = ingredients.find(i => i.id === value);
        newRecipe[index] = { 
          ...newRecipe[index], 
          ingredient_id: value,
          ingredient_name: selectedIng?.name || '',
          unit: selectedIng?.unit || ''
        };
      } else {
        newRecipe[index] = { ...newRecipe[index], [field]: value };
      }
      return newRecipe;
    });
  };

  const removeRecipeRow = (index: number) => {
    setRecipe(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || sellingPrice === '') {
      return Swal.fire({
        icon: 'warning',
        title: 'Missing Info',
        text: 'Name and Selling Price are required!',
        confirmButtonColor: '#f59e0b',
        customClass: { popup: 'rounded-[2rem]' }
      });
    }
    
    setIsSubmitting(true);
    try {
      await onAdd({
        name,
        selling_price: Number(sellingPrice),
        category,
        image,
        recipe: recipe.length > 0 ? recipe : undefined
      });
      
      // Reset Form
      setName('');
      setSellingPrice('');
      setCategory(CATEGORIES[0]);
      setImage('');
      setRecipe([]);
      setIsModalOpen(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Menu item created successfully.',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-[2rem]' }
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: 'Failed to create menu item.',
        confirmButtonColor: '#f59e0b',
        customClass: { popup: 'rounded-[2rem]' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔴 প্রফেশনাল ডিলিট কনফার্মেশন ফাংশন 🔴
  const handleDeleteItem = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Delete this menu item?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e', // Rose color for delete
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      onDelete(id);
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Menu item has been removed.',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-[2rem]' }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
            <UtensilsCrossed size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Menu & Recipes</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Manage your offerings and BOM</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search menu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 font-bold focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl font-black transition-colors shadow-lg shadow-amber-200 uppercase tracking-widest text-xs shrink-0"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMenuItems.map(item => {
          const cost = calculateCost(item);
          const profit = item.selling_price - cost;
          const margin = item.selling_price > 0 ? ((profit / item.selling_price) * 100).toFixed(1) : 0;

          return (
            <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              {/* Image Section */}
              <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <UtensilsCrossed size={48} className="text-slate-300" />
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-800 shadow-sm">
                  {item.category || 'Uncategorized'}
                </div>
              </div>

              {/* Details Section */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-slate-800 leading-tight">{item.name}</h3>
                  {/* 🔴 আপডেট করা ডিলিট বাটন */}
                  <button onClick={() => handleDeleteItem(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Selling Price</p>
                    <p className="text-lg font-black text-amber-500">${item.selling_price.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Recipe Cost</p>
                    <p className="text-lg font-black text-rose-500">${cost.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                    <ChefHat size={14} /> 
                    {item.recipe?.length || 0} Ingredients
                  </div>
                  <div className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${profit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {margin}% Margin
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredMenuItems.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-200 py-20 flex flex-col items-center justify-center text-slate-400">
            <UtensilsCrossed size={48} className="mb-4 opacity-50" />
            <p className="font-bold uppercase tracking-widest text-sm">No menu items found</p>
          </div>
        )}
      </div>

      {/* Add Menu Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <ChefHat className="text-amber-500" size={24} /> Create Menu Item
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Item Name</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spicy Chicken Burger" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none font-bold text-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Selling Price ($)</label>
                    <input type="number" required min="0" step="0.01" value={sellingPrice} onChange={e => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none font-black text-amber-600" />
                  </div>
                  
                  {/* 🔴 Category Dropdown 🔴 */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      value={category} 
                      onChange={e => setCategory(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none font-bold text-slate-800 cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 🔴 Image Browse & Upload 🔴 */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Item Image</label>
                    <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${image ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50 hover:border-amber-400 hover:bg-slate-100'}`}>
                      <div className="flex items-center gap-2">
                        <ImageIcon className={`w-4 h-4 ${image ? 'text-amber-500' : 'text-slate-400'}`} />
                        <span className={`text-sm font-bold ${image ? 'text-amber-600' : 'text-slate-500'}`}>
                          {image ? 'Image Selected' : 'Browse Image...'}
                        </span>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Recipe Builder */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recipe Builder (BOM)</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ingredients required per serving</p>
                  </div>
                  <button type="button" onClick={addRecipeRow} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-400 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm">
                    <Plus size={14} /> Add Ingredient
                  </button>
                </div>

                {recipe.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 flex flex-col items-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <AlertCircle size={24} className="mb-2 opacity-50" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No ingredients added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recipe.map((row, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Ingredient</label>
                          <select 
                            value={row.ingredient_id} 
                            onChange={e => updateRecipeRow(index, 'ingredient_id', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20"
                          >
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Quantity</label>
                          <input 
                            type="number" min="0.01" step="0.01" required
                            value={row.quantity_required} 
                            onChange={e => updateRecipeRow(index, 'quantity_required', Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 text-center"
                          />
                        </div>
                        <div className="pt-4">
                          <button type="button" onClick={() => removeRecipeRow(index)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-amber-200 transition-colors disabled:opacity-50">
                {isSubmitting ? 'Saving Menu Item...' : 'Create Menu Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuAndRecipes;