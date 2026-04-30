-- Catálogo de roles editable desde el panel admin
CREATE TABLE public.roles_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key app_role NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roles_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view roles catalog" ON public.roles_catalog
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin manage roles catalog" ON public.roles_catalog
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_roles_catalog_updated_at
  BEFORE UPDATE ON public.roles_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sembrar valores por defecto
INSERT INTO public.roles_catalog (key, label, description) VALUES
  ('admin', 'Administrador', 'Acceso total al sistema'),
  ('medico', 'Médico', 'Personal médico'),
  ('odontologia', 'Auxiliar de Odontología', 'Área de odontología'),
  ('enfermeria', 'Enfermería', 'Personal de enfermería'),
  ('administrativo', 'Administrativo', 'Personal administrativo'),
  ('aseo', 'Aseo', 'Personal de aseo'),
  ('papeleria', 'Papelería', 'Insumos y papelería')
ON CONFLICT (key) DO NOTHING;