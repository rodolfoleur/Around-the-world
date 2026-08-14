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
  created_at timestamptz not null default now(),
  -- "Where we've been" world map on the trips dashboard — keyed by
  -- country name (as given by the map's own geography data), value = an
  -- array of household_members.user_id who've visited. Household-level
  -- (not per-trip): a lifetime travel record, not tied to any one trip.
  visited_countries jsonb not null default '{}'
);

-- Same reasoning as trips: without full replica identity, Postgres's
-- logical replication (what Realtime rides on) can omit an unchanged
-- jsonb column's value once it's large enough to be stored out-of-line —
-- as visited_countries will be, eventually, with enough countries marked.
alter table households replica identity full;

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
  custom_cards jsonb not null default '[]',
  todos jsonb not null default '[]',
  photos jsonb not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trip-level sharing, additive to the household model above: a household
-- is still the boundary for trips *you* create, but sharing one specific
-- trip with someone else doesn't require adding them to your whole
-- household — they redeem a trip-scoped invite code instead, and only
-- ever see that one trip, not any of your others.
create table trip_shares (
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  color text not null,
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table trip_invites (
  code text primary key,
  trip_id uuid not null references trips(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
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
-- Trip-level sharing: invite one person to one trip, not your household.
-- ---------------------------------------------------------------------

-- True if the current user can see/edit this trip — either via their
-- household (the original model, above) or a trip-specific share. Kept as
-- its own security definer function (rather than inlined in each policy)
-- so trips/trip_shares' RLS and every RPC below agree on exactly one
-- definition of "has access."
create or replace function has_trip_access(tid uuid) returns boolean as $$
  select exists (
    select 1 from trips t
    where t.id = tid
      and (
        is_household_member(t.household_id)
        or exists (select 1 from trip_shares ts where ts.trip_id = tid and ts.user_id = auth.uid())
      )
  );
$$ language sql stable security definer;

-- Reuses any still-valid code for this trip rather than minting a new one
-- every time the invite panel opens — same pattern as my_household().
create or replace function get_trip_invite(target_trip_id uuid)
returns text as $$
declare
  code text;
begin
  if not has_trip_access(target_trip_id) then
    raise exception 'You do not have access to this trip.';
  end if;

  select trip_invites.code into code
    from trip_invites
    where trip_invites.trip_id = target_trip_id and expires_at > now()
    order by created_at desc limit 1;

  if code is null then
    code := encode(gen_random_bytes(4), 'hex');
    insert into trip_invites (code, trip_id) values (code, target_trip_id);
  end if;

  return code;
end;
$$ language plpgsql security definer;

-- Redeeming a trip invite only ever grants access to that one trip —
-- never the inviter's household or any of their other trips.
create or replace function join_trip(invite_code text, display_name text)
returns uuid as $$
declare
  target_trip_id uuid;
  assigned_color text;
begin
  select trip_id into target_trip_id
    from trip_invites
    where code = invite_code and expires_at > now();

  if target_trip_id is null then
    raise exception 'That invite code is invalid or has expired.';
  end if;

  assigned_color := (array['#c96f3f','#3f6f8f','#6b8f5a','#8a6a9f','#b08d4f'])[
    (select count(*) from trip_shares where trip_id = target_trip_id) % 5 + 1
  ];

  insert into trip_shares (trip_id, user_id, display_name, color)
    values (target_trip_id, auth.uid(), display_name, assigned_color)
    on conflict (trip_id, user_id) do update set display_name = excluded.display_name;

  return target_trip_id;
end;
$$ language plpgsql security definer;

-- Combined "who has access to this trip" for the trip's own Invite panel —
-- household members plus trip_shares, tagged so the UI can label each.
create or replace function trip_access_list(target_trip_id uuid)
returns table(user_id uuid, display_name text, color text, via text) as $$
declare
  hid uuid;
begin
  if not has_trip_access(target_trip_id) then
    raise exception 'You do not have access to this trip.';
  end if;

  select trips.household_id into hid from trips where trips.id = target_trip_id;

  return query
    select hm.user_id, hm.display_name, hm.color, 'household'::text
    from household_members hm where hm.household_id = hid
    union all
    select ts.user_id, ts.display_name, ts.color, 'shared'::text
    from trip_shares ts where ts.trip_id = target_trip_id;
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table households enable row level security;
alter table household_members enable row level security;
alter table household_invites enable row level security;
alter table trips enable row level security;
alter table trip_shares enable row level security;
alter table trip_invites enable row level security;

create policy "members can see their own household row"
  on households for select
  using (is_household_member(id));

-- The one direct write allowed on households — visited_countries is
-- shared, editable content (like a trip's fields), not membership/access
-- control, so it doesn't need the security-definer-RPC treatment below.
create policy "members can update their household's visited countries"
  on households for update
  using (is_household_member(id))
  with check (is_household_member(id));

create policy "members can see other members of their household"
  on household_members for select
  using (is_household_member(household_id));

-- no direct insert/delete policies on households, and no direct
-- insert/update/delete on household_members, household_invites,
-- trip_shares, or trip_invites: all writes to these go through the
-- security definer RPCs above, which is deliberate — keeps the client
-- from adding itself to an arbitrary household or trip directly.

create policy "trip members can see their trip's shares"
  on trip_shares for select
  using (has_trip_access(trip_id));

create policy "trip access: select"
  on trips for select
  using (has_trip_access(id));

create policy "members can add trips to their household"
  on trips for insert
  with check (is_household_member(household_id));

-- Update is intentionally broader than insert/delete: a trip-shared
-- collaborator can help plan/edit the trip they were invited to, but only
-- the owning household can create or delete trips outright.
create policy "trip access: update"
  on trips for update
  using (has_trip_access(id))
  with check (has_trip_access(id));

create policy "members can delete their household's trips"
  on trips for delete
  using (is_household_member(household_id));

-- ---------------------------------------------------------------------
-- Realtime: broadcast row changes on trips/households to subscribed clients
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table trips;
alter publication supabase_realtime add table households;

-- ---------------------------------------------------------------------
-- Storage: a public bucket for uploaded location photos. Public-read is
-- deliberate (they're just destination photos, nothing private) — the
-- trip data that actually matters stays behind the RLS above. Any signed-in
-- user can upload/replace one; for a 2-person household app that's the
-- same trust level every other write in this schema already assumes.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do nothing;

create policy "trip photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'trip-photos');

create policy "signed-in users can upload trip photos"
  on storage.objects for insert
  with check (bucket_id = 'trip-photos' and auth.role() = 'authenticated');

create policy "signed-in users can replace trip photos"
  on storage.objects for update
  using (bucket_id = 'trip-photos' and auth.role() = 'authenticated');
