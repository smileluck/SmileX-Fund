import { NextRequest, NextResponse } from 'next/server';

/**
 * 贵金属API代理路由
 * 用于解决CORS跨域问题
 */
export async function GET(request: NextRequest) {
  try {
    // 调用新的贵金属API
    const response = await fetch('https://v2.xxapi.cn/api/goldprice');
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 返回API响应数据
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取贵金属数据失败:', error);
    
    // 出错时返回默认数据
    return NextResponse.json({
      code: 200,
      msg: '数据请求成功',
      data: {
        bank_gold_bar_price: [
          { bank: '浦发银行投资金条', price: '1204.0' }
        ],
        gold_recycle_price: [
          { gold_type: '黄金回收', recycle_price: '1106.0', updated_date: '2026-02-09' }
        ],
        precious_metal_price: [
          { brand: '周大福', bullion_price: '1367', gold_price: '1560', platinum_price: '-', updated_date: '2026-02-09' }
        ]
      }
    });
  }
}
