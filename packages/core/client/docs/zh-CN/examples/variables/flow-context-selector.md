# FlowContextSelector - 上下文变量选择器

FlowContextSelector 是一个基于 antd Cascader 的上下文变量选择器组件，专门用于在流程引擎中选择上下文变量。

## 主要特性

- **层级选择**：支持多级嵌套的上下文结构选择
- **异步加载**：支持异步 metaTree 和懒加载子节点
- **搜索功能**：内置多级菜单搜索能力
- **变量格式**：自动生成 `{{ ctx.path }}` 格式的变量字符串
- **预选中支持**：根据 value 自动展开并选中对应路径
- **自定义触发器**：支持自定义触发按钮样式

## API

### FlowContextSelectorProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| value | `string` | - | 当前选中的变量值，格式为 `{{ ctx.path }}` |
| onChange | `(value: string) => void` | - | 变量选择变化时的回调 |
| metaTree | `MetaTreeNode[] \| (() => MetaTreeNode[] \| Promise<MetaTreeNode[]>)` | - | 上下文变量的元数据树 |
| children | `React.ReactNode` | `<Button>Var</Button>` | 自定义触发按钮 |
| showSearch | `boolean` | `false` | 是否显示搜索框 |

### MetaTreeNode

```typescript
interface MetaTreeNode {
  name: string;           // 字段名
  title: string;          // 显示标题
  type: string;           // 字段类型
  interface?: string;     // 接口类型
  children?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
}
```

## 使用示例

<code src="./flow-context-selector.tsx"></code>

## 核心功能说明

### 1. 异步数据加载

FlowContextSelector 支持异步的 metaTree 和懒加载的子节点：

```typescript
const metaTree: MetaTreeNode[] = [
  {
    name: 'user',
    title: 'User',
    type: 'object',
    children: [
      { name: 'name', title: 'Name', type: 'string' },
      { name: 'profile', title: 'Profile', type: 'object',
        children: async () => {
          // 异步加载子节点
          const response = await fetch('/api/profile-fields');
          return response.json();
        }
      },
    ],
  }
];
```

### 2. 搜索功能

启用 `showSearch` 属性后，用户可以在多级菜单中搜索变量：

```typescript
<FlowContextSelector
  metaTree={metaTree}
  value={value}
  onChange={setValue}
  showSearch // 启用搜索
/>
```

### 3. 自定义触发按钮

可以通过 children 属性自定义触发按钮：

```typescript
<FlowContextSelector
  metaTree={metaTree}
  value={value}
  onChange={setValue}
>
  <Button type="primary" icon={<SearchOutlined />}>
    选择变量
  </Button>
</FlowContextSelector>
```

### 4. 变量格式

FlowContextSelector 会自动将选择的路径转换为标准的变量格式：

- 选择路径：`['user', 'profile', 'avatar']`
- 生成变量：`{{ ctx.user.profile.avatar }}`

## 最佳实践

1. **性能优化**：对于大型数据集，使用异步加载避免一次性加载过多数据
2. **用户体验**：为重要操作提供搜索功能
3. **错误处理**：为异步加载添加适当的错误处理和加载状态
4. **类型安全**：使用 TypeScript 定义严格的 MetaTreeNode 类型

## 与 VariableInput 的配合

FlowContextSelector 通常与 VariableInput 组件结合使用，提供完整的变量输入解决方案。VariableInput 会自动集成 FlowContextSelector，无需单独使用。