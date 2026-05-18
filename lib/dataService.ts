// 数据持久化服务
// 使用 Supabase 作为主存储，localStorage 作为离线缓存/降级

import { getSupabase, isSupabaseConfigured } from './supabase';

// 基金基本信息接口
export interface FundBasic {
  code: string;
  name: string;
  type: string;
  riskLevel: string;
  manager: string;
  establishedDate: string;
  fundSize: string;
}

export interface FundValuation {
  code: string;
  valuation: number;
  netValue: number;
  dailyChange: number;
  dailyChangeRate: number;
  weeklyChangeRate: number;
  monthlyChangeRate: number;
  updateTime: string;
}

export interface FundRealTimeData {
  code: string;
  name: string;
  netValue: number;
  estimatedValue: number;
  changeRate: number;
  updateTime: string;
}

export interface FundHistory {
  code: string;
  date: string;
  value: number;
}

export interface FundHoldings {
  code: string;
  stockCode: string;
  stockName: string;
  proportion: number;
  industry: string;
}

export interface FundInfo extends FundBasic {
  valuation: FundValuation;
  holdings?: FundHoldings[];
}

export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  isUp: boolean;
  updateTime?: string;
}

export interface MacroEconomicData {
  date: string;
  m1: number;
  m1ChangeRate: number;
  m2: number;
  m2ChangeRate: number;
  gdp: number;
  gdpChangeRate: number;
  buffettIndicator: number;
}

export interface MacroEconomicCumulative {
  date: string;
  cumulativeChange: number;
}

export interface PreciousMetal {
  name: string;
  value: string;
  change: string;
  isUp: boolean;
  unit: string;
}

export interface PreciousMetalHistory {
  name: string;
  date: string;
  value: number;
}

export interface BankGoldBarPrice {
  bank: string;
  price: string;
  unit?: string;
}

export interface GoldRecyclePrice {
  gold_type: string;
  recycle_price: string;
  updated_date: string;
  unit?: string;
}

export interface BrandPreciousMetalPrice {
  brand: string;
  bullion_price: string;
  gold_price: string;
  platinum_price: string;
  updated_date: string;
  unit?: string;
}

export interface CompletePreciousMetalData {
  bankGoldBarPrices: BankGoldBarPrice[];
  goldRecyclePrices: GoldRecyclePrice[];
  brandPrices: BrandPreciousMetalPrice[];
}

export interface Wallet {
  id: string;
  name: string;
  createdAt: string;
}

export interface UserHolding {
  code: string;
  fundName: string;
  holdingAmount: number;
  holdingProfit: number;
  currentPrice: number;
  profitRate: number;
  type: string;
  industryInfo?: string;
  walletId: string;
}

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const STORAGE_PREFIX = 'smilex-fund';
const STORAGE_KEYS = {
  USER_HOLDINGS: `${STORAGE_PREFIX}:userHoldings`,
  WALLETS: `${STORAGE_PREFIX}:wallets`,
  SETTINGS: `${STORAGE_PREFIX}:settings`,
  MARKET_INDICES: `${STORAGE_PREFIX}:marketIndices`,
  PRECIOUS_METALS: `${STORAGE_PREFIX}:preciousMetals`,
  BANK_GOLD_BAR_PRICES: `${STORAGE_PREFIX}:bankGoldBarPrices`,
  GOLD_RECYCLE_PRICES: `${STORAGE_PREFIX}:goldRecyclePrices`,
  BRAND_PRECIOUS_METAL_PRICES: `${STORAGE_PREFIX}:brandPreciousMetalPrices`,
  PRECIOUS_METAL_SYNC_TIME: `${STORAGE_PREFIX}:preciousMetalSyncTime`,
  FUND_HOLDINGS_SUMMARY: `${STORAGE_PREFIX}:fundHoldingsSummary`,
  TRACKED_FUNDS: `${STORAGE_PREFIX}:trackedFunds`,
  FUNDS: `${STORAGE_PREFIX}:funds`,
};

const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

class DataService {
  private cache: Record<string, any> = {};
  private debouncedSave: Record<string, (...args: any[]) => void>;

  constructor() {
    this.debouncedSave = {
      userHoldings: debounce((data: any) => this.saveUserHoldings(data), 500),
      wallets: debounce((data: any) => this.saveWallets(data), 500),
      trackedFunds: debounce((data: any) => this.saveTrackedFunds(data), 500),
    };
  }

  // ===== localStorage 读写（降级用） =====

