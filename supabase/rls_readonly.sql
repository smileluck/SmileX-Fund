-- RLS 公开只读权限
-- 适用于由后端 cron 写入、前端仅读取的公共数据表

-- 批量开启 RLS
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'market_indices', 'precious_metals', 'bank_gold_bar_prices',
    'gold_recycle_prices', 'brand_precious_metal_prices',
    'funds', 'fund_holdings_summary', 'macro_economic_data',
    'macro_economic_cumulative', 'precious_metal_history'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;

-- 公开只读策略
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'market_indices', 'precious_metals', 'bank_gold_bar_prices',
    'gold_recycle_prices', 'brand_precious_metal_prices',
    'funds', 'fund_holdings_summary', 'macro_economic_data',
    'macro_economic_cumulative', 'precious_metal_history'
  ]
  LOOP
    EXECUTE format('CREATE POLICY "公开只读" ON %I FOR SELECT USING (true)', t);
  END LOOP;
END;
$$;
