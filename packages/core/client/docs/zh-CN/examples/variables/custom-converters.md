# 自定义 Converters - 高级定制功能

Converters 是 VariableInput 的核心机制，允许开发者完全自定义组件的渲染逻辑、值处理和路径解析。通过 converters，可以实现任意复杂的业务逻辑和 UI 定制。

## Converters 接口

```typescript
interface Converters {
  // 自定义输入组件渲染
  renderInputComponent?: (
    meta: MetaTreeNode | null, 
    value: any, 
    componentTypeHint?: string | null
  ) => React.ComponentType<any> | null;
  
  // 自定义路径解析
  resolvePathFromValue?: (value: any) => string[] | null;
  
  // 自定义值生成
  resolveValueFromPath?: (meta: MetaTreeNode, path: string[]) => any;
}
```

## 核心概念

### 1. renderInputComponent

这是最重要的方法，决定了为给定的值和上下文渲染什么组件：

- **meta 参数**：如果当前值是变量（如 `{{ ctx.user.name }}`），则包含对应的元数据；如果是静态值，则为 `null`
- **value 参数**：当前的值
- **componentTypeHint 参数**：组件类型提示，从变量名自动推断（如 'rate', 'switch', 'number' 等）

### 2. 智能组件切换

VariableInput 支持智能的组件切换机制：

1. **变量 → 静态值**：当用户清除变量时，会根据 `componentTypeHint` 保持合适的组件类型
2. **类型推断**：从变量名自动推断组件类型（如 `userRating` → `rate`，`enabled` → `switch`）
3. **默认值处理**：清除变量时提供类型相关的默认值

## 使用示例

<code src="./custom-converters.tsx"></code>

## 常见使用模式

### 1. 基于值类型的组件选择

```typescript
const typeBasedConverters: Converters = {
  renderInputComponent: (meta, value) => {
    if (!meta) { // 静态值
      if (typeof value === 'number') {
        return (props) => <InputNumber {...props} />;
      }
      if (typeof value === 'boolean') {
        return (props) => <Switch checked={props.value} onChange={props.onChange} />;
      }
    }
    return null; // 使用默认组件
  },
};
```

### 2. 基于组件类型提示的选择

```typescript
const hintBasedConverters: Converters = {
  renderInputComponent: (meta, value, componentTypeHint) => {
    if (!meta && componentTypeHint) {
      switch (componentTypeHint) {
        case 'rate':
          return (props) => <Rate value={props.value} onChange={props.onChange} />;
        case 'switch':
          return (props) => <Switch checked={props.value} onChange={props.onChange} />;
        case 'date':
          return (props) => <DatePicker {...props} />;
      }
    }
    return null;
  },
};
```

### 3. 复合条件判断

```typescript
const complexConverters: Converters = {
  renderInputComponent: (meta, value, componentTypeHint) => {
    if (!meta) {
      // 优先使用组件类型提示
      if (componentTypeHint === 'rate') {
        return (props) => <Rate value={props.value} onChange={props.onChange} />;
      }
      
      // 回退到值类型判断
      if (typeof value === 'number' && value >= 0 && value <= 5) {
        return (props) => <Rate value={props.value} onChange={props.onChange} />;
      }
      
      // 特殊值判断
      if (value === 'light' || value === 'dark') {
        return (props) => (
          <Select {...props}>
            <Select.Option value="light">Light</Select.Option>
            <Select.Option value="dark">Dark</Select.Option>
          </Select>
        );
      }
    }
    return null;
  },
};
```

## 组件类型提示机制

VariableInput 会自动从变量名推断组件类型：

| 变量名模式 | 推断类型 | 默认组件 | 默认值 |
|-----------|----------|----------|--------|
| `*rating*`, `*rate*`, `*score*` | `rate` | Rate | `0` |
| `*enable*`, `*switch*`, `*toggle*` | `switch` | Switch | `false` |
| `*count*`, `*number*`, `*amount*` | `number` | InputNumber | `0` |
| `*date*`, `*time*` | `date` | DatePicker | `null` |
| `*theme*`, `*select*`, `*option*` | `select` | Select | `''` |

## 高级特性

### 1. 自定义路径解析

```typescript
const customPathConverters: Converters = {
  resolvePathFromValue: (value) => {
    // 支持自定义变量格式
    if (typeof value === 'string' && value.startsWith('$')) {
      return value.substring(1).split('.');
    }
    return null; // 使用默认解析
  },
  
  resolveValueFromPath: (meta, path) => {
    // 生成自定义格式的变量
    return `$${path.join('.')}`;
  },
};
```

### 2. 条件渲染逻辑

```typescript
const conditionalConverters: Converters = {
  renderInputComponent: (meta, value, componentTypeHint) => {
    // 只在特定条件下使用自定义组件
    if (!meta && someCondition) {
      return CustomComponent;
    }
    return null;
  },
};
```

## 最佳实践

1. **返回 null**：当不需要自定义处理时，返回 `null` 使用默认行为
2. **优先级设计**：componentTypeHint > 值类型判断 > 默认组件
3. **性能考虑**：避免在 converter 函数中进行重复的复杂计算
4. **类型安全**：为自定义组件提供正确的 TypeScript 类型
5. **测试覆盖**：为复杂的 converter 逻辑编写单元测试

## 与其他组件集成

Converters 不仅可以返回 antd 组件，还可以返回任何自定义 React 组件：

```typescript
const customComponentConverters: Converters = {
  renderInputComponent: (meta, value) => {
    if (!meta && isComplexValue(value)) {
      return MyCustomComplexInput;
    }
    return null;
  },
};
```

这样的设计让 VariableInput 具有无限的扩展可能性，可以适应任何复杂的业务场景。