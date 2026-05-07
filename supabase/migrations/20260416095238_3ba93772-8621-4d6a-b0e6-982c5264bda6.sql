
-- Remove overly permissive write policies from all engineering reference tables
DROP POLICY IF EXISTS "Authenticated users can manage materials" ON public.eng_materials;
DROP POLICY IF EXISTS "Authenticated users can manage compatibility" ON public.eng_material_compatibility;
DROP POLICY IF EXISTS "Authenticated users can manage pipe dimensions" ON public.eng_pipe_dimensions;
DROP POLICY IF EXISTS "Authenticated users can manage stress data" ON public.eng_allowable_stress;
DROP POLICY IF EXISTS "Authenticated users can manage flange ratings" ON public.eng_flange_pt_ratings;
DROP POLICY IF EXISTS "Authenticated users can manage valve specs" ON public.eng_valve_specs;
DROP POLICY IF EXISTS "Authenticated users can manage classifications" ON public.eng_classification_mappings;
DROP POLICY IF EXISTS "Authenticated users can manage schedule bands" ON public.eng_schedule_bands;
