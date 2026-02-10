// 编辑持仓模态框组件
import { useState, useEffect } from 'react';

interface EditHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditHolding: (holding: {
    code: string;
    fundName: string;
    holdingAmount: number;
    holdingProfit: number;
    type: string;
    industryInfo: string;
    walletId: string;
  }) => void;
  holding: {
    code: string;
    fundName: string;
    totalValue: number;
    profit: number;
    type: string;
    industryInfo: string;
    walletId: string;
  } | null;
}

/**
 * 编辑持仓模态框组件
 * 用于用户编辑现有基金持仓的金额和盈亏
 */
export default function EditHoldingModal({ isOpen, onClose, onEditHolding, holding }: EditHoldingModalProps) {
  // 状态管理
  const [holdingAmount, setHoldingAmount] = useState('0');
  const [holdingProfit, setHoldingProfit] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 当持仓数据变化时，更新表单数据
  useEffect(() => {
    if (holding) {
      setHoldingAmount(holding.totalValue.toString());
      setHoldingProfit(holding.profit.toString());
    }
  }, [holding]);

  // 处理编辑持仓
  const handleEditHolding = () => {
    // 验证输入
    if (!holding) {
      setError('持仓数据无效');
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

    // 构建持仓信息
    const updatedHolding = {
      code: holding.code,
      fundName: holding.fundName,
      holdingAmount: parseFloat(holdingAmount),
      holdingProfit: parseFloat(holdingProfit) || 0,
      type: holding.type,
      industryInfo: holding.industryInfo,
      walletId: holding.walletId
    };

    // 调用编辑持仓回调
    onEditHolding(updatedHolding);

    // 重置状态
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setError(null);
      onClose();
    }, 1500);
  };

  // 处理模态框关闭
  const handleClose = () => {
    // 重置状态
    setError(null);
    setSuccess(false);
    onClose();
  };

  // 如果模态框未打开或持仓数据为空，不渲染
  if (!isOpen || !holding) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(255,255,255,0.7)] flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">编辑基金持仓</h2>
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
            <p className="text-green-600 dark:text-green-400 font-medium">编辑成功！</p>
          </div>
        ) : (
          <div>
            {/* 基金信息 */}
            <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md">
              <h3 className="font-medium text-zinc-900 dark:text-white">{holding.fundName}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                代码：{holding.code} | 类型：{holding.type}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                行业信息：{holding.industryInfo || '未知'}
              </p>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* 持仓信息输入 */}
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

            {/* 操作按钮 */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                onClick={handleEditHolding}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={!holdingAmount}
              >
                保存修改
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
