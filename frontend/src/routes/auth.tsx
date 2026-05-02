import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLE_LABELS } from "@/lib/auth-context";
import type { AppRole } from "@/lib/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // login
  const [lEmail, setLEmail] = useState("");
  const [lPwd, setLPwd] = useState("");

  // signup
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPwd, setSPwd] = useState("");
  const [sArea, setSArea] = useState("");
  const [sRole, setSRole] = useState<AppRole>("administrativo");

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: lEmail, password: lPwd });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Bienvenido");
      navigate({ to: "/" });
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: sEmail,
      password: sPwd,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: sName, area: sArea, role: sRole },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Cuenta creada. Sesión iniciada.");
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-screen gradient-brand flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-card">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-3">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold">SaludCaribe Shop</h1>
          <p className="text-sm text-muted-foreground">Gestión interna de insumos</p>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <Label htmlFor="le">Correo</Label>
                <Input id="le" type="email" required value={lEmail} onChange={(e) => setLEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lp">Contraseña</Label>
                <Input id="lp" type="password" required value={lPwd} onChange={(e) => setLPwd(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <form onSubmit={onSignup} className="space-y-3">
              <div>
                <Label htmlFor="sn">Nombre completo</Label>
                <Input id="sn" required value={sName} onChange={(e) => setSName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="se">Correo</Label>
                <Input id="se" type="email" required value={sEmail} onChange={(e) => setSEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sp">Contraseña</Label>
                <Input id="sp" type="password" required minLength={8} value={sPwd} onChange={(e) => setSPwd(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sa">Área</Label>
                <Input id="sa" placeholder="Ej: Urgencias, Consultorio 3" value={sArea} onChange={(e) => setSArea(e.target.value)} />
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={sRole} onValueChange={(v) => setSRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as AppRole[])
                      .filter((r) => r !== "admin")
                      .map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando..." : "Crear cuenta"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Los administradores se asignan desde el panel de admin.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
