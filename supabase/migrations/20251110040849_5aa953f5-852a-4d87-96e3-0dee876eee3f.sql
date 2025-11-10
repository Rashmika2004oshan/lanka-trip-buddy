-- Create profiles table for traveller information
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  bio text,
  country text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create saved_itineraries table
create table public.saved_itineraries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  days integer not null,
  interests jsonb not null,
  itinerary_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.saved_itineraries enable row level security;

-- Saved itineraries policies
create policy "Users can view their own itineraries"
  on public.saved_itineraries for select
  using (auth.uid() = user_id);

create policy "Users can create their own itineraries"
  on public.saved_itineraries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own itineraries"
  on public.saved_itineraries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own itineraries"
  on public.saved_itineraries for delete
  using (auth.uid() = user_id);

-- Create favorite_places table
create table public.favorite_places (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  place_name text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, place_name)
);

-- Enable RLS
alter table public.favorite_places enable row level security;

-- Favorite places policies
create policy "Users can view their own favorites"
  on public.favorite_places for select
  using (auth.uid() = user_id);

create policy "Users can add favorites"
  on public.favorite_places for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their favorites"
  on public.favorite_places for delete
  using (auth.uid() = user_id);

-- Create travel_reviews table
create table public.travel_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  place_name text not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  review_text text,
  visit_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.travel_reviews enable row level security;

-- Reviews policies
create policy "Reviews are viewable by everyone"
  on public.travel_reviews for select
  using (true);

create policy "Users can create reviews"
  on public.travel_reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
  on public.travel_reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reviews"
  on public.travel_reviews for delete
  using (auth.uid() = user_id);

-- Function to handle new user profile creation
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger to automatically create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_reviews_updated_at
  before update on public.travel_reviews
  for each row execute procedure public.handle_updated_at();