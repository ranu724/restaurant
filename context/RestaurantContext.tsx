import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Ingredient, MenuItem, Sale, Expense, Branch, User, PaymentMethod, PurchaseLog, FundTransfer, StorePayment, UserRole } from '../types';
import { supabase } from '../lib/supabase'; 

interface RestaurantContextType {
  ingredients: Ingredient[];
  allIngredients: Ingredient[];
  menuItems: MenuItem[];
  sales: Sale[];
  expenses: Expense[];
  purchaseLogs: PurchaseLog[];
  branches: Branch[];
  users: User[];
  transfers: FundTransfer[]; 
  payments: StorePayment[];
  
  selectedBranchId: string | 'all'; 
  setSelectedBranchId: (id: string | 'all') => void;
  
  isLoggedIn: boolean;
  currentUser: User | null; 
  restaurantName: string;
  currentAdminName: string;
  
  login: (username: string, password: string) => boolean; 
  logout: () => void;
  updateRestaurantName: (name: string) => void;
  updateAdminName: (name: string) => void;
  
  // 🔴 addSale ফাংশনে discount অপশন যুক্ত করা হলো
  addSale: (menuItemId: string, quantity: number, paymentMethod: PaymentMethod | string, discount?: number) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'restaurant_id' | 'branch_id'>) => void;
  addPurchase: (purchase: Omit<PurchaseLog, 'id' | 'restaurant_id' | 'branch_id' | 'linked_expense_id'>) => void;
  addIngredient: (ing: Omit<Ingredient, 'id' | 'restaurant_id'>) => void;
  updateIngredient: (id: string, ing: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'restaurant_id'>) => void;
  deleteMenuItem: (id: string) => void;
  
  addBranch: (branch: Omit<Branch, 'id' | 'restaurant_id' | 'created_at'>) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void; 
  deleteBranch: (id: string) => void;
  
  addUser: (user: Omit<User, 'id' | 'restaurant_id' | 'created_at'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void; 
  deleteUser: (id: string) => void;
  
  addTransfer: (transfer: Omit<FundTransfer, 'id'>) => void; 
  addPayment: (payment: Omit<StorePayment, 'id'>) => void; 
  updatePayment: (id: string, updates: Partial<StorePayment>) => void; 
  
  calculateMenuItemCost: (item: MenuItem, branchId?: string) => number;
  exportBackup: (branchId: string, branchName: string) => void; 
  importBackup: (branchId: string, branchName: string, jsonData: string) => Promise<void>; 
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLog[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transfers, setTransfers] = useState<FundTransfer[]>([]); 
  const [payments, setPayments] = useState<StorePayment[]>([]); 
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  const [currentAdminName, setCurrentAdminName] = useState('Admin');
  const [selectedBranchId, setSelectedBranchId] = useState<string | 'all'>('all'); 

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          { data: branchesData }, { data: usersData }, { data: ingredientsData },
          { data: menuItemsData }, { data: salesData }, { data: expensesData },
          { data: purchaseLogsData }, { data: transfersData }, { data: paymentsData }
        ] = await Promise.all([
          supabase.from('branches').select('*'),
          supabase.from('users').select('*'),
          supabase.from('ingredients').select('*'),
          supabase.from('menu_items').select('*'),
          supabase.from('sales').select('*').order('sold_at', { ascending: false }),
          supabase.from('expenses').select('*').order('date', { ascending: false }),
          supabase.from('purchase_logs').select('*').order('date', { ascending: false }),
          supabase.from('fund_transfers').select('*'),
          supabase.from('store_payments').select('*')
        ]);

        if (branchesData) setBranches(branchesData);
        if (ingredientsData) setIngredients(ingredientsData);
        if (menuItemsData) setMenuItems(menuItemsData);
        if (salesData) setSales(salesData);
        if (expensesData) setExpenses(expensesData);
        if (purchaseLogsData) setPurchaseLogs(purchaseLogsData);
        if (transfersData) setTransfers(transfersData);
        if (paymentsData) setPayments(paymentsData);

        if (usersData && usersData.length > 0) {
          setUsers(usersData);
        } else {
          const defaultAdmin: User = { 
            id: 'u1', restaurant_id: 'r1', name: 'Super Admin', role: UserRole.SUPER_ADMIN, 
            password: 'admin123', avatar: 'https://ui-avatars.com/api/?name=Admin', 
            created_at: new Date().toISOString() 
          };
          await supabase.from('users').insert([defaultAdmin]);
          setUsers([defaultAdmin]);
        }
      } catch (error) {
        console.error("Error fetching data from Supabase:", error);
      }
    };

    fetchAllData();

    const session = localStorage.getItem('resto_session');
    if (session) {
      const parsedUser = JSON.parse(session);
      setCurrentUser(parsedUser);
      setIsLoggedIn(true);
      if (parsedUser.role !== UserRole.SUPER_ADMIN && parsedUser.branch_id) {
        setSelectedBranchId(parsedUser.branch_id);
      } else {
        setSelectedBranchId('all');
      }
    }
  }, []);

  const login = (username: string, password: string) => {
    const inputId = username.trim().toLowerCase();
    
    const user = users.find(u => {
      const matchPhone = u.phone && u.phone.trim() === inputId;
      const matchName = u.name && u.name.trim().toLowerCase() === inputId;
      const matchAdminShortcut = inputId === 'admin' && u.role === UserRole.SUPER_ADMIN;
      
      return (matchPhone || matchName || matchAdminShortcut) && u.password === password;
    });

    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(user);
      localStorage.setItem('resto_session', JSON.stringify(user));
      
      if (user.role !== UserRole.SUPER_ADMIN && user.branch_id) {
        setSelectedBranchId(user.branch_id);
      } else {
        setSelectedBranchId('all');
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('resto_session');
  };

  const findBranchIngredient = useCallback((ingredientId: string, branchId: string) => {
    const template = ingredients.find(ing => ing.id === ingredientId);
    if (!template) return null;
    return ingredients.find(ing => ing.name === template.name && ing.branch_id === branchId) || template;
  }, [ingredients]);

  const calculateMenuItemCost = useCallback((menuItem: MenuItem, branchId?: string) => {
    if (!menuItem.recipe || menuItem.recipe.length === 0) return 0;
    const targetBranch = branchId || (selectedBranchId === 'all' ? branches[0]?.id : selectedBranchId);
    return menuItem.recipe.reduce((total, recipeItem) => {
      const branchIng = findBranchIngredient(recipeItem.ingredient_id, targetBranch);
      return total + (branchIng ? (branchIng.unit_cost * recipeItem.quantity_required) : 0);
    }, 0);
  }, [findBranchIngredient, selectedBranchId, branches]);

  const filteredIngredients = useMemo(() => selectedBranchId === 'all' ? ingredients : ingredients.filter(i => i.branch_id === selectedBranchId), [ingredients, selectedBranchId]);
  const filteredMenuItems = useMemo(() => selectedBranchId === 'all' ? [] : menuItems.filter(m => m.branch_id === selectedBranchId), [menuItems, selectedBranchId]);
  const filteredSales = useMemo(() => selectedBranchId === 'all' ? sales : sales.filter(s => s.branch_id === selectedBranchId), [sales, selectedBranchId]);
  const filteredExpenses = useMemo(() => selectedBranchId === 'all' ? expenses : expenses.filter(e => e.branch_id === selectedBranchId), [expenses, selectedBranchId]);

  // 🔴 Discount Logic Applied to addSale 🔴
  const addSale = useCallback(async (menuItemId: string, quantity: number, paymentMethod: PaymentMethod | string, discount: number = 0) => {
    if (selectedBranchId === 'all') return alert("⚠️ Please select a specific branch from the top menu to record a sale.");

    const menuItem = menuItems.find(m => m.id === menuItemId);
    if (!menuItem) return;

    const unitCost = calculateMenuItemCost(menuItem, selectedBranchId);
    const newSale: Sale = {
      id: `sale_${Math.random().toString(36).substr(2, 9)}`,
      restaurant_id: 'r1',
      branch_id: selectedBranchId,
      menu_item_id: menuItem.id,
      menu_item_name: menuItem.name,
      quantity,
      total_price: (menuItem.selling_price * quantity) - discount, // 🔴 ডিসকাউন্ট বাদ দিয়ে সেভ হবে
      total_cost: unitCost * quantity,
      payment_method: paymentMethod, 
      sold_at: new Date().toISOString()
    };

    setSales(prev => [newSale, ...prev]);
    await supabase.from('sales').insert([newSale]);

    setIngredients(prev => prev.map(ing => {
      if (ing.branch_id !== selectedBranchId) return ing;
      const recipePart = menuItem.recipe?.find(r => {
        const branchIng = findBranchIngredient(r.ingredient_id, selectedBranchId);
        return branchIng?.id === ing.id;
      });
      if (recipePart) {
        const newStock = ing.stock_quantity - (recipePart.quantity_required * quantity);
        supabase.from('ingredients').update({ stock_quantity: newStock }).eq('id', ing.id).then();
        return { ...ing, stock_quantity: newStock };
      }
      return ing;
    }));
  }, [menuItems, ingredients, selectedBranchId, calculateMenuItemCost, findBranchIngredient]);

  const addPurchase = useCallback(async (purchase: Omit<PurchaseLog, 'id' | 'restaurant_id' | 'branch_id' | 'linked_expense_id'>) => {
    if (selectedBranchId === 'all') return alert("⚠️ Please select a specific branch from the top menu to add inventory stock.");

    const logId = `pur_${Math.random().toString(36).substr(2, 9)}`;
    const newLog: PurchaseLog = { ...purchase, id: logId, restaurant_id: 'r1', branch_id: selectedBranchId };

    setPurchaseLogs(prev => [newLog, ...prev]);
    
    setIngredients(prev => prev.map(ing => {
      if (ing.id === purchase.ingredient_id && ing.branch_id === selectedBranchId) {
        const updatedIng = { ...ing, stock_quantity: Number(ing.stock_quantity) + Number(purchase.quantity), unit_cost: purchase.unit_cost };
        supabase.from('ingredients').update({ stock_quantity: updatedIng.stock_quantity, unit_cost: updatedIng.unit_cost }).eq('id', ing.id).then();
        return updatedIng;
      }
      return ing;
    }));

    await supabase.from('purchase_logs').insert([newLog]);
  }, [selectedBranchId, ingredients]);

  const exportBackup = (branchId: string, branchName: string) => {
    const backup = { 
      branchName, 
      backupDate: new Date().toISOString(),
      ingredients: ingredients.filter(i => i.branch_id === branchId),
      menuItems: menuItems.filter(m => m.branch_id === branchId),
      sales: sales.filter(s => s.branch_id === branchId), 
      expenses: expenses.filter(e => e.branch_id === branchId), 
      purchaseLogs: purchaseLogs.filter(p => p.branch_id === branchId),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RestoAccrue_${branchName.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importBackup = async (branchId: string, branchName: string, jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.ingredients && data.ingredients.length > 0) {
         await supabase.from('ingredients').upsert(data.ingredients);
         setIngredients(prev => [...prev.filter(i => i.branch_id !== branchId), ...data.ingredients]);
      }
      if (data.menuItems && data.menuItems.length > 0) {
         await supabase.from('menu_items').upsert(data.menuItems);
         setMenuItems(prev => [...prev.filter(m => m.branch_id !== branchId), ...data.menuItems]);
      }
      if (data.sales && data.sales.length > 0) {
         await supabase.from('sales').upsert(data.sales);
         setSales(prev => [...prev.filter(i => i.branch_id !== branchId), ...data.sales]);
      }
      if (data.expenses && data.expenses.length > 0) {
         await supabase.from('expenses').upsert(data.expenses);
         setExpenses(prev => [...prev.filter(i => i.branch_id !== branchId), ...data.expenses]);
      }
      alert(`Backup restored successfully for ${branchName}!`);
    } catch (e) {
      alert('Failed to restore backup. Invalid file format.');
    }
  };

  const createUpdater = <T extends { id: string }>(table: string, setter: React.Dispatch<React.SetStateAction<T[]>>) => 
    async (id: string, updates: any) => {
      setter(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      await supabase.from(table).update(updates).eq('id', id);
    };

  const createDeleter = <T extends { id: string }>(table: string, setter: React.Dispatch<React.SetStateAction<T[]>>) => 
    async (id: string) => {
      setter(prev => prev.filter(i => i.id !== id));
      await supabase.from(table).delete().eq('id', id);
    };

  return (
    <RestaurantContext.Provider value={{
      ingredients: filteredIngredients, allIngredients: ingredients,
      menuItems: filteredMenuItems, 
      sales: filteredSales, expenses: filteredExpenses, purchaseLogs,
      branches, users, transfers, payments, 
      selectedBranchId, setSelectedBranchId, isLoggedIn, currentUser, restaurantName, currentAdminName,
      login, logout,
      updateRestaurantName: (name) => { setRestaurantName(name); localStorage.setItem('resto_settings', JSON.stringify({ restaurantName: name })); },
      updateAdminName: (name) => { setCurrentAdminName(name); },
      
      addSale, addPurchase, calculateMenuItemCost, exportBackup, importBackup,
      
      addIngredient: async (ing) => {
        if (selectedBranchId === 'all') return alert("⚠️ Please select a specific branch to add ingredients.");
        const newItem = { ...ing, id: `ing_${Math.random().toString(36).substr(2, 9)}`, restaurant_id: 'r1', branch_id: selectedBranchId };
        setIngredients(prev => [newItem as Ingredient, ...prev]);
        await supabase.from('ingredients').insert([newItem]);
      },
      updateIngredient: createUpdater('ingredients', setIngredients),
      deleteIngredient: createDeleter('ingredients', setIngredients),
      
      addExpense: async (e) => {
        if (selectedBranchId === 'all') return alert("⚠️ Please select a specific branch to add an expense.");
        const newExpense = { ...e, id: `exp_${Math.random().toString(36).substr(2, 9)}`, restaurant_id: 'r1', branch_id: selectedBranchId };
        setExpenses(prev => [newExpense as Expense, ...prev]);
        await supabase.from('expenses').insert([newExpense]);
      },

      addMenuItem: async (item) => {
        if (selectedBranchId === 'all') return alert("⚠️ Please select a specific branch to add a menu item.");
        const newItem = { ...item, id: `mnu_${Math.random().toString(36).substr(2, 9)}`, restaurant_id: 'r1', branch_id: selectedBranchId };
        setMenuItems(prev => [newItem as MenuItem, ...prev]);
        await supabase.from('menu_items').insert([newItem]);
      },
      deleteMenuItem: createDeleter('menu_items', setMenuItems),
      
      addBranch: async (b) => {
        const newBranch = { ...b, id: `br_${Math.random().toString(36).substr(2, 9)}`, restaurant_id: 'r1', created_at: new Date().toISOString() };
        setBranches(prev => [...prev, newBranch as Branch]);
        await supabase.from('branches').insert([newBranch]);
      },
      updateBranch: createUpdater('branches', setBranches),
      deleteBranch: createDeleter('branches', setBranches),
      
      addUser: async (u) => {
        const newUser = { ...u, id: `usr_${Math.random().toString(36).substr(2, 9)}`, restaurant_id: 'r1', created_at: new Date().toISOString() };
        setUsers(prev => [...prev, newUser as User]);
        await supabase.from('users').insert([newUser]);
      },
      updateUser: async (id, updates) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
        await supabase.from('users').update(updates).eq('id', id);
        if (currentUser?.id === id) {
          const updatedUser = { ...currentUser, ...updates } as User;
          setCurrentUser(updatedUser);
          localStorage.setItem('resto_session', JSON.stringify(updatedUser));
        }
      },
      deleteUser: createDeleter('users', setUsers),
      
      addTransfer: async (item) => {
        const newItem = { ...item, id: `trf_${Math.random().toString(36).substr(2, 9)}` };
        setTransfers(prev => [newItem as FundTransfer, ...prev]);
        await supabase.from('fund_transfers').insert([newItem]);
      },
      addPayment: async (item) => {
        const newItem = { ...item, id: `pay_${Math.random().toString(36).substr(2, 9)}` };
        setPayments(prev => [newItem as StorePayment, ...prev]);
        await supabase.from('store_payments').insert([newItem]);
      },
      updatePayment: createUpdater('store_payments', setPayments)
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error('useRestaurant must be used within a RestaurantProvider');
  return context;
};