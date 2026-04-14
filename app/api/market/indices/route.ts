// 市场指数实时数据 API 路由
// 用于获取中国主要股票指数的实时行情数据，解决 CORS 问题
import { NextRequest, NextResponse } from 'next/server';

/**
 * 市场指数配置接口
 */
interface MarketIndexConfig {
  name: string;           // 指数名称
  code: string;           // 指数代码（新浪财经格式）
  symbol: string;         // 股票代码
}

/**
 * 支持的市场指数列表
 */
const MARKET_INDICES: MarketIndexConfig[] = [
  { name: '上证指数', code: 'sh000001', symbol: '000001' },
  { name: '深证成指', code: 'sz399001', symbol: '399001' },
  { name: '创业板指', code: 'sz399006', symbol: '399006' },
  { name: '恒生指数', code: 'hkHSI', symbol: 'HSI' },
];

/**
 * 解析新浪财经返回的实时数据
 * @param rawData 原始数据字符串
 * @returns 解析后的对象或 null
 */
function parseSinaMarketData(rawData: string): Record<string, any> | null {
  try {
    // 新浪财经返回格式：var hq_str_sh000001="上证指数,3258.63,26.52,0.82,...";
    const match = rawData.match(/"([^"]+)"/);
    if (!match) return null;

    const fields = match[1].split(',');
    
    return {
      name: fields[0] || '',                    // 指数名称
      currentPrice: parseFloat(fields[1]) || 0,  // 当前价格
      changePrice: parseFloat(fields[2]) || 0,   // 涨跌额
      changePercent: parseFloat(fields[3]) || 0, // 涨跌幅(%)
      buyPrice: parseFloat(fields[4]) || 0,      // 买价
      sellPrice: parseFloat(fields[5]) || 0,     // 卖价
      openPrice: parseFloat(fields[6]) || 0,     // 开盘价
      yesterdayClose: parseFloat(fields[7]) || 0,// 昨收
      highPrice: parseFloat(fields[8]) || 0,     // 最高
      lowPrice: parseFloat(fields[9]) || 0,      // 最低
      updateTime: fields[30] || new Date().toLocaleTimeString('zh-CN'), // 更新时间
    };
  } catch (error) {
    console.error('解析市场数据失败:', error);
    return null;
  }
}

/**
 * 格式化价格显示
 * @param price 价格数值
 * @returns 格式化后的字符串
 */
function formatPrice(price: number): string {
  if (price >= 10000) {
    return price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toFixed(2);
}

/**
 * 格式化涨跌幅显示
 * @param percent 百分比数值
 * @returns 格式化后的字符串（带正负号）
 */
function formatChangePercent(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

/**
 * 处理 GET 请求 - 获取市场指数实时数据
 * @param request 请求对象
 * @returns 响应对象
 */
export async function GET(request: NextRequest) {
  try {
    const results: Array<{
      name: string;
      value: string;
      change: string;
      isUp: boolean;
      updateTime: string;
    }> = [];

    // 并行请求所有指数数据，提高性能
    const fetchPromises = MARKET_INDICES.map(async (index) => {
      try {
        const url = `https://hq.sinajs.cn/list=${index.code}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': '*/*',
            'Referer': 'https://finance.sina.com.cn/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        const parsedData = parseSinaMarketData(text);

        if (parsedData) {
          return {
            name: index.name,
            value: formatPrice(parsedData.currentPrice),
            change: formatChangePercent(parsedData.changePercent),
            isUp: parsedData.changePercent >= 0,
            updateTime: parsedData.updateTime
          };
        }

        return null;
      } catch (error) {
        console.error(`获取 ${index.name} 数据失败:`, error);
        return null;
      }
    });

    // 等待所有请求完成
    const fetchedResults = await Promise.all(fetchPromises);

    // 过滤掉失败的结果并添加到结果数组
    fetchedResults.forEach(result => {
      if (result) {
        results.push(result);
      }
    });

    // 如果所有请求都失败，返回错误
    if (results.length === 0) {
      return NextResponse.json(
        { 
          error: '无法获取市场指数数据',
          message: '所有数据源请求失败' 
        },
        { status: 503 }
      );
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: results,
      updateTime: new Date().toLocaleString('zh-CN'),
      count: results.length
    });

  } catch (error) {
    console.error('获取市场指数实时数据失败:', error);
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
