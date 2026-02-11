'use client';

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import { Search, Bell, Settings, ChevronDown, TrendingUp, BarChart2, Bookmark, Home, DollarSign, LineChart as LineChartIcon } from 'lucide-react';
import { FundInfo, MarketIndex, MacroEconomicData, MacroEconomicCumulative, UserHolding, Wallet, PreciousMetal, PreciousMetalHistory, BankGoldBarPrice, GoldRecyclePrice, BrandPreciousMetalPrice, formatCurrency, formatPercentage } from '@/lib/dataService';
import dataService from '@/lib/dataService';

// 懒加载组件
const FundTab = lazy(() => import('./components/FundTab'));
const MetalTab = lazy(() => import('./components/MetalTab'));
const MarketTab = lazy(() => import('./components/MarketTab'));

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('fund');
  const [funds, setFunds] = useState<FundInfo[]>([]);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [preciousMetals, setPreciousMetals] = useState<PreciousMetal[]>([]);
  const [bankGoldBarPrices, setBankGoldBarPrices] = useState<BankGoldBarPrice[]>([]);
  const [goldRecyclePrices, setGoldRecyclePrices] = useState<GoldRecyclePrice[]>([]);
  const [brandPrices, setBrandPrices] = useState<BrandPreciousMetalPrice[]>([]);
  const [preciousMetalSyncTime, setPreciousMetalSyncTime] = useState<string | null>(null);
  const [fundHoldingsSummary, setFundHoldingsSummary] = useState<{ industry: string; proportion: number; count: number }[]>([]);
  const [macroEconomicData, setMacroEconomicData] = useState<MacroEconomicData[]>([]);
  const [macroEconomicCumulative, setMacroEconomicCumulative] = useState<MacroEconomicCumulative[]>([]);
  const [goldHistory, setGoldHistory] = useState<PreciousMetalHistory[]>([]);
  const [silverHistory, setSilverHistory] = useState<PreciousMetalHistory[]>([]);
  const [sortBy, setSortBy] = useState<'valuation' | 'dailyChangeRate' | 'name'>('dailyChangeRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [fundType, setFundType] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  // 持仓管理状态
  const [userHoldings, setUserHoldings] = useState<UserHolding[]>([]);
  // 钱包管理状态
  const [wallets, setWallets] = useState<Wallet[]>([
    { id: 'summary', name: '汇总', createdAt: new Date().toISOString() },
    { id: 'default', name: '默认钱包', createdAt: new Date().toISOString() }
  ]);
  const [currentWalletId, setCurrentWalletId] = useState('default');
  // 设置相关状态
  const [itemsPerRow, setItemsPerRow] = useState(2); // 贵金属默认值为 2
  const [marketItemsPerRow, setMarketItemsPerRow] = useState(2); // 市场默认值为 2
  const [colorScheme, setColorScheme] = useState<'red-up' | 'red-down'>('red-up'); // 默认红色为涨
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);

  // 从本地存储读取设置
  useEffect(() => {
    try {
      // 读取贵金属设置
      const savedItemsPerRow = localStorage.getItem('metalItemsPerRow');
      if (savedItemsPerRow) {
        const parsedValue = parseInt(savedItemsPerRow, 10);
        if (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 4) {
          setItemsPerRow(parsedValue);
        }
      }
      
      // 读取市场设置
      const savedMarketItemsPerRow = localStorage.getItem('marketItemsPerRow');
      if (savedMarketItemsPerRow) {
        const parsedValue = parseInt(savedMarketItemsPerRow, 10);
        if (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 4) {
          setMarketItemsPerRow(parsedValue);
        }
      }
      
      // 读取涨跌颜色配置
      const savedColorScheme = localStorage.getItem('colorScheme');
      if (savedColorScheme && (savedColorScheme === 'red-up' || savedColorScheme === 'red-down')) {
        setColorScheme(savedColorScheme as 'red-up' | 'red-down');
      }
    } catch (error) {
      console.error('Error reading settings from localStorage:', error);
      // 出错时使用默认值，但不保存到本地存储
    }
  }, []);

  // 移除自动保存设置的逻辑，只在设置页面保存
  // 这样可以避免在主页面初始化时覆盖本地存储中的值

  // 监听本地存储变化，实现设置自动同步
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // 监听贵金属设置变化
      if (event.key === 'metalItemsPerRow' && event.newValue) {
        const parsedValue = parseInt(event.newValue, 10);
        if (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 4) {
          setItemsPerRow(parsedValue);
        }
      }
      
      // 监听市场设置变化
      if (event.key === 'marketItemsPerRow' && event.newValue) {
        const parsedValue = parseInt(event.newValue, 10);
        if (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 4) {
          setMarketItemsPerRow(parsedValue);
        }
      }
      
      // 监听涨跌颜色配置变化
      if (event.key === 'colorScheme' && event.newValue && (event.newValue === 'red-up' || event.newValue === 'red-down')) {
        setColorScheme(event.newValue as 'red-up' | 'red-down');
      }
    };

    // 添加存储事件监听器
    window.addEventListener('storage', handleStorageChange);

    // 清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 监听用户持仓变化并自动保存
  useEffect(() => {
    dataService.saveUserHoldings(userHoldings);
  }, [userHoldings]);

  // 监听钱包变化并自动保存
  useEffect(() => {
    dataService.saveWallets(wallets);
  }, [wallets]);

  // 注意：移除了定期检查本地存储的interval，因为：
  // 1. 它会导致频繁的组件重渲染
  // 2. 本地存储的变化已经通过storage事件监听器处理
  // 3. 对于同一页面内的本地存储变化，应该通过直接调用setState来处理，而不是轮询

  // 如需在同一页面内同步设置变化，请在修改localStorage后直接更新对应的状态

  // 从API获取贵金属数据
  const fetchPreciousMetals = async () => {
    try {
      setIsLoading(true);
      const metals = await dataService.fetchPreciousMetalsFromAPI();
      setPreciousMetals(metals);
    } catch (error) {
      console.error('Error fetching precious metals:', error);
      // 出错时使用默认数据
      setPreciousMetals([
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
      ]);
    } finally {
      // 更新贵金属同步时间
      const syncTime = dataService.getPreciousMetalSyncTime();
      setPreciousMetalSyncTime(syncTime);
      setIsLoading(false);
    }
  };

  // 从API获取完整的贵金属数据（包括银行金条、回收价格和品牌价格）
  const fetchCompletePreciousMetalData = async () => {
    try {
      setIsLoading(true);
      const completeData = await dataService.fetchCompletePreciousMetalDataFromAPI();
      setBankGoldBarPrices(completeData.bankGoldBarPrices);
      setGoldRecyclePrices(completeData.goldRecyclePrices);
      setBrandPrices(completeData.brandPrices);
    } catch (error) {
      console.error('Error fetching complete precious metal data:', error);
      // 出错时使用默认数据
      setBankGoldBarPrices(dataService.getBankGoldBarPrices());
      setGoldRecyclePrices(dataService.getGoldRecyclePrices());
      setBrandPrices(dataService.getBrandPreciousMetalPrices());
    } finally {
      // 更新贵金属同步时间
      const syncTime = dataService.getPreciousMetalSyncTime();
      setPreciousMetalSyncTime(syncTime);
      setIsLoading(false);
    }
  };

  // 从LocalStorage加载初始数据
  useEffect(() => {
    const loadInitialData = () => {
      try {
        // 初始化应用数据
        dataService.initializeData();
        
        // 加载用户数据
        const savedHoldings = dataService.getUserHoldings();
        if (savedHoldings && savedHoldings.length > 0) {
          setUserHoldings(savedHoldings);
        }
        
        const savedWallets = dataService.getWallets();
        if (savedWallets && savedWallets.length > 0) {
          setWallets(savedWallets);
        }
        
        // 加载市场数据
        const allFunds = dataService.getAllFunds();
        setFunds(allFunds);
        const indices = dataService.getMarketIndices();
        setMarketIndices(indices);
        
        // 获取贵金属数据（从API）
        fetchPreciousMetals();
        // 获取完整的贵金属数据（包括银行金条、回收价格和品牌价格）
        fetchCompletePreciousMetalData();
        
        // 获取基金持仓汇总数据
        const holdingsSummary = dataService.getFundHoldingsSummary();
        setFundHoldingsSummary(holdingsSummary);
        
        // 获取宏观经济数据
        const macroData = dataService.getMacroEconomicData();
        setMacroEconomicData(macroData);
        const cumulativeData = dataService.getMacroEconomicCumulative();
        setMacroEconomicCumulative(cumulativeData);
        
        // 获取贵金属历史数据
        const goldData = dataService.getPreciousMetalHistory('黄金', 30);
        setGoldHistory(goldData);
        const silverData = dataService.getPreciousMetalHistory('白银', 30);
        setSilverHistory(silverData);

        // 获取贵金属同步时间
        const initialSyncTime = dataService.getPreciousMetalSyncTime();
        setPreciousMetalSyncTime(initialSyncTime);
      } catch (error) {
        console.error('Error loading initial data:', error);
        // 即使出错也继续运行，确保页面不会崩溃
      }
    };

    loadInitialData();
  }, []);

  // 设置定时器，每隔1分钟获取一次贵金属数据
  useEffect(() => {
    // 初始加载
    fetchPreciousMetals();
    fetchCompletePreciousMetalData();
    
    // 设置定时器
    const intervalId = setInterval(() => {
      fetchPreciousMetals();
      fetchCompletePreciousMetalData();
    }, 60000); // 60秒 = 1分钟
    
    // 清理函数
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // 使用 useMemo 缓存过滤和排序后的基金数据
  const filteredAndSortedFunds = useMemo(() => {
    try {
      let result = [...funds];

      // 搜索过滤
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        result = result.filter(fund => 
          fund.name.toLowerCase().includes(query) || 
          fund.code.includes(query)
        );
      }

      // 基金类型过滤
      if (fundType) {
        result = result.filter(fund => fund.type === fundType);
      }

      // 风险等级过滤
      if (riskLevel) {
        result = result.filter(fund => fund.riskLevel === riskLevel);
      }

      // 排序
      return dataService.sortFunds(sortBy, sortOrder, result);
    } catch (error) {
      console.error('Error filtering or sorting funds:', error);
      // 出错时返回原始基金数据，确保页面不会崩溃
      return funds;
    }
  }, [funds, searchQuery, fundType, riskLevel, sortBy, sortOrder]);

  // 移除了更新filteredFunds状态的useEffect，直接使用filteredAndSortedFunds

  // 处理排序变更 - 使用 useCallback 缓存
  const handleSortChange = useCallback((newSortBy: 'valuation' | 'dailyChangeRate' | 'name') => {
    if (newSortBy === sortBy) {
      // 如果点击的是当前排序字段，则切换排序顺序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 否则，设置新的排序字段并使用默认排序顺序
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // 重置筛选 - 使用 useCallback 缓存
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setFundType('');
    setRiskLevel('');
  }, []);

  // 计算持仓数据
  const calculateHoldingData = useCallback((holding: {
    code: string;
    name: string;
    holdingAmount?: number;
    holdingProfit?: number;
    type: string;
    industryInfo?: string;
    walletId: string;
  }): UserHolding => {
    try {
      // 查找对应的基金信息以获取当前价格
      const fund = funds.find(f => f.code === holding.code);
      // 确保当前价格有效，找不到基金时使用0
      const currentPrice = fund?.valuation?.valuation || 0;
      
      // 确保持仓金额有效
      const holdingAmount = holding.holdingAmount && holding.holdingAmount > 0 ? holding.holdingAmount : 0;
      // 使用传入的盈亏值
      const holdingProfit = holding.holdingProfit || 0;
      
      // 计算成本和盈亏率
      const cost = holdingAmount - holdingProfit;
      // 确保成本为正数，避免除以零或负数
      const validCost = cost > 0 ? cost : 0;
      const profitRate = validCost > 0 ? (holdingProfit / validCost) * 100 : 0;
      
      return {
        code: holding.code,
        fundName: holding.name || '未知基金',
        holdingAmount,
        holdingProfit,
        currentPrice,
        profitRate,
        type: holding.type || '未知类型',
        industryInfo: holding.industryInfo,
        walletId: holding.walletId
      };
    } catch (error) {
      console.error('计算持仓数据失败:', error);
      // 返回默认值，确保函数不会抛出错误
      return {
        code: holding.code,
        fundName: holding.name || '未知基金',
        holdingAmount: holding.holdingAmount || 0,
        holdingProfit: holding.holdingProfit || 0,
        currentPrice: 0,
        profitRate: 0,
        type: holding.type || '未知类型',
        industryInfo: holding.industryInfo,
        walletId: holding.walletId
      };
    }
  }, [funds]);

  // 添加持仓
  const handleAddHolding = useCallback((holding: {
    code: string;
    name: string;
    holdingAmount: number;
    holdingProfit: number;
    type: string;
    industryInfo: string;
    walletId: string;
  }) => {
    try {
      // 验证输入数据
      if (!holding.code || !holding.code.trim()) {
        throw new Error('基金代码不能为空');
      }
      
      if (!holding.name || !holding.name.trim()) {
        throw new Error('基金名称不能为空');
      }
      
      if (typeof holding.holdingAmount !== 'number' || holding.holdingAmount <= 0) {
        throw new Error('持仓金额必须大于0');
      }
      
      if (!holding.walletId) {
        throw new Error('请选择钱包');
      }
      
      // 检查是否已存在相同代码和钱包的持仓
      const existingIndex = userHoldings.findIndex(h => h.code === holding.code && h.walletId === holding.walletId);
      
      if (existingIndex >= 0) {
        // 如果已存在，更新持仓
        const updatedHoldings = [...userHoldings];
        const existingHolding = updatedHoldings[existingIndex];
        
        // 计算新的持仓金额和总盈亏
        const newHoldingAmount = (existingHolding.holdingAmount || 0) + holding.holdingAmount;
        const newHoldingProfit = (existingHolding.holdingProfit || 0) + holding.holdingProfit;
        
        // 更新持仓数据
        updatedHoldings[existingIndex] = calculateHoldingData({
          code: holding.code,
          name: holding.name,
          holdingAmount: newHoldingAmount,
          holdingProfit: newHoldingProfit,
          type: holding.type,
          industryInfo: holding.industryInfo || existingHolding.industryInfo,
          walletId: holding.walletId
        });
        
        setUserHoldings(updatedHoldings);
      } else {
        // 如果不存在，添加新持仓
        const newHolding = calculateHoldingData(holding);
        setUserHoldings([...userHoldings, newHolding]);
      }
    } catch (error) {
      console.error('添加持仓失败:', error);
      // 可以在这里添加用户提示，比如使用toast
      alert((error as Error).message);
    }
  }, [userHoldings, calculateHoldingData]);

  // 批量添加持仓
  const handleBatchAddHolding = useCallback((holdings: {
    code: string;
    name: string;
    holdingAmount: number;
    holdingProfit: number;
    type: string;
    industryInfo: string;
    walletId: string;
  }[]) => {
    try {
      // 验证持仓数组
      if (!Array.isArray(holdings) || holdings.length === 0) {
        throw new Error('请选择要添加的持仓');
      }
      
      // 验证每个持仓数据
      for (const holding of holdings) {
        if (!holding.code || !holding.code.trim()) {
          throw new Error('基金代码不能为空');
        }
        
        if (!holding.name || !holding.name.trim()) {
          throw new Error('基金名称不能为空');
        }
        
        if (typeof holding.holdingAmount !== 'number' || holding.holdingAmount <= 0) {
          throw new Error('持仓金额必须大于0');
        }
        
        if (!holding.walletId) {
          throw new Error('请选择钱包');
        }
      }
      
      const updatedHoldings = [...userHoldings];
      
      for (const holding of holdings) {
        const existingIndex = updatedHoldings.findIndex(h => h.code === holding.code && h.walletId === holding.walletId);
        
        if (existingIndex >= 0) {
          // 如果已存在，更新持仓
          const existingHolding = updatedHoldings[existingIndex];

          // 计算新的持仓金额和总盈亏
          const newHoldingAmount = (existingHolding.holdingAmount || 0) + holding.holdingAmount;
          const newHoldingProfit = (existingHolding.holdingProfit || 0) + holding.holdingProfit;

          // 更新持仓数据，使用新的持仓金额和总盈亏
          updatedHoldings[existingIndex] = calculateHoldingData({
            code: holding.code,
            name: holding.name,
            holdingAmount: newHoldingAmount,
            holdingProfit: newHoldingProfit,
            type: holding.type,
            industryInfo: holding.industryInfo || existingHolding.industryInfo,
            walletId: holding.walletId
          });
        } else {
          // 如果不存在，添加新持仓
          const newHolding = calculateHoldingData(holding);
          updatedHoldings.push(newHolding);
        }
      }
      
      setUserHoldings(updatedHoldings);
    } catch (error) {
      console.error('批量添加持仓失败:', error);
      // 可以在这里添加用户提示，比如使用toast
      alert((error as Error).message);
    }
  }, [userHoldings, calculateHoldingData]);

  // 添加钱包
  const handleAddWallet = useCallback((name: string) => {
    try {
      // 验证钱包名称
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('钱包名称不能为空');
      }
      
      // 检查钱包名称是否已存在
      const isNameExists = wallets.some(wallet => wallet.name === trimmedName);
      if (isNameExists) {
        throw new Error('钱包名称已存在');
      }
      
      const newWallet: Wallet = {
        id: `wallet-${Date.now()}`,
        name: trimmedName,
        createdAt: new Date().toISOString()
      };
      setWallets([...wallets, newWallet]);
      setCurrentWalletId(newWallet.id);
    } catch (error) {
      console.error('添加钱包失败:', error);
      // 可以在这里添加用户提示，比如使用toast
      alert((error as Error).message);
    }
  }, [wallets]);

  // 删除钱包
  const handleDeleteWallet = useCallback((id: string) => {
    // 不能删除默认钱包和汇总钱包
    if (id === 'default' || id === 'summary') return;
    
    // 从钱包列表中删除
    const updatedWallets = wallets.filter(wallet => wallet.id !== id);
    setWallets(updatedWallets);
    
    // 如果删除的是当前钱包，切换到默认钱包
    if (id === currentWalletId) {
      setCurrentWalletId('default');
    }
    
    // 删除该钱包下的所有持仓
    setUserHoldings(userHoldings.filter(holding => holding.walletId !== id));
  }, [wallets, currentWalletId, userHoldings]);

  // 切换钱包
  const handleSwitchWallet = useCallback((id: string) => {
    try {
      if (!id) {
        throw new Error('钱包ID不能为空');
      }
      
      setCurrentWalletId(id);
    } catch (error) {
      console.error('切换钱包失败:', error);
      // 可以在这里添加用户提示，比如使用toast
      alert((error as Error).message);
    }
  }, []);

  // 删除持仓
  const handleDeleteHolding = useCallback((code: string) => {
    try {
      if (!code || !code.trim()) {
        throw new Error('基金代码不能为空');
      }
      
      setUserHoldings(userHoldings.filter(holding => !(holding.code === code && holding.walletId === currentWalletId)));
    } catch (error) {
      console.error('删除持仓失败:', error);
      // 可以在这里添加用户提示，比如使用toast
      alert((error as Error).message);
    }
  }, [userHoldings, currentWalletId]);

  // 批量删除持仓
  const handleBatchDeleteHolding = useCallback((codes: string[]) => {
    try {
      if (!Array.isArray(codes) || codes.length === 0) {
        throw new Error('请选择要删除的持仓');
      }
      
      setUserHoldings(userHoldings.filter(holding => !(codes.includes(holding.code) && holding.walletId === currentWalletId)));
    } catch (error) {
      console.error('批量删除持仓失败:', error);
      // 可以在这里添加用户提示，比如使用toast
      alert((error as Error).message);
    }
  }, [userHoldings, currentWalletId]);

  // 编辑持仓
  const handleEditHolding = useCallback((holding: {
    code: string;
    fundName: string;
    holdingAmount: number;
    holdingProfit: number;
    type: string;
    industryInfo: string;
    walletId: string;
  }) => {
    try {
      // 验证输入数据
      if (!holding.code || !holding.code.trim()) {
        throw new Error('基金代码不能为空');
      }
      
      if (!holding.fundName || !holding.fundName.trim()) {
        throw new Error('基金名称不能为空');
      }
      
      if (typeof holding.holdingAmount !== 'number' || holding.holdingAmount <= 0) {
        throw new Error('持仓金额必须大于0');
      }
      
      if (!holding.walletId) {
        throw new Error('请选择钱包');
      }
      
      setUserHoldings(userHoldings.map(h => {
        if (h.code === holding.code && h.walletId === holding.walletId) {
          // 计算成本和盈亏率
          const cost = holding.holdingAmount - holding.holdingProfit;
          const validCost = cost > 0 ? cost : 0;
          const profitRate = validCost > 0 ? (holding.holdingProfit / validCost) * 100 : 0;
          
          // 查找对应的基金信息以获取当前价格
          const fund = funds.find(f => f.code === holding.code);
          const currentPrice = fund?.valuation?.valuation || 0;
          
          // 更新持仓数据
          return {
            ...h,
            fundName: holding.fundName,
            holdingAmount: holding.holdingAmount,
            holdingProfit: holding.holdingProfit,
            profitRate,
            currentPrice,
            type: holding.type,
            industryInfo: holding.industryInfo
          };
        }
        return h;
      }));
    } catch (error) {
      console.error('编辑持仓失败:', error);
      // 可以在这里添加用户提示，比如使用toast
      alert((error as Error).message);
    }
  }, [userHoldings, funds]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              SmileX 基金估值
            </h1>
          </div>
          
          {/* 搜索框 */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="搜索基金名称或代码"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* 右侧按钮 */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <Link 
              href="/settings"
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Settings className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </Link>
          </div>
        </div>
        
        {/* 移动端搜索框 */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="搜索基金名称或代码"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Suspense fallback={<div className="flex justify-center items-center h-64">加载中...</div>}>
          {activeTab === 'fund' && (
            <FundTab 
              funds={funds}
              userHoldings={userHoldings}
              wallets={wallets}
              currentWalletId={currentWalletId}
              fundType={fundType}
              setFundType={setFundType}
              onAddHolding={handleAddHolding}
              onBatchAddHolding={handleBatchAddHolding}
              onDeleteHolding={handleDeleteHolding}
              onBatchDeleteHolding={handleBatchDeleteHolding}
              onAddWallet={handleAddWallet}
              onDeleteWallet={handleDeleteWallet}
              onSwitchWallet={handleSwitchWallet}
              onEditHolding={handleEditHolding}
              colorScheme={colorScheme}
            />
          )}
          {activeTab === 'metal' && (
            <MetalTab 
              preciousMetals={preciousMetals} 
              goldHistory={goldHistory} 
              silverHistory={silverHistory} 
              bankGoldBarPrices={bankGoldBarPrices}
              goldRecyclePrices={goldRecyclePrices}
              brandPrices={brandPrices}
              preciousMetalSyncTime={preciousMetalSyncTime}
              itemsPerRow={itemsPerRow}
              colorScheme={colorScheme}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'market' && (
            <MarketTab 
              marketIndices={marketIndices}
              macroEconomicData={macroEconomicData}
              macroEconomicCumulative={macroEconomicCumulative}
              itemsPerRow={marketItemsPerRow}
              colorScheme={colorScheme}
            />
          )}
        </Suspense>
      </main>

      {/* 底部导航 */}
      <footer className="sticky bottom-0 z-40 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="grid grid-cols-3 gap-1">
          <button 
            onClick={() => setActiveTab('fund')}
            className={`flex flex-col items-center py-3 px-2 ${activeTab === 'fund' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <BarChart2 className="h-5 w-5" />
            <span className="text-xs mt-1">基金</span>
          </button>
          <button 
            onClick={() => setActiveTab('metal')}
            className={`flex flex-col items-center py-3 px-2 ${activeTab === 'metal' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <DollarSign className="h-5 w-5" />
            <span className="text-xs mt-1">贵金属</span>
          </button>
          <button 
            onClick={() => setActiveTab('market')}
            className={`flex flex-col items-center py-3 px-2 ${activeTab === 'market' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs mt-1">市场</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
