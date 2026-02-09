// 添加持仓模态框组件
import { useState } from 'react';
import { searchFund, validateFundCode, FundSearchResult } from '../../lib/api';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHolding: (holding: {
    code: string;
    name: string;
    shares: number;
    costPrice: number;
    holdingAmount: number;
    holdingProfit: number;
    type: string;
    industryInfo: string;
  }) => void;
}

/**
 * 添加持仓模态框组件
 * 用于用户添加新的基金持仓
 */
export default function AddHoldingModal({ isOpen, onClose, onAddHolding }: AddHoldingModalProps) {
  // 状态管理
  const [fundCode, setFundCode] = useState('');
  const [holdingAmount, setHoldingAmount] = useState('0');
  const [holdingProfit, setHoldingProfit] = useState('0');
  const [searchResult, setSearchResult] = useState<FundSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 处理基金代码搜索
  const handleSearch = async () => {
    // 验证基金代码格式
    if (!validateFundCode(fundCode)) {
      setError('请输入有效的6位基金代码');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await searchFund(fundCode);
      if (result) {
        setSearchResult(result);
        setError(null);
      } else {
        setError('未找到该基金信息');
        setSearchResult(null);
      }
    } catch (err) {
      setError('搜索基金失败，请稍后重试');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  // 处理添加持仓
  const handleAddHolding = () => {
    // 验证输入
    if (!searchResult) {
      setError('请先搜索并选择基金');
      return;
    }

    if (!holdingAmount || isNaN(parseFloat(holdingAmount)) || parseFloat(holdingAmount) < 0) {
      setError('请输入有效的持仓金额');
      return;
    }

    if (holdingProfit && isNaN(parseFloat(holdingProfit))) {
      setError('请输入有效的持仓盈亏');
      return;
    }

    // 提取行业信息
    let industryInfo = '';
    if (searchResult.ZTJJInfo && searchResult.ZTJJInfo.length > 0) {
      industryInfo = searchResult.ZTJJInfo.map((item: any) => item.INDUSTRY || item.name || item.TTYPENAME || item.industry).filter(Boolean).join(', ') || '未知';
    } else {
      industryInfo = '未知';
    }

    // 构建持仓信息
    const holding = {
      code: searchResult.CODE,
      name: searchResult.NAME,
      shares: 0, // 兼容旧结构，设置为0
      costPrice: 0, // 兼容旧结构，设置为0
      holdingAmount: parseFloat(holdingAmount),
      holdingProfit: parseFloat(holdingProfit) || 0,
      type: searchResult.FundBaseInfo.FTYPE || '未知类型',
      industryInfo: industryInfo
    };

    // 调用添加持仓回调
    onAddHolding(holding);

    // 重置状态
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setFundCode('');
      setHoldingAmount('0');
      setHoldingProfit('0');
      setSearchResult(null);
      onClose();
    }, 1500);
  };

  // 处理模态框关闭
  const handleClose = () => {
    // 重置状态
    setFundCode('');
    setHoldingAmount('0');
    setHoldingProfit('0');
    setSearchResult(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  // 如果模态框未打开，不渲染
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(255,255,255,0.7)] flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">添加基金持仓</h2>
          <button
            onClick={handleClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-600 dark:text-green-400 font-medium">添加成功！</p>
          </div>
        ) : (
          <div>
            {/* 基金代码输入 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                基金代码
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fundCode}
                  onChange={(e) => setFundCode(e.target.value)}
                  placeholder="请输入6位基金代码"
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  disabled={loading}
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center"
                  disabled={loading || !fundCode}
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    '搜索'
                  )}
                </button>
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* 搜索结果 */}
            {searchResult && (
              <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                <h3 className="font-medium text-zinc-900 dark:text-white">{searchResult.NAME}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  代码：{searchResult.CODE} | 类型：{searchResult.FundBaseInfo.FTYPE}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  基金公司：{searchResult.FundBaseInfo.JJGS} | 基金经理：{searchResult.FundBaseInfo.JJJL}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  最新净值：{searchResult.FundBaseInfo.DWJZ} ({searchResult.FundBaseInfo.FSRQ})
                </p>
                {/* 行业信息 */}
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  行业信息：{(() => {
                    let industryInfo = '';
                    if (searchResult.ZTJJInfo && searchResult.ZTJJInfo.length > 0) {
                      industryInfo = searchResult.ZTJJInfo.map((item: any) => item.INDUSTRY || item.name || item.TTYPENAME || item.industry).filter(Boolean).join(', ') || '未知';
                    } else {
                      industryInfo = '未知';
                    }
                    return industryInfo;
                  })()}
                </p>
              </div>
            )}

            {/* 持仓信息输入 */}
            {searchResult && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    持仓金额
                  </label>
                  <input
                    type="number"
                    value={holdingAmount}
                    onChange={(e) => setHoldingAmount(e.target.value)}
                    placeholder="请输入持仓金额"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    持仓盈亏
                  </label>
                  <input
                    type="number"
                    value={holdingProfit}
                    onChange={(e) => setHoldingProfit(e.target.value)}
                    placeholder="请输入持仓盈亏"
                    step="0.01"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                onClick={handleAddHolding}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={!searchResult || !holdingAmount}
              >
                添加持仓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
