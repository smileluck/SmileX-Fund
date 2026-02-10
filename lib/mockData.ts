// 基金数据模拟服务
// 提供实时估值数据、历史数据和基金基本信息

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
  totalValue: number;    // 总价值
  profit: number;        // 盈亏
  profitRate: number;    // 盈亏比例
  type: string;          // 基金类型
  industryInfo?: string; // 行业信息
  walletId: string;      // 所属钱包ID
}

// 模拟基金基本数据
const fundBasicData: FundBasic[] = [
  {
    code: '000001',
    name: '华夏成长混合',
    type: '混合型',
    riskLevel: '中高风险',
    manager: '巩怀志',
    establishedDate: '2001-12-18',
    fundSize: '32.56亿'
  },
  {
    code: '110022',
    name: '易方达消费行业股票',
    type: '股票型',
    riskLevel: '高风险',
    manager: '萧楠',
    establishedDate: '2010-08-20',
    fundSize: '156.78亿'
  },
  {
    code: '001475',
    name: '易方达国防军工混合',
    type: '混合型',
    riskLevel: '高风险',
    manager: '何崇恺',
    establishedDate: '2015-06-19',
    fundSize: '89.34亿'
  },
  {
    code: '000209',
    name: '信诚新兴产业混合',
    type: '混合型',
    riskLevel: '中高风险',
    manager: '孙浩中',
    establishedDate: '2013-07-24',
    fundSize: '15.67亿'
  },
  {
    code: '003095',
    name: '中欧医疗健康混合A',
    type: '混合型',
    riskLevel: '中高风险',
    manager: '葛兰',
    establishedDate: '2016-09-29',
    fundSize: '234.56亿'
  },
  {
    code: '001511',
    name: '兴全商业模式优选混合',
    type: '混合型',
    riskLevel: '中风险',
    manager: '乔迁',
    establishedDate: '2015-01-21',
    fundSize: '102.34亿'
  },
  {
    code: '000689',
    name: '前海开源新经济混合A',
    type: '混合型',
    riskLevel: '中高风险',
    manager: '崔宸龙',
    establishedDate: '2014-08-20',
    fundSize: '78.92亿'
  },
  {
    code: '001480',
    name: '中银智能制造股票',
    type: '股票型',
    riskLevel: '高风险',
    manager: '王伟',
    establishedDate: '2015-06-19',
    fundSize: '45.67亿'
  }
];

// 模拟市场指数数据
const marketIndexData: MarketIndex[] = [
  { name: '上证指数', value: '3,258.63', change: '+0.82%', isUp: true },
  { name: '深证成指', value: '10,824.36', change: '+1.25%', isUp: true },
  { name: '创业板指', value: '2,156.78', change: '-0.35%', isUp: false },
  { name: '恒生指数', value: '18,245.67', change: '+0.56%', isUp: true },
];

// 模拟贵金属数据
const preciousMetalData: PreciousMetal[] = [
  { name: '黄金', value: '412.56', change: '+0.32%', isUp: true, unit: '元/克' },
  { name: '白银', value: '5.23', change: '-0.15%', isUp: false, unit: '元/克' },
  { name: '铂金', value: '235.67', change: '+0.58%', isUp: true, unit: '元/克' },
  { name: '钯金', value: '312.45', change: '-0.24%', isUp: false, unit: '元/克' },
];

// 模拟基金持仓汇总数据
const fundHoldingsSummary = [
  { industry: '信息技术', proportion: 35.2, count: 12 },
  { industry: '医药生物', proportion: 22.5, count: 8 },
  { industry: '消费零售', proportion: 18.7, count: 6 },
  { industry: '金融服务', proportion: 12.3, count: 4 },
  { industry: '新能源', proportion: 8.5, count: 3 },
  { industry: '制造业', proportion: 2.8, count: 2 },
];

// 生成随机涨跌幅度
const generateRandomChange = (baseValue: number, volatility: number = 0.02): number => {
  // 生成 -volatility 到 +volatility 之间的随机数
  const change = (Math.random() - 0.5) * 2 * volatility;
  return baseValue * (1 + change);
};

// 格式化数字为指定小数位数
const formatNumber = (num: number, decimals: number = 4): number => {
  return parseFloat(num.toFixed(decimals));
};

