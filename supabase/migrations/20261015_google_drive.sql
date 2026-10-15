-- Integración con Google Drive: conexión, respaldos, carpetas y tarea automática.
create table if not exists public.drive_conexion (
  id smallint primary key default 1 check (id = 1),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  refresh_token text not null,
  carpeta_raiz_id text,
  conectado_at timestamptz not null default now(),
  ultimo_respaldo_at timestamptz,
  ultimo_error text
);
alter table public.drive_conexion enable row level security;

create table if not exists public.drive_oauth_estados (
  estado text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.drive_oauth_estados enable row level security;

create table if not exists public.drive_carpetas (
  ruta text primary key,
  drive_id text not null,
  created_at timestamptz not null default now()
);
alter table public.drive_carpetas enable row level security;

create table if not exists public.drive_respaldos (
  documento_id uuid primary key,
  drive_file_id text not null,
  ruta text not null,
  nombre text not null,
  sincronizado_at timestamptz not null default now()
);
alter table public.drive_respaldos enable row level security;

create or replace function public.drive_estado()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case
    when not exists (select 1 from profiles where id = auth.uid() and rol = 'admin') then null
    else (
      select jsonb_build_object(
        'conectado', c.id is not null,
        'email', c.email,
        'conectado_at', c.conectado_at,
        'ultimo_respaldo_at', c.ultimo_respaldo_at,
        'ultimo_error', c.ultimo_error,
        'respaldados', (select count(*) from drive_respaldos),
        'total', (select count(*) from documentos d where owner_via_entidad(d.entidad_tipo, d.entidad_id) is null)
      )
      from (select 1) x left join drive_conexion c on true
    )
  end;
$$;
grant execute on function public.drive_estado() to authenticated;

create or replace function public.tocar_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists documentos_updated_at on public.documentos;
create trigger documentos_updated_at before update on public.documentos
  for each row execute function public.tocar_updated_at();

select cron.unschedule('drive-sincronizar') where exists (select 1 from cron.job where jobname = 'drive-sincronizar');
select cron.schedule('drive-sincronizar', '*/10 * * * *', $cron$
  select net.http_post(
    url := 'https://mlbbbskhoficppzisfqo.supabase.co/functions/v1/google-drive?accion=sincronizar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret')
    ),
    body := '{}'::jsonb
  );
$cron$);
