
-- 1. Engineering Materials (unified table for pipe, flange, fitting, bolt, gasket)
CREATE TABLE public.eng_materials (
  id text PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('pipe', 'flange', 'fitting', 'bolt', 'gasket')),
  designation text NOT NULL,
  description text,
  material_group text NOT NULL,
  min_temp_c numeric NOT NULL DEFAULT -29,
  max_temp_c numeric NOT NULL DEFAULT 427,
  standard text,
  source text,
  cast_equivalent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.eng_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Engineering materials are publicly readable" ON public.eng_materials FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage materials" ON public.eng_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Material Compatibility Map
CREATE TABLE public.eng_material_compatibility (
  pipe_id text PRIMARY KEY REFERENCES public.eng_materials(id) ON DELETE CASCADE,
  flanges text[] NOT NULL DEFAULT '{}',
  fittings text[] NOT NULL DEFAULT '{}',
  bolts text[] NOT NULL DEFAULT '{}',
  gaskets text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.eng_material_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Compatibility map is publicly readable" ON public.eng_material_compatibility FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage compatibility" ON public.eng_material_compatibility FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Pipe Dimensions (ASME B36.10M)
CREATE TABLE public.eng_pipe_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nps text NOT NULL,
  od_mm numeric NOT NULL,
  od_in numeric NOT NULL,
  schedule text NOT NULL,
  wt_mm numeric NOT NULL,
  wt_in numeric NOT NULL,
  id_mm numeric NOT NULL,
  weight_per_meter numeric NOT NULL,
  standard text NOT NULL DEFAULT 'B36.10M',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(nps, schedule)
);
ALTER TABLE public.eng_pipe_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pipe dimensions are publicly readable" ON public.eng_pipe_dimensions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage pipe dimensions" ON public.eng_pipe_dimensions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_pipe_dimensions_nps ON public.eng_pipe_dimensions(nps);

-- 4. Allowable Stress (ASME Sec II-D / B31.3 Table A-1)
CREATE TABLE public.eng_allowable_stress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material text NOT NULL,
  spec text NOT NULL,
  grade text NOT NULL,
  type text,
  p_number integer,
  min_temp_f integer,
  smts_ksi numeric,
  smys_ksi numeric,
  stress_values jsonb NOT NULL DEFAULT '[]',
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(material)
);
ALTER TABLE public.eng_allowable_stress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allowable stress is publicly readable" ON public.eng_allowable_stress FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage stress data" ON public.eng_allowable_stress FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Flange P-T Ratings (ASME B16.5)
CREATE TABLE public.eng_flange_pt_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_group text NOT NULL,
  material_description text NOT NULL,
  applicable_materials text[] NOT NULL DEFAULT '{}',
  class integer NOT NULL,
  ratings jsonb NOT NULL DEFAULT '[]',
  source text DEFAULT 'ASME B16.5',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(material_group, class)
);
ALTER TABLE public.eng_flange_pt_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flange PT ratings are publicly readable" ON public.eng_flange_pt_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage flange ratings" ON public.eng_flange_pt_ratings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Valve Specifications by Material Family
CREATE TABLE public.eng_valve_specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_family text NOT NULL UNIQUE,
  cast_spec text NOT NULL,
  forged_spec text NOT NULL,
  trim_default text,
  seat_default text,
  stem_packing_default text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.eng_valve_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Valve specs are publicly readable" ON public.eng_valve_specs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage valve specs" ON public.eng_valve_specs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Engineering Classification Mappings (pipe → B16.5 group, welded equivalents)
CREATE TABLE public.eng_classification_mappings (
  material_id text PRIMARY KEY REFERENCES public.eng_materials(id) ON DELETE CASCADE,
  flange_pt_group text,
  welded_pipe_spec text,
  welded_pipe_grade_rule text,
  nace_compliant boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.eng_classification_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Classification mappings are publicly readable" ON public.eng_classification_mappings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage classifications" ON public.eng_classification_mappings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Schedule Band Definitions
CREATE TABLE public.eng_schedule_bands (
  band text PRIMARY KEY,
  label text NOT NULL,
  description text,
  target_schedules text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.eng_schedule_bands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schedule bands are publicly readable" ON public.eng_schedule_bands FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage schedule bands" ON public.eng_schedule_bands FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_eng_materials_updated_at BEFORE UPDATE ON public.eng_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
