// 基金搜索 API 路由
// 用于代理基金搜索请求，解决 CORS 问题
import { NextRequest, NextResponse } from 'next/server';

/**
 * 基金搜索结果接口
 */
interface FundSearchResult {
  _id: string;
  CODE: string;
  NAME: string;
  JP: string;
  CATEGORY: number;
  CATEGORYDESC: string;
  STOCKMARKET: any;
  BACKCODE: string;
  MatchCount: number;
  FundBaseInfo: {
    _id: string;
    FCODE: string;
    FUNDTYPE: string;
    ISBUY: string;
    JJGS: string;
    JJGSBID: number;
    JJGSID: string;
    JJJL: string;
    JJJLID: string;
    MINSG: number;
    OTHERNAME: string;
    RSFUNDTYPE: string;
    SHORTNAME: string;
    FTYPE: string;
    DWJZ: number;
    FSRQ: string;
    NAVURL: string;
  };
  StockHolder: any;
  ZTJJInfo: any[];
  SEARCHWEIGHT: number;
  NEWTEXCH: string;
}

/**
 * 基金搜索响应接口
 */
interface FundSearchResponse {
  ErrCode: number;
  ErrMsg: string;
  Datas: FundSearchResult[];
}

/**
 * 验证基金代码格式
 * @param fundCode 基金代码
 * @returns 是否为有效的基金代码
 */
function validateFundCode(fundCode: string): boolean {
  // 基金代码通常为6位数字
  return /^\d{6}$/.test(fundCode);
}

/**
 * 处理基金搜索请求
 * @param request 请求对象
 * @returns 响应对象
 */
export async function GET(request: NextRequest) {
  try {
    // 从查询参数中获取基金代码
    const fundCode = request.nextUrl.searchParams.get('code');
    
    // 验证基金代码
    if (!fundCode || !validateFundCode(fundCode)) {
      return NextResponse.json(
        { error: '无效的基金代码格式' },
        { status: 400 }
      );
    }
    
    const timestamp = Date.now();
    // 构建API请求URL
    const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${fundCode}&callback=SuggestData_${timestamp}&_=${timestamp}`;
    
    // 发送请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    // 检查响应状态
    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP error! status: ${response.status}` },
        { status: 500 }
      );
    }
    
    // 解析响应数据
    const text = await response.text();
    // 移除JSONP包装
    const jsonpMatch = text.match(/^\w+\((.*)\)$/);
    if (!jsonpMatch) {
      return NextResponse.json(
        { error: '无效的响应格式' },
        { status: 500 }
      );
    }
    
    const data: FundSearchResponse = JSON.parse(jsonpMatch[1]);
    
    // 检查是否有错误
    if (data.ErrCode !== 0) {
      return NextResponse.json(
        { error: data.ErrMsg || '搜索基金失败' },
        { status: 500 }
      );
    }
    
    // 返回第一个结果（如果有）
    const result = data.Datas.length > 0 ? data.Datas[0] : null;
    return NextResponse.json(result);
  } catch (error) {
    console.error('搜索基金失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
