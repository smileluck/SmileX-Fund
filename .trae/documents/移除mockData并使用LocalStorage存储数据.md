# 移除mockData并使用LocalStorage存储数据计划

## 1. 分析现有代码结构
- 保留现有的数据接口定义（FundBasic, FundValuation, FundInfo等）
- 分析FundMockService的使用方式和功能
- 确定需要迁移到LocalStorage的数据类型

## 2. 创建LocalStorage服务
- 创建新的`LocalStorageService`类来替代`FundMockService`
- 实现数据的本地存储和读取功能
- 保持与原有服务相同的API接口，确保兼容性

## 3. 实现数据迁移
- 初始化LocalStorage数据，使用现有的mockData作为初始数据
- 实现数据的持久化存储
- 确保数据结构的一致性

## 4. 修改主页面和组件
- 更新`app/page.tsx`中的数据获取方式
- 修改相关组件以使用新的LocalStorage服务
- 确保所有功能正常运行

## 5. 为云端同步做准备
- 设计数据同步的接口和机制
- 实现数据版本控制，以便后续的云端同步
- 添加数据同步状态管理

## 6. 测试和优化
- 测试数据的存储和读取功能
- 优化LocalStorage的使用，避免存储过大的数据
- 确保页面性能不受影响

## 7. 实现细节
- 使用try-catch处理LocalStorage操作可能的异常
- 实现数据的自动更新机制，替代原有的定时更新
- 保持数据的实时性和准确性

## 8. 后续扩展
- 设计云端同步的API接口
- 实现用户认证和授权机制
- 考虑数据加密和安全存储