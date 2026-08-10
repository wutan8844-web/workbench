-- 基金买入流水表:对话记账/手动买入时记录每一笔交易,用于对账与历史查看
create table if not exists public.fund_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fund_code text not null check (fund_code ~ '^[0-9]{6}$'),
  fund_name text not null,
  trade_type text not null default 'buy' check (trade_type in ('buy', 'sell')),
  amount numeric(14, 2) not null check (amount > 0),
  nav numeric(14, 6) not null check (nav > 0),
  shares numeric(18, 4) not null check (shares > 0),
  fee numeric(14, 2) not null default 0,
  trade_date date not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fund_trades_user_date_idx on public.fund_trades(user_id, trade_date desc);

alter table public.fund_trades enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['fund_trades']
  loop
    execute format('drop policy if exists "owner_all" on public.%I', table_name);
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name
    );
  end loop;
end $$;

grant select, insert, update, delete on public.fund_trades to authenticated;
