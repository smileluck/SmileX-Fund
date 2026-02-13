import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import dataService from '@/lib/dataService';
import { FundRealTimeData } from '@/lib/dataService';

interface FundTrackerProps {
  colorScheme?: 'red-up' | 'red-down';
}

/**
 * 基金跟踪组件
 * 包含基金跟踪和实时数据刷新功能
 * 基金代码会保存到 LocalStorage，确保页面刷新后数据保持
 * 支持基于涨跌幅的排序功能
 * 使用 dataService 统一处理数据存储和读取
 */
export default function FundTracker({
  colorScheme = 'red-up'
}: FundTrackerProps) {
  // 基金跟踪相关状态
  const [trackedFunds, setTrackedFunds] = useState<FundRealTimeData[]>([]);
  const [fundCodeInput, setFundCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  // 排序相关状态
  const [sortField, setSortField] = useState<string | null>('changeRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // 从 dataService 加载跟踪基金数据
  useEffect(() => {
    const loadTrackedFunds = async () => {
      try {
        // 从 dataService 获取跟踪基金列表
        const trackedFundsList = dataService.getTrackedFunds();
        if (trackedFundsList.length > 0) {
          setTrackedFunds(trackedFundsList);
          setLastRefreshTime(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error('加载跟踪基金数据失败:', error);
      }
    };

    loadTrackedFunds();
  }, []);

  // 当跟踪基金列表变化时，保存到 dataService
  useEffect(() => {
    try {
      // 保存跟踪基金列表到 dataService
      dataService.saveTrackedFunds(trackedFunds);
    } catch (error) {
      console.error('保存跟踪基金数据失败:', error);
    }
  }, [trackedFunds]);

  // 根据 colorScheme 获取涨跌颜色类名
  const getChangeColorClass = (isUp: boolean) => {
    if (colorScheme === 'red-up') {
      return isUp ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
    } else {
      return isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    }
  };

  // 定时刷新逻辑
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    // 检查是否在交易时间内（上午10点到下午3点）
    const isInTradingHours = () => {
      const now = new Date();
      const hour = now.getHours();
      return hour >= 10 && hour < 15;
    };

    // 自动刷新函数
    const autoRefresh = async () => {
      if (trackedFunds.length > 0 && isInTradingHours()) {
        try {
          // 批量刷新所有跟踪基金的数据
          const fundCodes = trackedFunds.map(fund => fund.code);
          const updatedFunds = await dataService.fetchBatchFundRealTimeData(fundCodes);
          setTrackedFunds(updatedFunds);
          setLastRefreshTime(new Date().toLocaleTimeString());
        } catch (error) {
          console.error('自动刷新基金数据失败:', error);
        }
      }
    };

    // 检查是否需要启用自动刷新
    const checkAutoRefresh = () => {
      const enabled = trackedFunds.length > 0 && isInTradingHours();
      setAutoRefreshEnabled(enabled);

      if (enabled) {
        // 立即执行一次刷新
        autoRefresh();
        // 设置定时器，每5分钟刷新一次
        intervalId = setInterval(autoRefresh, 5 * 60 * 1000);
      } else {
        // 清除定时器
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    // 初始检查
    checkAutoRefresh();

    // 每分钟检查一次交易时间状态
    const checkIntervalId = setInterval(checkAutoRefresh, 60 * 1000);

    // 清理函数
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      clearInterval(checkIntervalId);
    };
  }, [trackedFunds]);

  // 手动刷新基金数据
  const handleManualRefresh = async () => {
    if (trackedFunds.length === 0) {
      alert('暂无跟踪基金');
      return;
    }
    
    setIsLoading(true);
    try {
      // 批量刷新所有跟踪基金的数据
      const fundCodes = trackedFunds.map(fund => fund.code);
      const updatedFunds = await dataService.fetchBatchFundRealTimeData(fundCodes);
      setTrackedFunds(updatedFunds);
      setLastRefreshTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('刷新基金数据失败:', error);
      alert('刷新基金数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 添加基金到跟踪列表
  const handleAddTrackedFund = async () => {
    if (!fundCodeInput.trim()) return;
    
    setIsLoading(true);
    try {
      // 处理逗号分隔的基金代码
      // 将中文逗号转换为英文逗号
      const normalizedInput = fundCodeInput.replace(/，/g, ',');
      
      let fundCodes = normalizedInput
        .split(',')
        .map(code => code.trim())
        .filter(code => code);
      
      // 过滤掉非6位数字的基金代码
      fundCodes = fundCodes.filter(code => /^\d{6}$/.test(code));
      
      if (fundCodes.length === 0) {
        alert('请输入有效的6位数字基金代码');
        return;
      }
      
      // 过滤掉已在跟踪列表中的基金代码
      const newFundCodes = fundCodes.filter(code => 
        !trackedFunds.some(fund => fund.code === code)
      );
      
      if (newFundCodes.length === 0) {
        alert('所有基金代码均已在跟踪列表中');
        return;
      }
      
      // 批量获取基金数据
      const newFunds = [];
      for (const code of newFundCodes) {
        try {
          const fundData = await dataService.fetchFundRealTimeData(code);
          newFunds.push(fundData);
        } catch (error) {
          console.error(`获取基金 ${code} 数据失败:`, error);
          // 继续处理其他基金，不中断整个流程
        }
      }
      
      if (newFunds.length > 0) {
        // 添加新基金到跟踪列表
        setTrackedFunds([...trackedFunds, ...newFunds]);
        setFundCodeInput('');
        setLastRefreshTime(new Date().toLocaleTimeString());
        
        if (newFunds.length < newFundCodes.length) {
          alert(`成功添加 ${newFunds.length} 个基金，部分基金数据获取失败`);
        } else {
          alert(`成功添加 ${newFunds.length} 个基金`);
        }
      } else {
        alert('无法获取任何基金数据，请检查基金代码是否正确');
      }
    } catch (error) {
      console.error('添加基金跟踪失败:', error);
      alert('添加基金跟踪失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 删除跟踪基金
  const handleRemoveTrackedFund = (index: number) => {
    setTrackedFunds(trackedFunds.filter((_, i) => i !== index));
  };

  // 处理排序
  const handleSort = (field: string) => {
    if (sortField === field) {
      // 如果点击的是当前排序字段，则切换排序方向
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 否则，设置新的排序字段和默认排序方向
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 根据排序状态对跟踪基金列表进行排序
  const sortedTrackedFunds = useMemo(() => {
    if (!sortField) return trackedFunds;
    
    return [...trackedFunds].sort((a, b) => {
      let aValue = a[sortField as keyof FundRealTimeData];
      let bValue = b[sortField as keyof FundRealTimeData];
      
      // 确保值是数字类型
      aValue = typeof aValue === 'number' ? aValue : 0;
      bValue = typeof bValue === 'number' ? bValue : 0;
      
      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [trackedFunds, sortField, sortDirection]);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">基金跟踪</h3>
        <div className="flex gap-2">
          <button
            onClick={handleManualRefresh}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center gap-1"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            {isLoading ? '刷新中...' : '手动刷新'}
          </button>
        </div>
      </div>
      
      {/* 基金代码输入 */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">基金代码</label>
            <input
                  type="text"
                  value={fundCodeInput}
                  onChange={(e) => setFundCodeInput(e.target.value)}
                  placeholder="请输入基金代码，多个代码用英文逗号分隔"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddTrackedFund}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              disabled={!fundCodeInput.trim() || isLoading}
            >
              添加跟踪
            </button>
          </div>
        </div>
        {lastRefreshTime && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            最后刷新时间: {lastRefreshTime}
            {autoRefreshEnabled && (
              <span className="ml-2 text-green-500 dark:text-green-400">
                (自动刷新中)
              </span>
            )}
          </p>
        )}
      </div>
      
      {/* 基金跟踪列表 */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
        {trackedFunds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                  <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">基金名称</th>
                  <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">基金代码</th>
                  <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">最新净值</th>
                  <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">估算净值</th>
                  <th 
                    className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white"
                    onClick={() => handleSort('changeRate')}
                  >
                    涨跌幅
                    {sortField === 'changeRate' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">更新时间</th>
                  <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedTrackedFunds.map((fund, index) => (
                  <tr key={index} className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <td className="py-3 px-4 text-sm text-zinc-900 dark:text-white">{fund.name}</td>
                    <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{fund.code}</td>
                    <td className="py-3 px-4 text-sm text-zinc-900 dark:text-white">{fund.netValue}</td>
                    <td className="py-3 px-4 text-sm text-zinc-900 dark:text-white">{fund.estimatedValue}</td>
                    <td className={`py-3 px-4 text-sm font-medium ${getChangeColorClass(fund.changeRate > 0)}`}>
                      {fund.changeRate > 0 ? '+' : ''}{fund.changeRate}%
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{fund.updateTime}</td>
                    <td className="py-3 px-4 text-sm">
                      <button
                        onClick={() => handleRemoveTrackedFund(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">暂无跟踪基金</p>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">在上方输入基金代码添加跟踪</p>
          </div>
        )}
      </div>
    </div>
  );
}
