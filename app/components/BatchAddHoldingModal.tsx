// 批量添加持仓模态框组件
import { useState, useEffect } from 'react';
import { batchAddHoldings, BatchAddItem, validateBatchAddItems, BatchAddResult } from '../../lib/batchOperations';
import { searchFund } from '../../lib/api';

interface BatchAddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchAddHolding: (holdings: {
    code: string;
    name: string;
    holdingAmount: number;
    holdingProfit: number;
    type: string;
    industryInfo: string;
    walletId: string;
  }[]) => void;
  userHoldings?: {
    code: string;
    fundName: string;
    holdingAmount: number;
    holdingProfit: number;
    currentPrice: number;
    profitRate: number;
    type: string;
  }[];
  currentWalletId: string;
}

/**
 * 批量添加持仓模态框组件
 * 用于用户批量添加多个基金持仓
 */
export default function BatchAddHoldingModal({ isOpen, onClose, onBatchAddHolding, userHoldings = [], currentWalletId }: BatchAddHoldingModalProps) {
  // 状态管理
  const [items, setItems] = useState<BatchAddItem[]>([{ code: '', holdingAmount: 0, holdingProfit: 0, fundName: '', error: '', fundType: '', fundCompany: '', fundManager: '', latestNav: 0, navDate: '', industryInfo: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BatchAddResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // 当模态框打开时重置状态
  useEffect(() => {
    if (isOpen) {
      setItems([{ code: '', holdingAmount: 0, holdingProfit: 0, fundName: '', error: '', fundType: '', fundCompany: '', fundManager: '', latestNav: 0, navDate: '', industryInfo: '' }]);
      setLoading(false);
      setError(null);
      setResults([]);
      setShowResults(false);
    }
  }, [isOpen]);

  // 添加新的输入行
  const handleAddItem = () => {
    if (items.length < 10) {
      setItems([...items, { code: '', holdingAmount: 0, holdingProfit: 0, fundName: '', error: '', fundType: '', fundCompany: '', fundManager: '', latestNav: 0, navDate: '', industryInfo: '' }]);
    }
  };

  // 删除输入行
  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  // 更新输入项
  const handleUpdateItem = async (index: number, field: keyof BatchAddItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'code' ? value : parseFloat(value as string) || 0,
      error: '' // 重置错误信息
    };

    // 实时校验
    const item = newItems[index];
    if (field === 'code') {
      if (typeof value === 'string' && value.length > 0 && !/^\d{6}$/.test(value)) {
        newItems[index].error = '基金代码必须为6位数字';
      }
    } else if (field === 'holdingAmount') {
      if (parseFloat(value as string) < 0) {
        newItems[index].error = '持仓金额不能小于0';
      }
    }

    // 当基金代码输入完整（6位）时，自动查询基金信息
    if (field === 'code' && typeof value === 'string' && value.length === 6) {
      try {
        const fundInfo = await searchFund(value as string);
        if (fundInfo) {
          console.log('基金信息:', fundInfo);
          console.log('FundBaseInfo:', fundInfo.FundBaseInfo);
          console.log('FUNDTYPE:', fundInfo.FundBaseInfo?.FTYPE);
          console.log('ZTJJInfo:', fundInfo.ZTJJInfo);
          
          // 从ZTJJInfo中提取行业信息
          let industryInfo = '';
          if (fundInfo.ZTJJInfo && fundInfo.ZTJJInfo.length > 0) {
            // 假设ZTJJInfo中的每个元素都有行业名称字段
            // 这里根据实际数据结构调整
            industryInfo = fundInfo.ZTJJInfo.map((item: any) => item.INDUSTRY || item.name ||item.TTYPENAME || item.industry ).filter(Boolean).join(', ') || '未知';
          }
          
          newItems[index] = {
            ...newItems[index],
            fundName: fundInfo.NAME || '未知',
            fundType: fundInfo.FundBaseInfo?.FTYPE || fundInfo.CATEGORYDESC || '未知',
            fundCompany: fundInfo.FundBaseInfo?.JJGS || '未知',
            fundManager: fundInfo.FundBaseInfo?.JJJL || '未知',
            latestNav: fundInfo.FundBaseInfo?.DWJZ || 0,
            navDate: fundInfo.FundBaseInfo?.FSRQ || '',
            industryInfo: industryInfo || '未知'
          };
        } else {
          newItems[index].error = '未找到该基金信息';
        }
      } catch (error) {
        console.error('查询基金信息失败:', error);
        newItems[index].error = '查询基金信息失败';
      }
    }

    setItems(newItems);
  };

  // 处理批量添加
  const handleBatchAdd = async () => {
    // 验证输入
    const validation = validateBatchAddItems(items);
    if (!validation.valid) {
      // 将错误信息分配到对应的输入项中
      const newItems = [...items];

      // 检查是否有全局错误（如项目数量、重复代码）
      const globalErrors = validation.errors.filter(error =>
        error.includes('请至少添加一项持仓') ||
        error.includes('每次最多添加10项持仓') ||
        error.includes('存在重复的基金代码')
      );

      if (globalErrors.length > 0) {
        setError(globalErrors.join('\n'));
        return;
      }

      // 分配每个项目的错误
      validation.errors.forEach(error => {
        const match = error.match(/第(\d+)项：(.*)/);
        if (match) {
          const index = parseInt(match[1]) - 1;
          if (index >= 0 && index < newItems.length) {
            newItems[index].error = match[2];
          }
        }
      });

      setItems(newItems);
      return;
    }

    // 检查本地持仓信息
    const newItems = [...items];
    let hasExistingHoldings = false;

    newItems.forEach((item, index) => {
      const existingHolding = userHoldings.find(holding => holding.code === item.code);
      if (existingHolding) {
        newItems[index].error = '该基金已存在于持仓中';
        hasExistingHoldings = true;
      }
    });

    if (hasExistingHoldings) {
      setItems(newItems);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setShowResults(false);

    try {
      // 调用批量添加函数
      const addResults = await batchAddHoldings(items);

      // 检查是否有失败的结果
      const hasFailedResults = addResults.some(result => !result.success);

      if (hasFailedResults) {
        // 如果有失败的结果，将错误信息分配到对应的输入项中
        const newItems = [...items];
        addResults.forEach(result => {
          if (!result.success) {
            const index = newItems.findIndex(item => item.code === result.code);
            if (index >= 0) {
              newItems[index].error = result.error || '添加失败';
            }
          }
        });
        setItems(newItems);
        setLoading(false);
        return;
      }

      // 如果所有结果都成功，跳转到添加结果页面
      setResults(addResults);
      setShowResults(true);

      // 提取成功添加的持仓
      const successfulHoldings = addResults
        .filter(result => result.success)
        .map(result => {
          const item = items.find(i => i.code === result.code);
          return {
            code: result.code,
            name: result.name || '',
            holdingAmount: item?.holdingAmount || 0,
            holdingProfit: item?.holdingProfit || 0,
            type: item?.fundType || '未知类型',
            industryInfo: item?.industryInfo || '未知',
            walletId: currentWalletId
          };
        });

      // 如果有成功添加的持仓，调用回调
      if (successfulHoldings.length > 0) {
        onBatchAddHolding(successfulHoldings);
      }
    } catch (err) {
      setError('批量添加失败：' + (err instanceof Error ? err.message : '未知错误'));
      setLoading(false);
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  // 处理模态框关闭
  const handleClose = () => {
    // 重置状态
    setItems([{ code: '', fundName: '', holdingAmount: 0, holdingProfit: 0, error: '', fundType: '', fundCompany: '', fundManager: '', latestNav: 0, navDate: '', industryInfo: '' }]);
    setError(null);
    setResults([]);
    setShowResults(false);
    onClose();
  };

  // 如果模态框未打开，不渲染
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(255,255,255,0.7)] flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-[800px] p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">批量添加基金持仓</h2>
          <button
            onClick={handleClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showResults ? (
          <div>
            <h3 className="text-md font-medium text-zinc-900 dark:text-white mb-3">添加结果</h3>
            <div className="overflow-x-auto w-full max-h-80">
              <table className="w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      基金代码
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      基金名称
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      信息
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                        {result.code}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                        {result.name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.success
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                          {result.success ? '成功' : '失败'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                        {result.error || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                关闭
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* 错误信息 */}
            {error && (
              <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm whitespace-pre-line">
                {error}
              </div>
            )}

            {/* 批量输入表格 */}
            <div className="w-full mb-4">
              <table className="w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider" style={{ width: '10%' }}>
                      基金代码
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      基金信息
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider" style={{ width: '10%' }}>
                      持仓金额
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider" style={{ width: '10%' }}>
                      持有盈亏
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider" style={{ width: '15%' }}>
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
                  {items.map((item, index) => (
                    <>
                      <tr key={index}>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => handleUpdateItem(index, 'code', e.target.value)}
                            placeholder="基金代码"
                            maxLength={6}
                            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                            style={{ width: '100px' }}
                          />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm text-zinc-900 dark:text-zinc-100">
                            {item.fundName || '---'}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {item.fundType || '---'} | {item.fundCompany || '---'}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            基金经理：{item.fundManager || '---'}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            最新净值：{item.latestNav || '---'} ({item.navDate || '---'})
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            行业信息：{item.industryInfo || '---'}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <input
                            type="number"
                            value={item.holdingAmount || 0}
                            onChange={(e) => handleUpdateItem(index, 'holdingAmount', e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                            style={{ width: '120px' }}
                          />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <input
                            type="number"
                            value={item.holdingProfit || 0}
                            onChange={(e) => handleUpdateItem(index, 'holdingProfit', e.target.value)}
                            placeholder="0"
                            step="0.01"
                            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                            style={{ width: '120px' }}
                          />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            disabled={items.length === 1}
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                      {item.error && (
                        <tr>
                          <td colSpan={5} className="px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10">
                            {item.error}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 添加行按钮 */}
            {items.length < 10 && (
              <button
                onClick={handleAddItem}
                className="mb-4 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                添加一行
              </button>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                onClick={handleBatchAdd}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    处理中...
                  </>
                ) : (
                  '批量添加'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
