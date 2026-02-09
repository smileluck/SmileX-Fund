// 批量操作工具函数
// 提供持仓的批量添加和删除功能

import { UserHolding } from './mockData';
import { searchFund } from './api';

/**
 * 批量添加持仓的输入项接口
 */
export interface BatchAddItem {
  code: string;
  shares: number;
  costPrice: number;
  fundName?: string;
  holdingAmount?: number;
  holdingProfit?: number;
  error?: string;
  fundType?: string; // 基金类型
  fundCompany?: string; // 基金公司
  fundManager?: string; // 基金经理
  latestNav?: number; // 最新净值
  navDate?: string; // 净值日期
  industryInfo?: string; // 行业信息
}

/**
 * 批量添加持仓的结果接口
 */
export interface BatchAddResult {
  success: boolean;
  code: string;
  name?: string;
  error?: string;
}

/**
 * 批量添加持仓
 * @param items 要添加的持仓列表
 * @returns 添加结果列表
 */
export async function batchAddHoldings(items: BatchAddItem[]): Promise<BatchAddResult[]> {
  const results: BatchAddResult[] = [];

  // 限制批量处理数量
  const limitedItems = items.slice(0, 10);

  for (const item of limitedItems) {
    try {
      // 验证基金代码
      if (!/^\d{6}$/.test(item.code)) {
        results.push({
          success: false,
          code: item.code,
          error: '无效的基金代码格式'
        });
        continue;
      }

      // 验证持仓金额
      if (item.holdingAmount && item.holdingAmount < 0) {
        results.push({
          success: false,
          code: item.code,
          error: '持仓金额不能小于0'
        });
        continue;
      }

      // 验证数值范围
      if (item.holdingAmount && item.holdingAmount > 1000000) {
        results.push({
          success: false,
          code: item.code,
          error: '持仓金额不能超过1,000,000'
        });
        continue;
      }

      // 搜索基金信息
      const fundInfo = await searchFund(item.code);
      if (!fundInfo) {
        results.push({
          success: false,
          code: item.code,
          error: '未找到基金信息'
        });
        continue;
      }

      results.push({
        success: true,
        code: item.code,
        name: fundInfo.NAME
      });
    } catch (error) {
      results.push({
        success: false,
        code: item.code,
        error: '添加失败：' + (error instanceof Error ? error.message : '未知错误')
      });
    }
  }

  return results;
}

/**
 * 批量删除持仓
 * @param holdings 当前持仓列表
 * @param codes 要删除的基金代码列表
 * @returns 删除后的持仓列表
 */
export function batchDeleteHoldings(holdings: UserHolding[], codes: string[]): UserHolding[] {
  return holdings.filter(holding => !codes.includes(holding.code));
}

/**
 * 验证批量添加的输入数据
 * @param items 输入数据列表
 * @returns 验证结果
 */
export function validateBatchAddItems(items: BatchAddItem[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('请至少添加一项持仓');
    return { valid: false, errors };
  }

  if (items.length > 10) {
    errors.push('每次最多添加10项持仓');
    return { valid: false, errors };
  }

  // 检查重复代码
  const codes = items.map(item => item.code);
  const uniqueCodes = new Set(codes);
  if (codes.length !== uniqueCodes.size) {
    errors.push('存在重复的基金代码');
  }

  // 检查每个项目
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!/^\d{6}$/.test(item.code)) {
      errors.push(`第${i + 1}项：无效的基金代码格式`);
    }
    if (item.holdingAmount && item.holdingAmount < 0) {
      errors.push(`第${i + 1}项：持仓金额不能小于0`);
    }
  }

  return { valid: errors.length === 0, errors };
}
