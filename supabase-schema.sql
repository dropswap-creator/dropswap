-- Run this entire file in your Supabase SQL Editor

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  bio text,
  avatar_url text,
  country text not null default '',
  trust_score numeric(3,2) default 0,
  total_ratings int default 0,
  completed_swaps int default 0,
  created_at timestamptz default now()
);

-- Items
create table items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  title text not null,
  description text not null,
  category text not null,
  images text[] default '{}',
  country text not null,
  status text default 'available' check (status in ('available','in_swap','swapped')),
  created_at timestamptz default now()
);

-- Swaps
create table swaps (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references profiles on delete cascade not null,
  receiver_id uuid references profiles on delete cascade not null,
  requester_item_id uuid references items not null,
  receiver_item_id uuid references items not null,
  status text default 'pending' check (status in (
    'pending','accepted','declined','cancelled',
    'a_shipped','b_shipped','both_shipped',
    'a_received','b_received','completed','disputed'
  )),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages
create table messages (
  id uuid default gen_random_uuid() primary key,
  swap_id uuid references swaps on delete cascade not null,
  sender_id uuid references profiles on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- Ratings
create table ratings (
  id uuid default gen_random_uuid() primary key,
  swap_id uuid references swaps not null,
  rater_id uuid references profiles not null,
  rated_id uuid references profiles not null,
  score int check (score between 1 and 5) not null,
  comment text,
  created_at timestamptz default now(),
  unique(swap_id, rater_id)
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Update trust score when rating is added
create or replace function update_trust_score()
returns trigger as $$
declare
  avg_score numeric;
  count_ratings int;
begin
  select avg(score), count(*) into avg_score, count_ratings
  from ratings where rated_id = new.rated_id;

  update profiles
  set trust_score = round(avg_score, 2),
      total_ratings = count_ratings
  where id = new.rated_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_rating_added
  after insert on ratings
  for each row execute procedure update_trust_score();

-- Increment completed_swaps when swap completes
create or replace function handle_swap_complete()
returns trigger as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    update profiles set completed_swaps = completed_swaps + 1
    where id in (new.requester_id, new.receiver_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_swap_completed
  after update on swaps
  for each row execute procedure handle_swap_complete();

-- RLS Policies
alter table profiles enable row level security;
alter table items enable row level security;
alter table swaps enable row level security;
alter table messages enable row level security;
alter table ratings enable row level security;

-- Profiles: anyone can read, owner can update
create policy "Public profiles" on profiles for select using (true);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- Items: anyone can read available items, owner can insert/update/delete
create policy "Public items" on items for select using (true);
create policy "Authenticated users insert items" on items for insert with check (auth.uid() = user_id);
create policy "Owners update items" on items for update using (auth.uid() = user_id);
create policy "Owners delete items" on items for delete using (auth.uid() = user_id);

-- Swaps: only participants can see
create policy "Participants view swaps" on swaps for select
  using (auth.uid() = requester_id or auth.uid() = receiver_id);
create policy "Authenticated users create swaps" on swaps for insert
  with check (auth.uid() = requester_id);
create policy "Participants update swaps" on swaps for update
  using (auth.uid() = requester_id or auth.uid() = receiver_id);

-- Messages: only swap participants
create policy "Participants view messages" on messages for select
  using (
    exists (
      select 1 from swaps
      where swaps.id = messages.swap_id
      and (swaps.requester_id = auth.uid() or swaps.receiver_id = auth.uid())
    )
  );
create policy "Participants send messages" on messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from swaps
      where swaps.id = messages.swap_id
      and (swaps.requester_id = auth.uid() or swaps.receiver_id = auth.uid())
    )
  );

-- Ratings: public read, participants write once
create policy "Public ratings" on ratings for select using (true);
create policy "Participants rate once" on ratings for insert
  with check (auth.uid() = rater_id);

-- Storage bucket for item images and avatars
insert into storage.buckets (id, name, public) values ('images', 'images', true);

create policy "Public image access" on storage.objects for select
  using (bucket_id = 'images');
create policy "Authenticated users upload images" on storage.objects for insert
  with check (bucket_id = 'images' and auth.role() = 'authenticated');
create policy "Owners delete images" on storage.objects for delete
  using (bucket_id = 'images' and auth.uid()::text = split_part(name, '/', 1));
