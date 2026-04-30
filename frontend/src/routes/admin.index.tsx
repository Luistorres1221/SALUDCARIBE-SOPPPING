import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { formatCOP } from "@/lib/cart-context";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const COLORS = ["oklch(0.55 0.18 245)", "oklch(0.78 0.16 95)", "oklch(0.65 0.16 155)", "oklch(0.65 0.2 25)", "oklch(0.55 0.2 305)"];

function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [byArea, setByArea] = useState<any[]>([]);
  const [byDay, setByDay] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: pCount }, { data: orders }, { count: uCount }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, created_at, user_id, status"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      const revenue = (orders ?? []).filter(o => o.status === "pagado" || o.status === "entregado")
        .reduce((s, o) => s + Number(o.total), 0);
      setStats({ products: pCount ?? 0, orders: orders?.length ?? 0, users: uCount ?? 0, revenue });

      // by day (last 14)
      const days: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days[d.toISOString().slice(0, 10)] = 0;
      }
      (orders ?? []).forEach((o) => {
        const k = new Date(o.created_at).toISOString().slice(0, 10);
        if (k in days) days[k]++;
      });
      setByDay(Object.entries(days).map(([date, count]) => ({ date: date.slice(5), count })));

      // top products + categories
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, product:products(category:categories(name))");
      const prodMap: Record<string, { name: string; qty: number }> = {};
      const catMap: Record<string, number> = {};
      (items ?? []).forEach((it: any) => {
        prodMap[it.product_id] = prodMap[it.product_id] || { name: it.product_name, qty: 0 };
        prodMap[it.product_id].qty += it.quantity;
        const cat = it.product?.category?.name || "Sin categoría";
        catMap[cat] = (catMap[cat] || 0) + it.quantity;
      });
      setTopProducts(
        Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 6)
      );
      setByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      // by area + top users
      const { data: ordersWithUser } = await supabase
        .from("orders")
        .select("user_id, profile:profiles(full_name, area)");
      const areaMap: Record<string, number> = {};
      const userMap: Record<string, { name: string; count: number }> = {};
      (ordersWithUser ?? []).forEach((o: any) => {
        const area = o.profile?.area || "Sin área";
        areaMap[area] = (areaMap[area] || 0) + 1;
        const name = o.profile?.full_name || "Usuario";
        userMap[o.user_id] = userMap[o.user_id] || { name, count: 0 };
        userMap[o.user_id].count++;
      });
      setByArea(Object.entries(areaMap).map(([name, count]) => ({ name, count })));
      setTopUsers(Object.values(userMap).sort((a, b) => b.count - a.count).slice(0, 5));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Métricas e indicadores clave de consumo</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Productos" value={stats.products} />
        <StatCard icon={ShoppingCart} label="Pedidos" value={stats.orders} />
        <StatCard icon={Users} label="Usuarios" value={stats.users} />
        <StatCard icon={TrendingUp} label="Total facturado" value={formatCOP(stats.revenue)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Pedidos por día (últimos 14)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="oklch(0.55 0.18 245)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Categorías más solicitadas</h3>
          {byCategory.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80} label>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Productos más pedidos</h3>
          {topProducts.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} layout="vertical">
                <XAxis type="number" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" fontSize={11} width={120} />
                <Tooltip />
                <Bar dataKey="qty" fill="oklch(0.78 0.16 95)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Pedidos por área</h3>
          {byArea.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byArea}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="oklch(0.65 0.16 155)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Top usuarios solicitantes</h3>
        {topUsers.length === 0 ? <Empty /> : (
          <div className="space-y-2">
            {topUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <span className="font-medium">{u.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{u.count} pedidos</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <Card className="p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

function Empty() {
  return <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">Sin datos aún</div>;
}
