import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package, Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { formatCOP } from "@/lib/cart-context";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/productos")({
  component: AdminProducts,
});

function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ sku: "", name: "", description: "", price: 0, stock: 0, category_id: "", active: true, image_url: "" });

  const load = () => {
    const data = JSON.parse(localStorage.getItem('products') || '[]');
    setProducts(data);
  };
  const loadCats = () => {
    const data = JSON.parse(localStorage.getItem('categories') || '[]');
    setCats(data);
  };
  useEffect(() => {
    load();
    loadCats();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ sku: "", name: "", description: "", price: 0, stock: 0, category_id: cats[0]?.id ?? "", active: true, image_url: "" });
    setOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ sku: p.sku, name: p.name, description: p.description ?? "", price: Number(p.price), stock: p.stock, category_id: p.category_id ?? "", active: p.active, image_url: p.image_url ?? "" });
    setOpen(true);
  };

  const save = () => {
    if (!form.category_id) return toast.error("Selecciona una categoría");
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock), created_at: editing ? editing.created_at : new Date().toISOString() };
    let newProducts;
    if (editing) {
      newProducts = products.map(p => p.id === editing.id ? { ...p, ...payload } : p);
    } else {
      newProducts = [...products, { id: Date.now().toString(), ...payload }];
    }
    localStorage.setItem('products', JSON.stringify(newProducts));
    setProducts(newProducts);
    toast.success(editing ? "Producto actualizado" : "Producto creado");
    setOpen(false);
  };

  const remove = (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const newProducts = products.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(newProducts));
    setProducts(newProducts);
    toast.success("Producto eliminado");
  };

  // ---------- Exportar a Excel ----------
  const exportExcel = () => {
    if (products.length === 0) {
      toast.warning("No hay productos para exportar");
      return;
    }
    const rows = products.map((p) => ({
      sku: p.sku,
      nombre: p.name,
      descripcion: p.description ?? "",
      precio: Number(p.price),
      stock: p.stock,
      categoria: p.category?.name ?? "",
      activo: p.active ? "SI" : "NO",
      image_url: p.image_url ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, `productos-saludcaribe-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Productos exportados a Excel");
  };

  // ---------- Plantilla de importación ----------
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        sku: "MED-100",
        nombre: "Ejemplo: Guantes de nitrilo",
        descripcion: "Caja x 100 unidades",
        precio: 35000,
        stock: 50,
        categoria: "Insumos Médicos",
        activo: "SI",
        image_url: "https://...",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, "plantilla-productos-saludcaribe.xlsx");
    toast.info("Plantilla descargada. Llénala y vuelve a subirla.");
  };

  // ---------- Importar desde Excel ----------
  const importExcel = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
      if (rows.length === 0) {
        toast.error("El archivo no contiene filas");
        return;
      }
      const catMap = new Map(cats.map((c) => [c.name.toLowerCase().trim(), c.id]));
      const payload: any[] = [];
      const errores: string[] = [];

      rows.forEach((r, i) => {
        const sku = String(r.sku ?? "").trim();
        const nombre = String(r.nombre ?? r.name ?? "").trim();
        const categoriaNombre = String(r.categoria ?? r.category ?? "").trim().toLowerCase();
        if (!sku || !nombre) {
          errores.push(`Fila ${i + 2}: faltan SKU o nombre`);
          return;
        }
        const category_id = catMap.get(categoriaNombre);
        if (!category_id) {
          errores.push(`Fila ${i + 2}: categoría "${r.categoria}" no existe`);
          return;
        }
        const activoStr = String(r.activo ?? "SI").trim().toUpperCase();
        payload.push({
          sku,
          name: nombre,
          description: String(r.descripcion ?? r.description ?? "").trim() || null,
          price: Number(r.precio ?? r.price ?? 0) || 0,
          stock: Number(r.stock ?? 0) || 0,
          category_id,
          active: activoStr === "SI" || activoStr === "TRUE" || activoStr === "1",
          image_url: String(r.image_url ?? "").trim() || null,
        });
      });

      if (errores.length) {
        toast.error(`Errores en el archivo:\n${errores.slice(0, 5).join("\n")}${errores.length > 5 ? `\n…y ${errores.length - 5} más` : ""}`);
      }
      if (payload.length === 0) {
        toast.error("No hay filas válidas para importar");
        return;
      }

      // Upsert por SKU (sku es UNIQUE en la tabla products)
      const { error } = await supabase.from("products").upsert(payload, { onConflict: "sku" });
      if (error) toast.error("Error al importar: " + error.message);
      else {
        toast.success(`${payload.length} producto(s) importado(s) correctamente`);
        load();
      }
    } catch (e: any) {
      toast.error("No se pudo leer el archivo Excel: " + (e?.message ?? ""));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Plantilla
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-1" /> Importar Excel
              </span>
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importExcel(f);
                e.target.value = "";
              }}
            />
          </label>
          <Button variant="outline" onClick={exportExcel}>
            <Download className="w-4 h-4 mr-1" /> Exportar Excel
          </Button>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nuevo producto</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-3">Producto</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Categoría</th>
                <th className="p-3 text-right">Precio</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3">Estado</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/40">
                  <td className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 text-muted-foreground" />}
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.sku}</td>
                  <td className="p-3">{p.category?.name ?? "—"}</td>
                  <td className="p-3 text-right font-medium">{formatCOP(Number(p.price))}</td>
                  <td className="p-3 text-right">{p.stock}</td>
                  <td className="p-3">
                    <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Activo" : "Inactivo"}</Badge>
                  </td>
                  <td className="p-3 flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sin productos. Agrega el primero.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              <div><Label>Precio</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
              <div>
                <Label>Categoría</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Imagen *</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image_url && <img src={form.image_url} alt="preview" className="w-16 h-16 rounded object-cover" />}
                <label className="flex-1 cursor-pointer">
                  <div className="border border-dashed rounded-md px-4 py-3 text-sm text-center hover:bg-accent">
                    <Upload className="w-4 h-4 inline mr-1" /> {uploading ? "Subiendo..." : "Subir imagen"}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Producto activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
