import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MetalTabProps {
  preciousMetals: any[];
  goldHistory?: any[];
  silverHistory?: any[];
  bankGoldBarPrices?: any[];
  goldRecyclePrices?: any[];
  brandPrices?: any[];
  preciousMetalSyncTime?: string | null;
  itemsPerRow?: number;
  colorScheme?: 'red-up' | 'red-down';
  isLoading?: boolean;
}

/**
 * 贵金属Tab组件
 * 包含贵金属板块和趋势图
 */
export default function MetalTab({ 
  preciousMetals, 
  goldHistory, 
  silverHistory, 
  bankGoldBarPrices = [], 
  goldRecyclePrices = [], 
  brandPrices = [], 
  preciousMetalSyncTime = null, 
  itemsPerRow = 2, 
  colorScheme = 'red-up', 
  isLoading = false 
}: MetalTabProps) {
  // 根据 colorScheme 获取涨跌颜色类名
  const getChangeColorClass = (isUp: boolean) => {
    if (colorScheme === 'red-up') {
      return isUp ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
    } else {
      return isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    }
  };

  // 根据 itemsPerRow 计算趋势图网格布局类名
  const getChartGridClass = () => {
    // 确保 itemsPerRow 在 1-4 之间
    const validItemsPerRow = Math.max(1, Math.min(4, itemsPerRow));
    
    // 移动端始终为 1 列，桌面端根据设置调整
    switch (validItemsPerRow) {
      case 1:
        return "grid-cols-1";
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

  return (
    <div>
      {/* 贵金属 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">贵金属</h2>
        {/* 只显示黄金和白银数据 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? (
            // 显示加载状态
            [1, 2].map((item) => (
              <div key={item} className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 animate-pulse">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-2"></div>
                <div className="flex items-baseline gap-2 mt-1">
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
                </div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mt-1"></div>
              </div>
            ))
          ) : (
            // 显示贵金属数据
            preciousMetals
              .filter(metal => metal.name === '黄金' || metal.name === '白银')
              .map((metal, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{metal.name}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-semibold text-zinc-900 dark:text-white">{metal.value}</span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">{metal.unit}</span>
                  </div>
                  <div className={`text-sm font-medium mt-1 ${getChangeColorClass(metal.isUp)}`}>
                    {metal.change}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* 趋势图 */}
      {(goldHistory && goldHistory.length > 0) || (silverHistory && silverHistory.length > 0) ? (
        <div className={`grid ${getChartGridClass()} gap-6 mb-8`}>
          {/* 黄金趋势图 */}
          {goldHistory && goldHistory.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-md font-semibold text-zinc-900 dark:text-white mb-4">黄金价格趋势</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={goldHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(0,0,0,0.6)" />
                  <YAxis stroke="rgba(0,0,0,0.6)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }} 
                    formatter={(value: number | undefined) => [`${value?.toFixed(2) || '0.00'} 元/克`, '价格']} 
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="黄金价格" 
                    stroke="#ffd700" 
                    strokeWidth={2} 
                    dot={{ r: 2 }} 
                    activeDot={{ r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 白银趋势图 */}
          {silverHistory && silverHistory.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-md font-semibold text-zinc-900 dark:text-white mb-4">白银价格趋势</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={silverHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(0,0,0,0.6)" />
                  <YAxis stroke="rgba(0,0,0,0.6)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }} 
                    formatter={(value: number | undefined) => [`${value?.toFixed(2) || '0.00'} 元/克`, '价格']} 
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="白银价格" 
                    stroke="#c0c0c0" 
                    strokeWidth={2} 
                    dot={{ r: 2 }} 
                    activeDot={{ r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : null}

      {/* 银行投资金条价格模块 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">银行投资金条价格</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left py-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">银行名称</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">价格 (元/克)</th>
              </tr>
            </thead>
            <tbody>
              {bankGoldBarPrices.map((item, index) => (
                <tr key={index} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="py-2 px-4 text-sm text-zinc-900 dark:text-white">{item.bank}</td>
                  <td className="py-2 px-4 text-sm text-right text-zinc-900 dark:text-white">{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 贵金属回收价格模块 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">贵金属回收价格</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left py-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">品种</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">价格 (元/克)</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">更新时间</th>
              </tr>
            </thead>
            <tbody>
              {goldRecyclePrices.map((item, index) => (
                <tr key={index} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="py-2 px-4 text-sm text-zinc-900 dark:text-white">{item.gold_type}</td>
                  <td className="py-2 px-4 text-sm text-right text-zinc-900 dark:text-white">{item.recycle_price}</td>
                  <td className="py-2 px-4 text-sm text-right text-zinc-500 dark:text-zinc-400">{item.updated_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 品牌贵金属价格模块 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">品牌贵金属价格</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left py-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">品牌</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">金条价 (元/克)</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">黄金价 (元/克)</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">铂金价 (元/克)</th>
                <th className="text-right py-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">更新时间</th>
              </tr>
            </thead>
            <tbody>
              {brandPrices.map((item, index) => (
                <tr key={index} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="py-2 px-4 text-sm text-zinc-900 dark:text-white">{item.brand}</td>
                  <td className="py-2 px-4 text-sm text-right text-zinc-900 dark:text-white">{item.bullion_price || '-'}</td>
                  <td className="py-2 px-4 text-sm text-right text-zinc-900 dark:text-white">{item.gold_price}</td>
                  <td className="py-2 px-4 text-sm text-right text-zinc-900 dark:text-white">{item.platinum_price || '-'}</td>
                  <td className="py-2 px-4 text-sm text-right text-zinc-500 dark:text-zinc-400">{item.updated_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 接口同步时间 */}
      {preciousMetalSyncTime && (
        <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-4 mb-6">
          数据同步时间: {preciousMetalSyncTime}
        </div>
      )}
    </div>
  );
}
