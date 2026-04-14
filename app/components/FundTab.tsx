import React, { useState } from 'react';
import { FundInfo, UserHolding, Wallet } from '@/lib/dataService';
import WalletManager from './WalletManager';
import FundTracker from './FundTracker';

interface FundTabProps {
  funds: FundInfo[];
  userHoldings: UserHolding[];
  wallets: Wallet[];
  currentWalletId: string;
  fundType: string;
  setFundType: (type: string) => void;
  onAddHolding: (holding: {
    code: string;
    name: string;
    holdingAmount: number;
    holdingProfit: number;
    type: string;
    industryInfo: string;
    walletId: string;
  }) => void;
  onBatchAddHolding: (holdings: {
    code: string;
    name: string;
    holdingAmount: number;
    holdingProfit: number;
    type: string;
    industryInfo: string;
    walletId: string;
  }[]) => void;
  onDeleteHolding: (code: string) => void;
  onBatchDeleteHolding: (codes: string[]) => void;
  onAddWallet: (name: string) => void;
  onDeleteWallet: (id: string) => void;
  onSwitchWallet: (id: string) => void;
  onEditHolding: (holding: {
    code: string;
    fundName: string;
    holdingAmount: number;
    holdingProfit: number;
    type: string;
    industryInfo: string;
    walletId: string;
  }) => void;
  colorScheme?: 'red-up' | 'red-down';
}

/**
 * 基金Tab组件
 * 包含钱包管理和基金跟踪两个主要功能模块
 */
export default function FundTab({  
  funds, 
  userHoldings, 
  wallets,
  currentWalletId,
  fundType, 
  setFundType,
  onAddHolding,
  onBatchAddHolding,
  onDeleteHolding,
  onBatchDeleteHolding,
  onAddWallet,
  onDeleteWallet,
  onSwitchWallet,
  onEditHolding,
  colorScheme = 'red-up'
}: FundTabProps) {
  // Tab切换状态
  const [activeTab, setActiveTab] = useState<'wallet' | 'tracking'>('wallet');
  
  return (
    <div>
      {/* 主Tab切换 */}
      <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'wallet' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
          >
            钱包管理
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tracking' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
          >
            基金跟踪
          </button>
        </div>
      </div>

      {/* 钱包管理Tab */}
      {activeTab === 'wallet' && (
        <WalletManager
          userHoldings={userHoldings}
          funds={funds}
          wallets={wallets}
          currentWalletId={currentWalletId}
          fundType={fundType}
          setFundType={setFundType}
          onAddHolding={onAddHolding}
          onBatchAddHolding={onBatchAddHolding}
          onDeleteHolding={onDeleteHolding}
          onBatchDeleteHolding={onBatchDeleteHolding}
          onAddWallet={onAddWallet}
          onDeleteWallet={onDeleteWallet}
          onSwitchWallet={onSwitchWallet}
          onEditHolding={onEditHolding}
          colorScheme={colorScheme}
        />
      )}

      {/* 基金跟踪Tab */}
      {activeTab === 'tracking' && (
        <FundTracker
          colorScheme={colorScheme}
        />
      )}
    </div>
  );
}
