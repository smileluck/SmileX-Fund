// 定时刷新数据 API 路由
// 被外部 cron 服务定时调用，抓取市场数据写入 Supabase
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

// ============================================
// 市场指数抓取（新浪财经）
// ============================================

const MARKET_INDICES = [
  { name: '上证指数', code: 'sh000001' },
  { name: '深证成指', code: 'sz399001' },
  { name: '创业板指', code: 'sz399006' },
  { name: '恒生指数', code: 'hkHSI' },
];

function parseSinaMarketData(rawData: string) {
  const match = rawData.match(/"([^"]+)"/);
  if (!match) return null;
  const fields = match[1].split(',');
  return {
    name: fields[0] || '',
    currentPrice: parseFloat(fields[1]) || 0,
    changePercent: parseFloat(fields[3]) || 0,
  };
}

function formatPrice(price: number): string {
  if (price >= 10000) return price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toFixed(2);
}

async function refreshMarketIndices() {
  const results: Array<{ name: string; value: string; change: string; is_up: boolean }> = [];

  const fetchPromises = MARKET_INDICES.map(async (index) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`https://hq.sinajs.cn/list=${index.code}`, {
        signal: controller.signal,
        headers: {
          Accept: '*/*',
          Referer: 'https://finance.sina.com.cn/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      clearTimeout(timeoutId);
      if (!response.ok) return null;
      const text = await response.text();
      const parsed = parseSinaMarketData(text);
      if (!parsed) return null;
      return {
        name: index.name,
        value: formatPrice(parsed.currentPrice),
        change: `${parsed.changePercent >= 0 ? '+' : ''}${parsed.changePercent.toFixed(2)}%`,
        is_up: parsed.changePercent >= 0,
      };
    } catch {
      return null;
    }
  });

  const fetched = await Promise.all(fetchPromises);
  fetched.forEach((r) => { if (r) results.push(r); });

  if (results.length === 0) return { success: false, error: '市场指数全部获取失败' };

  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase 未配置' };

  for (const item of results) {
    const { error } = await supabase
      .from('market_indices')
      .upsert(item, { onConflict: 'name' });
    if (error) console.error(`写入市场指数 ${item.name} 失败:`, error);
  }

  return { success: true, count: results.length };
}

// ============================================
// 贵金属数据抓取
// ============================================

async function refreshPreciousMetals() {
  try {
    const response = await fetch('https://v2.xxapi.cn/api/goldprice');
    if (!response.ok) throw new Error(`API ${response.status}`);
    const apiResponse = await response.json();
    const data = apiResponse.data;
    if (!data) return { success: false, error: '贵金属 API 无数据' };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase 未配置' };

    // 银行金条价格
    if (data.bank_gold_bar_price) {
      for (const item of data.bank_gold_bar_price) {
        await supabase.from('bank_gold_bar_prices').upsert(
          { bank: item.bank, price: item.price, unit: '元/克' },
          { onConflict: 'bank' }
        );
      }
    }

    // 贵金属回收价格
    if (data.gold_recycle_price) {
      for (const item of data.gold_recycle_price) {
        await supabase.from('gold_recycle_prices').upsert(
          { gold_type: item.gold_type, recycle_price: item.recycle_price, updated_date: item.updated_date, unit: '元/克' },
          { onConflict: 'gold_type' }
        );
      }
    }

    // 品牌贵金属价格
    if (data.precious_metal_price) {
      for (const item of data.precious_metal_price) {
        await supabase.from('brand_precious_metal_prices').upsert(
          { brand: item.brand, bullion_price: item.bullion_price, gold_price: item.gold_price, platinum_price: item.platinum_price, updated_date: item.updated_date, unit: '元/克' },
          { onConflict: 'brand' }
        );
      }
    }

    // 从品牌价格中提取黄金/白银简明数据写入 precious_metals
    const previousPrices: Record<string, number> = {};
    const { data: existing } = await supabase.from('precious_metals').select('name,value');
    if (existing) {
      for (const row of existing) {
        previousPrices[row.name] = parseFloat(row.value) || 0;
      }
    }

    // 黄金
    if (data.precious_metal_price && data.precious_metal_price.length > 0) {
      const firstBrand = data.precious_metal_price[0];
      if (firstBrand?.gold_price) {
        const currentPrice = parseFloat(firstBrand.gold_price);
        const prev = previousPrices['黄金'] || currentPrice;
        const changePercent = prev > 0 ? ((currentPrice - prev) / prev) * 100 : 0;
        await supabase.from('precious_metals').upsert(
          { name: '黄金', value: firstBrand.gold_price, change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`, is_up: changePercent >= 0, unit: '元/克' },
          { onConflict: 'name' }
        );
      }
    }

    // 白银
    if (data.gold_recycle_price) {
      const silverItem = data.gold_recycle_price.find((i: { gold_type: string }) => i.gold_type.includes('银'));
      if (silverItem?.recycle_price) {
        const currentPrice = parseFloat(silverItem.recycle_price);
        const prev = previousPrices['白银'] || currentPrice;
        const changePercent = prev > 0 ? ((currentPrice - prev) / prev) * 100 : 0;
        await supabase.from('precious_metals').upsert(
          { name: '白银', value: silverItem.recycle_price, change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`, is_up: changePercent >= 0, unit: '元/克' },
          { onConflict: 'name' }
        );
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// 跟踪基金实时数据刷新
// ============================================

async function refreshTrackedFunds() {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase 未配置' };

  const { data: tracked } = await supabase.from('tracked_funds').select('code');
  if (!tracked || tracked.length === 0) return { success: true, count: 0 };

  let updated = 0;
  for (const fund of tracked) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`https://fundgz.1234567.com.cn/js/${fund.code}.js`, {
        signal: controller.signal,
        headers: { Accept: '*/*', 'User-Agent': 'Mozilla/5.0' },
      });
      clearTimeout(timeoutId);
      if (!response.ok) continue;

      const text = await response.text();
      const match = text.match(/^jsonpgz\((.*)\);$/);
      if (!match) continue;

      let fundData: Record<string, string>;
      try { fundData = JSON.parse(match[1]); } catch { continue; }

      await supabase.from('tracked_funds').update({
        name: fundData.name,
        net_value: parseFloat(fundData.dwjz),
        estimated_value: parseFloat(fundData.gsz),
        change_rate: parseFloat(fundData.gszzl),
        update_time: fundData.gztime,
      }).eq('code', fund.code);

      updated++;
    } catch {
      // skip failed fund
    }
  }

  return { success: true, count: updated };
}

// ============================================
// 主入口
// ============================================

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const tasks = body.tasks || ['market', 'metals', 'funds'];

  const results: Record<string, any> = {};

  if (tasks.includes('market')) {
    results.market = await refreshMarketIndices();
  }
  if (tasks.includes('metals')) {
    results.metals = await refreshPreciousMetals();
  }
  if (tasks.includes('funds')) {
    results.funds = await refreshTrackedFunds();
  }

  return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
}

export async function GET(request: NextRequest) {
  // GET 请求也执行刷新，方便 cron 服务调用
  const tasks = request.nextUrl.searchParams.get('tasks')?.split(',') || ['market', 'metals'];

  const results: Record<string, any> = {};

  if (tasks.includes('market')) {
    results.market = await refreshMarketIndices();
  }
  if (tasks.includes('metals')) {
    results.metals = await refreshPreciousMetals();
  }
  if (tasks.includes('funds')) {
    results.funds = await refreshTrackedFunds();
  }

  return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
}
