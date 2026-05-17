-- RLS 完全读写权限
-- 适用于前端直接增删改查的用户数据表

-- 批量开启 RLS
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'wallets', 'user_holdings', 'settings', 'tracked_funds'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;

-- 完全读写策略
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'wallets', 'user_holdings', 'settings', 'tracked_funds'
  ]
  LOOP
    EXECUTE format('CREATE POLICY "完全访问" ON %I FOR ALL USING (true)', t);
  END LOOP;
END;
$$;
