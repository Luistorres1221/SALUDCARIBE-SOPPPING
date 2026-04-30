import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCOP } from "@/lib/cart-context";
import { toast } from "sonner";
import { Eye, Download, Search, CheckCircle2, Clock, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminOrders,
});

const STATUSES = ["pendiente", "aprobado", "pagado", "entregado", "cancelado"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_LABEL: Record<Status, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  pagado: "Pagado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};
const STATUS_COLOR: Record<Status, string> = {
  pendiente: "bg-warning text-warning-foreground",
  aprobado: "bg-primary text-primary-foreground",
  pagado: "bg-success text-success-foreground",
  entregado: "bg-success text-success-foreground",
  cancelado: "bg-destructive text-destructive-foreground",
};

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, profile:profiles(full_name, area), items:order_items(id, product_id, product_name, unit_price, quantity, subtotal, status, delivered_at)")
      .order("created_at", { ascending: false });
    if (error) toast.error("No se pudieron cargar los pedidos: " + error.message);
    setOrders(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error("No se pudo actualizar: " + error.message);
    else {
      if (status === "entregado") toast.success("Pedido marcado como entregado. Inventario actualizado.");
      else if (status === "pendiente") toast.success("Pedido marcado como pendiente");
      else toast.success("Estado actualizado correctamente");
      load();
    }
  };

  const removeOrder = async (id: string) => {
    if (!confirm("¿Eliminar este pedido? Esta acción no se puede deshacer.")) return;
    // Eliminar items primero (FK lógica)
    await supabase.from("order_items").delete().eq("order_id", id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) toast.error("No se pudo eliminar: " + error.message);
    else { toast.success("Pedido eliminado"); load(); }
  };

  const updateItemStatus = async (itemId: string, status: "pendiente" | "entregado") => {
    const { error } = await supabase.from("order_items").update({ status }).eq("id", itemId);
    if (error) { toast.error("No se pudo actualizar el producto: " + error.message); return; }
    toast.success(status === "entregado" ? "Producto entregado. Inventario descontado." : "Producto marcado como pendiente. Inventario devuelto.");
    // refrescar listado y detalle
    const { data } = await supabase
      .from("orders")
      .select("*, profile:profiles(full_name, area), items:order_items(id, product_id, product_name, unit_price, quantity, subtotal, status, delivered_at)")
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    if (detail) {
      const fresh = (data ?? []).find((o: any) => o.id === detail.id);
      if (fresh) setDetail(fresh);
    }
  };

  const filtered = orders.filter((o) => {
    if (filter !== "todos" && o.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(s) ||
        (o.profile?.full_name ?? "").toLowerCase().includes(s) ||
        (o.profile?.area ?? "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  const exportExcel = () => {
    if (filtered.length === 0) {
      toast.warning("No hay pedidos para exportar");
      return;
    }
    const rows = filtered.map((o) => ({
      "N° Pedido": o.id.slice(0, 8),
      Solicitante: o.profile?.full_name ?? "—",
      Área: o.profile?.area ?? "—",
      Fecha: new Date(o.created_at).toLocaleString("es-CO"),
      Ítems: o.items?.length ?? 0,
      Total: Number(o.total),
      Estado: STATUS_LABEL[o.status as Status] ?? o.status,
      Notas: o.notes ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, `pedidos-saludcaribe-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Pedidos exportados");
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Button variant="outline" onClick={exportExcel}>
          <Download className="w-4 h-4 mr-1" /> Exportar Excel
        </Button>
      </div>

      <Card className="p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por solicitante, área o N° pedido"
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">{filtered.length} pedido(s)</div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-3">N° Pedido</th>
                <th className="p-3">Solicitante</th>
                <th className="p-3">Área</th>
                <th className="p-3">Fecha</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Cargando pedidos...</td></tr>}
              {!loading && filtered.map((o) => (
                <tr key={o.id} className="border-t hover:bg-muted/40">
                  <td className="p-3">
                    <button onClick={() => setDetail(o)} className="text-primary hover:underline font-medium">
                      #{o.id.slice(0, 8)}
                    </button>
                    <div className="text-xs text-muted-foreground">{o.items?.length ?? 0} ítems</div>
                  </td>
                  <td className="p-3">{o.profile?.full_name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{o.profile?.area || "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleString("es-CO")}</td>
                  <td className="p-3 text-right font-medium">{formatCOP(Number(o.total))}</td>
                  <td className="p-3">
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as Status)}>
                      <SelectTrigger className="w-36 h-8">
                        <Badge className={STATUS_COLOR[o.status as Status]}>{STATUS_LABEL[o.status as Status]}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {o.status !== "entregado" && (
                        <Button size="icon" variant="ghost" onClick={() => updateStatus(o.id, "entregado")} title="Marcar como entregado">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        </Button>
                      )}
                      {o.status !== "pendiente" && o.status !== "entregado" && (
                        <Button size="icon" variant="ghost" onClick={() => updateStatus(o.id, "pendiente")} title="Marcar como pendiente">
                          <Clock className="w-4 h-4 text-warning" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => setDetail(o)} title="Ver detalle">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => removeOrder(o.id)} title="Eliminar pedido">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay pedidos que coincidan con el filtro</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido #{detail?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Solicitante:</span> <span className="font-medium">{detail.profile?.full_name ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Área:</span> <span className="font-medium">{detail.profile?.area ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Fecha:</span> {new Date(detail.created_at).toLocaleString("es-CO")}</div>
                <div><span className="text-muted-foreground">Estado:</span> <Badge className={STATUS_COLOR[detail.status as Status]}>{STATUS_LABEL[detail.status as Status]}</Badge></div>
              </div>
              {detail.notes && (
                <div className="text-sm bg-muted p-3 rounded">
                  <div className="text-muted-foreground text-xs mb-1">Notas del solicitante</div>
                  {detail.notes}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">Productos solicitados</div>
                  <div className="text-xs text-muted-foreground">
                    {detail.items?.filter((i: any) => i.status === "entregado").length ?? 0} de {detail.items?.length ?? 0} entregados
                  </div>
                </div>
                <table className="w-full text-sm border rounded overflow-hidden">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Producto</th>
                      <th className="p-2 text-right">Cant.</th>
                      <th className="p-2 text-right">Unit.</th>
                      <th className="p-2 text-right">Subtotal</th>
                      <th className="p-2 text-center">Estado</th>
                      <th className="p-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items?.map((it: any) => {
                      const entregado = it.status === "entregado";
                      return (
                        <tr key={it.id} className="border-t">
                          <td className="p-2">{it.product_name}</td>
                          <td className="p-2 text-right">{it.quantity}</td>
                          <td className="p-2 text-right">{formatCOP(Number(it.unit_price))}</td>
                          <td className="p-2 text-right font-medium">{formatCOP(Number(it.subtotal))}</td>
                          <td className="p-2 text-center">
                            <Badge className={entregado ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                              {entregado ? "Entregado" : "Pendiente"}
                            </Badge>
                          </td>
                          <td className="p-2 text-center">
                            {entregado ? (
                              <Button size="sm" variant="outline" onClick={() => updateItemStatus(it.id, "pendiente")} title="Marcar como pendiente (devuelve stock)">
                                <Clock className="w-3 h-3 mr-1" /> Pendiente
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => updateItemStatus(it.id, "entregado")} title="Marcar como entregado (descuenta stock)">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Entregar
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/60">
                      <td colSpan={3} className="p-2 text-right font-semibold">Total</td>
                      <td className="p-2 text-right font-bold">{formatCOP(Number(detail.total))}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Cambiar estado:</span>
                <Select value={detail.status} onValueChange={(v) => { updateStatus(detail.id, v as Status); setDetail({ ...detail, status: v }); }}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
