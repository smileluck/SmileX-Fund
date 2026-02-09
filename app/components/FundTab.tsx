import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Bookmark, Plus, Trash2, CheckSquare, Square, Edit2 } from 'lucide-react';
import { FundInfo, MarketIndex, UserHolding, formatCurrency, formatPercentage } from '@/lib/mockData';
import AddHoldingModal from './AddHoldingModal';
import BatchAddHoldingModal from './BatchAddHoldingModal';

interface FundTabProps {
  marketIndices: MarketIndex[];
  fundHoldingsSummary: any[];
  funds: FundInfo[];
  filteredFunds: FundInfo[];
  userHoldings: UserHolding[];
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
  onAddHolding: (holding: {
    code: string;
    name: string;
    shares: number;
    costPrice: number;
    type: string;
    industryInfo: string;
  }) => void;
  onBatchAddHolding: (holdings: {
    code: string;
    name: string;
    shares: number;
    costPrice: number;
    type: string;
    industryInfo: string;
  }[]) => void;
  onDeleteHolding: (code: string) => void;
  onBatchDeleteHolding: (codes: string[]) => void;
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
  userHoldings, 
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
  onAddHolding,
  onBatchAddHolding,
  onDeleteHolding,
  onBatchDeleteHolding,
  colorScheme = 'red-up'
}: FundTabProps) {
  // 定义当前激活的tab
  const [activeTab, setActiveTab] = useState<'holdings' | 'valuation'>('holdings');
  
  // 模态框状态
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [batchAddModalOpen, setBatchAddModalOpen] = useState(false);
  
  // 批量选择状态
  const [selectedHoldings, setSelectedHoldings] = useState<string[]>([]);
  
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

      {/* Tab 切换 */}
      <div className="mb-6">
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'holdings' 
              ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' 
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            onClick={() => setActiveTab('holdings')}
          >
            基金持仓
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'valuation' 
              ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' 
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            onClick={() => setActiveTab('valuation')}
          >
            基金估值
          </button>
        </div>

        {/* Tab 内容 */}
        <div className="mt-4">
          {/* 基金持仓 */}
          {activeTab === 'holdings' && (
            <div>
              {/* 持仓操作按钮 */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">我的持仓</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBatchAddModalOpen(true)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    批量添加
                  </button>
                  <button
                    onClick={() => setAddModalOpen(true)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    添加持仓
                  </button>
                  {selectedHoldings.length > 0 && (
                    <button
                      onClick={() => onBatchDeleteHolding(selectedHoldings)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      批量删除
                    </button>
                  )}
                </div>
              </div>
              
              {/* 用户持仓列表 */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                {userHoldings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                          <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            <button
                              onClick={() => {
                                if (selectedHoldings.length === userHoldings.length) {
                                  setSelectedHoldings([]);
                                } else {
                                  setSelectedHoldings(userHoldings.map(h => h.code));
                                }
                              }}
                              className="flex items-center gap-1"
                            >
                              {selectedHoldings.length === userHoldings.length ? (
                                <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <Square className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                              )}
                            </button>
                          </th>
                          <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">基金名称</th>
                          <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">代码</th>
                          <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">类型</th>
                          <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">行业信息</th>
                          <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">持仓金额</th>
                          <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">盈亏</th>
                          <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">盈亏比例</th>
                          <th className="py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userHoldings.map((holding, i) => {
                          const isUp = holding.profit > 0;
                          return (
                            <tr key={i} className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => {
                                    if (selectedHoldings.includes(holding.code)) {
                                      setSelectedHoldings(selectedHoldings.filter(c => c !== holding.code));
                                    } else {
                                      setSelectedHoldings([...selectedHoldings, holding.code]);
                                    }
                                  }}
                                >
                                  {selectedHoldings.includes(holding.code) ? (
                                    <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  ) : (
                                    <Square className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                  )}
                                </button>
                              </td>
                              <td className="py-3 px-4 text-sm text-zinc-900 dark:text-white">{holding.name}</td>
                              <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{holding.code}</td>
                              <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{holding.type}</td>
                              <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{holding.industryInfo || '---'}</td>
                              <td className="py-3 px-4 text-sm text-zinc-900 dark:text-white">{formatCurrency(holding.totalValue)}</td>
                              <td className={`py-3 px-4 text-sm font-medium ${getChangeColorClass(isUp)}`}>
                                {isUp ? '+' : ''}{formatCurrency(holding.profit)}
                              </td>
                              <td className={`py-3 px-4 text-sm font-medium ${getChangeColorClass(isUp)}`}>
                                {isUp ? '+' : ''}{formatPercentage(holding.profitRate)}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => onDeleteHolding(holding.code)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                  <Link href={`/funds/${holding.code}`}>
                                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-zinc-500 dark:text-zinc-400">暂无持仓</p>
                    <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">点击上方按钮添加持仓</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 基金估值 */}
          {activeTab === 'valuation' && (
            <div>
              <div className="flex items-center justify-between mb-4">
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
          )}
        </div>
      </div>
      
      {/* 模态框 */}
      <AddHoldingModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddHolding={onAddHolding}
      />
      <BatchAddHoldingModal
        isOpen={batchAddModalOpen}
        onClose={() => setBatchAddModalOpen(false)}
        onBatchAddHolding={onBatchAddHolding}
        userHoldings={userHoldings}
      />
    </div>
  );
}
