
import { useState, useCallback, useMemo } from 'react';
import { Ingredient, MenuItem, Sale, Expense, Branch, User } from '../types';

const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', restaurant_id: 'r1', name: 'Downtown Hub', location: '123 Main St', created_at: new Date().toISOString() },
  { id: 'b2', restaurant_id: 'r1', name: 'Westside Bistro', location: '456 West Blvd', created_at: new Date().toISOString() }
];

const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: '1', restaurant_id: 'r1', branch_id: 'b1', name: 'Flour', unit: 'kg', stock_quantity: 50, unit_cost: 1.2, reorder_level: 10 },
  { id: '2', restaurant_id: 'r1', branch_id: 'b1', name: 'Ground Beef', unit: 'kg', stock_quantity: 20, unit_cost: 8.5, reorder_level: 5 },
  { id: '3', restaurant_id: 'r1', branch_id: 'b2', name: 'Flour', unit: 'kg', stock_quantity: 30, unit_cost: 1.3, reorder_level: 5 },
  { id: '4', restaurant_id: 'r1', branch_id: 'b2', name: 'Ground Beef', unit: 'kg', stock_quantity: 15, unit_cost: 9.0, reorder_level: 5 },
];

const INITIAL_MENU: MenuItem[] = [
  {
    id: 'm1',
    restaurant_id: 'r1',
    name: 'Classic Burger',
    selling_price: 12.99,
    category: 'Main',
    recipe: [
      { ingredient_id: '2', quantity_required: 0.15 }, // 150g Beef
    ]
  }
];

const INITIAL_USERS: User[] = [
  { id: 'u1', restaurant_id: 'r1', name: 'Admin HQ', role: 'admin', created_at: new Date().toISOString() },
  { id: 'u2', restaurant_id: 'r1', branch_id: 'b1', name: 'Downtown Manager', role: 'manager', created_at: new Date().toISOString() }
];

