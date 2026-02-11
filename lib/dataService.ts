// 数据持久化服务
// 提供LocalStorage存储和读取功能，为后续云端同步预留接口

// 基金基本信息接口
export interface FundBasic {
  code: string;          // 基金代码
  name: string;          // 基金名称
  type: string;          // 基金类型
  riskLevel: string;     // 风险等级
  manager: string;       // 基金经理
  establishedDate: string; // 成立日期
  fundSize: string;      // 基金规模
}

// 基金实时估值接口
export interface FundValuation {
  code: string;          // 基金代码
  valuation: number;      // 实时估值
  netValue: number;       // 最新净值
  dailyChange: number;    // 日涨跌
  dailyChangeRate: number; // 日涨跌幅
  weeklyChangeRate: number; // 周涨跌幅
  monthlyChangeRate: number; // 月涨跌幅
  updateTime: string;     // 更新时间
}

// 基金历史走势接口
export interface FundHistory {
  code: string;          // 基金代码
  date: string;          // 日期
  value: number;         // 净值/估值
}

// 基金持仓接口
export interface FundHoldings {
  code: string;          // 基金代码
  stockCode: string;     // 股票代码
  stockName: string;     // 股票名称
  proportion: number;    // 持仓比例
  industry: string;      // 所属行业
}

// 完整基金信息接口
export interface FundInfo extends FundBasic {
  valuation: FundValuation;
  holdings?: FundHoldings[];
}

// 市场指数接口
export interface MarketIndex {
  name: string;          // 指数名称
  value: string;         // 指数值
  change: string;        // 涨跌幅
  isUp: boolean;         // 是否上涨
}

// 宏观经济数据接口
export interface MacroEconomicData {
  date: string;          // 日期
  m1: number;            // M1货币供应量
  m1ChangeRate: number;  // M1同比增长率
  m2: number;            // M2货币供应量
  m2ChangeRate: number;  // M2同比增长率
  gdp: number;           // GDP总量
  gdpChangeRate: number; // GDP同比增长率
  buffettIndicator: number; // 巴菲特指标（股市总市值/GDP）
}

// 宏观经济累计涨跌幅接口
export interface MacroEconomicCumulative {
  date: string;          // 日期
  cumulativeChange: number; // 累计涨跌幅
}

// 贵金属数据接口
export interface PreciousMetal {
  name: string;          // 贵金属名称
  value: string;         // 价格
  change: string;        // 涨跌幅
  isUp: boolean;         // 是否上涨
  unit: string;          // 单位
}

// 贵金属历史走势接口
export interface PreciousMetalHistory {
  name: string;          // 贵金属名称
  date: string;          // 日期
  value: number;         // 价格
}

// 银行投资金条价格接口
export interface BankGoldBarPrice {
  bank: string;          // 银行名称
  price: string;         // 价格
  unit?: string;         // 单位
}

// 贵金属回收价格接口
export interface GoldRecyclePrice {
  gold_type: string;     // 品种
  recycle_price: string; // 价格
  updated_date: string;  // 更新时间
  unit?: string;         // 单位
}

// 品牌贵金属价格接口
export interface BrandPreciousMetalPrice {
  brand: string;         // 品牌
  bullion_price: string; // 金条价
  gold_price: string;    // 黄金价
  platinum_price: string; // 铂金价
  updated_date: string;  // 更新日期
  unit?: string;         // 单位
}

// 完整贵金属数据接口
export interface CompletePreciousMetalData {
  bankGoldBarPrices: BankGoldBarPrice[];
  goldRecyclePrices: GoldRecyclePrice[];
  brandPrices: BrandPreciousMetalPrice[];
}

// 钱包接口
export interface Wallet {
  id: string;            // 钱包ID
  name: string;          // 钱包名称
  createdAt: string;     // 创建时间
}

// 用户持仓接口
export interface UserHolding {
  code: string;          // 基金代码
  fundName: string;      // 基金名称
  holdingAmount: number; // 持仓金额
  holdingProfit: number; // 持仓盈亏
  currentPrice: number;  // 当前价格
  profitRate: number;    // 盈亏率
  type: string;          // 基金类型
  industryInfo?: string; // 行业信息
  walletId: string;      // 所属钱包ID
}

// 工具函数
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  });
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// 存储键前缀
const STORAGE_PREFIX = 'smilex-fund';

// 存储键定义
const STORAGE_KEYS = {
  USER_HOLDINGS: `${STORAGE_PREFIX}:userHoldings`,
  WALLETS: `${STORAGE_PREFIX}:wallets`,
  SETTINGS: `${STORAGE_PREFIX}:settings`,
  MARKET_DATA: `${STORAGE_PREFIX}:marketData`,
  FUNDS: `${STORAGE_PREFIX}:funds`,
  MARKET_INDICES: `${STORAGE_PREFIX}:marketIndices`,
  PRECIOUS_METALS: `${STORAGE_PREFIX}:preciousMetals`,
  BANK_GOLD_BAR_PRICES: `${STORAGE_PREFIX}:bankGoldBarPrices`,
  GOLD_RECYCLE_PRICES: `${STORAGE_PREFIX}:goldRecyclePrices`,
  BRAND_PRECIOUS_METAL_PRICES: `${STORAGE_PREFIX}:brandPreciousMetalPrices`,
  PRECIOUS_METAL_SYNC_TIME: `${STORAGE_PREFIX}:preciousMetalSyncTime`,
  FUND_HOLDINGS_SUMMARY: `${STORAGE_PREFIX}:fundHoldingsSummary`
};

