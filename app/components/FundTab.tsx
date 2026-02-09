import React from 'react';
import Link from 'next/link';
import { ChevronDown, Bookmark } from 'lucide-react';
import { FundInfo, MarketIndex, formatCurrency, formatPercentage } from '@/lib/mockData';

interface FundTabProps {
  marketIndices: MarketIndex[];
  fundHoldingsSummary: any[];
  funds: FundInfo[];
  filteredFunds: FundInfo[];
  sortBy: 'valuation' | 'dailyChangeRate' | 'name';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  fundType: string;
  riskLevel: string;
  handleSortChange: (newSortBy: 'valuation' | 'dailyChangeRate' | 'name') => void;
  handleResetFilters: () => void;
  setSearchQuery: (query: string) => void;
  setFundType: (type: string) => void;
  setRiskLevel: (level: string) => void;
  colorScheme?: 'red-up' | 'red-down';
}

/**
 * 基金Tab组件
 * 包含市场概览、基金持仓和基金估值部分
 */
export default function FundTab({  
  marketIndices, 
  fundHoldingsSummary, 
  funds, 
  filteredFunds, 
  sortBy, 
  sortOrder, 
  searchQuery, 
  fundType, 
  riskLevel, 
  handleSortChange, 
  handleResetFilters, 
  setSearchQuery, 
  setFundType, 
  setRiskLevel,
  colorScheme = 'red-up'
}: FundTabProps) {
  // 根据 colorScheme 获取涨跌颜色类名
  const getChangeColorClass = (isUp: boolean) => {
    if (colorScheme === 'red-up') {
      return isUp ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
    } else {
      return isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    }
  };
  return (
    <div>
      {/* 市场概览 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">市场概览</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {marketIndices.map((index, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{index.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">{index.value}</span>
                <span className={`text-sm font-medium ${getChangeColorClass(index.isUp)}`}>
                  {index.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 基金持仓 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">基金持仓</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">行业</th>
                  <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">持仓比例</th>
                  <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">持仓数量</th>
                </tr>
              </thead>
              <tbody>
                {fundHoldingsSummary.map((item, i) => (
                  <tr key={i} className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0">
                    <td className="py-3 px-4 text-sm text-zinc-900 dark:text-white">{item.industry}</td>
                    <td className="py-3 px-4 text-sm text-zinc-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{item.proportion}%</span>
                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" 
                            style={{ width: `${item.proportion}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-900 dark:text-white">{item.count}只</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                        <p className={`font-medium ${getChangeColorClass(isUp)}`}>
                          {fund.valuation.dailyChange > 0 ? '+' : ''}{formatCurrency(fund.valuation.dailyChange)}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-400">涨跌幅</p>
                        <p className={`font-medium ${getChangeColorClass(isUp)}`}>
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
                      <p className={`font-medium ${getChangeColorClass(isUp)}`}>
                        {fund.valuation.dailyChange > 0 ? '+' : ''}{formatCurrency(fund.valuation.dailyChange)}
                      </p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className={`font-medium ${getChangeColorClass(isUp)}`}>
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
    </div>
  );
}