// 生成基金历史数据
const generateFundHistory = (code: string, days: number = 30): FundHistory[] => {
  const history: FundHistory[] = [];
  const today = new Date();
  let baseValue = 1 + Math.random() * 2; // 初始值 1-3 之间
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // 生成带有随机波动的历史数据
    baseValue = generateRandomChange(baseValue, 0.015);
    
    history.push({
      code,
      date: dateStr,
      value: formatNumber(baseValue)
    });
  }
  
  return history;
};

// 生成贵金属历史数据
const generatePreciousMetalHistory = (name: string, days: number = 30): PreciousMetalHistory[] => {
  const history: PreciousMetalHistory[] = [];
  const today = new Date();
  
  // 根据贵金属类型设置不同的初始值范围
  let baseValue: number;
  switch (name) {
    case '黄金':
      baseValue = 400 + Math.random() * 30; // 初始值 400-430 之间
      break;
    case '白银':
      baseValue = 5 + Math.random() * 1; // 初始值 5-6 之间
      break;
    case '铂金':
      baseValue = 230 + Math.random() * 20; // 初始值 230-250 之间
      break;
    case '钯金':
      baseValue = 300 + Math.random() * 30; // 初始值 300-330 之间
      break;
    default:
      baseValue = 100 + Math.random() * 50; // 默认初始值
  }
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // 生成带有随机波动的历史数据
    baseValue = generateRandomChange(baseValue, 0.01);
    
    history.push({
      name,
      date: dateStr,
      value: formatNumber(baseValue, 2)
    });
  }
  
  return history;
};

// 生成基金持仓数据
const generateFundHoldings = (code: string): FundHoldings[] => {
  const industries = ['信息技术', '医药生物', '消费零售', '金融服务', '新能源', '制造业'];
  const stocks = [
    { code: '600519', name: '贵州茅台' },
    { code: '000858', name: '五粮液' },
    { code: '000333', name: '美的集团' },
    { code: '601318', name: '中国平安' },
    { code: '600036', name: '招商银行' },
    { code: '000001', name: '平安银行' },
    { code: '600276', name: '恒瑞医药' },
    { code: '601166', name: '兴业银行' },
    { code: '000651', name: '格力电器' },
    { code: '600887', name: '伊利股份' }
  ];
  
  // 随机选择 5-8 只股票作为持仓
  const holdingCount = Math.floor(Math.random() * 4) + 5;
  const shuffledStocks = [...stocks].sort(() => Math.random() - 0.5);
  const selectedStocks = shuffledStocks.slice(0, holdingCount);
  
  // 生成持仓比例，总和为 60-80%
  const totalProportion = 0.6 + Math.random() * 0.2;
  let remainingProportion = totalProportion;
  const holdings: FundHoldings[] = [];
  
  for (let i = 0; i < selectedStocks.length; i++) {
    const stock = selectedStocks[i];
    let proportion: number;
    
    if (i === selectedStocks.length - 1) {
      // 最后一只股票取剩余比例
      proportion = remainingProportion;
    } else {
      // 前面的股票随机分配比例，确保后面还有剩余
      const maxProportion = remainingProportion / (selectedStocks.length - i);
      proportion = Math.random() * maxProportion * 1.5;
      proportion = Math.min(proportion, remainingProportion * 0.3); // 单个持仓不超过剩余的 30%
    }
    
    holdings.push({
      code,
      stockCode: stock.code,
      stockName: stock.name,
      proportion: formatNumber(proportion, 4),
      industry: industries[Math.floor(Math.random() * industries.length)]
    });
    
    remainingProportion -= proportion;
  }
  
  return holdings;
};

// 生成宏观经济数据
const generateMacroEconomicData = (months: number = 24): MacroEconomicData[] => {
  const data: MacroEconomicData[] = [];
  const today = new Date();
  let baseM1 = 60000 + Math.random() * 20000; // 初始 M1 值 6-8 万亿
  let baseM2 = 200000 + Math.random() * 50000; // 初始 M2 值 20-25 万亿
  let baseGDP = 100000 + Math.random() * 50000; // 初始 GDP 值 10-15 万亿
  
  for (let i = months; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    const dateStr = date.toISOString().slice(0, 7); // 格式：YYYY-MM
    
    // 生成带有随机波动的 M1 和 M2 数据
    baseM1 = generateRandomChange(baseM1, 0.05);
    baseM2 = generateRandomChange(baseM2, 0.03);
    baseGDP = generateRandomChange(baseGDP, 0.04); // GDP 波动较小
    
    // 生成同比增长率
    const m1ChangeRate = (Math.random() - 0.3) * 20; // -6% 到 14% 之间
    const m2ChangeRate = (Math.random() - 0.2) * 15; // -3% 到 12% 之间
    const gdpChangeRate = (Math.random() - 0.1) * 10 + 5; // 4% 到 14% 之间
    
    // 生成巴菲特指标（股市总市值/GDP），通常在 0.7-1.5 之间
    const buffettIndicator = (Math.random() * 0.8) + 0.7;
    
    data.push({
      date: dateStr,
      m1: formatNumber(baseM1),
      m1ChangeRate: formatNumber(m1ChangeRate, 2),
      m2: formatNumber(baseM2),
      m2ChangeRate: formatNumber(m2ChangeRate, 2),
      gdp: formatNumber(baseGDP),
      gdpChangeRate: formatNumber(gdpChangeRate, 2),
      buffettIndicator: formatNumber(buffettIndicator, 2)
    });
  }
  
  return data;
};

