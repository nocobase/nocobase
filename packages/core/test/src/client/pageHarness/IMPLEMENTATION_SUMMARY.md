# Page Test Harness 实现总结

## 概述

Page Test Harness 是一个用于在单元测试中快速创建和测试 NocoBase 2.0 页面的工具。它提供了简洁易用的 API，支持从空页面到复杂多 Tab 页面的各种场景。

## 实现的文件

### 核心文件

1. **types.ts** - 类型定义
   - `PageTestHarnessConfig`: 页面配置接口
   - `BlockConfig`: 区块配置接口
   - `TabConfig`: 标签页配置接口
   - `FieldConfig`: 字段配置接口
   - `ActionConfig`: 按钮配置接口
   - `StepParams`: Flow Engine 的步骤参数配置

2. **normalizer.ts** - 配置规范化
   - `normalizePageConfig()`: 将用户配置转换为内部规范
   - `normalizeBlock()`: 处理区块配置
   - `normalizeTab()`: 处理标签页配置
   - `normalizeField/Column/Action()`: 处理子组件
   - `extractStepParamsFromSimplifiedProps()`: 提取简化属性到 stepParams

3. **PageTestHarness.tsx** - 测试工具类
   - `getRootPageModel()`: 获取根页面模型
   - `getTabModel()`: 根据 key 或 title 获取标签页
   - `findBlock()`: 递归查找区块
   - `render()`: 渲染页面
   - `cleanup()`: 清理资源

4. **index.ts** - 主入口
   - `createPageTestHarness()`: 工厂函数
   - `setupApiMocks()`: 配置 axios 模拟
   - `setupMockData()`: 配置 CRUD 端点
   - `setupCollections()`: 配置集合 API

5. **README.md** - 完整文档
   - 基础用法示例
   - stepParams 配置说明
   - 高级场景示例
   - API 参考

### 测试文件

1. **`__tests__/index.test.ts`** - 单元测试
   - 15 个测试用例，全部通过
   - 覆盖基础用法、stepParams、tabs、复杂场景等

### 导出文件

1. **client/pageHarness/index.ts** - 客户端导出
   - 为客户端测试提供便捷导出

1. **client/index.tsx** - 更新主导出文件
   - 添加 pageHarness 到总导出

## API 设计

### 核心特性

1. **渐进式复杂度**

   ```typescript
   // 最简形式
   { blocks: ['users'] }
   
   // 只指定 collection
   { blocks: [{ collection: 'users' }] }
   
   // 完整配置
   { 
     blocks: [{ 
       type: 'Table', 
       collection: 'users',
       stepParams: {...}
     }] 
   }
   ```

2. **支持 stepParams**
   - 页面级 stepParams
   - Tab 级 stepParams
   - 区块级 stepParams
   - 字段级 stepParams
   - 按钮级 stepParams

3. **类型安全**
   - 完整的 TypeScript 类型定义
   - 编辑器智能提示
   - 编译时类型检查

## 测试结果

所有 15 个测试用例都通过：

```text
✓ basic usage (3)
  ✓ should create an empty page
  ✓ should create a page with a single Table block
  ✓ should create a page with mock data
✓ stepParams configuration (4)
  ✓ should configure block with stepParams
  ✓ should support simplified props that convert to stepParams
  ✓ should configure fields with stepParams
  ✓ should configure actions with stepParams
✓ tabs configuration (2)
  ✓ should create a page with multiple tabs
  ✓ should configure tabs with stepParams
✓ page configuration (2)
  ✓ should configure page with stepParams
  ✓ should configure page title and config
✓ complex scenarios (2)
  ✓ should create a complete page with tabs, blocks, and data
  ✓ should support mixed simple and detailed configuration
✓ utility methods (2)
  ✓ should get root page model
  ✓ should get tab models
```

## 使用方法

### 安装

```typescript
import { createPageTestHarness } from '@nocobase/test/client';
```

### 运行测试

```bash
# 必须使用 --client 标志
yarn test --client packages/core/test/src/pageHarness/__tests__/index.test.ts
```

### 示例

```typescript
// 创建带 Table 区块的页面
const harness = await createPageTestHarness({
  blocks: [
    {
      type: 'Table',
      collection: 'users',
      columns: ['name', 'email'],
      actions: ['add', 'edit', 'delete'],
    },
  ],
  data: {
    users: [
      { id: 1, name: 'Alice', email: 'alice@test.com' },
    ],
  },
});

// 渲染并测试
await harness.render();
const page = harness.getRootPageModel();
expect(page).toBeDefined();
```

## 技术亮点

1. **灵活的配置系统**
   - 支持简化写法和详细配置混用
   - 自动提取简化属性到 stepParams
   - 完整的类型推断

2. **完善的 Mock 系统**
   - 自动配置 axios mock
   - 支持自定义数据
   - 支持自定义 API mock

3. **易于扩展**
   - 清晰的模块划分
   - 可扩展的区块类型映射
   - 可自定义的模型注册

4. **良好的测试覆盖**
   - 15 个测试用例
   - 覆盖所有主要功能
   - 包括复杂场景测试

## 后续优化建议

1. **增强 findBlock 方法**
   - 考虑添加按 stepParams 查找的功能
   - 提供更多便捷的查找方式

2. **添加更多预设区块**
   - List 区块
   - Grid Card 区块
   - Chart 区块
   - Filter form 区块

3. **增强文档**
   - 添加更多实际使用场景
   - 提供完整的 API 参考
   - 添加常见问题解答

4. **性能优化**
   - 考虑缓存模型创建
   - 优化大量区块的创建性能

## 总结

Page Test Harness 成功实现了以下目标：

- ✅ 提供简洁易用的 API
- ✅ 支持从简单到复杂的各种场景
- ✅ 完整的 stepParams 配置支持
- ✅ 类型安全
- ✅ 完善的测试覆盖
- ✅ 清晰的文档

该工具现在可以用于 NocoBase 2.0 的页面单元测试，大大简化了测试代码的编写。