// 防抖函数
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 数据服务类
class DataService {
  private cache: Record<string, any> = {};
  private debouncedSave: Record<string, (...args: any[]) => void> = {};

  constructor() {
    // 初始化防抖函数
    this.debouncedSave = {
      userHoldings: debounce(this.saveToStorage.bind(this, STORAGE_KEYS.USER_HOLDINGS), 500),
      wallets: debounce(this.saveToStorage.bind(this, STORAGE_KEYS.WALLETS), 500),
      settings: debounce(this.saveToStorage.bind(this, STORAGE_KEYS.SETTINGS), 500)
    };
  }

  /**
   * 从LocalStorage读取数据
   * @param key 存储键
   * @param defaultValue 默认值
   * @returns 读取的数据或默认值
   */
  private readFromStorage<T>(key: string, defaultValue: T): T {
    try {
      // 检查缓存
      if (this.cache[key]) {
        return this.cache[key];
      }

      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // 更新缓存
        this.cache[key] = parsed;
        return parsed;
      }
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
    }
    return defaultValue;
  }

  /**
   * 保存数据到LocalStorage
   * @param key 存储键
   * @param data 要存储的数据
   */
  private saveToStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      // 更新缓存
      this.cache[key] = data;
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  }

  /**
   * 清除缓存
   * @param key 可选，指定要清除的缓存键
   */
  private clearCache(key?: string): void {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  }

  // ===== 用户数据相关方法 =====

  /**
   * 获取用户持仓数据
   * @returns 用户持仓数组
   */
  getUserHoldings(): UserHolding[] {
    return this.readFromStorage<UserHolding[]>(STORAGE_KEYS.USER_HOLDINGS, []);
  }

  /**
   * 保存用户持仓数据
   * @param holdings 用户持仓数组
   */
  saveUserHoldings(holdings: UserHolding[]): void {
    this.debouncedSave.userHoldings(holdings);
  }

  /**
   * 获取钱包列表
   * @returns 钱包数组
   */
  getWallets(): Wallet[] {
    const defaultWallets: Wallet[] = [
      { id: 'summary', name: '汇总', createdAt: new Date().toISOString() },
      { id: 'default', name: '默认钱包', createdAt: new Date().toISOString() }
    ];
    return this.readFromStorage<Wallet[]>(STORAGE_KEYS.WALLETS, defaultWallets);
  }

  /**
   * 保存钱包列表
   * @param wallets 钱包数组
   */
  saveWallets(wallets: Wallet[]): void {
    this.debouncedSave.wallets(wallets);
  }

  /**
   * 获取应用设置
   * @returns 设置对象
   */
  getSettings(): Record<string, any> {
    const defaultSettings = {
      metalItemsPerRow: 2,
      marketItemsPerRow: 2,
      colorScheme: 'red-up'
    };
    return this.readFromStorage<Record<string, any>>(STORAGE_KEYS.SETTINGS, defaultSettings);
  }

  /**
   * 保存应用设置
   * @param settings 设置对象
   */
  saveSettings(settings: Record<string, any>): void {
    this.debouncedSave.settings(settings);
  }

  // ===== 市场数据相关方法 =====

  /**
   * 获取市场指数数据
   * @returns 市场指数数组
   */
  getMarketIndices(): MarketIndex[] {
    const defaultMarketIndices: MarketIndex[] = [
      { name: '上证指数', value: '3,258.63', change: '+0.82%', isUp: true },
      { name: '深证成指', value: '10,824.36', change: '+1.25%', isUp: true },
      { name: '创业板指', value: '2,156.78', change: '-0.35%', isUp: false },
      { name: '恒生指数', value: '18,245.67', change: '+0.56%', isUp: true },
    ];
    return this.readFromStorage<MarketIndex[]>(STORAGE_KEYS.MARKET_INDICES, defaultMarketIndices);
  }

  /**
   * 保存市场指数数据
   * @param marketIndices 市场指数数组
   */
  saveMarketIndices(marketIndices: MarketIndex[]): void {
    this.saveToStorage(STORAGE_KEYS.MARKET_INDICES, marketIndices);
  }

  /**
   * 获取贵金属数据
   * @returns 贵金属数组
   */
  getPreciousMetals(): PreciousMetal[] {
    const defaultPreciousMetals: PreciousMetal[] = [
      { name: '黄金', value: '412.56', change: '+0.32%', isUp: true, unit: '元/克' },
      { name: '白银', value: '5.23', change: '-0.15%', isUp: false, unit: '元/克' },
      { name: '铂金', value: '235.67', change: '+0.58%', isUp: true, unit: '元/克' },
      { name: '钯金', value: '312.45', change: '-0.24%', isUp: false, unit: '元/克' },
    ];
    return this.readFromStorage<PreciousMetal[]>(STORAGE_KEYS.PRECIOUS_METALS, defaultPreciousMetals);
  }

  /**
   * 保存贵金属数据
   * @param preciousMetals 贵金属数组
   */
  savePreciousMetals(preciousMetals: PreciousMetal[]): void {
    this.saveToStorage(STORAGE_KEYS.PRECIOUS_METALS, preciousMetals);
  }

  /**
   * 获取贵金属历史数据
   * @param name 贵金属名称
   * @param days 天数
   * @returns 贵金属历史数据数组
   */
  getPreciousMetalHistory(name: string, days: number = 30): PreciousMetalHistory[] {
    const key = `${STORAGE_PREFIX}:preciousMetalHistory:${name}`;
    const history: PreciousMetalHistory[] = [];
    const today = new Date();
    let baseValue = 100 + Math.random() * 300;

    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // 生成随机波动
      baseValue = baseValue * (1 + (Math.random() - 0.5) * 0.02);

      history.push({
        name,
        date: dateStr,
        value: parseFloat(baseValue.toFixed(2))
      });
    }

    return this.readFromStorage<PreciousMetalHistory[]>(key, history);
  }

  /**
   * 保存贵金属历史数据
   * @param name 贵金属名称
   * @param history 贵金属历史数据数组
   */
  savePreciousMetalHistory(name: string, history: PreciousMetalHistory[]): void {
    const key = `${STORAGE_PREFIX}:preciousMetalHistory:${name}`;
    this.saveToStorage(key, history);
  }

  /**
   * 获取宏观经济数据
   * @param months 月数
   * @returns 宏观经济数据数组
   */
  getMacroEconomicData(months: number = 24): MacroEconomicData[] {
    const key = `${STORAGE_PREFIX}:macroEconomicData:${months}`;
    const data: MacroEconomicData[] = [];
    const today = new Date();
    let baseM1 = 60000 + Math.random() * 20000;
    let baseM2 = 200000 + Math.random() * 50000;
    let baseGDP = 100000 + Math.random() * 50000;

    for (let i = months; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const dateStr = date.toISOString().slice(0, 7);

      // 生成随机波动
      baseM1 = baseM1 * (1 + (Math.random() - 0.5) * 0.05);
      baseM2 = baseM2 * (1 + (Math.random() - 0.5) * 0.03);
      baseGDP = baseGDP * (1 + (Math.random() - 0.5) * 0.04);

      data.push({
        date: dateStr,
        m1: parseFloat(baseM1.toFixed(2)),
        m1ChangeRate: parseFloat(((Math.random() - 0.3) * 20).toFixed(2)),
        m2: parseFloat(baseM2.toFixed(2)),
        m2ChangeRate: parseFloat(((Math.random() - 0.2) * 15).toFixed(2)),
        gdp: parseFloat(baseGDP.toFixed(2)),
        gdpChangeRate: parseFloat(((Math.random() - 0.1) * 10 + 5).toFixed(2)),
        buffettIndicator: parseFloat(((Math.random() * 0.8) + 0.7).toFixed(2))
      });
    }

    return this.readFromStorage<MacroEconomicData[]>(key, data);
  }

  /**
   * 保存宏观经济数据
   * @param months 月数
   * @param data 宏观经济数据数组
   */
  saveMacroEconomicData(months: number = 24, data: MacroEconomicData[]): void {
    const key = `${STORAGE_PREFIX}:macroEconomicData:${months}`;
    this.saveToStorage(key, data);
  }

  /**
   * 获取宏观经济累计涨跌幅数据
   * @param months 月数
   * @returns 宏观经济累计涨跌幅数据数组
   */
  getMacroEconomicCumulative(months: number = 24): MacroEconomicCumulative[] {
    const key = `${STORAGE_PREFIX}:macroEconomicCumulative:${months}`;
    const macroData = this.getMacroEconomicData(months);
    const cumulativeData: MacroEconomicCumulative[] = [];
    let cumulativeChange = 0;

    macroData.forEach((item, index) => {
      if (index === 0) {
        cumulativeChange = 0;
      } else {
        const prevItem = macroData[index - 1];
        const change = ((item.m1 - prevItem.m1) / prevItem.m1) * 100;
        cumulativeChange += change;
      }

      cumulativeData.push({
        date: item.date,
        cumulativeChange: parseFloat(cumulativeChange.toFixed(2))
      });
    });

    return this.readFromStorage<MacroEconomicCumulative[]>(key, cumulativeData);
  }

  /**
   * 保存宏观经济累计涨跌幅数据
   * @param months 月数
   * @param data 宏观经济累计涨跌幅数据数组
   */
  saveMacroEconomicCumulative(months: number = 24, data: MacroEconomicCumulative[]): void {
    const key = `${STORAGE_PREFIX}:macroEconomicCumulative:${months}`;
    this.saveToStorage(key, data);
  }

  /**
   * 获取基金持仓汇总数据
   * @returns 基金持仓汇总数组
   */
  getFundHoldingsSummary() {
    const defaultFundHoldingsSummary = [
      { industry: '信息技术', proportion: 35.2, count: 12 },
      { industry: '医药生物', proportion: 22.5, count: 8 },
      { industry: '消费零售', proportion: 18.7, count: 6 },
      { industry: '金融服务', proportion: 12.3, count: 4 },
      { industry: '新能源', proportion: 8.5, count: 3 },
      { industry: '制造业', proportion: 2.8, count: 2 },
    ];
    return this.readFromStorage<any[]>(STORAGE_KEYS.FUND_HOLDINGS_SUMMARY, defaultFundHoldingsSummary);
  }

  /**
   * 保存基金持仓汇总数据
   * @param summary 基金持仓汇总数组
   */
  saveFundHoldingsSummary(summary: any[]): void {
    this.saveToStorage(STORAGE_KEYS.FUND_HOLDINGS_SUMMARY, summary);
  }

  /**
   * 获取所有基金数据
   * @returns 基金数据数组
   */
  getAllFunds(): FundInfo[] {
    const defaultFunds: FundInfo[] = [
      {
        code: '000001',
        name: '华夏成长混合',
        type: '混合型',
        riskLevel: '中高风险',
        manager: '巩怀志',
        establishedDate: '2001-12-18',
        fundSize: '32.56亿',
        valuation: {
          code: '000001',
          valuation: 1.5678,
          netValue: 1.5432,
          dailyChange: 0.0246,
          dailyChangeRate: 1.60,
          weeklyChangeRate: 2.30,
          monthlyChangeRate: 4.50,
          updateTime: new Date().toLocaleTimeString()
        }
      },
      {
        code: '110022',
        name: '易方达消费行业股票',
        type: '股票型',
        riskLevel: '高风险',
        manager: '萧楠',
        establishedDate: '2010-08-20',
        fundSize: '156.78亿',
        valuation: {
          code: '110022',
          valuation: 2.3456,
          netValue: 2.3123,
          dailyChange: 0.0333,
          dailyChangeRate: 1.44,
          weeklyChangeRate: 1.80,
          monthlyChangeRate: 3.20,
          updateTime: new Date().toLocaleTimeString()
        }
      },
      {
        code: '001475',
        name: '易方达国防军工混合',
        type: '混合型',
        riskLevel: '高风险',
        manager: '何崇恺',
        establishedDate: '2015-06-19',
        fundSize: '89.34亿',
        valuation: {
          code: '001475',
          valuation: 1.8976,
          netValue: 1.8654,
          dailyChange: 0.0322,
          dailyChangeRate: 1.73,
          weeklyChangeRate: 2.10,
          monthlyChangeRate: 5.60,
          updateTime: new Date().toLocaleTimeString()
        }
      },
      {
        code: '000209',
        name: '信诚新兴产业混合',
        type: '混合型',
        riskLevel: '中高风险',
        manager: '孙浩中',
        establishedDate: '2013-07-24',
        fundSize: '15.67亿',
        valuation: {
          code: '000209',
          valuation: 1.2345,
          netValue: 1.2123,
          dailyChange: 0.0222,
          dailyChangeRate: 1.83,
          weeklyChangeRate: 1.50,
          monthlyChangeRate: 3.80,
          updateTime: new Date().toLocaleTimeString()
        }
      },
      {
        code: '003095',
        name: '中欧医疗健康混合A',
        type: '混合型',
        riskLevel: '中高风险',
        manager: '葛兰',
        establishedDate: '2016-09-29',
        fundSize: '234.56亿',
        valuation: {
          code: '003095',
          valuation: 2.6789,
          netValue: 2.6456,
          dailyChange: 0.0333,
          dailyChangeRate: 1.26,
          weeklyChangeRate: 2.80,
          monthlyChangeRate: 4.20,
          updateTime: new Date().toLocaleTimeString()
        }
      }
    ];
    return this.readFromStorage<FundInfo[]>(STORAGE_KEYS.FUNDS, defaultFunds);
  }

  /**
   * 保存所有基金数据
   * @param funds 基金数据数组
   */
  saveAllFunds(funds: FundInfo[]): void {
    this.saveToStorage(STORAGE_KEYS.FUNDS, funds);
  }

  /**
   * 根据代码获取基金数据
   * @param code 基金代码
   * @returns 基金数据或undefined
   */
  getFundByCode(code: string): FundInfo | undefined {
    const funds = this.getAllFunds();
    return funds.find(fund => fund.code === code);
  }

  /**
   * 排序基金数据
   * @param sortBy 排序字段
   * @param sortOrder 排序顺序
   * @param funds 基金数据数组
   * @returns 排序后的基金数据数组
   */
  sortFunds(sortBy: 'valuation' | 'dailyChangeRate' | 'name', sortOrder: 'asc' | 'desc', funds: FundInfo[]): FundInfo[] {
    return [...funds].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'valuation':
          aValue = a.valuation.valuation;
          bValue = b.valuation.valuation;
          break;
        case 'dailyChangeRate':
          aValue = a.valuation.dailyChangeRate;
          bValue = b.valuation.dailyChangeRate;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ===== 云端同步预留接口 =====

  /**
   * 同步数据到云端
   * @returns Promise<boolean> 同步是否成功
   */
  async syncToCloud(): Promise<boolean> {
    // 预留接口，后续实现云端同步
    console.log('Syncing data to cloud...');
    return true;
  }

  /**
   * 从云端同步数据
   * @returns Promise<boolean> 同步是否成功
   */
  async syncFromCloud(): Promise<boolean> {
    // 预留接口，后续实现云端同步
    console.log('Syncing data from cloud...');
    return true;
  }

  /**
   * 检查数据同步状态
   * @returns Promise<boolean> 是否需要同步
   */
  async checkSyncStatus(): Promise<boolean> {
    // 预留接口，后续实现同步状态检查
    return false;
  }

  /**
   * 获取银行投资金条价格
   * @returns 银行投资金条价格数组
   */
  getBankGoldBarPrices(): BankGoldBarPrice[] {
    const defaultBankGoldBarPrices: BankGoldBarPrice[] = [
      { bank: '农行传世之宝金条', price: '805.27', unit: '元/克' },
      { bank: '浦发银行投资金条', price: '803.45', unit: '元/克' },
      { bank: '和谐平安金条', price: '792.1', unit: '元/克' },
      { bank: '工商银行如意金条', price: '797.66', unit: '元/克' },
      { bank: '中国银行金条', price: '794.98', unit: '元/克' },
      { bank: '建设银行龙鼎金条', price: '797.1', unit: '元/克' }
    ];
    return this.readFromStorage<BankGoldBarPrice[]>(STORAGE_KEYS.BANK_GOLD_BAR_PRICES, defaultBankGoldBarPrices);
  }

  /**
   * 保存银行投资金条价格
   * @param bankGoldBarPrices 银行投资金条价格数组
   */
  saveBankGoldBarPrices(bankGoldBarPrices: BankGoldBarPrice[]): void {
    this.saveToStorage(STORAGE_KEYS.BANK_GOLD_BAR_PRICES, bankGoldBarPrices);
  }

  /**
   * 获取贵金属回收价格
   * @returns 贵金属回收价格数组
   */
  getGoldRecyclePrices(): GoldRecyclePrice[] {
    const defaultGoldRecyclePrices: GoldRecyclePrice[] = [
      { gold_type: '24K金回收', recycle_price: '767.0', updated_date: '2025-07-22', unit: '元/克' },
      { gold_type: '18K金回收', recycle_price: '571.0', updated_date: '2025-07-22', unit: '元/克' },
      { gold_type: '14K金回收', recycle_price: '442.0', updated_date: '2025-07-22', unit: '元/克' },
      { gold_type: 'pd950钯金回收', recycle_price: '259.0', updated_date: '2025-07-22', unit: '元/克' },
      { gold_type: 'pd990钯金回收', recycle_price: '270.0', updated_date: '2025-07-22', unit: '元/克' },
      { gold_type: 'pd999钯金回收', recycle_price: '273.0', updated_date: '2025-07-22', unit: '元/克' },
      { gold_type: '黄金回收', recycle_price: '771.0', updated_date: '2025-07-22', unit: '元/克' },
      { gold_type: '925银条回收', recycle_price: '7.18', updated_date: '2025-07-22', unit: '元/克' },
      { gold_type: '足银回收', recycle_price: '8.29', updated_date: '2025-07-22', unit: '元/克' }
    ];
    return this.readFromStorage<GoldRecyclePrice[]>(STORAGE_KEYS.GOLD_RECYCLE_PRICES, defaultGoldRecyclePrices);
  }

  /**
   * 保存贵金属回收价格
   * @param goldRecyclePrices 贵金属回收价格数组
   */
  saveGoldRecyclePrices(goldRecyclePrices: GoldRecyclePrice[]): void {
    this.saveToStorage(STORAGE_KEYS.GOLD_RECYCLE_PRICES, goldRecyclePrices);
  }

  /**
   * 获取品牌贵金属价格
   * @returns 品牌贵金属价格数组
   */
  getBrandPreciousMetalPrices(): BrandPreciousMetalPrice[] {
    const defaultBrandPreciousMetalPrices: BrandPreciousMetalPrice[] = [
      { brand: '周六福', bullion_price: '900', gold_price: '988', platinum_price: '621', updated_date: '2025-07-22', unit: '元/克' },
      { brand: '老凤祥', bullion_price: '966', gold_price: '1016', platinum_price: '470', updated_date: '2025-07-22', unit: '元/克' },
      { brand: '老庙黄金', bullion_price: '969', gold_price: '1014', platinum_price: '470', updated_date: '2025-07-22', unit: '元/克' },
      { brand: '菜百首饰', bullion_price: '890', gold_price: '996', platinum_price: '445', updated_date: '2025-07-22', unit: '元/克' },
      { brand: '潮宏基', bullion_price: '1015', gold_price: '1015', platinum_price: '588', updated_date: '2025-07-22', unit: '元/克' },
      { brand: '金至尊', bullion_price: '1015', gold_price: '1015', platinum_price: '588', updated_date: '2025-07-22', unit: '元/克' },
      { brand: '谢瑞麟', bullion_price: '952', gold_price: '1015', platinum_price: '-', updated_date: '2025-07-22', unit: '元/克' },
      { brand: '六福珠宝', bullion_price: '1015', gold_price: '1015', platinum_price: '588', updated_date: '2025-07-22', unit: '元/克' },
      { brand: '周生生', bullion_price: '952', gold_price: '1021', platinum_price: '588', updated_date: '2025-07-22', unit: '元/克' },
      { brand: '周大福', bullion_price: '1015', gold_price: '1015', platinum_price: '-', updated_date: '2025-07-22', unit: '元/克' }
    ];
    return this.readFromStorage<BrandPreciousMetalPrice[]>(STORAGE_KEYS.BRAND_PRECIOUS_METAL_PRICES, defaultBrandPreciousMetalPrices);
  }

  /**
   * 保存品牌贵金属价格
   * @param brandPreciousMetalPrices 品牌贵金属价格数组
   */
  saveBrandPreciousMetalPrices(brandPreciousMetalPrices: BrandPreciousMetalPrice[]): void {
    this.saveToStorage(STORAGE_KEYS.BRAND_PRECIOUS_METAL_PRICES, brandPreciousMetalPrices);
  }

  /**
   * 获取贵金属数据同步时间
   * @returns 同步时间字符串或null
   */
  getPreciousMetalSyncTime(): string | null {
    return this.readFromStorage<string | null>(STORAGE_KEYS.PRECIOUS_METAL_SYNC_TIME, null);
  }

  /**
   * 保存贵金属数据同步时间
   * @param syncTime 同步时间字符串
   */
  savePreciousMetalSyncTime(syncTime: string): void {
    this.saveToStorage(STORAGE_KEYS.PRECIOUS_METAL_SYNC_TIME, syncTime);
  }

  /**
   * 从API获取贵金属数据
   * @returns Promise<PreciousMetal[]> 贵金属数据数组
   */
  async fetchPreciousMetalsFromAPI(): Promise<PreciousMetal[]> {
    try {
      // 调用贵金属API（通过代理路由解决CORS问题）
      const response = await fetch('/api/precious-metal');
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      
      // 保存完整的贵金属数据
      if (apiResponse.data) {
        // 保存银行投资金条价格
        if (apiResponse.data.bank_gold_bar_price) {
          const bankGoldBarPrices = apiResponse.data.bank_gold_bar_price.map((item: any) => ({
            bank: item.bank,
            price: item.price,
            unit: '元/克'
          }));
          this.saveBankGoldBarPrices(bankGoldBarPrices);
        }
        
        // 保存贵金属回收价格
        if (apiResponse.data.gold_recycle_price) {
          const goldRecyclePrices = apiResponse.data.gold_recycle_price.map((item: any) => ({
            gold_type: item.gold_type,
            recycle_price: item.recycle_price,
            updated_date: item.updated_date,
            unit: '元/克'
          }));
          this.saveGoldRecyclePrices(goldRecyclePrices);
        }
        
        // 保存品牌贵金属价格
        if (apiResponse.data.precious_metal_price) {
          const brandPreciousMetalPrices = apiResponse.data.precious_metal_price.map((item: any) => ({
            brand: item.brand,
            bullion_price: item.bullion_price,
            gold_price: item.gold_price,
            platinum_price: item.platinum_price,
            updated_date: item.updated_date,
            unit: '元/克'
          }));
          this.saveBrandPreciousMetalPrices(brandPreciousMetalPrices);
        }
      }
      
      // 转换数据格式，确保符合PreciousMetal接口
      const preciousMetals: PreciousMetal[] = [];
      
      // 处理黄金数据
      if (apiResponse.data && apiResponse.data.precious_metal_price) {
        // 获取第一个品牌的黄金价格
        const firstBrand = apiResponse.data.precious_metal_price[0];
        if (firstBrand && firstBrand.gold_price) {
          preciousMetals.push({
            name: '黄金',
            value: firstBrand.gold_price,
            change: '+0.00%', // API未提供涨跌幅，使用默认值
            isUp: true,
            unit: '元/克'
          });
        }
      }
      
      // 处理白银数据
      // 从黄金回收价格中获取白银价格的近似值
      if (apiResponse.data && apiResponse.data.gold_recycle_price) {
        const silverItem = apiResponse.data.gold_recycle_price.find((item: any) => 
          item.gold_type.includes('银')
        );
        if (silverItem && silverItem.recycle_price) {
          preciousMetals.push({
            name: '白银',
            value: silverItem.recycle_price,
            change: '-0.00%', // API未提供涨跌幅，使用默认值
            isUp: false,
            unit: '元/克'
          });
        } else {
          // 如果没有白银数据，使用默认值
          preciousMetals.push({
            name: '白银',
            value: '5.23',
            change: '-0.15%',
            isUp: false,
            unit: '元/克'
          });
        }
      }
      
      // 确保至少返回黄金和白银数据
      if (preciousMetals.length === 0) {
        // 使用默认数据
        preciousMetals.push(
          {
            name: '黄金',
            value: '412.56',
            change: '+0.32%',
            isUp: true,
            unit: '元/克'
          },
          {
            name: '白银',
            value: '5.23',
            change: '-0.15%',
            isUp: false,
            unit: '元/克'
          }
        );
      }
      
      return preciousMetals;
    } catch (error) {
      console.error('获取贵金属数据失败:', error);
      // 出错时返回默认数据
      return [
        {
          name: '黄金',
          value: '412.56',
          change: '+0.32%',
          isUp: true,
          unit: '元/克'
        },
        {
          name: '白银',
          value: '5.23',
          change: '-0.15%',
          isUp: false,
          unit: '元/克'
        }
      ];
    }
  }

  /**
   * 从API获取完整的贵金属数据
   * @returns Promise<CompletePreciousMetalData> 完整的贵金属数据
   */
  async fetchCompletePreciousMetalDataFromAPI(): Promise<CompletePreciousMetalData> {
    try {
      // 调用贵金属API（通过代理路由解决CORS问题）
      const response = await fetch('https://v2.xxapi.cn/api/goldprice');
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const apiResponse = await response.json();
      
      // 处理银行投资金条价格
      const bankGoldBarPrices = apiResponse.data?.bank_gold_bar_price?.map((item: any) => ({
        bank: item.bank,
        price: item.price,
        unit: '元/克'
      })) || [];
      
      // 处理贵金属回收价格
      const goldRecyclePrices = apiResponse.data?.gold_recycle_price?.map((item: any) => ({
        gold_type: item.gold_type,
        recycle_price: item.recycle_price,
        updated_date: item.updated_date,
        unit: '元/克'
      })) || [];
      
      // 处理品牌贵金属价格
      const brandPrices = apiResponse.data?.precious_metal_price?.map((item: any) => ({
        brand: item.brand,
        bullion_price: item.bullion_price,
        gold_price: item.gold_price,
        platinum_price: item.platinum_price,
        updated_date: item.updated_date,
        unit: '元/克'
      })) || [];
      
      // 保存数据到本地存储
      this.saveBankGoldBarPrices(bankGoldBarPrices);
      this.saveGoldRecyclePrices(goldRecyclePrices);
      this.saveBrandPreciousMetalPrices(brandPrices);
      
      // 保存同步时间
      const syncTime = new Date().toLocaleString('zh-CN');
      this.savePreciousMetalSyncTime(syncTime);
      
      return {
        bankGoldBarPrices,
        goldRecyclePrices,
        brandPrices
      };
    } catch (error) {
      console.error('获取完整贵金属数据失败:', error);
      // 出错时返回本地存储的数据
      return {
        bankGoldBarPrices: this.getBankGoldBarPrices(),
        goldRecyclePrices: this.getGoldRecyclePrices(),
        brandPrices: this.getBrandPreciousMetalPrices()
      };
    }
  }

  /**
   * 初始化应用数据
   * 确保所有必要的数据都已保存到LocalStorage
   */
  initializeData(): void {
    try {
      // 初始化用户持仓数据
      const holdings = this.getUserHoldings();
      if (!holdings || holdings.length === 0) {
        this.saveUserHoldings([]);
      }

      // 初始化钱包数据
      const wallets = this.getWallets();
      if (!wallets || wallets.length === 0) {
        this.saveWallets([
          { id: 'summary', name: '汇总', createdAt: new Date().toISOString() },
          { id: 'default', name: '默认钱包', createdAt: new Date().toISOString() }
        ]);
      }

      // 初始化设置数据
      const settings = this.getSettings();
      if (!settings) {
        this.saveSettings({
          metalItemsPerRow: 2,
          marketItemsPerRow: 2,
          colorScheme: 'red-up'
        });
      }

      // 初始化市场指数数据
      const marketIndices = this.getMarketIndices();
      if (!marketIndices || marketIndices.length === 0) {
        this.saveMarketIndices([
          { name: '上证指数', value: '3,258.63', change: '+0.82%', isUp: true },
          { name: '深证成指', value: '10,824.36', change: '+1.25%', isUp: true },
          { name: '创业板指', value: '2,156.78', change: '-0.35%', isUp: false },
          { name: '恒生指数', value: '18,245.67', change: '+0.56%', isUp: true },
        ]);
      }

      // 初始化贵金属数据
      const preciousMetals = this.getPreciousMetals();
      if (!preciousMetals || preciousMetals.length === 0) {
        this.savePreciousMetals([
          { name: '黄金', value: '412.56', change: '+0.32%', isUp: true, unit: '元/克' },
          { name: '白银', value: '5.23', change: '-0.15%', isUp: false, unit: '元/克' },
          { name: '铂金', value: '235.67', change: '+0.58%', isUp: true, unit: '元/克' },
          { name: '钯金', value: '312.45', change: '-0.24%', isUp: false, unit: '元/克' },
        ]);
      }

      // 初始化银行投资金条价格数据
      const bankGoldBarPrices = this.getBankGoldBarPrices();
      if (!bankGoldBarPrices || bankGoldBarPrices.length === 0) {
        this.saveBankGoldBarPrices([
          { bank: '农行传世之宝金条', price: '805.27', unit: '元/克' },
          { bank: '浦发银行投资金条', price: '803.45', unit: '元/克' },
          { bank: '和谐平安金条', price: '792.1', unit: '元/克' },
          { bank: '工商银行如意金条', price: '797.66', unit: '元/克' },
          { bank: '中国银行金条', price: '794.98', unit: '元/克' },
          { bank: '建设银行龙鼎金条', price: '797.1', unit: '元/克' }
        ]);
      }

      // 初始化贵金属回收价格数据
      const goldRecyclePrices = this.getGoldRecyclePrices();
      if (!goldRecyclePrices || goldRecyclePrices.length === 0) {
        this.saveGoldRecyclePrices([
          { gold_type: '24K金回收', recycle_price: '767.0', updated_date: '2025-07-22', unit: '元/克' },
          { gold_type: '18K金回收', recycle_price: '571.0', updated_date: '2025-07-22', unit: '元/克' },
          { gold_type: '14K金回收', recycle_price: '442.0', updated_date: '2025-07-22', unit: '元/克' },
          { gold_type: 'pd950钯金回收', recycle_price: '259.0', updated_date: '2025-07-22', unit: '元/克' },
          { gold_type: 'pd990钯金回收', recycle_price: '270.0', updated_date: '2025-07-22', unit: '元/克' },
          { gold_type: 'pd999钯金回收', recycle_price: '273.0', updated_date: '2025-07-22', unit: '元/克' },
          { gold_type: '黄金回收', recycle_price: '771.0', updated_date: '2025-07-22', unit: '元/克' },
          { gold_type: '925银条回收', recycle_price: '7.18', updated_date: '2025-07-22', unit: '元/克' },
          { gold_type: '足银回收', recycle_price: '8.29', updated_date: '2025-07-22', unit: '元/克' }
        ]);
      }

      // 初始化品牌贵金属价格数据
      const brandPreciousMetalPrices = this.getBrandPreciousMetalPrices();
      if (!brandPreciousMetalPrices || brandPreciousMetalPrices.length === 0) {
        this.saveBrandPreciousMetalPrices([
          { brand: '周六福', bullion_price: '900', gold_price: '988', platinum_price: '621', updated_date: '2025-07-22', unit: '元/克' },
          { brand: '老凤祥', bullion_price: '966', gold_price: '1016', platinum_price: '470', updated_date: '2025-07-22', unit: '元/克' },
          { brand: '老庙黄金', bullion_price: '969', gold_price: '1014', platinum_price: '470', updated_date: '2025-07-22', unit: '元/克' },
          { brand: '菜百首饰', bullion_price: '890', gold_price: '996', platinum_price: '445', updated_date: '2025-07-22', unit: '元/克' },
          { brand: '潮宏基', bullion_price: '1015', gold_price: '1015', platinum_price: '588', updated_date: '2025-07-22', unit: '元/克' },
          { brand: '金至尊', bullion_price: '1015', gold_price: '1015', platinum_price: '588', updated_date: '2025-07-22', unit: '元/克' },
          { brand: '谢瑞麟', bullion_price: '952', gold_price: '1015', platinum_price: '-', updated_date: '2025-07-22', unit: '元/克' },
          { brand: '六福珠宝', bullion_price: '1015', gold_price: '1015', platinum_price: '588', updated_date: '2025-07-22', unit: '元/克' },
          { brand: '周生生', bullion_price: '952', gold_price: '1021', platinum_price: '588', updated_date: '2025-07-22', unit: '元/克' },
          { brand: '周大福', bullion_price: '1015', gold_price: '1015', platinum_price: '-', updated_date: '2025-07-22', unit: '元/克' }
        ]);
      }

      // 初始化基金数据
      const funds = this.getAllFunds();
      if (!funds || funds.length === 0) {
        this.saveAllFunds([
          {
            code: '000001',
            name: '华夏成长混合',
            type: '混合型',
            riskLevel: '中高风险',
            manager: '巩怀志',
            establishedDate: '2001-12-18',
            fundSize: '32.56亿',
            valuation: {
              code: '000001',
              valuation: 1.5678,
              netValue: 1.5432,
              dailyChange: 0.0246,
              dailyChangeRate: 1.60,
              weeklyChangeRate: 2.30,
              monthlyChangeRate: 4.50,
              updateTime: new Date().toLocaleTimeString()
            }
          },
          {
            code: '110022',
            name: '易方达消费行业股票',
            type: '股票型',
            riskLevel: '高风险',
            manager: '萧楠',
            establishedDate: '2010-08-20',
            fundSize: '156.78亿',
            valuation: {
              code: '110022',
              valuation: 2.3456,
              netValue: 2.3123,
              dailyChange: 0.0333,
              dailyChangeRate: 1.44,
              weeklyChangeRate: 1.80,
              monthlyChangeRate: 3.20,
              updateTime: new Date().toLocaleTimeString()
            }
          },
          {
            code: '001475',
            name: '易方达国防军工混合',
            type: '混合型',
            riskLevel: '高风险',
            manager: '何崇恺',
            establishedDate: '2015-06-19',
            fundSize: '89.34亿',
            valuation: {
              code: '001475',
              valuation: 1.8976,
              netValue: 1.8654,
              dailyChange: 0.0322,
              dailyChangeRate: 1.73,
              weeklyChangeRate: 2.10,
              monthlyChangeRate: 5.60,
              updateTime: new Date().toLocaleTimeString()
            }
          },
          {
            code: '000209',
            name: '信诚新兴产业混合',
            type: '混合型',
            riskLevel: '中高风险',
            manager: '孙浩中',
            establishedDate: '2013-07-24',
            fundSize: '15.67亿',
            valuation: {
              code: '000209',
              valuation: 1.2345,
              netValue: 1.2123,
              dailyChange: 0.0222,
              dailyChangeRate: 1.83,
              weeklyChangeRate: 1.50,
              monthlyChangeRate: 3.80,
              updateTime: new Date().toLocaleTimeString()
            }
          },
          {
            code: '003095',
            name: '中欧医疗健康混合A',
            type: '混合型',
            riskLevel: '中高风险',
            manager: '葛兰',
            establishedDate: '2016-09-29',
            fundSize: '234.56亿',
            valuation: {
              code: '003095',
              valuation: 2.6789,
              netValue: 2.6456,
              dailyChange: 0.0333,
              dailyChangeRate: 1.26,
              weeklyChangeRate: 2.80,
              monthlyChangeRate: 4.20,
              updateTime: new Date().toLocaleTimeString()
            }
          }
        ]);
      }

      // 初始化基金持仓汇总数据
      const fundHoldingsSummary = this.getFundHoldingsSummary();
      if (!fundHoldingsSummary || fundHoldingsSummary.length === 0) {
        this.saveFundHoldingsSummary([
          { industry: '信息技术', proportion: 35.2, count: 12 },
          { industry: '医药生物', proportion: 22.5, count: 8 },
          { industry: '消费零售', proportion: 18.7, count: 6 },
          { industry: '金融服务', proportion: 12.3, count: 4 },
          { industry: '新能源', proportion: 8.5, count: 3 },
          { industry: '制造业', proportion: 2.8, count: 2 },
        ]);
      }

      console.log('Application data initialized successfully');
    } catch (error) {
      console.error('Error initializing application data:', error);
    }
  }
}

// 导出单例实例
const dataService = new DataService();

export default dataService;
export { DataService };
