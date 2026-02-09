import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MetalTabProps {
  preciousMetals: any[];
  goldHistory?: any[];
  silverHistory?: any[];
}

/**
 * 贵金属Tab组件
 * 包含贵金属板块和趋势图
 */
export default function MetalTab({ preciousMetals, goldHistory, silverHistory }: MetalTabProps) {
  return (
    <div>
      {/* 贵金属 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">贵金属</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {preciousMetals.map((metal, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{metal.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">{metal.value}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{metal.unit}</span>
              </div>
              <div className={`text-sm font-medium mt-1 ${metal.isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {metal.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 黄金趋势图 */}
      {goldHistory && goldHistory.length > 0 && (
        <div className="mb-8 bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
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
        <div className="mb-8 bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
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
  );
}
