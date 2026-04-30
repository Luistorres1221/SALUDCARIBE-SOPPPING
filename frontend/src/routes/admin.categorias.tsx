import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategories,
});

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function AdminCategories() {
  const [cats, setCats] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon: "Package" });

  const load = () => {
    const data = JSON.parse(localStorage.getItem('categories') || '[]');
    setCats(data);
  };
  useEffect(() => { load(); }, []);

  const save = () => {
    const payload = { ...form, slug: form.slug || slugify(form.name), created_at: editing ? editing.created_at : new Date().toISOString() };
    let newCats;
    if (editing) {
      newCats = cats.map(c => c.id === editing.id ? { ...c, ...payload } : c);
    } else {
      newCats = [...cats, { id: Date.now().toString(), ...payload }];
    }
    localStorage.setItem('categories', JSON.stringify(newCats));
    setCats(newCats);
    toast.success("Guardado");
    setOpen(false);
  };

  const remove = (id: string) => {
    if (!confirm("¿Eliminar categoría?")) return;
    const newCats = cats.filter(c => c.id !== id);
    localStorage.setItem('categories', JSON.stringify(newCats));
    setCats(newCats);
    toast.success("Eliminada");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: "", slug: "", description: "", icon: "Package" }); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Nueva
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {cats.map((c) => (
          <Card key={c.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">/{c.slug} · {c.description}</div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description ?? "", icon: c.icon ?? "Package" }); setOpen(true); }}><Edit className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} categoría</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Slug</Label><Input placeholder="auto" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>Descripción</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Ícono (lucide)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
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
