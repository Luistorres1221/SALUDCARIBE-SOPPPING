-- Estado por ítem de pedido
DO $$ BEGIN
  CREATE TYPE public.order_item_status AS ENUM ('pendiente','entregado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS status public.order_item_status NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Permitir que el admin actualice ítems
DROP POLICY IF EXISTS "admin update order items" ON public.order_items;
CREATE POLICY "admin update order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger: ajustar inventario por ítem al cambiar status
CREATE OR REPLACE FUNCTION public.adjust_stock_on_item_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status = 'entregado' AND OLD.status IS DISTINCT FROM 'entregado') THEN
    UPDATE public.products
      SET stock = GREATEST(0, stock - NEW.quantity)
      WHERE id = NEW.product_id;
    NEW.delivered_at := now();
  END IF;

  IF (TG_OP = 'UPDATE' AND OLD.status = 'entregado' AND NEW.status IS DISTINCT FROM 'entregado') THEN
    UPDATE public.products
      SET stock = stock + OLD.quantity
      WHERE id = OLD.product_id;
    NEW.delivered_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_adjust_stock_on_item_delivery ON public.order_items;
CREATE TRIGGER trg_adjust_stock_on_item_delivery
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.adjust_stock_on_item_delivery();

-- Reemplazar trigger a nivel de orden: ahora marca/desmarca todos los ítems
CREATE OR REPLACE FUNCTION public.adjust_stock_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Cuando la orden pasa a entregado, marcar todos los ítems como entregados
  -- (el trigger por ítem se encarga del stock)
  IF (TG_OP = 'UPDATE' AND NEW.status = 'entregado' AND OLD.status IS DISTINCT FROM 'entregado') THEN
    UPDATE public.order_items
      SET status = 'entregado'
      WHERE order_id = NEW.id AND status <> 'entregado';
  END IF;

  -- Cuando sale de entregado, devolver todos los ítems a pendiente
  IF (TG_OP = 'UPDATE' AND OLD.status = 'entregado' AND NEW.status IS DISTINCT FROM 'entregado') THEN
    UPDATE public.order_items
      SET status = 'pendiente'
      WHERE order_id = NEW.id AND status = 'entregado';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_adjust_stock_on_delivery ON public.orders;
CREATE TRIGGER trg_adjust_stock_on_delivery
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.adjust_stock_on_delivery();