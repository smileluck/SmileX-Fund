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

const SINA_HEADERS = {
  Accept: '*/*',
  Referer: 'https://finance.sina.com.cn/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

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
        headers: SINA_HEADERS,
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
// 黄金/白银：新浪财经期货接口（上海期货交易所）
// 品牌/银行/回收：xxapi.cn
// ============================================

// 解析新浪期货数据：nf_AU0 / nf_AG0
function parseSinaFuturesData(raw: string) {
  const match = raw.match(/"([^"]+)"/);
  if (!match) return null;
  const f = match[1].split(',');
  // 字段: 0=名称, 2=最新价, 10=昨收盘, 17=日期
  const price = parseFloat(f[2]);
  const prevClose = parseFloat(f[10]);
  if (!price || price <= 0) return null;
  return { price, prevClose, date: f[17] || '' };
}

// 从新浪获取沪金/沪银实时价格
async function fetchSinaGoldSilver() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  const response = await fetch('https://hq.sinajs.cn/list=nf_AU0,nf_AG0', {
    signal: controller.signal,
    headers: SINA_HEADERS,
  });
  clearTimeout(timeoutId);
  if (!response.ok) return null;
  const text = await response.text();

  const auMatch = text.match(/hq_str_nf_AU0="([^"]*)"/);
  const agMatch = text.match(/hq_str_nf_AG0="([^"]*)"/);

  const gold = auMatch?.[1] ? parseSinaFuturesData(`"${auMatch[1]}"`) : null;
  // 白银单位是元/千克，转换为元/克
  const silverRaw = agMatch?.[1] ? parseSinaFuturesData(`"${agMatch[1]}"`) : null;
  const silver = silverRaw ? { ...silverRaw, price: silverRaw.price / 1000, prevClose: silverRaw.prevClose / 1000 } : null;

  return { gold, silver };
}

async function refreshPreciousMetals() {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase 未配置' };

  // 1. 从新浪财经获取沪金/沪银实时价格
  const sinaData = await fetchSinaGoldSilver();
  if (!sinaData?.gold && !sinaData?.silver) {
    return { success: false, error: '新浪期货数据获取失败' };
  }

  const today = new Date().toISOString().split('T')[0];

  // 写入黄金
  if (sinaData.gold) {
    const { price, prevClose } = sinaData.gold;
    const changePercent = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    await supabase.from('precious_metals').upsert(
      { name: '黄金', value: price.toFixed(2), change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`, is_up: changePercent >= 0, unit: '元/克' },
      { onConflict: 'name' }
    );
    await supabase.from('precious_metal_history').upsert(
      { name: '黄金', date: today, value: price },
      { onConflict: 'name,date' }
    );
  }

  // 写入白银
  if (sinaData.silver) {
    const { price, prevClose } = sinaData.silver;
    const changePercent = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    await supabase.from('precious_metals').upsert(
      { name: '白银', value: price.toFixed(2), change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`, is_up: changePercent >= 0, unit: '元/克' },
      { onConflict: 'name' }
    );
    await supabase.from('precious_metal_history').upsert(
      { name: '白银', date: today, value: price },
      { onConflict: 'name,date' }
    );
  }

  // 2. 从 xxapi.cn 获取品牌/银行/回收价格（辅助数据，失败不影响主流程）
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch('https://v2.xxapi.cn/api/goldprice', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return { success: true, warning: '期货数据已写入，xxapi 品牌数据获取失败' };
    const apiResponse = await response.json();
    const data = apiResponse.data;

    // 批量写入：银行金条价格
    if (data.bank_gold_bar_price?.length) {
      const rows = data.bank_gold_bar_price.map((item: any) => ({
        bank: item.bank, price: item.price, unit: '元/克',
      }));
      await supabase.from('bank_gold_bar_prices').upsert(rows, { onConflict: 'bank' });
    }

    // 批量写入：贵金属回收价格（按 gold_type 去重，保留最新日期的记录）
    if (data.gold_recycle_price?.length) {
      const latestMap = new Map<string, any>();
      for (const item of data.gold_recycle_price) {
        const existing = latestMap.get(item.gold_type);
        if (!existing || item.updated_date >= existing.updated_date) {
          latestMap.set(item.gold_type, item);
        }
      }
      const rows = Array.from(latestMap.values()).map((item: any) => ({
        gold_type: item.gold_type, recycle_price: item.recycle_price,
        updated_date: item.updated_date, unit: '元/克',
      }));
      await supabase.from('gold_recycle_prices').upsert(rows, { onConflict: 'gold_type' });
    }

    // 批量写入：品牌贵金属价格
    if (data.precious_metal_price?.length) {
      const rows = data.precious_metal_price.map((item: any) => ({
        brand: item.brand, bullion_price: item.bullion_price,
        gold_price: item.gold_price, platinum_price: item.platinum_price,
        updated_date: item.updated_date, unit: '元/克',
      }));
      await supabase.from('brand_precious_metal_prices').upsert(rows, { onConflict: 'brand' });
    }
  } catch {
    // xxapi 品牌数据获取失败不影响期货主数据
  }

  return { success: true };
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