export const useRestaurantStore = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [restaurantName, setRestaurantName] = useState('RestoAccrue Corp');
  const [currentAdminName, setCurrentAdminName] = useState('Admin HQ');
  const [selectedBranchId, setSelectedBranchId] = useState<string | 'all'>('all');

  const login = (password: string) => {
    if (password === 'admin123') {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const findBranchIngredient = useCallback((ingredientId: string, branchId: string) => {
    const template = ingredients.find(ing => ing.id === ingredientId);
    if (!template) return null;
    return ingredients.find(ing => ing.name === template.name && ing.branch_id === branchId) || template;
  }, [ingredients]);

  const calculateMenuItemCost = useCallback((menuItem: MenuItem, branchId?: string) => {
    if (!menuItem.recipe || menuItem.recipe.length === 0) return 0;
    const targetBranch = branchId || (selectedBranchId === 'all' ? 'b1' : selectedBranchId);
    return menuItem.recipe.reduce((total, recipeItem) => {
      const branchIng = findBranchIngredient(recipeItem.ingredient_id, targetBranch);
      return total + (branchIng ? (branchIng.unit_cost * recipeItem.quantity_required) : 0);
    }, 0);
  }, [findBranchIngredient, selectedBranchId]);

  const filteredIngredients = useMemo(() => 
    selectedBranchId === 'all' ? ingredients : ingredients.filter(i => i.branch_id === selectedBranchId)
  , [ingredients, selectedBranchId]);

  const filteredSales = useMemo(() => 
    selectedBranchId === 'all' ? sales : sales.filter(s => s.branch_id === selectedBranchId)
  , [sales, selectedBranchId]);

  const filteredExpenses = useMemo(() => 
    selectedBranchId === 'all' ? expenses : expenses.filter(e => e.branch_id === selectedBranchId)
  , [expenses, selectedBranchId]);

  // Transactional Sale (Simulating Supabase RPC 'process_sale')
  const addSale = useCallback((menuItemId: string, quantity: number) => {
    if (selectedBranchId === 'all') {
      alert("Please select a specific branch to record a sale.");
      return;
    }

    const menuItem = menuItems.find(m => m.id === menuItemId);
    if (!menuItem) return;

    const unitCost = calculateMenuItemCost(menuItem, selectedBranchId);
    const totalCost = unitCost * quantity;
    const totalPrice = menuItem.selling_price * quantity;

    // Check BOM availability
    let canProcess = true;
    if (menuItem.recipe) {
      for (const r of menuItem.recipe) {
        const branchIng = findBranchIngredient(r.ingredient_id, selectedBranchId);
        if (!branchIng || branchIng.stock_quantity < r.quantity_required * quantity) {
          canProcess = false;
          break;
        }
      }
    }

    if (!canProcess) {
      alert("Insufficient stock at this branch for this recipe!");
      return;
    }

    // Insert Sale & Update Ingredients (Atomic Simulation)
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      restaurant_id: 'r1',
      branch_id: selectedBranchId,
      menu_item_id: menuItem.id,
      menu_item_name: menuItem.name,
      quantity,
      total_price: totalPrice,
      total_cost: totalCost,
      sold_at: new Date().toISOString()
    };

    setSales(prev => [newSale, ...prev]);

    setIngredients(prev => prev.map(ing => {
      if (ing.branch_id !== selectedBranchId) return ing;
      const recipePart = menuItem.recipe?.find(r => {
        const branchIng = findBranchIngredient(r.ingredient_id, selectedBranchId);
        return branchIng?.id === ing.id;
      });
      if (recipePart) {
        return { ...ing, stock_quantity: ing.stock_quantity - (recipePart.quantity_required * quantity) };
      }
      return ing;
    }));
  }, [menuItems, ingredients, selectedBranchId, calculateMenuItemCost, findBranchIngredient]);

  return {
    ingredients: filteredIngredients,
    allIngredients: ingredients,
    menuItems,
    sales: filteredSales,
    expenses: filteredExpenses,
    branches,
    users,
    selectedBranchId,
    setSelectedBranchId,
    isLoggedIn,
    restaurantName,
    currentAdminName,
    login,
    logout,
    updateRestaurantName: setRestaurantName,
    updateAdminName: setCurrentAdminName,
    addSale,
    addExpense: (e: any) => setExpenses(prev => [...prev, { ...e, id: Math.random().toString(36).substr(2, 9), restaurant_id: 'r1', branch_id: selectedBranchId as string }]),
    addIngredient: (ing: any) => setIngredients(prev => [...prev, { ...ing, id: Math.random().toString(36).substr(2, 9), restaurant_id: 'r1', branch_id: selectedBranchId as string }]),
    updateIngredient: (id: string, u: Partial<Ingredient>) => setIngredients(prev => prev.map(i => i.id === id ? {...i, ...u} : i)),
    deleteIngredient: (id: string) => setIngredients(prev => prev.filter(i => i.id !== id)),
    addMenuItem: (item: any) => setMenuItems(prev => [...prev, { ...item, id: Math.random().toString(36).substr(2, 9), restaurant_id: 'r1' }]),
    deleteMenuItem: (id: string) => setMenuItems(prev => prev.filter(m => m.id !== id)),
    addBranch: (b: any) => setBranches(prev => [...prev, { ...b, id: Math.random().toString(36).substr(2, 9), restaurant_id: 'r1', created_at: new Date().toISOString() }]),
    deleteBranch: (id: string) => setBranches(prev => prev.filter(b => b.id !== id)),
    addUser: (u: any) => setUsers(prev => [...prev, { ...u, id: Math.random().toString(36).substr(2, 9), restaurant_id: 'r1', created_at: new Date().toISOString() }]),
    deleteUser: (id: string) => setUsers(prev => prev.filter(u => u.id !== id)),
    calculateMenuItemCost
  };
};
