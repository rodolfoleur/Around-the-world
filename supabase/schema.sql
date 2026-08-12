-- Voyager sync schema — run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste all of this → Run).
--
-- Model: a "household" is the sharing boundary (you + Kirsten). Trips
-- belong to a household; anyone who is a member of that household can
-- read and write its trips. New users create a household and get an
-- invite code; a second person redeems that code to join the same one.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table households (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  color text not null,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table household_invites (
  code text primary key,
  household_id uuid not null references households(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  route text not null default '',
  currency text not null default 'GBP',
  curated boolean not null default false,
  travelers jsonb not null default '[]',
  days jsonb not null default '[]',
  bookings jsonb not null default '[]',
  costs jsonb not null default '[]',
  extra_costs jsonb not null default '[]',
  extra_activities jsonb not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Without this, Postgres's logical replication (what Supabase Realtime
-- rides on) is allowed to omit an unchanged jsonb column's value entirely
-- from an UPDATE event once that column is stored TOASTed out-of-line —
-- so e.g. adding an activity (which only touches extra_activities) could
-- make `days`/`bookings` arrive as missing/null in the realtime payload
-- even though the database itself was fine. Full replica identity always
-- includes every column, closing that gap.
alter table trips replica identity full;

-- keep updated_at fresh so realtime consumers can tell what changed
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trips_touch_updated_at
  before update on trips
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------
-- Helper: is the current user a member of this household?
-- ---------------------------------------------------------------------
create or replace function is_household_member(hid uuid) returns boolean as $$
  select exists (
    select 1 from household_members
    where household_id = hid and user_id = auth.uid()
  );
$$ language sql stable security definer;

-- Assigns the next color in the app's avatar palette, in join order —
-- matches TERRA/BLUE/SAGE/PLUM/GOLD in src/data/tripsRegistry.js.
create or replace function member_color(hid uuid) returns text as $$
  select (array['#c96f3f','#3f6f8f','#6b8f5a','#8a6a9f','#b08d4f'])[
    (select count(*) from household_members where household_id = hid) % 5 + 1
  ];
$$ language sql stable;

-- ---------------------------------------------------------------------
-- RPCs: create a household (first user) / join one (second user).
-- security definer so a brand-new user (not yet a member of anything)
-- can still create their first household or redeem an invite, without
-- needing broad direct-insert RLS grants on the underlying tables.
-- ---------------------------------------------------------------------

create or replace function create_household(display_name text)
returns table(household_id uuid, invite_code text) as $$
declare
  new_household_id uuid;
  new_code text;
begin
  insert into households default values returning id into new_household_id;
  insert into household_members (household_id, user_id, display_name, color)
    values (new_household_id, auth.uid(), display_name, member_color(new_household_id));
  new_code := encode(gen_random_bytes(4), 'hex');
  insert into household_invites (code, household_id) values (new_code, new_household_id);
  return query select new_household_id, new_code;
end;
$$ language plpgsql security definer;

create or replace function join_household(invite_code text, display_name text)
returns uuid as $$
declare
  target_household_id uuid;
begin
  select household_id into target_household_id
    from household_invites
    where code = invite_code and expires_at > now();

  if target_household_id is null then
    raise exception 'That invite code is invalid or has expired.';
  end if;

  insert into household_members (household_id, user_id, display_name, color)
    values (target_household_id, auth.uid(), display_name, member_color(target_household_id))
    on conflict (household_id, user_id) do update set display_name = excluded.display_name;

  return target_household_id;
end;
$$ language plpgsql security definer;

-- lets a signed-in user fetch their own membership + a fresh invite code
-- to share, without needing direct select on household_invites for
-- codes that aren't theirs.
create or replace function my_household()
returns table(household_id uuid, invite_code text) as $$
declare
  hid uuid;
  code text;
begin
  select household_members.household_id into hid
    from household_members where user_id = auth.uid() limit 1;
  if hid is null then return; end if;

  select household_invites.code into code
    from household_invites
    where household_invites.household_id = hid and expires_at > now()
    order by created_at desc limit 1;

  if code is null then
    code := encode(gen_random_bytes(4), 'hex');
    insert into household_invites (code, household_id) values (code, hid);
  end if;

  return query select hid, code;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table households enable row level security;
alter table household_members enable row level security;
alter table household_invites enable row level security;
alter table trips enable row level security;

create policy "members can see their own household row"
  on households for select
  using (is_household_member(id));

create policy "members can see other members of their household"
  on household_members for select
  using (is_household_member(household_id));

-- no direct insert/update/delete policies on household_members or
-- households/household_invites: all writes go through the security
-- definer RPCs above, which is deliberate — keeps the client from
-- being able to add itself to an arbitrary household directly.

create policy "members can read their household's trips"
  on trips for select
  using (is_household_member(household_id));

create policy "members can add trips to their household"
  on trips for insert
  with check (is_household_member(household_id));

create policy "members can update their household's trips"
  on trips for update
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "members can delete their household's trips"
  on trips for delete
  using (is_household_member(household_id));

-- ---------------------------------------------------------------------
-- Realtime: broadcast row changes on trips to subscribed clients
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table trips;
