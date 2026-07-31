/*
# Create site_settings and products tables for BaghdadLaptop

1. New Tables
- `site_settings`: single-row table holding the site-wide configuration
  - `id` (int, primary key, always 1)
  - `site_name` (text, default 'BaghdadLaptop')
  - `logo_url` (text, nullable — URL or data URI for uploaded logo)
  - `color_scheme` (text, default 'mono' — one of: mono, midnight, forest, crimson, sand)
  - `marquee_enabled` (boolean, default true)
  - `marquee_text_1` (text, default 'Free delivery across Baghdad')
  - `marquee_text_2` (text, default 'Cash on Delivery available')
  - `marquee_text_3` (text, default '7-day money-back guarantee')
  - `contact_phone_1` (text, default '+964 770 000 0000')
  - `contact_phone_2` (text, default '+964 750 000 0000')
  - `contact_email_1` (text, default 'info@baghdadlaptop.com')
  - `contact_email_2` (text, default 'support@baghdadlaptop.com')
  - `contact_address` (text, default 'Al-Rasheed Street, Baghdad, Iraq')
  - `social_facebook` (text, default '')
  - `social_instagram` (text, default '')
  - `social_whatsapp` (text, default '')
  - `social_telegram` (text, default '')
  - `delivery_fee` (numeric, default 150)
  - `updated_at` (timestamptz, default now())
- `products`: product catalog
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `brand` (text, not null)
  - `price` (numeric, not null)
  - `stock` (int, default 0)
  - `specs` (text)
  - `image` (text)
  - `status` (text, default 'active')
  - `created_at` (timestamptz, default now())
- `orders`: customer orders
  - `id` (uuid, primary key)
  - `order_number` (text)
  - `customer_name` (text)
  - `customer_email` (text)
  - `customer_phone` (text)
  - `customer_address` (text)
  - `customer_city` (text)
  - `customer_pincode` (text)
  - `notes` (text)
  - `items` (jsonb)
  - `subtotal` (numeric)
  - `delivery_fee` (numeric)
  - `total` (numeric)
  - `payment_method` (text, default 'COD')
  - `status` (text, default 'Pending')
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD on all tables (single-tenant, no auth screen for customers).
- The dashboard uses a local session check only; data is intentionally shared.
3. Notes
- site_settings is enforced as a single row via primary key = 1.
- A trigger keeps updated_at current on site_settings.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name text NOT NULL DEFAULT 'BaghdadLaptop',
  logo_url text,
  color_scheme text NOT NULL DEFAULT 'mono',
  marquee_enabled boolean NOT NULL DEFAULT true,
  marquee_text_1 text NOT NULL DEFAULT 'Free delivery across Baghdad',
  marquee_text_2 text NOT NULL DEFAULT 'Cash on Delivery available',
  marquee_text_3 text NOT NULL DEFAULT '7-day money-back guarantee',
  contact_phone_1 text NOT NULL DEFAULT '+964 770 000 0000',
  contact_phone_2 text NOT NULL DEFAULT '+964 750 000 0000',
  contact_email_1 text NOT NULL DEFAULT 'info@baghdadlaptop.com',
  contact_email_2 text NOT NULL DEFAULT 'support@baghdadlaptop.com',
  contact_address text NOT NULL DEFAULT 'Al-Rasheed Street, Baghdad, Iraq',
  social_facebook text NOT NULL DEFAULT '',
  social_instagram text NOT NULL DEFAULT '',
  social_whatsapp text NOT NULL DEFAULT '',
  social_telegram text NOT NULL DEFAULT '',
  delivery_fee numeric NOT NULL DEFAULT 150,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure the single row exists
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  price numeric NOT NULL,
  stock int NOT NULL DEFAULT 0,
  specs text,
  image text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_address text,
  customer_city text,
  customer_pincode text,
  notes text,
  items jsonb,
  subtotal numeric,
  delivery_fee numeric,
  total numeric,
  payment_method text NOT NULL DEFAULT 'COD',
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- site_settings policies
DROP POLICY IF EXISTS "anon_select_settings" ON site_settings;
CREATE POLICY "anon_select_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_settings" ON site_settings;
CREATE POLICY "anon_update_settings" ON site_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- products policies
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- orders policies
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- updated_at trigger for site_settings
CREATE OR REPLACE FUNCTION update_site_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_site_settings_timestamp();

-- Seed sample products
INSERT INTO products (name, brand, price, stock, specs, image, status) VALUES
  ('ProBook 14 Ultra', 'Dell', 74999, 12, 'Intel i7 / 16GB RAM / 512GB SSD / 14" FHD', 'https://images.unsplash.com/photo-1496181133206-56db36b71d1d?auto=format&fit=crop&w=600&q=80', 'active'),
  ('AirLite 13 Slim', 'HP', 52999, 24, 'Intel i5 / 8GB RAM / 256GB SSD / 13" QHD', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80', 'active'),
  ('GamerForce X17', 'Lenovo', 129999, 6, 'Ryzen 7 / 32GB / 1TB SSD / RTX 4060 / 17" 144Hz', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80', 'active'),
  ('BizBook 15 Pro', 'Asus', 61999, 18, 'Intel i5 / 16GB / 512GB SSD / 15.6" FHD', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80', 'active'),
  ('StudioBook 16 Creator', 'Asus', 99999, 8, 'Ryzen 9 / 32GB / 1TB SSD / 16" OLED / RTX 4070', 'https://images.unsplash.com/photo-1531492746076-1610796f342e?auto=format&fit=crop&w=600&q=80', 'active'),
  ('EduLite 12 Go', 'Acer', 34999, 40, 'Intel Celeron / 8GB / 128GB SSD / 12" HD', 'https://images.unsplash.com/photo-1611180575133-322e3e6e9b6c?auto=format&fit=crop&w=600&q=80', 'active'),
  ('UltraBook 15 Edge', 'Dell', 87999, 0, 'Intel i7 / 16GB / 1TB SSD / 15.6" 2.8K OLED', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80', 'active'),
  ('GamerForce X15 Air', 'Lenovo', 109999, 3, 'Ryzen 7 / 24GB / 1TB SSD / RTX 4050 / 15" 165Hz', 'https://images.unsplash.com/photo-1525547719195-98d1adfa5c0a?auto=format&fit=crop&w=600&q=80', 'active')
ON CONFLICT DO NOTHING;