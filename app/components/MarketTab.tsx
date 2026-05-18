import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, LineChart as LineChartIcon, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';
import { MacroEconomicData, MarketIndex, MacroEconomicCumulative } from '@/lib/dataService';

interface MarketTabProps {
  marketIndices: MarketIndex[];
  macroEconomicData: MacroEconomicData[];
  macroEconomicCumulative: MacroEconomicCumulative[];
  itemsPerRow?: number;
  colorScheme?: 'red-up' | 'red-down';
}

type ChartType = 'm1' | 'cumulative' | 'gdp' | 'buffett';

const CHART_TITLES: Record<ChartType, string> = {
  m1: 'M1货币供应量同比增长率',
  cumulative: 'M1货币供应量累计涨跌幅',
  gdp: 'GDP数据',
  buffett: '巴菲特指标（股市总市值/GDP）',
};

const CHART_ICONS: Record<ChartType, React.ElementType> = {
  m1: LineChartIcon,
  cumulative: TrendingUp,
  gdp: DollarSign,
  buffett: TrendingUp,
};

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const TOOLTIP_STYLE_FS = { ...TOOLTIP_STYLE, color: '#1f2937' };

/**
 * 市场Tab组件
 * 包含宏观经济部分
 */
export default function MarketTab({ marketIndices, macroEconomicData, macroEconomicCumulative, itemsPerRow = 2, colorScheme = 'red-up' }: MarketTabProps) {
  const [fullscreenState, setFullscreenState] = useState<{
    isFullscreen: boolean;
    chartType: ChartType | null;
  }>({ isFullscreen: false, chartType: null });

  const getGridClass = () => {
    const validItemsPerRow = Math.max(1, Math.min(4, itemsPerRow));
    switch (validItemsPerRow) {
      case 1: return "grid-cols-1 md:grid-cols-1";
      case 2: return "grid-cols-1 md:grid-cols-2";
      case 3: return "grid-cols-1 md:grid-cols-3";
      case 4: return "grid-cols-1 md:grid-cols-4";
      default: return "grid-cols-1 md:grid-cols-2";
    }
  };

  const getChangeColorClass = (isUp: boolean) => {
    if (colorScheme === 'red-up') {
      return isUp ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
    }
    return isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const enterFullscreen = (chartType: ChartType) => {
    setFullscreenState({ isFullscreen: true, chartType });
  };

  const exitFullscreen = () => {
    setFullscreenState({ isFullscreen: false, chartType: null });
  };

  // 渲染图表内容（正常视图和全屏共用）
  const renderChartContent = (type: ChartType, data: any[], isFullscreen: boolean) => {
    const lineWidth = isFullscreen ? 3 : 2;
    const dotRadius = isFullscreen ? 8 : 6;
    const tickDivisor = isFullscreen ? 10 : 12;
    const tooltipStyle = isFullscreen ? TOOLTIP_STYLE_FS : TOOLTIP_STYLE;

    const commonXAxis = (
      <XAxis
        dataKey="date"
        stroke="#6b7280"
        tick={{ fontSize: 12 }}
        interval={Math.ceil(data.length / tickDivisor)}
      />
    );

    const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />;

    switch (type) {
      case 'm1':
        return (
          <LineChart data={data}>
            {commonGrid}
            {commonXAxis}
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number | undefined) => [`${value?.toFixed(2) || '0.00'}%`, '同比增长率']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Legend />
            <Line type="monotone" dataKey="m1ChangeRate" name="M1同比增长率" stroke="#3b82f6" strokeWidth={lineWidth} dot={false} activeDot={{ r: dotRadius, fill: '#3b82f6' }} />
          </LineChart>
        );

      case 'cumulative':
        return (
          <LineChart data={data}>
            {commonGrid}
            {commonXAxis}
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number | undefined) => [`${value?.toFixed(2) || '0.00'}%`, '累计涨跌幅']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Legend />
            <Line type="monotone" dataKey="cumulativeChange" name="累计涨跌幅" stroke="#10b981" strokeWidth={lineWidth} dot={false} activeDot={{ r: dotRadius, fill: '#10b981' }} />
          </LineChart>
        );

      case 'gdp':
        return (
          <LineChart data={data}>
            {commonGrid}
            {commonXAxis}
            <YAxis yAxisId="left" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number | undefined, name: string | undefined) => {
                if (name === 'GDP总量') return [`${value?.toFixed(2) || '0.00'} 万亿`, name];
                return [`${value?.toFixed(2) || '0.00'}%`, name];
              }}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="gdp" name="GDP总量" stroke="#3b82f6" strokeWidth={lineWidth} dot={false} activeDot={{ r: dotRadius, fill: '#3b82f6' }} />
            <Line yAxisId="right" type="monotone" dataKey="gdpChangeRate" name="GDP同比增长率" stroke="#f59e0b" strokeWidth={lineWidth} dot={false} activeDot={{ r: dotRadius, fill: '#f59e0b' }} />
          </LineChart>
        );

      case 'buffett':
        return (
          <LineChart data={data}>
            {commonGrid}
            {commonXAxis}
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} domain={[0.5, 1.7]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number | undefined) => [`${value?.toFixed(2) || '0.00'}`, '巴菲特指标']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Legend />
            <Line type="monotone" dataKey="buffettIndicator" name="巴菲特指标" stroke="#8b5cf6" strokeWidth={lineWidth} dot={false} activeDot={{ r: dotRadius, fill: '#8b5cf6' }} />
          </LineChart>
        );
    }
  };

  // 渲染单个图表卡片
  const renderChartCard = (type: ChartType, data: any[]) => {
    const Icon = CHART_ICONS[type];
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-zinc-900 dark:text-white flex items-center gap-2">
            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {CHART_TITLES[type]}
          </h3>
          <div
            onClick={() => enterFullscreen(type)}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="全屏查看"
            style={{ touchAction: 'manipulation' }}
          >
            <Maximize2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {renderChartContent(type, data, false)}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 市场概览 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">市场概览</h2>
        <div className={`grid ${getGridClass()} gap-4`}>
          {marketIndices.map((index, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{index.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">{index.value}</span>
                <span className={`text-sm font-medium ${getChangeColorClass(index.isUp)}`}>
                  {index.change}
                </span>
              </div>
              {index.updateTime && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{index.updateTime}</p>
              )}
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
        <div className={`grid ${getGridClass()} gap-4`}>
          {renderChartCard('m1', macroEconomicData)}
          {renderChartCard('cumulative', macroEconomicCumulative)}
          {renderChartCard('gdp', macroEconomicData)}
          {renderChartCard('buffett', macroEconomicData)}
        </div>
      </div>

      {/* 全屏图表模态框 */}
      {fullscreenState.isFullscreen && fullscreenState.chartType && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-6">
          <div className="relative w-full max-w-7xl max-h-[95vh] flex flex-col">
            {/* 顶部控制栏 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                {React.createElement(CHART_ICONS[fullscreenState.chartType], { className: "h-5 w-5 text-blue-600" })}
                <h2 className="text-lg font-semibold">
                  {CHART_TITLES[fullscreenState.chartType]} (全屏)
                </h2>
              </div>
              <div
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
                {renderChartContent(
                  fullscreenState.chartType,
                  fullscreenState.chartType === 'cumulative' ? macroEconomicCumulative : macroEconomicData,
                  true
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
