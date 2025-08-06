# Constant 二层上下文 - 结构化常量定义

本示例展示如何使用 `FlowContext.defineProperty()` 定义二层的结构化常量上下文，并通过自定义 `converters` 为不同类型的子常量选择专门的 Ant Design 输入组件。

## 功能特点

### 1. 二层常量结构

通过 `FlowContext.defineProperty()` 可以定义具有层级结构的常量：

```typescript
// 定义 Constant 父级，包含不同类型的子常量
flowContext.defineProperty('Constant', {
  value: {
    number: 42,
    string: 'Hello World', 
    date: new Date().toISOString()
  },
  meta: {
    title: 'Constant',
    type: 'object',
    properties: {
      number: { title: 'Number Value', type: 'number' },
      string: { title: 'String Value', type: 'string' },
      date: { title: 'Date Value', type: 'string', interface: 'date' }
    }
  }
});
```

### 2. 专门的组件选择

根据子常量的类型和接口，自动选择对应的 Ant Design 组件：

- **Constant → number** → `InputNumber` 组件
- **Constant → string** → `Input` 组件
- **Constant → date** → `DatePicker` 组件

### 3. 智能层级导航

FlowContextSelector 会展示层级结构：
1. 第一层显示：`Constant`
2. 第二层显示：`number`、`string`、`date` 等子项
3. 选择后生成完整路径：`{{ ctx.Constant.number }}`

## 使用场景

这种二层常量定义特别适合以下场景：

- **分类常量管理**: 将相关常量组织在同一个父级下
- **配置分组**: 数据库配置、API配置、UI配置等
- **业务常量集合**: 产品参数、价格体系、规格标准等
- **多语言资源**: 不同语言的文本常量
- **主题配置**: 颜色、字体、尺寸等设计常量

## 结构对比

### 单层结构 vs 二层结构

**单层结构**：
```
├── appName (string)
├── version (number)
└── debugMode (boolean)
```

**二层结构**：
```
└── Constant (object)
    ├── number (number)
    ├── string (string)
    ├── date (date)
    └── config (object)
        ├── timeout (number)
        └── enabled (boolean)
```

## 核心实现

```typescript
const multiLevelConverters: Converters = {
  renderInputComponent: (meta, value, componentTypeHint) => {
    if (!meta) { // 静态值模式
      // 根据组件类型提示选择专门的组件
      if (componentTypeHint === 'number') {
        return (props) => <InputNumber {...props} />;
      }
      if (componentTypeHint === 'date') {
        return (props) => <DatePicker {...props} showTime />;
      }
      // 默认使用 Input（字符串）
      return null;
    }
    return null; // 变量模式使用默认 VariableTag
  },
};
```

## 演示内容

<code src="./constant-multi-level.tsx"></code>

## 高级特性

### 1. 动态子节点加载

支持异步加载子节点，适合大型常量集合：

```typescript
// 支持函数形式的子节点定义
properties: {
  dynamicConfig: async () => {
    // 异步加载配置
    return await loadConfig();
  }
}
```

### 2. 条件性组件选择

根据路径上下文选择不同组件：

```typescript
renderInputComponent: (meta, value, componentTypeHint) => {
  // 根据完整路径判断
  if (meta?.path?.includes('Constant.number')) {
    return NumberSpecialInput;
  }
  return null;
}
```

### 3. 嵌套层级支持

支持更深层次的嵌套结构：

```
Constant
├── basic
│   ├── number
│   └── string
└── advanced
    ├── config
    │   ├── timeout
    │   └── retries
    └── settings
        └── theme
```

## 最佳实践

1. **合理分组**: 将相关的常量放在同一个父级下
2. **清晰命名**: 使用描述性的属性名和标题
3. **类型一致**: 同级别的常量保持类型的逻辑一致性
4. **适度嵌套**: 避免过深的层级结构（建议不超过3层）
5. **性能考虑**: 大量常量时使用懒加载机制

## 相关文档

- [单层常量上下文示例](./constant-single-level.md)
- [自定义 Converters](./custom-converters.md)
- [FlowContextSelector 使用指南](./flow-context-selector.md)