import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, LineChart as LineChartIcon, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';
import { MacroEconomicData, MacroEconomicCumulative } from '@/lib/mockData';

interface MarketTabProps {
  macroEconomicData: MacroEconomicData[];
  macroEconomicCumulative: MacroEconomicCumulative[];
  itemsPerRow?: number;
  colorScheme?: 'red-up' | 'red-down';
}

/**
 * 市场Tab组件
 * 包含宏观经济部分
 */
export default function MarketTab({ macroEconomicData, macroEconomicCumulative, itemsPerRow = 2, colorScheme = 'red-up' }: MarketTabProps) {
  // 全屏状态管理
  const [fullscreenState, setFullscreenState] = useState<{
    isFullscreen: boolean;
    chartType: 'm1' | 'cumulative' | 'gdp' | 'buffett' | null;
  }>({ isFullscreen: false, chartType: null });

  // 根据 itemsPerRow 计算网格布局类名
  const getGridClass = () => {
    // 确保 itemsPerRow 在 1-4 之间
    const validItemsPerRow = Math.max(1, Math.min(4, itemsPerRow));
    
    // 移动端始终为 1 列，桌面端根据设置调整
    switch (validItemsPerRow) {
      case 1:
        return "grid-cols-1 md:grid-cols-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-3";
      case 4:
        return "grid-cols-1 md:grid-cols-4";
      default:
        return "grid-cols-1 md:grid-cols-2";
    }
  };

  // 根据 colorScheme 获取涨跌颜色类名
  const getChangeColorClass = (isUp: boolean) => {
    if (colorScheme === 'red-up') {
      return isUp ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
    } else {
      return isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    }
  };

  // 进入全屏
  const enterFullscreen = (chartType: 'm1' | 'cumulative' | 'gdp' | 'buffett') => {
    setFullscreenState({ isFullscreen: true, chartType });
  };

  // 退出全屏
  const exitFullscreen = () => {
    setFullscreenState({ isFullscreen: false, chartType: null });
  };

  return (
    <div>
      {/* 宏观经济板块 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          宏观经济
        </h2>
        
        {/* 图表布局 */}
        <div className={`grid ${getGridClass()} gap-4`}>
          {/* M1站跌幅折线图 */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                <LineChartIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                M1货币供应量同比增长率
              </h3>
              <div
                onTouchEnd={() => enterFullscreen('m1')}
                onClick={() => enterFullscreen('m1')}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="全屏查看"
                style={{ touchAction: 'manipulation' }}
              >
                <Maximize2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
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
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                M1货币供应量累计涨跌幅
              </h3>
              <div
                onTouchEnd={() => enterFullscreen('cumulative')}
                onClick={() => enterFullscreen('cumulative')}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="全屏查看"
                style={{ touchAction: 'manipulation' }}
              >
                <Maximize2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
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
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                GDP数据
              </h3>
              <div
                onTouchEnd={() => enterFullscreen('gdp')}
                onClick={() => enterFullscreen('gdp')}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="全屏查看"
                style={{ touchAction: 'manipulation' }}
              >
                <Maximize2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                巴菲特指标（股市总市值/GDP）
              </h3>
              <div
                onTouchEnd={() => enterFullscreen('buffett')}
                onClick={() => enterFullscreen('buffett')}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="全屏查看"
                style={{ touchAction: 'manipulation' }}
              >
                <Maximize2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
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
      </div>

      {/* 全屏图表模态框 */}
      {fullscreenState.isFullscreen && fullscreenState.chartType && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6">
          <div className="relative w-full max-w-7xl max-h-[95vh] flex flex-col">
            {/* 顶部控制栏 */}
            <div className="flex items-center justify-between mb-4">
              {/* 全屏图表标题 */}
              <div className="flex items-center gap-2 text-zinc-900">
                {fullscreenState.chartType === 'm1' && <LineChartIcon className="h-5 w-5 text-blue-600" />}
                {fullscreenState.chartType === 'cumulative' && <TrendingUp className="h-5 w-5 text-blue-600" />}
                {fullscreenState.chartType === 'gdp' && <DollarSign className="h-5 w-5 text-blue-600" />}
                {fullscreenState.chartType === 'buffett' && <TrendingUp className="h-5 w-5 text-blue-600" />}
                <h2 className="text-lg font-semibold">
                  {fullscreenState.chartType === 'm1' && 'M1货币供应量同比增长率 (全屏)'}
                  {fullscreenState.chartType === 'cumulative' && 'M1货币供应量累计涨跌幅 (全屏)'}
                  {fullscreenState.chartType === 'gdp' && 'GDP数据 (全屏)'}
                  {fullscreenState.chartType === 'buffett' && '巴菲特指标（股市总市值/GDP） (全屏)'}
                </h2>
              </div>
              
              {/* 关闭按钮 */}
              <div
                onTouchEnd={exitFullscreen}
                onClick={exitFullscreen}
                className="ml-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="退出全屏"
                style={{ touchAction: 'manipulation' }}
              >
                <Minimize2 className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            
            {/* 全屏图表 */}
            <div className="flex-1 min-h-[60vh]">
              <ResponsiveContainer width="100%" height="100%">
                {/* M1货币供应量同比增长率图表 */}
                {fullscreenState.chartType === 'm1' && (
                  <LineChart data={macroEconomicData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }} 
                      interval={Math.ceil(macroEconomicData.length / 10)}
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
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: '#1f2937'
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
                      strokeWidth={3} 
                      dot={false} 
                      activeDot={{ r: 8, fill: '#3b82f6' }}
                    />
                  </LineChart>
                )}
                
                {/* M1货币供应量累计涨跌幅图表 */}
                {fullscreenState.chartType === 'cumulative' && (
                  <LineChart data={macroEconomicCumulative}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }} 
                      interval={Math.ceil(macroEconomicCumulative.length / 10)}
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
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: '#1f2937'
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
                      strokeWidth={3} 
                      dot={false} 
                      activeDot={{ r: 8, fill: '#10b981' }}
                    />
                  </LineChart>
                )}
                
                {/* GDP数据图表 */}
                {fullscreenState.chartType === 'gdp' && (
                  <LineChart data={macroEconomicData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }} 
                      interval={Math.ceil(macroEconomicData.length / 10)}
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
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: '#1f2937'
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
                      strokeWidth={3} 
                      dot={false} 
                      activeDot={{ r: 8, fill: '#3b82f6' }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="gdpChangeRate" 
                      name="GDP同比增长率" 
                      stroke="#f59e0b" 
                      strokeWidth={3} 
                      dot={false} 
                      activeDot={{ r: 8, fill: '#f59e0b' }}
                    />
                  </LineChart>
                )}
                
                {/* 巴菲特指标图表 */}
                {fullscreenState.chartType === 'buffett' && (
                  <LineChart data={macroEconomicData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }} 
                      interval={Math.ceil(macroEconomicData.length / 10)}
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
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: '#1f2937'
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
                      strokeWidth={3} 
                      dot={false} 
                      activeDot={{ r: 8, fill: '#8b5cf6' }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
