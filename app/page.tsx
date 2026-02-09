'use client';

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import { Search, Bell, Settings, ChevronDown, TrendingUp, BarChart2, Bookmark, Home, DollarSign, LineChart as LineChartIcon } from 'lucide-react';
import { fundMockService, FundInfo, MarketIndex, MacroEconomicData, MacroEconomicCumulative, formatCurrency, formatPercentage } from '@/lib/mockData';

// 懒加载组件
const FundTab = lazy(() => import('./components/FundTab'));
const MetalTab = lazy(() => import('./components/MetalTab'));
const MarketTab = lazy(() => import('./components/MarketTab'));

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('fund');
  const [funds, setFunds] = useState<FundInfo[]>([]);
  const [filteredFunds, setFilteredFunds] = useState<FundInfo[]>([]);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [preciousMetals, setPreciousMetals] = useState<any[]>([]);
  const [fundHoldingsSummary, setFundHoldingsSummary] = useState<any[]>([]);
  const [macroEconomicData, setMacroEconomicData] = useState<MacroEconomicData[]>([]);
  const [macroEconomicCumulative, setMacroEconomicCumulative] = useState<MacroEconomicCumulative[]>([]);
  const [goldHistory, setGoldHistory] = useState<any[]>([]);
  const [silverHistory, setSilverHistory] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'valuation' | 'dailyChangeRate' | 'name'>('dailyChangeRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [fundType, setFundType] = useState('');
  const [riskLevel, setRiskLevel] = useState('');

  // 初始化数据并启动实时更新
  useEffect(() => {
    // 获取初始数据
    const updateData = () => {
      try {
        const allFunds = fundMockService.getAllFunds();
        setFunds(allFunds);
        const indices = fundMockService.getMarketIndices();
        setMarketIndices(indices);
        
        // 获取贵金属数据
        const metals = fundMockService.getPreciousMetals();
        setPreciousMetals(metals);
        
        // 获取基金持仓汇总数据
        const holdingsSummary = fundMockService.getFundHoldingsSummary();
        setFundHoldingsSummary(holdingsSummary);
        
        // 获取宏观经济数据
        const macroData = fundMockService.getMacroEconomicData();
        setMacroEconomicData(macroData);
        const cumulativeData = fundMockService.getMacroEconomicCumulative();
        setMacroEconomicCumulative(cumulativeData);
        
        // 获取贵金属历史数据
        const goldData = fundMockService.getPreciousMetalHistory('黄金', 30);
        setGoldHistory(goldData);
        const silverData = fundMockService.getPreciousMetalHistory('白银', 30);
        setSilverHistory(silverData);
      } catch (error) {
        console.error('Error updating data:', error);
        // 即使出错也继续运行，确保页面不会崩溃
      }
    };

    // 初始更新
    updateData();

    // 添加数据更新监听器
    fundMockService.addListener(updateData);

    // 启动实时数据更新（每5秒）
    fundMockService.startUpdates(5000);

    // 清理函数
    return () => {
      fundMockService.removeListener(updateData);
      fundMockService.stopUpdates();
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
      return fundMockService.sortFunds(sortBy, sortOrder, result);
    } catch (error) {
      console.error('Error filtering or sorting funds:', error);
      // 出错时返回原始基金数据，确保页面不会崩溃
      return funds;
    }
  }, [funds, searchQuery, fundType, riskLevel, sortBy, sortOrder]);

  // 当过滤和排序结果变化时更新状态
  useEffect(() => {
    setFilteredFunds(filteredAndSortedFunds);
  }, [filteredAndSortedFunds]);

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
            <button className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Settings className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </button>
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
              marketIndices={marketIndices}
              fundHoldingsSummary={fundHoldingsSummary}
              funds={funds}
              filteredFunds={filteredFunds}
              sortBy={sortBy}
              sortOrder={sortOrder}
              searchQuery={searchQuery}
              fundType={fundType}
              riskLevel={riskLevel}
              handleSortChange={handleSortChange}
              handleResetFilters={handleResetFilters}
              setSearchQuery={setSearchQuery}
              setFundType={setFundType}
              setRiskLevel={setRiskLevel}
            />
          )}
          {activeTab === 'metal' && (
            <MetalTab 
              preciousMetals={preciousMetals} 
              goldHistory={goldHistory} 
              silverHistory={silverHistory} 
            />
          )}
          {activeTab === 'market' && (
            <MarketTab 
              macroEconomicData={macroEconomicData}
              macroEconomicCumulative={macroEconomicCumulative}
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
