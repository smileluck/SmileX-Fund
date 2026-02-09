// API服务
// 提供基金相关的API调用功能

/**
 * 基金搜索结果接口
 */
export interface FundSearchResult {
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
export interface FundSearchResponse {
  ErrCode: number;
  ErrMsg: string;
  Datas: FundSearchResult[];
}

/**
 * 搜索基金
 * @param fundCode 基金代码
 * @returns 基金搜索结果
 */
export async function searchFund(fundCode: string): Promise<FundSearchResult | null> {
  try {
    // 验证基金代码
    if (!validateFundCode(fundCode)) {
      throw new Error('无效的基金代码格式');
    }
    
    // 构建本地API请求URL
    const url = `/api/fund/search?code=${fundCode}`;
    
    // 发送请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 解析响应数据
    const data = await response.json();
    
    // 检查是否有错误
    if (data.error) {
      throw new Error(data.error);
    }
    
    // 返回结果
    return data;
  } catch (error) {
    console.error('搜索基金失败:', error);
    // 处理不同类型的错误
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('请求超时');
    }
    return null;
  }
}

/**
 * 验证基金代码格式
 * @param fundCode 基金代码
 * @returns 是否为有效的基金代码
 */
export function validateFundCode(fundCode: string): boolean {
  // 基金代码通常为6位数字
  return /^\d{6}$/.test(fundCode);
}
