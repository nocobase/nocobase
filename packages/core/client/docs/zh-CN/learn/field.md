# 字段扩展

## 字段扩展

- FieldModel
- ClickableFieldModel

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
