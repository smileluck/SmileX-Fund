# 统一数据源并移除mockData模块

## 实现步骤

### 1. 分析当前数据存储结构
- 检查LocalStorage中存储的数据结构和键名
- 了解当前dataService.ts的实现，特别是数据读写方法
- 分析mockData.ts中定义的数据模型和模拟数据生成逻辑

### 2. 重构数据模型定义
- 将mockData.ts中的数据模型接口（如UserHolding、Wallet、FundInfo等）移动到dataService.ts中
- 确保数据模型定义与LocalStorage中存储的数据结构一致

### 3. 修改dataService.ts实现
- 移除所有生成模拟数据的方法，如getAllFunds、getMarketIndices等
- 实现从LocalStorage中读取基金数据、市场指数等数据的方法
- 确保所有数据操作都通过LocalStorage进行，不再依赖模拟数据

### 4. 更新数据初始化逻辑
- 修改应用初始化逻辑，确保首次加载时能够正确初始化数据到LocalStorage
- 实现数据迁移逻辑，确保现有数据能够平滑过渡

### 5. 更新组件和页面
- 修改所有引用mockData的组件，改为从dataService获取数据
- 移除所有对mockData模块的导入
- 确保所有数据操作都使用新的dataService方法

### 6. 清理冗余文件
- 删除mockData.ts文件
- 清理所有不再使用的代码和导入

### 7. 验证功能
- 确保应用能够正常启动和运行
- 确保所有数据操作（添加、编辑、删除持仓等）正常工作
- 确保页面渲染和交互正常

## 技术要点

1. **数据模型迁移**：将数据模型定义从mockData.ts移动到dataService.ts，确保数据结构一致性

2. **LocalStorage数据管理**：实现完整的LocalStorage数据读写逻辑，包括数据初始化、更新和删除

3. **代码重构**：修改所有引用mockData的代码，改为使用dataService获取数据

4. **错误处理**：确保在LocalStorage操作失败时，应用能够正常运行，避免崩溃

5. **数据初始化**：实现首次加载时的数据初始化逻辑，确保应用有默认数据可用

## 预期效果

- 完全移除mockData相关模块，所有数据都从LocalStorage获取
- 应用能够正常启动和运行，所有功能保持正常
- 代码结构更加清晰，不再依赖模拟数据
- 数据持久化更加可靠，用户数据能够正确保存和读取