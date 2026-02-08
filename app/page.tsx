'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, Bell, Settings, ChevronDown, TrendingUp, BarChart2, Bookmark, Home, DollarSign, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fundMockService, FundInfo, MarketIndex, MacroEconomicData, MacroEconomicCumulative, formatCurrency, formatPercentage } from '@/lib/mockData';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home');
  const [funds, setFunds] = useState<FundInfo[]>([]);
  const [filteredFunds, setFilteredFunds] = useState<FundInfo[]>([]);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [macroEconomicData, setMacroEconomicData] = useState<MacroEconomicData[]>([]);
  const [macroEconomicCumulative, setMacroEconomicCumulative] = useState<MacroEconomicCumulative[]>([]);
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
        
        // 获取宏观经济数据
        const macroData = fundMockService.getMacroEconomicData();
        setMacroEconomicData(macroData);
        const cumulativeData = fundMockService.getMacroEconomicCumulative();
        setMacroEconomicCumulative(cumulativeData);
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
        {/* 市场概览 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">市场概览</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marketIndices.map((index, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{index.name}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-semibold text-zinc-900 dark:text-white">{index.value}</span>
                  <span className={`text-sm font-medium ${index.isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {index.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 宏观经济板块 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            宏观经济
          </h2>
          
          {/* M1站跌幅折线图 */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 mb-4">
            <h3 className="text-md font-medium text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <LineChartIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              M1货币供应量同比增长率
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macroEconomicData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    interval={Math.ceil(macroEconomicData.length / 12)}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number | undefined) => [`${value?.toFixed(2) || '0.00'}%`, '同比增长率']}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="m1ChangeRate" 
                    name="M1同比增长率" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* 累计涨跌幅总线图 */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 mb-4">
            <h3 className="text-md font-medium text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              M1货币供应量累计涨跌幅
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macroEconomicCumulative}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    interval={Math.ceil(macroEconomicCumulative.length / 12)}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number | undefined) => [`${value?.toFixed(2) || '0.00'}%`, '累计涨跌幅']}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeChange" 
                    name="累计涨跌幅" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* GDP数据图表 */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 mb-4">
            <h3 className="text-md font-medium text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              GDP数据
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macroEconomicData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    interval={Math.ceil(macroEconomicData.length / 12)}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number | undefined, name: string | undefined) => {
                      if (name === 'GDP总量') {
                        return [`${value?.toFixed(2) || '0.00'} 万亿`, name];
                      } else {
                        return [`${value?.toFixed(2) || '0.00'}%`, name];
                      }
                    }}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="gdp" 
                    name="GDP总量" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="gdpChangeRate" 
                    name="GDP同比增长率" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* 巴菲特指标图表 */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
            <h3 className="text-md font-medium text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              巴菲特指标（股市总市值/GDP）
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macroEconomicData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    interval={Math.ceil(macroEconomicData.length / 12)}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    domain={[0.5, 1.7]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number | undefined) => [`${value?.toFixed(2) || '0.00'}`, '巴菲特指标']}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="buffettIndicator" 
                    name="巴菲特指标" 
                    stroke="#8b5cf6" 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 基金列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">基金估值</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">排序:</span>
              <select 
                className="text-sm border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as 'valuation' | 'dailyChangeRate' | 'name')}
              >
                <option value="dailyChangeRate">涨跌幅</option>
                <option value="valuation">估值</option>
                <option value="name">名称</option>
              </select>
            </div>
          </div>

          {/* 筛选功能 */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 mr-2">基金类型:</span>
              <select 
                className="text-sm border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={fundType}
                onChange={(e) => setFundType(e.target.value)}
              >
                <option value="">全部</option>
                <option value="股票型">股票型</option>
                <option value="混合型">混合型</option>
                <option value="债券型">债券型</option>
                <option value="指数型">指数型</option>
              </select>
            </div>
            <div>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 mr-2">风险等级:</span>
              <select 
                className="text-sm border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
              >
                <option value="">全部</option>
                <option value="低风险">低风险</option>
                <option value="中风险">中风险</option>
                <option value="中高风险">中高风险</option>
                <option value="高风险">高风险</option>
              </select>
            </div>
            {((searchQuery || fundType || riskLevel) && (
              <button 
                onClick={handleResetFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 ml-auto"
              >
                重置筛选
              </button>
            ))}
          </div>

          {/* 基金列表头部 */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-t-lg font-medium text-sm text-zinc-600 dark:text-zinc-400">
            <div className="col-span-4">基金名称</div>
            <div 
              className="col-span-2 text-right cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => handleSortChange('valuation')}
            >
              估值 {sortBy === 'valuation' && (sortOrder === 'asc' ? '↑' : '↓')}
            </div>
            <div className="col-span-2 text-right">日涨跌</div>
            <div 
              className="col-span-2 text-right cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => handleSortChange('dailyChangeRate')}
            >
              涨跌幅 {sortBy === 'dailyChangeRate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </div>
            <div className="col-span-2 text-right">操作</div>
          </div>

          {/* 基金列表内容 */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
            {filteredFunds.length > 0 ? (
              filteredFunds.map((fund, i) => {
                const isUp = fund.valuation.dailyChangeRate > 0;
                return (
                  <div key={i} className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0">
                    {/* 移动端显示 */}
                    <div className="md:hidden p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-zinc-900 dark:text-white">{fund.name}</h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{fund.code} | {fund.type}</p>
                        </div>
                        <button className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-zinc-500 dark:text-zinc-400">估值</p>
                          <p className="font-medium text-zinc-900 dark:text-white">{formatCurrency(fund.valuation.valuation)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 dark:text-zinc-400">日涨跌</p>
                          <p className={`font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {fund.valuation.dailyChange > 0 ? '+' : ''}{formatCurrency(fund.valuation.dailyChange)}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-500 dark:text-zinc-400">涨跌幅</p>
                          <p className={`font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatPercentage(fund.valuation.dailyChangeRate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-500 dark:text-zinc-400">净值</p>
                          <p className="font-medium text-zinc-900 dark:text-white">{formatCurrency(fund.valuation.netValue)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 桌面端显示 */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 items-center">
                      <div className="col-span-4">
                        <h3 className="font-medium text-zinc-900 dark:text-white">{fund.name}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{fund.code} | {fund.type}</p>
                      </div>
                      <div className="col-span-2 text-right">
                        <p className="font-medium text-zinc-900 dark:text-white">{formatCurrency(fund.valuation.valuation)}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatCurrency(fund.valuation.netValue)}</p>
                      </div>
                      <div className="col-span-2 text-right">
                        <p className={`font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {fund.valuation.dailyChange > 0 ? '+' : ''}{formatCurrency(fund.valuation.dailyChange)}
                        </p>
                      </div>
                      <div className="col-span-2 text-right">
                        <p className={`font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatPercentage(fund.valuation.dailyChangeRate)}
                        </p>
                      </div>
                      <div className="col-span-2 text-right">
                        <Link 
                          href={`/funds/${fund.code}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mr-3"
                        >
                          详情
                        </Link>
                        <button className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          <Bookmark className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <p className="text-zinc-500 dark:text-zinc-400">未找到符合条件的基金</p>
              </div>
            )}
          </div>

          {/* 加载更多 */}
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto">
              加载更多 <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      {/* 底部导航 */}
      <footer className="sticky bottom-0 z-40 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="grid grid-cols-4 gap-1">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center py-3 px-2 ${activeTab === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">首页</span>
          </button>
          <button 
            onClick={() => setActiveTab('discover')}
            className={`flex flex-col items-center py-3 px-2 ${activeTab === 'discover' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs mt-1">发现</span>
          </button>
          <button 
            onClick={() => setActiveTab('portfolio')}
            className={`flex flex-col items-center py-3 px-2 ${activeTab === 'portfolio' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <BarChart2 className="h-5 w-5" />
            <span className="text-xs mt-1">组合</span>
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center py-3 px-2 ${activeTab === 'favorites' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <Bookmark className="h-5 w-5" />
            <span className="text-xs mt-1">收藏</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
