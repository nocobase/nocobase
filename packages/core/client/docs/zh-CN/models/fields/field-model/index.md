# FieldModel

## 扩展说明

### 展示类字段

```tsx | pure
class Hello1FieldModel extends FieldModel {
  render() {
    return <span>{this.props.value}</span>;
  }
}
DisplayItemModel.bindModelToInterface('Hello1FieldModel', ['input']);
```

### 编辑类字段

```tsx | pure
class Hello2FieldModel extends FieldModel {
  render() {
    return <Input {...this.props}/>;
  }
}
EditableItemModel.bindModelToInterface('Hello2FieldModel', ['input']);
FilterableItemModel.bindModelToInterface('Hello2FieldModel', ['input']);
```

## bindModelToInterface

定义的字段 Model 需要和对应的 Interface 绑定

```ts
interface BindModelToInterfaceOptions {
  isDefault?: boolean;
  defaultProps?: object | ((ctx: FlowEngineContext, fieldInstance: CollectionField) => object);
  when?: (ctx: FlowEngineContext, fieldInstance: CollectionField) => boolean;
}

static bindModelToInterface(
  // 字段 Model 的类名
  modelName: string,
  // 需要绑定的 interface
  interfaceName: string | string[],
  // 当前字段实例
  options: BindModelToInterfaceOptions,
);
```

相关场景有：

- DisplayItemModel：展示类字段
- EditableItemModel：可编辑类字段
- FilterableItemModel：筛选类字段

完整参数示例

```ts
DisplayItemModel.bindModelToInterface('Hello1FieldModel', ['input'], {
  isDefault: true,
  when(ctx, field: CollectionField) {
    return true;
  },
  defaultProps(ctx, field: CollectionField) {
    return {};
  }
});
```
