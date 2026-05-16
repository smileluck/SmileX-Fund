-- SmileX Fund - Supabase 数据库建表脚本
-- 在 Supabase Dashboard -> SQL Editor 中执行

-- ============================================
-- 用户数据表
-- ============================================

-- 钱包
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户持仓
CREATE TABLE IF NOT EXISTS user_holdings (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  fund_name TEXT NOT NULL,
  holding_amount NUMERIC DEFAULT 0,
  holding_profit NUMERIC DEFAULT 0,
  current_price NUMERIC DEFAULT 0,
  profit_rate NUMERIC DEFAULT 0,
  type TEXT DEFAULT '',
  industry_info TEXT,
  wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, wallet_id)
);

-- 应用设置 (key-value)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 定时刷新数据表（后端 cron 写入）
-- ============================================

-- 市场指数
CREATE TABLE IF NOT EXISTS market_indices (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  change TEXT NOT NULL,
  is_up BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 贵金属实时数据
CREATE TABLE IF NOT EXISTS precious_metals (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  change TEXT NOT NULL,
  is_up BOOLEAN NOT NULL DEFAULT TRUE,
  unit TEXT DEFAULT '元/克',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 银行投资金条价格
CREATE TABLE IF NOT EXISTS bank_gold_bar_prices (
  id BIGSERIAL PRIMARY KEY,
  bank TEXT NOT NULL UNIQUE,
  price TEXT NOT NULL,
  unit TEXT DEFAULT '元/克',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 贵金属回收价格
CREATE TABLE IF NOT EXISTS gold_recycle_prices (
  id BIGSERIAL PRIMARY KEY,
  gold_type TEXT NOT NULL UNIQUE,
  recycle_price TEXT NOT NULL,
  updated_date TEXT,
  unit TEXT DEFAULT '元/克',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 品牌贵金属价格
CREATE TABLE IF NOT EXISTS brand_precious_metal_prices (
  id BIGSERIAL PRIMARY KEY,
  brand TEXT NOT NULL UNIQUE,
  bullion_price TEXT,
  gold_price TEXT,
  platinum_price TEXT,
  updated_date TEXT,
  unit TEXT DEFAULT '元/克',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 跟踪基金
CREATE TABLE IF NOT EXISTS tracked_funds (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  net_value NUMERIC DEFAULT 0,
  estimated_value NUMERIC DEFAULT 0,
  change_rate NUMERIC DEFAULT 0,
  update_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 静态缓存数据表
-- ============================================

-- 基金基础信息
CREATE TABLE IF NOT EXISTS funds (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  risk_level TEXT,
  manager TEXT,
  established_date TEXT,
  fund_size TEXT,
  valuation JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 基金持仓汇总
CREATE TABLE IF NOT EXISTS fund_holdings_summary (
  id BIGSERIAL PRIMARY KEY,
  industry TEXT NOT NULL UNIQUE,
  proportion NUMERIC DEFAULT 0,
  count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 宏观经济数据
CREATE TABLE IF NOT EXISTS macro_economic_data (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  m1 NUMERIC,
  m1_change_rate NUMERIC,
  m2 NUMERIC,
  m2_change_rate NUMERIC,
  gdp NUMERIC,
  gdp_change_rate NUMERIC,
  buffett_indicator NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 宏观经济累计涨跌幅
CREATE TABLE IF NOT EXISTS macro_economic_cumulative (
  id BIGSERIAL PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  cumulative_change NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 贵金属历史数据
CREATE TABLE IF NOT EXISTS precious_metal_history (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  value NUMERIC NOT NULL,
  UNIQUE(name, date)
);

-- ============================================
-- 初始化默认钱包数据
-- ============================================
INSERT INTO wallets (id, name, created_at) VALUES
  ('summary', '汇总', NOW()),
  ('default', '默认钱包', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- updated_at 自动更新触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_holdings', 'settings', 'market_indices', 'precious_metals',
    'bank_gold_bar_prices', 'gold_recycle_prices', 'brand_precious_metal_prices',
    'tracked_funds', 'funds', 'fund_holdings_summary',
    'macro_economic_data', 'macro_economic_cumulative', 'precious_metal_history'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I;
       CREATE TRIGGER set_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW
         EXECUTE FUNCTION update_updated_at_column();',
      t, t
    );
  END LOOP;
END;
$$;
