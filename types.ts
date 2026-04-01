export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  SALESMAN = 'SALESMAN',
  STORE_OWNER = 'STORE_OWNER'
}

export interface UserPermissions {
  inventory_edit: boolean;
  inventory_delete: boolean;
  sales_delete: boolean;
  purchase_delete: boolean;
  customers_edit: boolean;
  customers_delete: boolean;
  suppliers_edit: boolean;
  suppliers_delete: boolean;
  expenses_edit: boolean;
  expenses_delete: boolean;
  user_control_access: boolean;
  settings_access: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  restaurant_id: string;
  name: string;
  location: string;
  monthlyFee?: number; // বিলিং সিস্টেমের জন্য
  billingStartMonth?: string; // বিলিং শুরুর মাসের জন্য
  created_at: string;
}

export interface User {
  id: string;
  restaurant_id: string;
  branch_id?: string; // Optional: specific branch or all if undefined
  name: string;
  phone?: string; 
  role: UserRole | string;
  avatar?: string;
  password?: string;
  permissions?: UserPermissions;
  created_at: string;
}

export interface Ingredient {
  id: string;
  restaurant_id: string;
  branch_id: string; // Scoped to branch
  name: string;
  unit: string;
  stock_quantity: number;
  unit_cost: number;
  reorder_level: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  selling_price: number;
  category?: string;
  recipe?: RecipeItem[];
  image?: string;
}

export interface RecipeItem {
  ingredient_id: string;
  ingredient_name?: string;
  quantity_required: number;
  unit?: string;
  cost?: number;
}

export enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
  BKASH = 'bKash',
  NAGAD = 'Nagad',
  OTHER = 'Other'
}

export interface Sale {
  id: string;
  restaurant_id: string;
  branch_id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  total_price: number;
  total_cost: number;
  sold_at: string;
  payment_method?: PaymentMethod | string; 
  customer_name?: string;
  customer_phone?: string;
}

export interface Expense {
  id: string;
  restaurant_id: string;
  branch_id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface PurchaseLog {
  id: string;
  restaurant_id: string;
  branch_id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier_name?: string;
  date: string;
  linked_expense_id?: string; 
}

export interface FundTransfer {
  id: string;
  date: string;
  from_account: string; 
  to_account: string;   
  amount: number;
  reference: string;
}

export interface StorePayment {
  id: string;
  branch_id: string;
  monthYear: string; 
  amountPaid: number;
  paymentDate: string;
  status: 'PENDING' | 'PAID' | 'REJECTED' | 'DUE';
  trxId?: string;
}

export enum View {
  Dashboard = 'dashboard',
  Inventory = 'inventory',
  Menu = 'menu',
  Sales = 'sales',
  Accounting = 'accounting',
  SmartInsights = 'insights',
  Users = 'users',           // 🔴 নতুন পেজ
  Settings = 'settings',     // 🔴 নতুন পেজ
  FundManagement = 'fund-management',
  Wastage = 'wastage'
}