
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Restaurants Table (Tenants)
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    restaurant_id UUID REFERENCES restaurants(id),
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'manager', 'staff'))
);

-- 3. Branches Table
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ingredients Table (Raw Materials)
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
    branch_id UUID REFERENCES branches(id) NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL, -- kg, gm, ltr, ml, pcs
    stock_quantity DECIMAL(12,2) DEFAULT 0,
    unit_cost DECIMAL(12,2) DEFAULT 0,
    reorder_level DECIMAL(12,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Menu Items Table
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
    name TEXT NOT NULL,
    selling_price DECIMAL(12,2) NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Recipes Table (BOM)
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_required DECIMAL(12,2) NOT NULL,
    UNIQUE(menu_item_id, ingredient_id)
);

-- 7. Sales Table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
    branch_id UUID REFERENCES branches(id) NOT NULL,
    menu_item_id UUID REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    sold_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
    branch_id UUID REFERENCES branches(id) NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE
);

-- DATABASE FUNCTION: Atomic Sale Process (BOM Deduction)
-- This function handles the sale and inventory update in one transaction.
CREATE OR REPLACE FUNCTION process_sale(
    p_restaurant_id UUID,
    p_branch_id UUID,
    p_menu_item_id UUID,
    p_quantity INTEGER,
    p_total_price DECIMAL,
    p_total_cost DECIMAL
) RETURNS VOID AS $$
DECLARE
    r_recipe RECORD;
BEGIN
    -- 1. Insert Sales Record
    INSERT INTO sales (restaurant_id, branch_id, menu_item_id, quantity, total_price, total_cost)
    VALUES (p_restaurant_id, p_branch_id, p_menu_item_id, p_quantity, p_total_price, p_total_cost);

    -- 2. Deduct Inventory based on Recipes (BOM)
    -- We join recipes with ingredients to find the specific stock at THIS branch
    FOR r_recipe IN 
        SELECT r.ingredient_id, r.quantity_required, i.name
        FROM recipes r
        JOIN ingredients i ON r.ingredient_id = i.id
        WHERE r.menu_item_id = p_menu_item_id
    LOOP
        UPDATE ingredients
        SET stock_quantity = stock_quantity - (r_recipe.quantity_required * p_quantity)
        WHERE name = r_recipe.name AND branch_id = p_branch_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- RLS POLICIES
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation" ON ingredients 
    USING (restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Sales Isolation" ON sales 
    USING (restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid()));
