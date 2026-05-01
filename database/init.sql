-- Salud Caribe Shopping Database
-- Migrated from Supabase to MySQL

-- Create Database
CREATE DATABASE IF NOT EXISTS salud_caribe_db;
USE salud_caribe_db;

-- Create user roles enum equivalent (using ENUM type in MySQL)
-- CREATE TYPE equivalent: we'll use ENUM directly in column definitions

-- profiles table
CREATE TABLE profiles (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  area VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profiles_id_unique UNIQUE (id)
);

-- user_roles table
CREATE TABLE user_roles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  role ENUM('admin', 'medico', 'odontologia', 'enfermeria', 'administrativo', 'aseo', 'papeleria') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_role (user_id, role),
  CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_user_roles_user_id (user_id)
);

-- categories table
CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_categories_slug (slug)
);

-- products table
CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  category_id VARCHAR(36),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_products_category_id (category_id),
  INDEX idx_products_active (active),
  INDEX idx_products_sku (sku)
);

-- cart_items table
CREATE TABLE cart_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_product (user_id, product_id),
  CONSTRAINT fk_cart_items_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_cart_items_user_id (user_id)
);

-- orders table
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  status ENUM('pendiente', 'aprobado', 'pagado', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at)
);

-- order_items table
CREATE TABLE order_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(12,2) NOT NULL,
  status ENUM('pendiente', 'entregado') NOT NULL DEFAULT 'pendiente',
  delivered_at TIMESTAMP NULL,
  CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product_id FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_product_id (product_id)
);

-- roles_catalog table
CREATE TABLE roles_catalog (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  key ENUM('admin', 'medico', 'odontologia', 'enfermeria', 'administrativo', 'aseo', 'papeleria') NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_roles_catalog_key (key)
);

-- Insert default roles
INSERT INTO roles_catalog (key, label, description) VALUES
  ('admin', 'Administrador', 'Acceso total al sistema'),
  ('medico', 'Médico', 'Personal médico'),
  ('odontologia', 'Auxiliar de Odontología', 'Área de odontología'),
  ('enfermeria', 'Enfermería', 'Personal de enfermería'),
  ('administrativo', 'Administrativo', 'Personal administrativo'),
  ('aseo', 'Aseo', 'Personal de aseo'),
  ('papeleria', 'Papelería', 'Insumos y papelería')
ON DUPLICATE KEY UPDATE 
  label = VALUES(label),
  description = VALUES(description);

-- Trigger for set_updated_at on products
DELIMITER $$
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- Trigger for set_updated_at on orders
DELIMITER $$
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- Trigger for set_updated_at on roles_catalog
DELIMITER $$
CREATE TRIGGER trg_roles_catalog_updated_at
BEFORE UPDATE ON roles_catalog
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- Trigger for adjust_stock_on_item_delivery
DELIMITER $$
CREATE TRIGGER trg_adjust_stock_on_item_delivery
BEFORE UPDATE ON order_items
FOR EACH ROW
BEGIN
  IF (NEW.status = 'entregado' AND OLD.status IS DISTINCT FROM 'entregado') THEN
    UPDATE products
    SET stock = GREATEST(0, stock - NEW.quantity)
    WHERE id = NEW.product_id;
    SET NEW.delivered_at = CURRENT_TIMESTAMP;
  END IF;

  IF (OLD.status = 'entregado' AND NEW.status IS DISTINCT FROM 'entregado') THEN
    UPDATE products
    SET stock = stock + OLD.quantity
    WHERE id = OLD.product_id;
    SET NEW.delivered_at = NULL;
  END IF;
END$$
DELIMITER ;

-- Trigger for adjust_stock_on_delivery (order level)
DELIMITER $$
CREATE TRIGGER trg_adjust_stock_on_delivery
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  -- When order status becomes 'entregado', mark all items as delivered
  IF (NEW.status = 'entregado' AND OLD.status IS DISTINCT FROM 'entregado') THEN
    UPDATE order_items
    SET status = 'entregado'
    WHERE order_id = NEW.id AND status <> 'entregado';
  END IF;

  -- When order status changes away from 'entregado', set all items back to pending
  IF (OLD.status = 'entregado' AND NEW.status IS DISTINCT FROM 'entregado') THEN
    UPDATE order_items
    SET status = 'pendiente'
    WHERE order_id = NEW.id AND status = 'entregado';
  END IF;
END$$
DELIMITER ;

-- Sample data (optional)
-- Insert admin user
INSERT INTO profiles (id, full_name, area) VALUES 
  ('admin-user-001', 'Administrador', 'Administración')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Insert admin role
INSERT INTO user_roles (user_id, role) VALUES 
  ('admin-user-001', 'admin')
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- Sample categories
INSERT INTO categories (name, slug, description, icon) VALUES 
  ('Medicamentos', 'medicamentos', 'Medicamentos y fármacos', 'pill'),
  ('Insumos Médicos', 'insumos-medicos', 'Insumos médicos diversos', 'syringe'),
  ('Papelería', 'papeleria', 'Artículos de papelería', 'file-text'),
  ('Equipos', 'equipos', 'Equipos médicos', 'activity')
ON DUPLICATE KEY UPDATE slug = VALUES(slug);

-- Grant privileges
GRANT ALL PRIVILEGES ON salud_caribe_db.* TO 'salud_user'@'%';
FLUSH PRIVILEGES;
