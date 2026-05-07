create table public.saved_specs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid references public.saved_projects(id) on delete cascade,
  spec_number text not null,
  spec_name text not null default '',
  material_group text not null default '',
  flange_rating text not null default '',
  schedule_band text not null default '',
  service_type text not null default '',
  data jsonb not null default '{}'::jsonb,
  design_inputs jsonb not null default '{}'::jsonb,
  overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saved_specs enable row level security;

create policy "Users can view own specs" on public.saved_specs for select using (auth.uid() = user_id);
create policy "Users can create own specs" on public.saved_specs for insert with check (auth.uid() = user_id);
create policy "Users can update own specs" on public.saved_specs for update using (auth.uid() = user_id);
create policy "Users can delete own specs" on public.saved_specs for delete using (auth.uid() = user_id);

create index saved_specs_user_idx on public.saved_specs(user_id);
create index saved_specs_project_idx on public.saved_specs(project_id);

create trigger saved_specs_updated_at before update on public.saved_specs
  for each row execute function public.update_updated_at_column();