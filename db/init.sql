DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  categories TEXT[] NOT NULL,
  tags TEXT[] NOT NULL,
  stock INTEGER NOT NULL CHECK (stock >= 0)
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  favorite_categories TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL
);

INSERT INTO products (id, name, description, price, categories, tags, stock) VALUES
  ('p-100', 'Notebook Pro 14', 'Notebook compacto com 16GB RAM e SSD 512GB', 5999.90,
    ARRAY['eletronicos', 'computadores'], ARRAY['destaque', 'novo'], 8),
  ('p-101', 'Smartphone XZoom', 'Smartphone com câmera tripla e bateria 5000mAh', 2999.00,
    ARRAY['eletronicos', 'celulares'], ARRAY['mais-vendido'], 15),
  ('p-102', 'Fone Bluetooth Sound+', 'Fones com cancelamento ativo de ruído', 699.50,
    ARRAY['eletronicos', 'audio'], ARRAY['acessorios'], 25),
  ('p-103', 'Cafeteira SmartBrew', 'Cafeteira inteligente com integração por aplicativo', 899.00,
    ARRAY['casa', 'cozinha'], ARRAY['smart-home'], 12),
  ('p-104', 'Teclado Mecânico RGB Nimbus', 'Teclado mecânico com switches azuis e iluminação RGB', 499.90,
    ARRAY['eletronicos', 'perifericos'], ARRAY['gamer'], 30);

INSERT INTO users (id, name, email, favorite_categories) VALUES
  ('u-1', 'Ana Lima', 'ana@example.com', ARRAY['eletronicos', 'gamer']),
  ('u-2', 'Bruno Martins', 'bruno@example.com', ARRAY['casa', 'cozinha']),
  ('u-3', 'Camila Torres', 'camila@example.com', ARRAY['eletronicos', 'audio']);
