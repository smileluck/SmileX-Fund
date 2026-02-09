'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

/**
 * 设置页面
 * 允许用户配置贵金属和市场板块的趋势图每行显示的个数，以及涨跌颜色
 */
export default function SettingsPage() {
  const router = useRouter();
  const [metalItemsPerRow, setMetalItemsPerRow] = useState(2); // 贵金属默认值为 2
  const [marketItemsPerRow, setMarketItemsPerRow] = useState(2); // 市场默认值为 2
  const [colorScheme, setColorScheme] = useState<'red-up' | 'red-down'>('red-up'); // 默认红色为涨
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 从本地存储读取设置
  useEffect(() => {
    try {
      // 读取贵金属设置
      const savedMetalItemsPerRow = localStorage.getItem('metalItemsPerRow');
      if (savedMetalItemsPerRow) {
        const parsedValue = parseInt(savedMetalItemsPerRow, 10);
        if (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 4) {
          setMetalItemsPerRow(parsedValue);
        }
      }
      
      // 读取市场设置
      const savedMarketItemsPerRow = localStorage.getItem('marketItemsPerRow');
      if (savedMarketItemsPerRow) {
        const parsedValue = parseInt(savedMarketItemsPerRow, 10);
        if (!isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 4) {
          setMarketItemsPerRow(parsedValue);
        }
      }
      
      // 读取涨跌颜色配置
      const savedColorScheme = localStorage.getItem('colorScheme');
      if (savedColorScheme && (savedColorScheme === 'red-up' || savedColorScheme === 'red-down')) {
        setColorScheme(savedColorScheme as 'red-up' | 'red-down');
      }
    } catch (error) {
      console.error('Error reading settings from localStorage:', error);
      // 出错时使用默认值
      setMetalItemsPerRow(2);
      setMarketItemsPerRow(2);
      setColorScheme('red-up');
    }
  }, []);

  // 处理保存按钮点击
  const handleSave = () => {
    try {
      setIsSaving(true);
      
      // 确保值在 1-4 之间
      const validMetalValue = Math.max(1, Math.min(4, metalItemsPerRow));
      const validMarketValue = Math.max(1, Math.min(4, marketItemsPerRow));
      
      // 保存到本地存储
      localStorage.setItem('metalItemsPerRow', validMetalValue.toString());
      localStorage.setItem('marketItemsPerRow', validMarketValue.toString());
      localStorage.setItem('colorScheme', colorScheme);
      
      // 显示保存成功提示
      setSaveSuccess(true);
      
      // 2秒后隐藏保存成功提示
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 处理返回按钮点击
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          {/* 返回按钮 */}
          <button 
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          
          {/* 标题 */}
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            设置
          </h1>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          {/* 贵金属板块设置 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">贵金属板块</h2>
            
            {/* 贵金属图每行显示个数设置 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                趋势图每行显示个数
              </label>
              <div className="flex items-center gap-4">
                {/* 数字输入框 */}
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={metalItemsPerRow}
                  onChange={(e) => setMetalItemsPerRow(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 快速选择按钮 */}
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((value) => (
                    <button
                      key={value}
                      onClick={() => setMetalItemsPerRow(value)}
                      className={`px-3 py-1 rounded-md text-sm ${metalItemsPerRow === value 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* 市场板块设置 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">市场板块</h2>
            
            {/* 市场图每行显示个数设置 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            趋势图每行显示个数
          </label>
          <div className="flex items-center gap-4">
            {/* 数字输入框 */}
            <input
              type="number"
              min="1"
              max="4"
              value={marketItemsPerRow}
              onChange={(e) => setMarketItemsPerRow(Number(e.target.value))}
              className="w-20 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* 快速选择按钮 */}
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((value) => (
                <button
                  key={value}
                  onClick={() => setMarketItemsPerRow(value)}
                  className={`px-3 py-1 rounded-md text-sm ${marketItemsPerRow === value 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* 通用模块设置 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">通用模块</h2>
        
        {/* 涨跌颜色配置 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            涨跌颜色配置
          </label>
          <div className="flex gap-4">
            {/* 红色为涨选项 */}
            <button
              onClick={() => setColorScheme('red-up')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${colorScheme === 'red-up' 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}
            >
              <span className="text-red-600 dark:text-red-400 font-bold">涨</span>
              <span className="text-gray-400">/</span>
              <span className="text-green-600 dark:text-green-400 font-bold">跌</span>
            </button>
            
            {/* 红色为跌选项 */}
            <button
              onClick={() => setColorScheme('red-down')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${colorScheme === 'red-down' 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}
            >
              <span className="text-green-600 dark:text-green-400 font-bold">涨</span>
              <span className="text-gray-400">/</span>
              <span className="text-red-600 dark:text-red-400 font-bold">跌</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '保存中...' : '保存'}
          </button>
          
          {/* 保存成功提示 */}
          {saveSuccess && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              保存成功
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
