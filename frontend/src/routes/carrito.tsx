import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useCart, formatCOP } from "@/lib/cart-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, Package, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/carrito")({
  component: CartPage,
});

function CartPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { items, total, updateQty, removeItem, clear } = useCart();
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const checkout = async () => {
    if (!user || items.length === 0) return;
    setPaying(true);
    // 1. create order
    const { data: order, error } = await supabase
      .from("orders")
      .insert({ user_id: user.id, total, status: "pendiente" })
      .select()
      .single();
    if (error || !order) {
      toast.error("Error creando pedido");
      setPaying(false);
      return;
    }
    // 2. create items
    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.product.name,
      unit_price: i.product.price,
      quantity: i.quantity,
      subtotal: Number(i.product.price) * i.quantity,
    }));
    const { error: e2 } = await supabase.from("order_items").insert(orderItems);
    if (e2) {
      toast.error("Error agregando ítems");
      setPaying(false);
      return;
    }
    // 3. simulate payment → mark paid + decrement stock
    await supabase.from("orders").update({ status: "pagado", paid_at: new Date().toISOString() }).eq("id", order.id);
    for (const i of items) {
      await supabase.rpc; // noop; do simple decrement via update
      const newStock = Math.max(0, i.product.stock - i.quantity);
      await supabase.from("products").update({ stock: newStock }).eq("id", i.product_id);
    }
    await clear();
    setPaying(false);
    toast.success("¡Pago simulado exitoso!");
    navigate({ to: "/pedidos/$orderId", params: { orderId: order.id } });
  };

  if (loading || !user) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingBag className="w-6 h-6" /> Tu carrito
      </h1>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
          <Button asChild><Link to="/productos">Ver productos</Link></Button>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((i) => (
              <Card key={i.id} className="p-4 flex gap-4 items-center">
                <div className="w-20 h-20 rounded-md bg-muted overflow-hidden shrink-0">
                  {i.product.image_url ? (
                    <img src={i.product.image_url} alt={i.product.name} className="w-full h-full object-cover" />
                  ) : <Package className="w-full h-full p-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{i.product.name}</div>
                  <div className="text-sm text-muted-foreground">SKU {i.product.sku}</div>
                  <div className="font-bold mt-1">{formatCOP(Number(i.product.price))}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(i.id, i.quantity - 1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{i.quantity}</span>
                  <Button size="icon" variant="outline" className="h-8 w-8"
                    disabled={i.quantity >= i.product.stock}
                    onClick={() => updateQty(i.id, i.quantity + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeItem(i.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>

          <Card className="p-6 h-fit shadow-card sticky top-24">
            <h2 className="font-bold mb-4">Resumen</h2>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Productos</span>
              <span>{items.reduce((s, i) => s + i.quantity, 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl border-t pt-3 mt-3">
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
            <Button className="w-full mt-6" size="lg" onClick={checkout} disabled={paying}>
              {paying ? "Procesando..." : "Pagar (simulado)"}
            </Button>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              💳 Pago de prueba — no se cobra dinero real
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
