-- FinPilote Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  company_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Financial data table
create table if not exists public.financial_data (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  month text not null, -- Format: YYYY-MM
  fixed_costs jsonb not null default '{
    "rent": 0,
    "salaries": 0,
    "insurance": 0,
    "subscriptions": 0,
    "loan_payments": 0,
    "other": 0
  }'::jsonb,
  variable_cost_rate numeric(5,2) not null default 0,
  revenue numeric(12,2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, month)
);

-- Transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null default current_date,
  description text not null,
  amount numeric(12,2) not null,
  type text not null check (type in ('income', 'expense')),
  category text not null default 'other',
  is_fixed boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists financial_data_user_id_idx on public.financial_data(user_id);
create index if not exists financial_data_month_idx on public.financial_data(month);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_date_idx on public.transactions(date);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.financial_data enable row level security;
alter table public.transactions enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Financial data policies
create policy "Users can view their own financial data"
  on public.financial_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own financial data"
  on public.financial_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own financial data"
  on public.financial_data for update
  using (auth.uid() = user_id);

create policy "Users can delete their own financial data"
  on public.financial_data for delete
  using (auth.uid() = user_id);

-- Transactions policies
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger to auto-create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Triggers for updated_at
drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_financial_data_updated_at on public.financial_data;
create trigger handle_financial_data_updated_at
  before update on public.financial_data
  for each row execute procedure public.handle_updated_at();