// 生成宏观经济累计涨跌幅数据
const generateMacroEconomicCumulative = (data: MacroEconomicData[]): MacroEconomicCumulative[] => {
  const cumulativeData: MacroEconomicCumulative[] = [];
  let cumulativeChange = 0;
  
  data.forEach((item, index) => {
    if (index === 0) {
      cumulativeChange = 0;
    } else {
      const prevItem = data[index - 1];
      const change = ((item.m1 - prevItem.m1) / prevItem.m1) * 100;
      cumulativeChange += change;
    }
    
    cumulativeData.push({
      date: item.date,
      cumulativeChange: formatNumber(cumulativeChange, 2)
    });
  });
  
  return cumulativeData;
};

// 基金数据模拟服务类
export class FundMockService {
  private fundData: Map<string, FundInfo>;
  private marketData: MarketIndex[];
  private preciousMetalData: PreciousMetal[];
  private updateInterval: NodeJS.Timeout | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // 初始化基金数据
    this.fundData = new Map();
    this.marketData = [...marketIndexData];
    this.preciousMetalData = [...preciousMetalData];
    
    // 为每个基金生成初始数据
    fundBasicData.forEach(fund => {
      const initialValuation = 1 + Math.random() * 2;
      const netValue = formatNumber(initialValuation * (1 + (Math.random() - 0.5) * 0.02));
      const dailyChange = formatNumber(initialValuation - netValue);
      const dailyChangeRate = formatNumber((dailyChange / netValue) * 100, 2);
      
      const fundInfo: FundInfo = {
        ...fund,
        valuation: {
          code: fund.code,
          valuation: formatNumber(initialValuation),
          netValue,
          dailyChange,
          dailyChangeRate,
          weeklyChangeRate: formatNumber((Math.random() - 0.5) * 5, 2),
          monthlyChangeRate: formatNumber((Math.random() - 0.5) * 10, 2),
          updateTime: new Date().toLocaleTimeString()
        },
        holdings: generateFundHoldings(fund.code)
      };
      
      this.fundData.set(fund.code, fundInfo);
    });
  }

  // 启动数据更新
  startUpdates(interval: number = 5000) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      try {
        this.updateFundValuations();
        this.updateMarketIndices();
        this.updatePreciousMetals();
        this.notifyListeners();
      } catch (error) {
        console.error('Error updating fund data:', error);
        // 即使出错也继续运行，确保服务不会崩溃
      }
    }, interval);
  }

  // 停止数据更新
  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // 更新基金估值数据
  private updateFundValuations() {
    this.fundData.forEach((fundInfo) => {
      const oldValuation = fundInfo.valuation.valuation;
      const newValuation = formatNumber(generateRandomChange(oldValuation));
      const netValue = fundInfo.valuation.netValue;
      const dailyChange = formatNumber(newValuation - netValue);
      const dailyChangeRate = formatNumber((dailyChange / netValue) * 100, 2);
      
      // 更新估值数据
      fundInfo.valuation = {
        ...fundInfo.valuation,
        valuation: newValuation,
        dailyChange,
        dailyChangeRate,
        updateTime: new Date().toLocaleTimeString()
      };
    });
  }

  // 更新市场指数数据
  private updateMarketIndices() {
    this.marketData = this.marketData.map(index => {
      const isUp = Math.random() > 0.4; // 60% 概率上涨
      const change = formatNumber((Math.random() * 1.5), 2);
      const changeStr = `${isUp ? '+' : '-' }${change}%`;
      
      // 模拟指数值变化
      const valueNum = parseFloat(index.value.replace(/,/g, ''));
      const valueChange = valueNum * (change / 100) * (isUp ? 1 : -1);
      const newValue = Math.round((valueNum + valueChange) * 100) / 100;
      const newValueStr = newValue.toLocaleString();
      
      return {
        ...index,
        value: newValueStr,
        change: changeStr,
        isUp
      };
    });
  }

  // 更新贵金属数据
  private updatePreciousMetals() {
    this.preciousMetalData = this.preciousMetalData.map(metal => {
      const isUp = Math.random() > 0.4; // 60% 概率上涨
      const change = formatNumber((Math.random() * 0.8), 2);
      const changeStr = `${isUp ? '+' : '-' }${change}%`;
      
      // 模拟价格变化
      const valueNum = parseFloat(metal.value);
      const valueChange = valueNum * (change / 100) * (isUp ? 1 : -1);
      const newValue = Math.round((valueNum + valueChange) * 100) / 100;
      const newValueStr = newValue.toFixed(2);
      
      return {
        ...metal,
        value: newValueStr,
        change: changeStr,
        isUp
      };
    });
  }

  // 添加数据更新监听器
  addListener(listener: () => void) {
    this.listeners.add(listener);
  }

  // 移除数据更新监听器
  removeListener(listener: () => void) {
    this.listeners.delete(listener);
  }

  // 通知所有监听器数据已更新
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in listener:', error);
        // 即使某个监听器出错，也继续通知其他监听器
      }
    });
  }

  // 获取所有基金数据
  getAllFunds(): FundInfo[] {
    return Array.from(this.fundData.values());
  }

  // 根据代码获取基金数据
  getFundByCode(code: string): FundInfo | undefined {
    return this.fundData.get(code);
  }

  // 根据名称搜索基金
  searchFundsByName(name: string): FundInfo[] {
    const lowerName = name.toLowerCase();
    return Array.from(this.fundData.values()).filter(fund => 
      fund.name.toLowerCase().includes(lowerName)
    );
  }

  // 根据代码搜索基金
  searchFundsByCode(code: string): FundInfo | undefined {
    return this.fundData.get(code);
  }

  // 获取市场指数数据
  getMarketIndices(): MarketIndex[] {
    return [...this.marketData];
  }

  // 获取基金历史数据
  getFundHistory(code: string, days: number = 30): FundHistory[] {
    return generateFundHistory(code, days);
  }

  // 根据类型筛选基金
  filterFundsByType(type: string): FundInfo[] {
    if (!type) return this.getAllFunds();
    return Array.from(this.fundData.values()).filter(fund => fund.type === type);
  }

  // 根据风险等级筛选基金
  filterFundsByRiskLevel(riskLevel: string): FundInfo[] {
    if (!riskLevel) return this.getAllFunds();
    return Array.from(this.fundData.values()).filter(fund => fund.riskLevel === riskLevel);
  }

  // 排序基金数据
  sortFunds(sortBy: 'valuation' | 'dailyChangeRate' | 'name', order: 'asc' | 'desc' = 'desc', fundList?: FundInfo[]): FundInfo[] {
    const funds = fundList || this.getAllFunds();
    
    funds.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'valuation':
          comparison = a.valuation.valuation - b.valuation.valuation;
          break;
        case 'dailyChangeRate':
          comparison = a.valuation.dailyChangeRate - b.valuation.dailyChangeRate;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
    
    return funds;
  }
  
  // 获取宏观经济数据
  getMacroEconomicData(months: number = 24): MacroEconomicData[] {
    return generateMacroEconomicData(months);
  }
  
  // 获取宏观经济累计涨跌幅数据
  getMacroEconomicCumulative(months: number = 24): MacroEconomicCumulative[] {
    const macroData = generateMacroEconomicData(months);
    return generateMacroEconomicCumulative(macroData);
  }
  
  // 获取贵金属数据
  getPreciousMetals(): PreciousMetal[] {
    return [...this.preciousMetalData];
  }
  
  // 获取贵金属历史数据
  getPreciousMetalHistory(name: string, days: number = 30): PreciousMetalHistory[] {
    return generatePreciousMetalHistory(name, days);
  }
  
  // 获取基金持仓汇总数据
  getFundHoldingsSummary() {
    return fundHoldingsSummary;
  }
}

// 导出单例实例
export const fundMockService = new FundMockService();

// 导出工具函数
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  });
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};