  private readFromLocal<T>(key: string, defaultValue: T): T {
    try {
      if (key in this.cache) return this.cache[key];
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          this.cache[key] = parsed;
          return parsed;
        }
      }
    } catch (error) {
      console.error(`localStorage 读取失败 (${key}):`, error);
    }
    return defaultValue;
  }

  private saveToLocal(key: string, data: any): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      }
      this.cache[key] = data;
    } catch (error) {
      console.error(`localStorage 写入失败 (${key}):`, error);
    }
  }

  // ===== 用户持仓 =====

  async getUserHoldings(): Promise<UserHolding[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase
          .from('user_holdings')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data) {
          const holdings = data.map((row: any) => ({
            code: row.code,
            fundName: row.fund_name,
            holdingAmount: Number(row.holding_amount),
            holdingProfit: Number(row.holding_profit),
            currentPrice: Number(row.current_price),
            profitRate: Number(row.profit_rate),
            type: row.type,
            industryInfo: row.industry_info,
            walletId: row.wallet_id,
          }));
          this.saveToLocal(STORAGE_KEYS.USER_HOLDINGS, holdings);
          return holdings;
        }
      } catch (error) {
        console.error('Supabase 读取 user_holdings 失败:', error);
      }
    }
    return this.readFromLocal<UserHolding[]>(STORAGE_KEYS.USER_HOLDINGS, []);
  }

  async saveUserHoldings(holdings: UserHolding[]): Promise<void> {
    this.saveToLocal(STORAGE_KEYS.USER_HOLDINGS, holdings);
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        // 删除旧数据后重新插入
        await supabase.from('user_holdings').delete().neq('id', 0);
        if (holdings.length > 0) {
          const rows = holdings.map((h) => ({
            code: h.code,
            fund_name: h.fundName,
            holding_amount: h.holdingAmount,
            holding_profit: h.holdingProfit,
            current_price: h.currentPrice,
            profit_rate: h.profitRate,
            type: h.type,
            industry_info: h.industryInfo,
            wallet_id: h.walletId,
          }));
          await supabase.from('user_holdings').insert(rows);
        }
      } catch (error) {
        console.error('Supabase 写入 user_holdings 失败:', error);
      }
    }
  }

  debouncedSaveUserHoldings(holdings: UserHolding[]): void {
    this.debouncedSave.userHoldings(holdings);
  }

  // ===== 钱包 =====

  async getWallets(): Promise<Wallet[]> {
    const defaultWallets: Wallet[] = [
      { id: 'summary', name: '汇总', createdAt: new Date().toISOString() },
      { id: 'default', name: '默认钱包', createdAt: new Date().toISOString() },
    ];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('wallets').select('*').order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          const wallets = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            createdAt: row.created_at,
          }));
          this.saveToLocal(STORAGE_KEYS.WALLETS, wallets);
          return wallets;
        }
      } catch (error) {
        console.error('Supabase 读取 wallets 失败:', error);
      }
    }
    return this.readFromLocal<Wallet[]>(STORAGE_KEYS.WALLETS, defaultWallets);
  }

  async saveWallets(wallets: Wallet[]): Promise<void> {
    this.saveToLocal(STORAGE_KEYS.WALLETS, wallets);
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        // 对比差异后 upsert
        for (const w of wallets) {
          await supabase.from('wallets').upsert(
            { id: w.id, name: w.name, created_at: w.createdAt },
            { onConflict: 'id' }
          );
        }
        // 删除已移除的钱包
        const { data: existing } = await supabase.from('wallets').select('id');
        if (existing) {
          const currentIds = wallets.map((w) => w.id);
          for (const row of existing) {
            if (!currentIds.includes(row.id)) {
              await supabase.from('wallets').delete().eq('id', row.id);
            }
          }
        }
      } catch (error) {
        console.error('Supabase 写入 wallets 失败:', error);
      }
    }
  }

  debouncedSaveWallets(wallets: Wallet[]): void {
    this.debouncedSave.wallets(wallets);
  }

  // ===== 设置 =====

  async getSettings(): Promise<Record<string, any>> {
    const defaults = { metalItemsPerRow: 2, marketItemsPerRow: 2, colorScheme: 'red-up', metalSyncInterval: 60 };
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('settings').select('*');
        if (!error && data && data.length > 0) {
          const settings: Record<string, any> = {};
          for (const row of data) {
            settings[row.key] = row.value;
          }
          return { ...defaults, ...settings };
        }
      } catch (error) {
        console.error('Supabase 读取 settings 失败:', error);
      }
    }
    return this.readFromLocal<Record<string, any>>(STORAGE_KEYS.SETTINGS, defaults);
  }

  async saveSettings(settings: Record<string, any>): Promise<void> {
    this.saveToLocal(STORAGE_KEYS.SETTINGS, settings);
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        for (const [key, value] of Object.entries(settings)) {
          await supabase.from('settings').upsert(
            { key, value },
            { onConflict: 'key' }
          );
        }
      } catch (error) {
        console.error('Supabase 写入 settings 失败:', error);
      }
    }
  }

  // ===== 市场指数（从 Supabase 读取，由 cron 写入） =====

  async getMarketIndices(): Promise<MarketIndex[]> {
    const defaults: MarketIndex[] = [
      { name: '上证指数', value: '3,258.63', change: '+0.82%', isUp: true },
      { name: '深证成指', value: '10,824.36', change: '+1.25%', isUp: true },
      { name: '创业板指', value: '2,156.78', change: '-0.35%', isUp: false },
      { name: '恒生指数', value: '18,245.67', change: '+0.56%', isUp: true },
    ];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('market_indices').select('*');
        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            name: row.name,
            value: row.value,
            change: row.change,
            isUp: row.is_up,
            updateTime: row.updated_at || undefined,
          }));
        }
      } catch (error) {
        console.error('Supabase 读取 market_indices 失败:', error);
      }
    }
    return this.readFromLocal<MarketIndex[]>(STORAGE_KEYS.MARKET_INDICES, defaults);
  }

  // ===== 贵金属（从 Supabase 读取，由 cron 写入） =====

  async getPreciousMetals(): Promise<PreciousMetal[]> {
    const defaults: PreciousMetal[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('precious_metals').select('*');
        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            name: row.name,
            value: row.value,
            change: row.change,
            isUp: row.is_up,
            unit: row.unit,
          }));
        }
      } catch (error) {
        console.error('Supabase 读取 precious_metals 失败:', error);
      }
    }
    return this.readFromLocal<PreciousMetal[]>(STORAGE_KEYS.PRECIOUS_METALS, defaults);
  }

  async getPreciousMetalSyncTime(): Promise<string | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data } = await supabase.from('precious_metals').select('updated_at').limit(1);
        if (data && data.length > 0) return data[0].updated_at;
      } catch {}
    }
    return this.readFromLocal<string | null>(STORAGE_KEYS.PRECIOUS_METAL_SYNC_TIME, null);
  }

  // ===== 银行金条价格 =====

  async getBankGoldBarPrices(): Promise<BankGoldBarPrice[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('bank_gold_bar_prices').select('*');
        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({ bank: row.bank, price: row.price, unit: row.unit }));
        }
      } catch {}
    }
    return this.readFromLocal<BankGoldBarPrice[]>(STORAGE_KEYS.BANK_GOLD_BAR_PRICES, []);
  }

  // ===== 贵金属回收价格 =====

  async getGoldRecyclePrices(): Promise<GoldRecyclePrice[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('gold_recycle_prices').select('*');
        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            gold_type: row.gold_type,
            recycle_price: row.recycle_price,
            updated_date: row.updated_date,
            unit: row.unit,
          }));
        }
      } catch {}
    }
    return this.readFromLocal<GoldRecyclePrice[]>(STORAGE_KEYS.GOLD_RECYCLE_PRICES, []);
  }

  // ===== 品牌贵金属价格 =====

  async getBrandPreciousMetalPrices(): Promise<BrandPreciousMetalPrice[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('brand_precious_metal_prices').select('*');
        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            brand: row.brand,
            bullion_price: row.bullion_price,
            gold_price: row.gold_price,
            platinum_price: row.platinum_price,
            updated_date: row.updated_date,
            unit: row.unit,
          }));
        }
      } catch {}
    }
    return this.readFromLocal<BrandPreciousMetalPrice[]>(STORAGE_KEYS.BRAND_PRECIOUS_METAL_PRICES, []);
  }

  // ===== 完整贵金属数据 =====

  async getCompletePreciousMetalData(): Promise<CompletePreciousMetalData> {
    const [bankGoldBarPrices, goldRecyclePrices, brandPrices] = await Promise.all([
      this.getBankGoldBarPrices(),
      this.getGoldRecyclePrices(),
      this.getBrandPreciousMetalPrices(),
    ]);
    return { bankGoldBarPrices, goldRecyclePrices, brandPrices };
  }

  // ===== 跟踪基金 =====

  async getTrackedFunds(): Promise<FundRealTimeData[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('tracked_funds').select('*').order('created_at', { ascending: true });
        if (!error && data) {
          return data.map((row: any) => ({
            code: row.code,
            name: row.name,
            netValue: Number(row.net_value),
            estimatedValue: Number(row.estimated_value),
            changeRate: Number(row.change_rate),
            updateTime: row.update_time,
          }));
        }
      } catch (error) {
        console.error('Supabase 读取 tracked_funds 失败:', error);
      }
    }
    return this.readFromLocal<FundRealTimeData[]>(STORAGE_KEYS.TRACKED_FUNDS, []);
  }

  async saveTrackedFunds(funds: FundRealTimeData[]): Promise<void> {
    this.saveToLocal(STORAGE_KEYS.TRACKED_FUNDS, funds);
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data: existing } = await supabase.from('tracked_funds').select('code');
        const existingCodes = new Set((existing || []).map((r: any) => r.code));
        const newCodes = new Set(funds.map((f) => f.code));

        // 批量删除已移除的
        const removedCodes = [...existingCodes].filter((c) => !newCodes.has(c));
        if (removedCodes.length > 0) {
          await supabase.from('tracked_funds').delete().in('code', removedCodes);
        }

        // 批量 upsert
        if (funds.length > 0) {
          const rows = funds.map((f) => ({
            code: f.code,
            name: f.name,
            net_value: f.netValue,
            estimated_value: f.estimatedValue,
            change_rate: f.changeRate,
            update_time: f.updateTime,
          }));
          await supabase.from('tracked_funds').upsert(rows, { onConflict: 'code' });
        }
      } catch (error) {
        console.error('Supabase 写入 tracked_funds 失败:', error);
      }
    }
  }

  debouncedSaveTrackedFunds(funds: FundRealTimeData[]): void {
    this.debouncedSave.trackedFunds(funds);
  }

  // ===== 基金实时数据（仍从外部 API 获取） =====

  async fetchFundRealTimeData(fundCode: string): Promise<FundRealTimeData> {
    try {
      const url = `/api/fund/realtime?code=${fundCode}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const fundData = await response.json();
      return {
        code: fundData.code,
        name: fundData.name,
        netValue: fundData.netValue,
        estimatedValue: fundData.estimatedValue,
        changeRate: fundData.changeRate,
        updateTime: fundData.updateTime,
      };
    } catch (error) {
      console.error(`获取基金 ${fundCode} 实时数据失败:`, error);
      return { code: fundCode, name: '未知基金', netValue: 0, estimatedValue: 0, changeRate: 0, updateTime: new Date().toLocaleString() };
    }
  }

  async fetchBatchFundRealTimeData(fundCodes: string[]): Promise<FundRealTimeData[]> {
    const promises = fundCodes.map((code) => this.fetchFundRealTimeData(code));
    return Promise.all(promises);
  }

  // ===== 基金列表 =====

  async getAllFunds(): Promise<FundInfo[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('funds').select('*');
        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            code: row.code,
            name: row.name,
            type: row.type,
            riskLevel: row.risk_level,
            manager: row.manager,
            establishedDate: row.established_date,
            fundSize: row.fund_size,
            valuation: row.valuation || { code: row.code, valuation: 0, netValue: 0, dailyChange: 0, dailyChangeRate: 0, weeklyChangeRate: 0, monthlyChangeRate: 0, updateTime: '' },
          }));
        }
      } catch {}
    }
    return this.readFromLocal<FundInfo[]>(STORAGE_KEYS.FUNDS, []);
  }

  async saveAllFunds(funds: FundInfo[]): Promise<void> {
    this.saveToLocal(STORAGE_KEYS.FUNDS, funds);
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        for (const fund of funds) {
          await supabase.from('funds').upsert(
            {
              code: fund.code,
              name: fund.name,
              type: fund.type,
              risk_level: fund.riskLevel,
              manager: fund.manager,
              established_date: fund.establishedDate,
              fund_size: fund.fundSize,
              valuation: fund.valuation as any,
            },
            { onConflict: 'code' }
          );
        }
      } catch (error) {
        console.error('Supabase 写入 funds 失败:', error);
      }
    }
  }

  async getFundByCode(code: string): Promise<FundInfo | undefined> {
    const funds = await this.getAllFunds();
    return funds.find((fund) => fund.code === code);
  }

  // ===== 排序 =====

  sortFunds(sortBy: 'valuation' | 'dailyChangeRate' | 'name', sortOrder: 'asc' | 'desc', funds: FundInfo[]): FundInfo[] {
    return [...funds].sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'valuation': aValue = a.valuation.valuation; bValue = b.valuation.valuation; break;
        case 'dailyChangeRate': aValue = a.valuation.dailyChangeRate; bValue = b.valuation.dailyChangeRate; break;
        case 'name': aValue = a.name; bValue = b.name; break;
        default: return 0;
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ===== 基金持仓汇总 =====

  async getFundHoldingsSummary() {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('fund_holdings_summary').select('*');
        if (!error && data && data.length > 0) return data.map((r: any) => ({ industry: r.industry, proportion: Number(r.proportion), count: r.count }));
      } catch {}
    }
    return this.readFromLocal(STORAGE_KEYS.FUND_HOLDINGS_SUMMARY, []);
  }

  // ===== 宏观经济数据 =====

  async getMacroEconomicData(months: number = 24): Promise<MacroEconomicData[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('macro_economic_data').select('*').order('date', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            date: r.date,
            m1: Number(r.m1),
            m1ChangeRate: Number(r.m1_change_rate),
            m2: Number(r.m2),
            m2ChangeRate: Number(r.m2_change_rate),
            gdp: Number(r.gdp),
            gdpChangeRate: Number(r.gdp_change_rate),
            buffettIndicator: Number(r.buffett_indicator),
          }));
        }
      } catch {}
    }
    // 降级：生成默认随机数据
    const data: MacroEconomicData[] = [];
    const today = new Date();
    let baseM1 = 60000 + Math.random() * 20000;
    let baseM2 = 200000 + Math.random() * 50000;
    let baseGDP = 100000 + Math.random() * 50000;
    for (let i = months; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      baseM1 *= 1 + (Math.random() - 0.5) * 0.05;
      baseM2 *= 1 + (Math.random() - 0.5) * 0.03;
      baseGDP *= 1 + (Math.random() - 0.5) * 0.04;
      data.push({
        date: date.toISOString().slice(0, 7),
        m1: parseFloat(baseM1.toFixed(2)),
        m1ChangeRate: parseFloat(((Math.random() - 0.3) * 20).toFixed(2)),
        m2: parseFloat(baseM2.toFixed(2)),
        m2ChangeRate: parseFloat(((Math.random() - 0.2) * 15).toFixed(2)),
        gdp: parseFloat(baseGDP.toFixed(2)),
        gdpChangeRate: parseFloat(((Math.random() - 0.1) * 10 + 5).toFixed(2)),
        buffettIndicator: parseFloat(((Math.random() * 0.8) + 0.7).toFixed(2)),
      });
    }
    return data;
  }

  async getMacroEconomicCumulative(months: number = 24): Promise<MacroEconomicCumulative[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.from('macro_economic_cumulative').select('*').order('date', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({ date: r.date, cumulativeChange: Number(r.cumulative_change) }));
        }
      } catch {}
    }
    // 降级
    const macroData = await this.getMacroEconomicData(months);
    const result: MacroEconomicCumulative[] = [];
    let cumulativeChange = 0;
    macroData.forEach((item, index) => {
      if (index > 0) {
        const prev = macroData[index - 1];
        cumulativeChange += ((item.m1 - prev.m1) / prev.m1) * 100;
      }
      result.push({ date: item.date, cumulativeChange: parseFloat(cumulativeChange.toFixed(2)) });
    });
    return result;
  }

  // ===== 贵金属历史 =====

  async getPreciousMetalHistory(name: string, days: number = 30): Promise<PreciousMetalHistory[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase()!;
        const { data, error } = await supabase
          .from('precious_metal_history')
          .select('*')
          .eq('name', name)
          .order('date', { ascending: true })
          .limit(days);
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({ name: r.name, date: r.date, value: Number(r.value) }));
        }
      } catch {}
    }
    return [];
  }

  // ===== 初始化 =====

  async initializeData(): Promise<void> {
    try {
      // 确保钱包存在
      const wallets = await this.getWallets();
      if (!wallets || wallets.length === 0) {
        await this.saveWallets([
          { id: 'summary', name: '汇总', createdAt: new Date().toISOString() },
          { id: 'default', name: '默认钱包', createdAt: new Date().toISOString() },
        ]);
      }

      // 确保设置存在
      const settings = await this.getSettings();
      if (!settings) {
        await this.saveSettings({ metalItemsPerRow: 2, marketItemsPerRow: 2, colorScheme: 'red-up' });
      }
    } catch (error) {
      console.error('初始化数据失败:', error);
    }
  }

  // ===== 兼容旧接口（同步读取 localStorage） =====

  getUserHoldingsSync(): UserHolding[] {
    return this.readFromLocal<UserHolding[]>(STORAGE_KEYS.USER_HOLDINGS, []);
  }

  getWalletsSync(): Wallet[] {
    return this.readFromLocal<Wallet[]>(STORAGE_KEYS.WALLETS, [
      { id: 'summary', name: '汇总', createdAt: new Date().toISOString() },
      { id: 'default', name: '默认钱包', createdAt: new Date().toISOString() },
    ]);
  }
}

const dataService = new DataService();
export default dataService;
export { DataService };
