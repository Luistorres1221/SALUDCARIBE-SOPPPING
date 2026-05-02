import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/lib/auth-context";
import type { AppRole } from "@/lib/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X, Edit, Trash2, Mail, KeyRound, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateUser,
  adminUpdateEmail,
  adminUpdatePassword,
  adminDeleteUser,
  adminListEmails,
} from "@/lib/admin.server";

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsers,
});

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("administrativo");
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", area: "" });

  const [emailDialog, setEmailDialog] = useState<any | null>(null);
  const [newEmail, setNewEmail] = useState("");

  const [passDialog, setPassDialog] = useState<any | null>(null);
  const [newPass, setNewPass] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    area: "",
    role: "administrativo" as AppRole,
  });

  const load = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("*");
    let emails: { id: string; email: string }[] = [];
    try {
      emails = await adminListEmails();
    } catch (e: any) {
      // Silencioso si aún no hay permisos cargados
    }
    const merged = (profiles ?? []).map((p) => ({
      ...p,
      email: emails.find((e) => e.id === p.id)?.email ?? "",
      roles: (roles ?? []).filter((r) => r.user_id === p.id),
    }));
    setUsers(merged);
  };
  useEffect(() => {
    load();
  }, []);

  const addRole = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) toast.error("No se pudo agregar el rol: " + error.message);
    else {
      toast.success("Rol agregado correctamente");
      setAdding(null);
      load();
    }
  };

  const removeRole = async (id: string) => {
    if (!confirm("¿Quitar este rol?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) toast.error("No se pudo quitar el rol: " + error.message);
    else {
      toast.success("Rol removido");
      load();
    }
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setEditForm({ full_name: u.full_name ?? "", area: u.area ?? "" });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("profiles").update(editForm).eq("id", editing.id);
    if (error) toast.error("No se pudo actualizar: " + error.message);
    else {
      toast.success("Usuario actualizado");
      setEditing(null);
      load();
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm("¿Eliminar este usuario por completo? Se borrará su cuenta, perfil y roles. Esta acción no se puede deshacer.")) return;
    try {
      await adminDeleteUser({ data: { user_id: id } });
      toast.success("Usuario eliminado");
      load();
    } catch (e: any) {
      toast.error("No se pudo eliminar: " + e.message);
    }
  };

  const openEmail = (u: any) => {
    setEmailDialog(u);
    setNewEmail(u.email ?? "");
  };
  const saveEmail = async () => {
    if (!emailDialog) return;
    try {
      await adminUpdateEmail({ data: { user_id: emailDialog.id, email: newEmail.trim() } });
      toast.success("Correo actualizado");
      setEmailDialog(null);
      load();
    } catch (e: any) {
      toast.error("No se pudo actualizar el correo: " + e.message);
    }
  };

  const openPass = (u: any) => {
    setPassDialog(u);
    setNewPass("");
  };
  const savePass = async () => {
    if (!passDialog) return;
    if (newPass.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    try {
      await adminUpdatePassword({ data: { user_id: passDialog.id, password: newPass } });
      toast.success("Contraseña actualizada");
      setPassDialog(null);
    } catch (e: any) {
      toast.error("No se pudo actualizar la contraseña: " + e.message);
    }
  };

  const createUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.full_name) {
      toast.error("Completa correo, contraseña y nombre");
      return;
    }
    if (createForm.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    try {
      await adminCreateUser({ data: createForm });
      toast.success("Usuario creado correctamente");
      setCreateOpen(false);
      setCreateForm({ email: "", password: "", full_name: "", area: "", role: "administrativo" });
      load();
    } catch (e: any) {
      toast.error("No se pudo crear: " + e.message);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h1 className="text-2xl font-bold">Usuarios y Roles</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1" /> Nuevo usuario
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Gestiona perfiles, correos, contraseñas y roles. Las acciones sobre la cuenta requieren permisos de administrador.
      </p>
      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold">{u.full_name || "(Sin nombre)"}</div>
                <div className="text-sm text-muted-foreground">{u.email || "Sin correo"}</div>
                <div className="text-xs text-muted-foreground">{u.area || "Sin área"}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {u.roles.map((r: any) => (
                  <Badge key={r.id} variant="secondary" className="gap-1">
                    {ROLE_LABELS[r.role as AppRole]}
                    <button onClick={() => removeRole(r.id)} className="hover:text-destructive" title="Quitar rol">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {adding === u.id ? (
                  <div className="flex items-center gap-1">
                    <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                      <SelectTrigger className="h-8 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => addRole(u.id)}>
                      OK
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAdding(null)}>
                      X
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setAdding(u.id)}>
                    <Plus className="w-3 h-3 mr-1" /> Rol
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => openEdit(u)} title="Editar perfil">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openEmail(u)} title="Cambiar correo">
                  <Mail className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openPass(u)} title="Cambiar contraseña">
                  <KeyRound className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => removeUser(u.id)} title="Eliminar usuario">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {users.length === 0 && <Card className="p-8 text-center text-muted-foreground">Sin usuarios todavía</Card>}
      </div>

      {/* Editar perfil */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre completo</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Área</Label>
              <Input
                value={editForm.area}
                onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                placeholder="Ej: Enfermería, Odontología, Aseo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cambiar correo */}
      <Dialog open={!!emailDialog} onOpenChange={(o) => !o && setEmailDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar correo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">{emailDialog?.full_name}</div>
            <div>
              <Label>Nuevo correo</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEmail}>Actualizar correo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cambiar contraseña */}
      <Dialog open={!!passDialog} onOpenChange={(o) => !o && setPassDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">{passDialog?.full_name}</div>
            <div>
              <Label>Nueva contraseña</Label>
              <Input type="text" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Mínimo 8 caracteres" />
              <p className="text-xs text-muted-foreground mt-1">El usuario deberá usar esta contraseña en su próximo inicio de sesión.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPassDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={savePass}>Actualizar contraseña</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crear usuario */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre completo</Label>
              <Input value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Correo</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input
                type="text"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <Label>Área</Label>
              <Input
                value={createForm.area}
                onChange={(e) => setCreateForm({ ...createForm, area: e.target.value })}
                placeholder="Ej: Enfermería, Odontología..."
              />
            </div>
            <div>
              <Label>Rol inicial</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v as AppRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createUser}>Crear usuario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
