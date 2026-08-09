-- 进度本 V2：每张个人数据表都按 auth.uid() 隔离。

create extension if not exists pgcrypto;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('expense', 'income', 'transfer')),
  amount numeric(14, 2) not null check (amount > 0),
  category text not null,
  note text not null default '',
  happened_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fund_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fund_code text not null check (fund_code ~ '^[0-9]{6}$'),
  fund_name text not null,
  shares numeric(18, 4) not null check (shares > 0),
  cost numeric(14, 6) not null check (cost > 0),
  group_name text not null default '我的持仓',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, fund_code)
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  code text not null default '',
  checks_passed integer not null default 0,
  completed boolean not null default false,
  attempts integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key(user_id, lesson_id)
);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  note text not null default '',
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  task_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_date date not null,
  summary text not null default '',
  gain text not null default '',
  lack text not null default '',
  plan text not null default '',
  mood integer not null default 3 check (mood between 1 and 5),
  updated_at timestamptz not null default now(),
  unique(user_id, review_date)
);

create table if not exists public.journal_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  tags text[] not null default '{}',
  note_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.english_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  level integer not null default 0 check (level between 0 and 5),
  next_review date not null,
  updated_at timestamptz not null default now(),
  primary key(user_id, word)
);

create index if not exists transactions_user_date_idx on public.transactions(user_id, happened_on desc);
create index if not exists tasks_user_date_idx on public.daily_tasks(user_id, task_date desc);
create index if not exists reviews_user_date_idx on public.daily_reviews(user_id, review_date desc);
create index if not exists notes_user_date_idx on public.journal_notes(user_id, note_date desc);

alter table public.transactions enable row level security;
alter table public.fund_positions enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.daily_reviews enable row level security;
alter table public.journal_notes enable row level security;
alter table public.english_progress enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['transactions','fund_positions','lesson_progress','daily_tasks','daily_reviews','journal_notes','english_progress']
  loop
    execute format('drop policy if exists "owner_all" on public.%I', table_name);
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name
    );
  end loop;
end $$;

grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.fund_positions to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;
grant select, insert, update, delete on public.daily_tasks to authenticated;
grant select, insert, update, delete on public.daily_reviews to authenticated;
grant select, insert, update, delete on public.journal_notes to authenticated;
grant select, insert, update, delete on public.english_progress to authenticated;
