create extension if not exists "pgcrypto";

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  nome text not null,
  ia_creditos integer not null default 0,
  peso_kg numeric(5,2),
  altura_cm integer,
  sexo text default 'M' check (sexo in ('M', 'F', 'O')),
  data_nascimento date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.treinos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  modalidade_id uuid,
  modalidade text not null,
  data_treino date not null default current_date,
  duracao_minutos integer,
  distancia_km numeric(6,2),
  calorias integer,
  criado_em timestamptz not null default now()
);

create table if not exists public.dicas (
  id uuid primary key default gen_random_uuid(),
  modalidade_id uuid,
  titulo text not null,
  subtitulo text,
  youtube_url text,
  alongamento text,
  aquecimento text,
  como_praticar text,
  icone text,
  cor text,
  criado_em timestamptz not null default now()
);

create table if not exists public.modalidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  icone text,
  usa_gps boolean not null default false,
  descricao text,
  criado_em timestamptz not null default now()
);

create table if not exists public.locais (
  id uuid primary key default gen_random_uuid(),
  modalidade_id uuid,
  nome text not null,
  cidade text,
  categoria text,
  nivel text,
  tipo text,
  icone text,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  endereco text,
  descricao text,
  horario text,
  telefone text,
  url text,
  criado_em timestamptz not null default now()
);

create table if not exists public.sugestoes_ia (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  modalidade_id uuid references public.modalidades(id),
  local_id uuid references public.locais(id),
  local_nome text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  score numeric(5,2),
  fonte text,
  criado_em timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_perfis_updated_at on public.perfis;
create trigger set_perfis_updated_at
before update on public.perfis
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, email, nome, ia_creditos)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome', ''), 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.perfis enable row level security;
alter table public.treinos enable row level security;
alter table public.dicas enable row level security;
alter table public.modalidades enable row level security;
alter table public.locais enable row level security;
alter table public.sugestoes_ia enable row level security;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'treinos' and column_name = 'modalidade_id'
  ) then
    alter table public.treinos add column modalidade_id uuid;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'modalidades' and column_name = 'descricao'
  ) then
    alter table public.modalidades add column descricao text;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'modalidades_nome_key'
  ) then
    alter table public.modalidades add constraint modalidades_nome_key unique (nome);
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'dicas' and column_name = 'modalidade_id'
  ) then
    alter table public.dicas add column modalidade_id uuid;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'locais' and column_name = 'modalidade_id'
  ) then
    alter table public.locais add column modalidade_id uuid;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'cidade') then alter table public.locais add column cidade text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'categoria') then alter table public.locais add column categoria text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'nivel') then alter table public.locais add column nivel text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'tipo') then alter table public.locais add column tipo text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'icone') then alter table public.locais add column icone text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'latitude') then alter table public.locais add column latitude numeric(9,6); end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'longitude') then alter table public.locais add column longitude numeric(9,6); end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'endereco') then alter table public.locais add column endereco text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'descricao') then alter table public.locais add column descricao text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'horario') then alter table public.locais add column horario text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'telefone') then alter table public.locais add column telefone text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'locais' and column_name = 'url') then alter table public.locais add column url text; end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'dicas' and column_name = 'subtitulo') then alter table public.dicas add column subtitulo text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'dicas' and column_name = 'youtube_url') then alter table public.dicas add column youtube_url text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'dicas' and column_name = 'alongamento') then alter table public.dicas add column alongamento text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'dicas' and column_name = 'aquecimento') then alter table public.dicas add column aquecimento text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'dicas' and column_name = 'como_praticar') then alter table public.dicas add column como_praticar text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'dicas' and column_name = 'icone') then alter table public.dicas add column icone text; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'dicas' and column_name = 'cor') then alter table public.dicas add column cor text; end if;

  if not exists (
    select 1 from pg_constraint where conname = 'treinos_modalidade_id_fkey'
  ) then
    alter table public.treinos
      add constraint treinos_modalidade_id_fkey
      foreign key (modalidade_id)
      references public.modalidades(id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'dicas_modalidade_id_fkey'
  ) then
    alter table public.dicas
      add constraint dicas_modalidade_id_fkey
      foreign key (modalidade_id)
      references public.modalidades(id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'locais_modalidade_id_fkey'
  ) then
    alter table public.locais
      add constraint locais_modalidade_id_fkey
      foreign key (modalidade_id)
      references public.modalidades(id);
  end if;
end $$;

drop policy if exists perfis_select_own on public.perfis;
create policy perfis_select_own on public.perfis
for select to authenticated
using (id = auth.uid());

drop policy if exists perfis_insert_own on public.perfis;
create policy perfis_insert_own on public.perfis
for insert to authenticated
with check (id = auth.uid());

drop policy if exists perfis_update_own on public.perfis;
create policy perfis_update_own on public.perfis
for update to authenticated
using (id = auth.uid());

drop policy if exists treinos_select_own on public.treinos;
create policy treinos_select_own on public.treinos
for select to authenticated
using (perfil_id = auth.uid());

drop policy if exists treinos_insert_own on public.treinos;
create policy treinos_insert_own on public.treinos
for insert to authenticated
with check (perfil_id = auth.uid());

drop policy if exists treinos_update_own on public.treinos;
create policy treinos_update_own on public.treinos
for update to authenticated
using (perfil_id = auth.uid());

drop policy if exists treinos_delete_own on public.treinos;
create policy treinos_delete_own on public.treinos
for delete to authenticated
using (perfil_id = auth.uid());

drop policy if exists sugestoes_ia_select_own on public.sugestoes_ia;
create policy sugestoes_ia_select_own on public.sugestoes_ia
for select to authenticated
using (perfil_id = auth.uid());

drop policy if exists sugestoes_ia_insert_own on public.sugestoes_ia;
create policy sugestoes_ia_insert_own on public.sugestoes_ia
for insert to authenticated
with check (perfil_id = auth.uid());

drop policy if exists sugestoes_ia_delete_own on public.sugestoes_ia;
create policy sugestoes_ia_delete_own on public.sugestoes_ia
for delete to authenticated
using (perfil_id = auth.uid());

drop policy if exists dicas_read_authenticated on public.dicas;
create policy dicas_read_authenticated on public.dicas
for select to authenticated
using (true);

drop policy if exists modalidades_read_authenticated on public.modalidades;
create policy modalidades_read_authenticated on public.modalidades
for select to authenticated
using (true);

drop policy if exists locais_read_authenticated on public.locais;
create policy locais_read_authenticated on public.locais
for select to authenticated
using (true);

create index if not exists treinos_perfil_id_idx on public.treinos (perfil_id);
create index if not exists treinos_data_treino_idx on public.treinos (data_treino desc);
create index if not exists dicas_modalidade_id_idx on public.dicas (modalidade_id);
create index if not exists locais_modalidade_id_idx on public.locais (modalidade_id);
create index if not exists sugestoes_ia_perfil_id_idx on public.sugestoes_ia (perfil_id);
