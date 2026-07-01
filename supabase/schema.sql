-- DOS Garage İstanbul — Üyelik & Randevu sistemi için Supabase şeması
-- Supabase Dashboard > SQL Editor içinde bu dosyanın tamamını çalıştırın.

-- ============================================================
-- 1. PROFİLLER
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Kullanici kendi profilini gorebilir"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Kullanici kendi profilini olusturabilir"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Kullanici kendi profilini guncelleyebilir"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- 2. RANDEVULAR
-- Not: user_id, auth.users yerine profiles(id) tablosuna referans veriyor.
-- Bu sayede admin panelinde appointments + profiles birlikte (embed)
-- tek sorguda çekilebiliyor. Randevu oluşturulmadan önce profilin
-- var olması gerekir (kayıt akışı zaten önce profili oluşturuyor).
-- ============================================================
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  service text not null,
  appointment_date date not null,
  appointment_time time not null,
  note text,
  status text not null default 'beklemede'
    check (status in ('beklemede', 'onaylandı', 'devam ediyor', 'tamamlandı', 'iptal')),
  created_at timestamptz default now()
);

alter table public.appointments enable row level security;

create policy "Kullanici kendi randevularini gorebilir"
  on public.appointments for select
  using (auth.uid() = user_id);

create policy "Kullanici kendi randevusunu olusturabilir"
  on public.appointments for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 3. ADMIN (USTA) YETKİLENDİRMESİ
-- is_admin(), RLS politikalari icinde profiles tablosuna
-- guvenli (recursion yaratmadan) erisim icin security definer
-- fonksiyon olarak tanimlanir.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Admin tum profilleri gorebilir"
  on public.profiles for select
  using (public.is_admin());

create policy "Admin tum randevulari gorebilir"
  on public.appointments for select
  using (public.is_admin());

create policy "Admin randevu durumunu guncelleyebilir"
  on public.appointments for update
  using (public.is_admin());

-- Güvenlik: bir müşterinin kendi profilini güncellerken
-- "role" alanını kendi kendine "admin" yapmasını engeller.
-- (Yukarıdaki "Kullanici kendi profilini guncelleyebilir" politikası
-- role dahil tüm sütunlara izin verdiği için bu tetikleyici olmadan
-- herhangi bir müşteri kendini admin yapabilirdi.)
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ============================================================
-- KURULUM ADIMLARI
-- ============================================================
-- 1. https://supabase.com üzerinde ücretsiz bir proje oluşturun.
-- 2. Bu SQL dosyasının tamamını Project > SQL Editor içinde çalıştırın.
-- 3. Project Settings > API sayfasından "Project URL" ve "anon public" anahtarını
--    alıp js/config.js dosyasındaki SUPABASE_URL ve SUPABASE_ANON_KEY değerlerine
--    yapıştırın.
-- 4. Authentication > Providers altında Email sağlayıcısının açık olduğundan emin olun.
-- 5. USTAYI ADMIN YAPMAK İÇİN:
--    a) Usta, siteden normal bir müşteri gibi "Üye Ol" formunu doldurarak kayıt olsun
--       (kendi gerçek e-posta adresiyle).
--    b) Ardından SQL Editor'de aşağıdaki komutu, e-postayı ustanın gerçek e-postasıyla
--       değiştirerek çalıştırın:
--
--       update public.profiles set role = 'admin'
--       where id = (select id from auth.users where email = 'usta@ornek.com');
--
--    c) Usta artık admin.html sayfasından aynı e-posta/şifre ile giriş yapıp
--       tüm randevuları ve müşteri geçmişini görebilir.
