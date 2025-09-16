# FieldModel

## 扩展说明

### 展示类字段

```ts | pure
class Hello1FieldModel extends FieldModel {
  render() {
    return <div>Hello, NocoBase Field</div>;
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

## 定义的字段 Model 需要和对应的 Interface 绑定，相关场景有：

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
