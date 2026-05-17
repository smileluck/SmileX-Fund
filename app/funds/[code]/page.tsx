'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, BarChart2, User, Calendar, Shield, PieChart, Maximize2, Minimize2 } from 'lucide-react';
import { FundInfo, FundHistory, formatCurrency, formatPercentage } from '@/lib/dataService';
import dataService from '@/lib/dataService';

const TIME_RANGE_LABELS: Record<string, string> = {
  '1d': '近1日',
  '1w': '近7天',
  '1m': '近1月',
  '3m': '近3月',
  '1y': '近1年',
};

type TimeRange = '1d' | '1w' | '1m' | '3m' | '1y';

export default function FundDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const fundCode = params.code;

  const [fund, setFund] = useState<FundInfo | null>(null);
  const [historyData, setHistoryData] = useState<FundHistory[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const getDaysForRange = useCallback((range: string): number => {
    switch (range) {
      case '1d': return 1;
      case '1w': return 7;
      case '1m': return 30;
      case '3m': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }, []);

  const fetchHistoryData = useCallback(async (code: string, days: number, signal?: AbortSignal): Promise<FundHistory[]> => {
    const response = await fetch(`/api/fund/history?code=${code}&days=${days}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      code,
      date: item.date,
      value: item.value,
    }));
  }, []);

  // 获取基金基本信息
  useEffect(() => {
    const fetchFundInfo = async () => {
      if (!fundCode) {
        setError('基金代码不能为空');
        setLoading(false);
        return;
      }

      try {
        const fundData = await dataService.getFundByCode(fundCode);
        if (!fundData) {
          setError('未找到该基金信息');
          setLoading(false);
          return;
        }
        setFund(fundData);
        setLoading(false);
      } catch (err) {
        setError('获取基金数据失败');
        setLoading(false);
        console.error('Error fetching fund data:', err);
      }
    };

    fetchFundInfo();
  }, [fundCode]);

  // 获取历史数据（根据 timeRange 变化）
  useEffect(() => {
    if (!fundCode || loading) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const fetchHistory = async () => {
      const days = getDaysForRange(timeRange);
      try {
        setHistoryLoading(true);
        const history = await fetchHistoryData(fundCode, days, controller.signal);
        setHistoryData(history);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching fund history:', err);
        setHistoryData([]);
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      controller.abort();
    };
  }, [fundCode, timeRange, loading, getDaysForRange, fetchHistoryData]);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setTimeRange(range);
  }, []);

  const handleBackClick = () => {
    router.back();
  };

  // 计算涨跌幅
  const calculateChangeRate = (data: FundHistory[]): number => {
    if (data.length < 2) return 0;
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    return ((lastValue - firstValue) / firstValue) * 100;
  };

  const changeRate = calculateChangeRate(historyData);
  const isUp = changeRate > 0;

  const formatDateTick = (dateStr: string) => {
    if (historyData.length > 31) {
      const parts = dateStr.split('-');
      return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
    }
    return dateStr;
  };

  // 加载中状态
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
        <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <button
              onClick={handleBackClick}
              className="mr-4 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">基金详情</h1>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-500 dark:text-zinc-400">加载中...</p>
          </div>
        </main>
      </div>
    );
  }

  // 错误状态
  if (error || !fund) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
        <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <button
              onClick={handleBackClick}
              className="mr-4 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">基金详情</h1>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">{error || '未找到基金信息'}</p>
            <button
              onClick={handleBackClick}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              返回首页
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <button
            onClick={handleBackClick}
            className="mr-4 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{fund.name}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{fund.code} | {fund.type}</p>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* 基金估值信息 */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {formatCurrency(fund.valuation.valuation)}
                </span>
                <span className={`text-lg font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatPercentage(changeRate)}
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                最新净值: {formatCurrency(fund.valuation.netValue)} | 更新时间: {fund.valuation.updateTime}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 md:mt-0 md:grid-cols-3 md:gap-6">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">日涨跌</p>
                <p className={`text-sm font-medium ${fund.valuation.dailyChangeRate > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatPercentage(fund.valuation.dailyChangeRate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">周涨跌</p>
                <p className={`text-sm font-medium ${fund.valuation.weeklyChangeRate > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatPercentage(fund.valuation.weeklyChangeRate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">月涨跌</p>
                <p className={`text-sm font-medium ${fund.valuation.monthlyChangeRate > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatPercentage(fund.valuation.monthlyChangeRate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 历史走势图 */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              历史走势
            </h2>
            <div className="flex gap-2 items-center">
              <div className="flex gap-1">
                {(['1d', '1w', '1m', '3m', '1y'] as const).map((range) => (
                  <div
                    key={range}
                    onTouchEnd={() => handleTimeRangeChange(range)}
                    onClick={() => handleTimeRangeChange(range)}
                    className={`px-3 py-1 text-xs rounded-full cursor-pointer ${timeRange === range
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {TIME_RANGE_LABELS[range]}
                  </div>
                ))}
              </div>
              <div
                onTouchEnd={() => setIsFullscreen(true)}
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="全屏查看"
                style={{ touchAction: 'manipulation' }}
              >
                <Maximize2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
          </div>
          <div className="h-80">
            {historyLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-zinc-500 dark:text-zinc-400">加载历史数据...</p>
              </div>
            ) : historyData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-zinc-500 dark:text-zinc-400">暂无历史数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatDateTick}
                    interval={Math.ceil(historyData.length / 10)}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 0.05', 'dataMax + 0.05']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number | undefined) => [formatCurrency(value ?? 0), '单位净值']}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="单位净值"
                    stroke={isUp ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 基金基本信息 */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            基本信息
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">成立日期</p>
                <p className="text-sm text-zinc-900 dark:text-white">{fund.establishedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">基金经理</p>
                <p className="text-sm text-zinc-900 dark:text-white">{fund.manager}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">风险等级</p>
                <p className="text-sm text-zinc-900 dark:text-white">{fund.riskLevel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 基金持仓 */}
        {fund.holdings && fund.holdings.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              基金持仓
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-2 px-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      股票名称
                    </th>
                    <th className="py-2 px-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      股票代码
                    </th>
                    <th className="py-2 px-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      所属行业
                    </th>
                    <th className="py-2 px-4 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      持仓比例
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {fund.holdings.map((holding, index) => (
                    <tr key={index}>
                      <td className="py-2 px-4 text-sm text-zinc-900 dark:text-white">
                        {holding.stockName}
                      </td>
                      <td className="py-2 px-4 text-sm text-zinc-500 dark:text-zinc-400">
                        {holding.stockCode}
                      </td>
                      <td className="py-2 px-4 text-sm text-zinc-500 dark:text-zinc-400">
                        {holding.industry}
                      </td>
                      <td className="py-2 px-4 text-sm text-right text-zinc-900 dark:text-white">
                        {(holding.proportion * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 全屏图表模态框 */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col items-center justify-center p-6">
          <div className="relative w-full max-w-7xl max-h-[95vh] flex flex-col">
            {/* 顶部控制栏 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">{fund?.name} - 历史走势 (全屏)</h2>
              </div>

              {/* 时间范围选择器 */}
              <div className="flex gap-1">
                {(['1d', '1w', '1m', '3m', '1y'] as const).map((range) => (
                  <div
                    key={range}
                    onTouchEnd={() => handleTimeRangeChange(range)}
                    onClick={() => handleTimeRangeChange(range)}
                    className={`px-3 py-1 text-xs rounded-full cursor-pointer ${timeRange === range
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {TIME_RANGE_LABELS[range]}
                  </div>
                ))}
              </div>

              {/* 关闭按钮 */}
              <div
                onTouchEnd={() => setIsFullscreen(false)}
                onClick={() => setIsFullscreen(false)}
                className="ml-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="退出全屏"
                style={{ touchAction: 'manipulation' }}
              >
                <Minimize2 className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>

            {/* 全屏图表 */}
            <div className="flex-1 min-h-[60vh]">
              {historyLoading ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-zinc-500 dark:text-zinc-400">加载历史数据...</p>
                </div>
              ) : historyData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-zinc-500 dark:text-zinc-400">暂无历史数据</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={formatDateTick}
                      interval={Math.ceil(historyData.length / 10)}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      domain={['dataMin - 0.05', 'dataMax + 0.05']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: '#1f2937'
                      }}
                      formatter={(value: number | undefined) => [formatCurrency(value ?? 0), '单位净值']}
                      labelFormatter={(label) => `日期: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="单位净值"
                      stroke={isUp ? '#10b981' : '#ef4444'}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 8, fill: isUp ? '#10b981' : '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
