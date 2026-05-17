// 基金历史净值 API 路由
// 代理天天基金历史净值接口，移除 JSONP 包装
// 天天基金 API 每页最多返回 20 条，需要分页获取
import { NextRequest, NextResponse } from 'next/server';

function validateFundCode(fundCode: string): boolean {
  return /^\d{6}$/.test(fundCode);
}

const PAGE_SIZE = 20;

async function fetchPage(fundCode: string, pageIndex: number): Promise<any[]> {
  const url = `https://api.fund.eastmoney.com/f10/lsjz?callback=jQuery&fundCode=${fundCode}&pageIndex=${pageIndex}&pageSize=${PAGE_SIZE}&startDate=&endDate=`;

  const maxRetries = 3;
  const baseDelay = 1000;
  let response: Response | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://fund.eastmoney.com/',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) break;
      if (attempt === maxRetries - 1) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
    }
  }

  if (!response || !response.ok) {
    throw new Error('获取历史数据失败');
  }

  const text = await response.text();
  const jsonpMatch = text.match(/^\w+\((.*)\)$/);
  if (!jsonpMatch) throw new Error('无效的响应格式');

  const parsed = JSON.parse(jsonpMatch[1]);
  const list = parsed?.Data?.LSJZList;
  if (!Array.isArray(list)) throw new Error('数据格式异常');

  return list;
}

export async function GET(request: NextRequest) {
  try {
    const fundCode = request.nextUrl.searchParams.get('code');
    const daysParam = request.nextUrl.searchParams.get('days');

    if (!fundCode || !validateFundCode(fundCode)) {
      return NextResponse.json({ error: '无效的基金代码格式' }, { status: 400 });
    }

    const days = Math.min(Math.max(parseInt(daysParam || '30') || 30, 1), 365);
    // 估算需要的页数：交易日 ≈ 日历日 * 5/7，每页 20 条
    const pagesNeeded = Math.ceil(days * 5 / 7 / PAGE_SIZE) || 1;

    // 并行获取所有页面
    const pagePromises = [];
    for (let i = 1; i <= pagesNeeded; i++) {
      pagePromises.push(fetchPage(fundCode, i));
    }

    const pages = await Promise.all(pagePromises);
    const allItems = pages.flat();

    const items = allItems.map((item: any) => ({
      date: item.FSRQ as string,
      value: parseFloat(item.DWJZ) || 0,
      changeRate: parseFloat(item.JZZZL) || 0,
    }));

    // 按日期升序排序（旧 → 新）
    items.sort((a, b) => a.date.localeCompare(b.date));

    // 按请求的日历天数裁剪，只保留范围内数据
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    const filtered = items.filter(item => item.date >= cutoffStr);

    return NextResponse.json(
      { items: filtered, totalCount: filtered.length },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('获取基金历史净值失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
