// 基金实时数据 API 路由
// 用于代理基金实时数据请求，解决 CORS 问题
import { NextRequest, NextResponse } from 'next/server';

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
 * 处理基金实时数据请求
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
    
    // 构建API请求URL
    const url = `https://fundgz.1234567.com.cn/js/${fundCode}.js`;
    
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
    const jsonpMatch = text.match(/^jsonpgz\((.*)\);$/);
    if (!jsonpMatch) {
      return NextResponse.json(
        { error: '无效的响应格式' },
        { status: 500 }
      );
    }
    
    const fundData = JSON.parse(jsonpMatch[1]);
    
    // 构建返回数据
    const result = {
      code: fundData.fundcode,
      name: fundData.name,
      netValue: parseFloat(fundData.dwjz),
      estimatedValue: parseFloat(fundData.gsz),
      changeRate: parseFloat(fundData.gszzl),
      updateTime: fundData.gztime
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取基金实时数据失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
