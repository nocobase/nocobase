# 函数式 Converters - 动态配置机制

函数式 Converters 是 VariableInput 的高级特性，允许开发者根据上下文信息动态生成 Converter 配置。这种模式特别适合需要根据不同字段、不同场景使用不同组件逻辑的复杂应用。

## 函数式 Converters 签名

```typescript
// 函数式 converters 接受一个 meta 参数，返回 Converters 对象
type FunctionalConverters = (meta: MetaTreeNode | null) => Converters;

// 使用方式
<VariableInput
  value={value}
  onChange={setValue}
  converters={(meta) => ({
    renderInputComponent: (metaNode, value, hint) => {
      // 基于 meta 信息动态决定组件
      return getComponentByMeta(meta, metaNode, value, hint);
    }
  })}
/>
```

## 核心优势

### 1. 动态性
根据字段信息、用户权限、业务状态等动态决定使用什么组件和逻辑。

### 2. 复用性
同一个 converter 函数可以处理多种不同的情况，减少代码重复。

### 3. 灵活性
每个字段可以有完全不同的 converter 逻辑，而无需创建多个组件。

### 4. 类型安全
配合 TypeScript 可以获得完整的类型检查和智能提示。

## 使用示例

<code src="./functional-converters.tsx"></code>

## 常见使用模式

### 1. 基于字段类型的动态组件

```typescript
const createFieldConverter = (fieldKey: string) => (meta: MetaTreeNode | null) => ({
  renderInputComponent: (metaNode, value, hint) => {
    if (metaNode) return null; // 变量值使用默认 VariableTag
    
    // 根据字段类型选择组件
    switch (fieldKey) {
      case 'date':
        return (props) => <DatePicker {...props} format="YYYY-MM-DD" />;
      case 'rating':
        return (props) => <Rate {...props} allowHalf />;
      case 'priority':
        return (props) => (
          <Select {...props}>
            <Select.Option value="low">🟢 低</Select.Option>
            <Select.Option value="high">🔴 高</Select.Option>
          </Select>
        );
      default:
        return null;
    }
  }
});

// 使用
<VariableInput converters={createFieldConverter('date')} />
<VariableInput converters={createFieldConverter('rating')} />
<VariableInput converters={createFieldConverter('priority')} />
```

### 2. 基于业务逻辑的条件渲染

```typescript
const createBusinessConverter = (userRole: string, permissions: string[]) => 
  (meta: MetaTreeNode | null) => ({
    renderInputComponent: (metaNode, value, hint) => {
      if (metaNode) return null;
      
      // 根据用户角色和权限决定组件
      if (userRole === 'admin') {
        return (props) => <AdminSpecialInput {...props} />;
      }
      
      if (permissions.includes('advanced_edit')) {
        return (props) => <AdvancedEditor {...props} />;
      }
      
      return null; // 使用默认组件
    }
  });
```

### 3. 基于表单状态的动态行为

```typescript
const createFormConverter = (formMode: 'create' | 'edit' | 'view') => 
  (meta: MetaTreeNode | null) => ({
    renderInputComponent: (metaNode, value, hint) => {
      if (metaNode) return null;
      
      const baseProps = {
        disabled: formMode === 'view',
        placeholder: formMode === 'create' ? '请输入...' : '点击编辑...'
      };
      
      if (hint === 'rate') {
        return (props) => <Rate {...props} {...baseProps} />;
      }
      
      return (props) => <Input {...props} {...baseProps} />;
    }
  });
```

### 4. 基于数据源的组件配置

```typescript
const createDataSourceConverter = (dataSource: any[], fieldConfig: FieldConfig) => 
  (meta: MetaTreeNode | null) => ({
    renderInputComponent: (metaNode, value, hint) => {
      if (metaNode) return null;
      
      // 根据数据源动态生成选项
      if (fieldConfig.type === 'select') {
        return (props) => (
          <Select {...props}>
            {dataSource.map(item => (
              <Select.Option key={item.value} value={item.value}>
                {item.label}
              </Select.Option>
            ))}
          </Select>
        );
      }
      
      return null;
    }
  });
```

## 高级模式

### 1. 组合多个 Converter 逻辑

```typescript
const createCompositeConverter = (...converterFactories: Array<(meta: MetaTreeNode | null) => Converters>) => 
  (meta: MetaTreeNode | null) => {
    const converters = converterFactories.map(factory => factory(meta));
    
    return {
      renderInputComponent: (metaNode, value, hint) => {
        // 依次尝试每个 converter
        for (const converter of converters) {
          const component = converter.renderInputComponent?.(metaNode, value, hint);
          if (component) return component;
        }
        return null;
      }
    };
  };

// 使用
const combinedConverter = createCompositeConverter(
  createFieldConverter('date'),
  createBusinessConverter(userRole, permissions),
  createFormConverter(formMode)
);
```

### 2. 缓存优化的 Converter

```typescript
const createCachedConverter = (expensiveComputationFn: Function) => {
  const cache = new Map();
  
  return (meta: MetaTreeNode | null) => {
    const cacheKey = JSON.stringify(meta);
    
    if (!cache.has(cacheKey)) {
      const result = expensiveComputationFn(meta);
      cache.set(cacheKey, result);
    }
    
    return cache.get(cacheKey);
  };
};
```

### 3. 异步 Converter（结合 useMemo）

```typescript
const AsyncConverterExample = () => {
  const [options, setOptions] = useState([]);
  
  const converter = useMemo(() => 
    (meta: MetaTreeNode | null) => ({
      renderInputComponent: (metaNode, value, hint) => {
        if (metaNode || !options.length) return null;
        
        return (props) => (
          <Select {...props}>
            {options.map(opt => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        );
      }
    }), 
    [options]
  );
  
  useEffect(() => {
    // 异步加载选项
    loadOptions().then(setOptions);
  }, []);
  
  return <VariableInput converters={converter} />;
};
```

## 性能考虑

### 1. 避免在 render 中创建新函数

```typescript
// ❌ 不好的做法
<VariableInput 
  converters={(meta) => ({ /* ... */ })} // 每次 render 都创建新函数
/>

// ✅ 好的做法
const converter = useCallback((meta) => ({ /* ... */ }), [deps]);
<VariableInput converters={converter} />
```

### 2. 使用 useMemo 缓存复杂计算

```typescript
const converter = useMemo(() => 
  createComplexConverter(expensiveData), 
  [expensiveData]
);
```

## 最佳实践

1. **保持纯函数**：Converter 函数应该是纯函数，相同输入产生相同输出
2. **合理使用缓存**：对于复杂计算使用适当的缓存机制
3. **类型安全**：为复杂的 converter 逻辑定义明确的 TypeScript 类型
4. **可测试性**：将 converter 逻辑拆分为可单独测试的小函数
5. **文档完善**：为复杂的动态逻辑提供清晰的文档和示例

## 实际应用场景

1. **表单生成器**：根据字段配置动态生成不同类型的输入组件
2. **权限控制**：根据用户权限动态启用/禁用某些组件功能
3. **多租户系统**：根据租户配置显示不同的组件样式和行为
4. **A/B 测试**：根据实验分组显示不同的组件实现
5. **国际化**：根据语言和地区显示不同的组件和交互方式

函数式 Converters 为 VariableInput 提供了无限的扩展可能，是构建复杂、动态表单系统的强大工具。