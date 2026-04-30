-- Trigger para descontar/devolver stock al cambiar estado de pedido
CREATE OR REPLACE FUNCTION public.adjust_stock_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  it RECORD;
BEGIN
  -- Cambió A entregado: descontar stock
  IF (TG_OP = 'UPDATE' AND NEW.status = 'entregado' AND OLD.status IS DISTINCT FROM 'entregado') THEN
    FOR it IN SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id LOOP
      UPDATE public.products
      SET stock = GREATEST(0, stock - it.quantity)
      WHERE id = it.product_id;
    END LOOP;
  END IF;

  -- Salió DE entregado: devolver stock
  IF (TG_OP = 'UPDATE' AND OLD.status = 'entregado' AND NEW.status IS DISTINCT FROM 'entregado') THEN
    FOR it IN SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id LOOP
      UPDATE public.products
      SET stock = stock + it.quantity
      WHERE id = it.product_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_adjust_stock_on_delivery ON public.orders;
CREATE TRIGGER trg_adjust_stock_on_delivery
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.adjust_stock_on_delivery();

-- Permitir al admin eliminar pedidos
CREATE POLICY "admin delete orders"
ON public.orders FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Permitir al admin eliminar order_items (en cascada lógica)
CREATE POLICY "admin delete order items"
ON public.order_items FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Permitir al admin eliminar perfiles
CREATE POLICY "admin delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
