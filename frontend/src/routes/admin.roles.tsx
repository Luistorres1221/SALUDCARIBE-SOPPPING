import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { AppRole, ROLE_LABELS } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/roles")({
  component: AdminRoles,
});

const ROLE_KEYS: AppRole[] = [
  "admin", "medico", "odontologia", "enfermeria", "administrativo", "aseo", "papeleria",
];

interface RoleRow {
  id: string;
  key: AppRole;
  label: string;
  description: string | null;
}

function AdminRoles() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [form, setForm] = useState<{ key: AppRole; label: string; description: string }>({
    key: "administrativo",
    label: "",
    description: "",
  });

  const load = async () => {
    const { data, error } = await supabase
      .from("roles_catalog")
      .select("*")
      .order("label");
    if (error) toast.error("No se pudieron cargar los roles");
    else setRows((data ?? []) as RoleRow[]);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    const used = new Set(rows.map((r) => r.key));
    const available = ROLE_KEYS.find((k) => !used.has(k)) ?? "administrativo";
    setForm({ key: available, label: ROLE_LABELS[available], description: "" });
    setOpen(true);
  };

  const openEdit = (r: RoleRow) => {
    setEditing(r);
    setForm({ key: r.key, label: r.label, description: r.description ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.label.trim()) {
      toast.error("La etiqueta es obligatoria");
      return;
    }
    if (editing) {
      const { error } = await supabase
        .from("roles_catalog")
        .update({ key: form.key, label: form.label.trim(), description: form.description.trim() || null })
        .eq("id", editing.id);
      if (error) return toast.error("No se pudo actualizar: " + error.message);
      toast.success("Rol actualizado");
    } else {
      const { error } = await supabase
        .from("roles_catalog")
        .insert({ key: form.key, label: form.label.trim(), description: form.description.trim() || null });
      if (error) return toast.error("No se pudo crear: " + error.message);
      toast.success("Rol creado");
    }
    setOpen(false);
    load();
  };

  const remove = async (r: RoleRow) => {
    if (!confirm(`¿Eliminar el rol "${r.label}" del catálogo? Los usuarios con este rol asignado no se verán afectados.`)) return;
    const { error } = await supabase.from("roles_catalog").delete().eq("id", r.id);
    if (error) toast.error("No se pudo eliminar: " + error.message);
    else { toast.success("Rol eliminado"); load(); }
  };

  const usedKeys = new Set(rows.filter((r) => r.id !== editing?.id).map((r) => r.key));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el catálogo de roles del sistema. Estos roles se pueden asignar a los usuarios.
          </p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nuevo rol</Button>
      </div>

      <div className="grid gap-3">
        {rows.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold">{r.label}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.key}</div>
                  {r.description && <div className="text-sm text-muted-foreground mt-1">{r.description}</div>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="Editar">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(r)} title="Eliminar">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">Sin roles en el catálogo</Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar rol" : "Nuevo rol"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Clave del sistema</Label>
              <Select value={form.key} onValueChange={(v) => setForm({ ...form, key: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_KEYS.map((k) => (
                    <SelectItem key={k} value={k} disabled={usedKeys.has(k)}>
                      {k} {usedKeys.has(k) && "(en uso)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Identificador interno usado por el sistema de permisos.
              </p>
            </div>
            <div>
              <Label>Etiqueta visible</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ej: Médico General" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe el alcance de este rol..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Guardar cambios" : "Crear rol"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
