import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trash2, RefreshCw, Download, Upload, ChevronDown } from 'lucide-react';
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
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);
  // 排序相关状态
  const [sortField, setSortField] = useState<string | null>('changeRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  // 跳过首次挂载，避免用初始空值覆盖 Supabase 数据
  const hasLoadedRef = useRef(false);
  const refreshMenuRef = useRef<HTMLDivElement>(null);

  // 点击菜单外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (refreshMenuRef.current && !refreshMenuRef.current.contains(e.target as Node)) {
        setShowRefreshMenu(false);
      }
    };
    if (showRefreshMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRefreshMenu]);

  // 用于跟踪最新的 trackedFunds 状态，避免 useEffect 频繁执行
  const trackedFundsRef = React.useRef<FundRealTimeData[]>(trackedFunds);
  
  // 当 trackedFunds 状态更新时，同步更新 ref
  useEffect(() => {
    trackedFundsRef.current = trackedFunds;
  }, [trackedFunds]);

  // 从 dataService 加载跟踪基金数据和刷新间隔设置
  useEffect(() => {
    const loadTrackedFunds = async () => {
      try {
        const [trackedFundsList, settings] = await Promise.all([
          dataService.getTrackedFunds(),
          dataService.getSettings(),
        ]);
        if (trackedFundsList.length > 0) {
          setTrackedFunds(trackedFundsList);
          setLastRefreshTime(new Date().toLocaleTimeString());
        }
        if (settings.refreshInterval) {
          setRefreshInterval(Number(settings.refreshInterval));
        }
      } catch (error) {
        console.error('加载跟踪基金数据失败:', error);
      } finally {
        hasLoadedRef.current = true;
      }
    };

    loadTrackedFunds();
  }, []);

  // 当跟踪基金列表变化时，保存到 dataService
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    try {
      dataService.debouncedSaveTrackedFunds(trackedFunds);
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
    let refreshIntervalId: NodeJS.Timeout | null = null;
    let checkIntervalId: NodeJS.Timeout | null = null;

    // 检查是否在交易时间内（上午10点到下午3点）
    const isInTradingHours = () => {
      const now = new Date();
      const hour = now.getHours();
      return hour >= 10 && hour < 15;
    };

    // 自动刷新函数
    const autoRefresh = async () => {
      // 使用 ref 获取最新的 trackedFunds 状态
      const currentTrackedFunds = trackedFundsRef.current;
      if (currentTrackedFunds.length === 0 || !isInTradingHours()) {
        return;
      }

      try {
        // 批量刷新所有跟踪基金的数据
        const fundCodes = currentTrackedFunds.map(fund => fund.code);
        const updatedFunds = await dataService.fetchBatchFundRealTimeData(fundCodes);
        
        // 过滤掉请求失败的基金数据（name 为 '未知基金' 的数据）
        const successfulFunds = updatedFunds.filter(fund => fund.name !== '未知基金');
        
        // 只有当获取到有效数据时才更新状态
        if (successfulFunds.length > 0) {
          console.log('自动刷新基金数据成功:', successfulFunds);
          // 将请求成功的基金数据更新到现有数据中
          const mergedFunds = currentTrackedFunds.map(existingFund => {
            const updatedFund = successfulFunds.find(fund => fund.code === existingFund.code);
            return updatedFund || existingFund;
          });
          
          setTrackedFunds(mergedFunds);
          setLastRefreshTime(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error('自动刷新基金数据失败:', error);
      }
    };

    // 检查是否需要启用自动刷新
    const checkAutoRefresh = () => {
      // 使用 ref 获取最新的 trackedFunds 状态
      const currentTrackedFunds = trackedFundsRef.current;
      const enabled = currentTrackedFunds.length > 0 && isInTradingHours();
      setAutoRefreshEnabled(enabled);

      if (enabled && !refreshIntervalId) {
        // 设置定时器，按用户配置的间隔刷新
        refreshIntervalId = setInterval(autoRefresh, refreshInterval * 60 * 1000);
      } else if (!enabled && refreshIntervalId) {
        // 清除定时器
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
      }
    };

    // 初始检查
    checkAutoRefresh();

    // 每分钟检查一次交易时间状态
    checkIntervalId = setInterval(checkAutoRefresh, 60 * 1000);

    // 清理函数
    return () => {
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
      }
      if (checkIntervalId) {
        clearInterval(checkIntervalId);
        checkIntervalId = null;
      }
    };
  }, [refreshInterval]);
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
      
      // 过滤掉请求失败的基金数据（name 为 '未知基金' 的数据）
      const successfulFunds = updatedFunds.filter(fund => fund.name !== '未知基金');
      
      // 只有当获取到有效数据时才更新状态
      if (successfulFunds.length > 0) {
        console.log('手动刷新基金数据成功:', successfulFunds);
        // 将请求成功的基金数据更新到现有数据中
        const mergedFunds = trackedFunds.map(existingFund => {
          const updatedFund = successfulFunds.find(fund => fund.code === existingFund.code);
          return updatedFund || existingFund;
        });
        
        setTrackedFunds(mergedFunds);
        setLastRefreshTime(new Date().toLocaleTimeString());
      } else {
        alert('刷新基金数据失败，请稍后重试');
      }
    } catch (error) {
      console.error('刷新基金数据失败:', error);
      alert('刷新基金数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 单独刷新单个基金数据
  const handleRefreshSingleFund = async (code: string) => {
    try {
      // 刷新单个基金的数据
      const updatedFund = await dataService.fetchFundRealTimeData(code);
      // 只有当获取到有效数据时才更新状态
      if (updatedFund && updatedFund.name !== '未知基金') {
        // 根据基金代码更新数据，确保更新正确的基金
        const updatedFunds = trackedFunds.map(fund => 
          fund.code === code ? updatedFund : fund
        );
        setTrackedFunds(updatedFunds);
        setLastRefreshTime(new Date().toLocaleTimeString());
      } else {
        alert(`刷新基金 ${code} 数据失败，请稍后重试`);
      }
    } catch (error) {
      console.error(`刷新基金 ${code} 数据失败:`, error);
      alert(`刷新基金 ${code} 数据失败，请稍后重试`);
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
  const handleRemoveTrackedFund = (code: string) => {
    setTrackedFunds(trackedFunds.filter(fund => fund.code !== code));
  };

  // 修改自动刷新间隔并持久化
  const handleChangeRefreshInterval = async (minutes: number) => {
    setRefreshInterval(minutes);
    try {
      const settings = await dataService.getSettings();
      await dataService.saveSettings({ ...settings, refreshInterval: minutes });
    } catch (error) {
      console.error('保存刷新间隔设置失败:', error);
    }
  };

  // 导出基金列表为CSV格式
  const handleExportCSV = () => {
    if (trackedFunds.length === 0) {
      alert('暂无跟踪基金可导出');
      return;
    }

    // 生成CSV内容
    const header = '基金代码,基金名称\n';
    const rows = trackedFunds.map(fund => `${fund.code},${fund.name}`).join('\n');
    const csvContent = header + rows;

    // 创建Blob对象并下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `funds_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 显示成功提示
    alert('基金列表已成功导出为CSV文件');
  };

  // 导出基金列表为TXT格式
  const handleExportTXT = () => {
    if (trackedFunds.length === 0) {
      alert('暂无跟踪基金可导出');
      return;
    }

    // 生成TXT内容
    const content = trackedFunds.map(fund => `${fund.code} ${fund.name}`).join('\n');

    // 创建Blob对象并下载
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `funds_${new Date().toISOString().slice(0, 10)}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 显示成功提示
    alert('基金列表已成功导出为TXT文件');
  };

  // 导入TXT文件（支持导出的TXT格式：每行 "代码 名称" 或纯代码，也支持CSV格式）
  const handleImportTXT = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        // 从每行中提取6位数字基金代码（兼容TXT "代码 名称" 和 CSV "代码,名称" 格式）
        const codes = text
          .split(/[\r\n]+/)
          .map(line => {
            const match = line.trim().match(/^(\d{6})[\s,]/) || line.trim().match(/^(\d{6})$/);
            return match ? match[1] : '';
          })
          .filter(code => code);

        if (codes.length === 0) {
          alert('未在文件中找到有效的6位基金代码');
          return;
        }

        // 去重
        const uniqueCodes = [...new Set(codes)];

        const newCodes = uniqueCodes.filter(code =>
          !trackedFunds.some(fund => fund.code === code)
        );

        if (newCodes.length === 0) {
          alert('文件中的基金均已在跟踪列表中');
          return;
        }

        setIsLoading(true);
        // 批量获取基金数据
        const fetchedFunds = await dataService.fetchBatchFundRealTimeData(newCodes);
        const newFunds = fetchedFunds.filter(fund => fund.name !== '未知基金');

        if (newFunds.length > 0) {
          setTrackedFunds(prev => [...prev, ...newFunds]);
          setLastRefreshTime(new Date().toLocaleTimeString());
          const skipped = newCodes.length - newFunds.length;
          alert(`成功导入 ${newFunds.length} 个基金${skipped > 0 ? `，${skipped} 个获取失败` : ''}`);
        } else {
          alert('无法获取任何基金数据，请检查文件内容');
        }
      } catch (error) {
        console.error('导入文件失败:', error);
        alert('导入文件失败，请确保文件格式正确');
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
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
        <div className="flex gap-2 relative" ref={refreshMenuRef}>
          <button
            onClick={() => setShowRefreshMenu(!showRefreshMenu)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
            <ChevronDown className="h-3 w-3" />
          </button>
          {showRefreshMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 min-w-[180px] py-1">
              <button
                onClick={() => { setShowRefreshMenu(false); handleManualRefresh(); }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white flex items-center gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? '刷新中...' : '手动刷新'}
              </button>
              <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
              <div className="px-4 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">自动刷新间隔</div>
              {[1, 3, 5, 10].map((min) => (
                <button
                  key={min}
                  onClick={() => { setShowRefreshMenu(false); handleChangeRefreshInterval(min); }}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between ${
                    refreshInterval === min ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-zinc-900 dark:text-white'
                  }`}
                >
                  <span>每 {min} 分钟</span>
                  {refreshInterval === min && <span className="text-blue-600 dark:text-blue-400">✓</span>}
                </button>
              ))}
            </div>
          )}
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
                (自动刷新中 / 每{refreshInterval}分钟)
              </span>
            )}
          </p>
        )}
      </div>

      {/* 工具箱模块 */}
      <div className="mt-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
        <h4 className="text-md font-semibold text-zinc-900 dark:text-white mb-3">工具箱</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center gap-2"
            disabled={trackedFunds.length === 0}
          >
            <Download className="h-4 w-4" />
            导出CSV
          </button>
          <button
            onClick={handleExportTXT}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2"
            disabled={trackedFunds.length === 0}
          >
            <Download className="h-4 w-4" />
            导出TXT
          </button>
          <button
            onClick={handleImportTXT}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md flex items-center gap-2"
            disabled={isLoading}
          >
            <Upload className="h-4 w-4" />
            导入文件
          </button>
        </div>
      </div>

      {/* 基金跟踪列表 */}
      <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRefreshSingleFund(fund.code)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          title="刷新"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveTrackedFund(fund.code)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
