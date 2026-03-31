# 操作扩展

## 基类

- ActionModel
- PopupActionModel

### 基础操作

```ts
class HelloCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    title: 'Hello1 Collection Action',
  };
}
```

```ts
class HelloRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    title: 'Hello1 Record Action',
  };
}
```

```ts
class HelloAllActionModel extends ActionModel {
  static scene = ActionSceneEnum.all;

  defaultProps: ButtonProps = {
    title: 'Hello1 All Action',
  };
}
```

### 弹窗操作

```ts
class HelloPopupActionModel extends PopupActionModel {
  static scene = ActionSceneEnum.all;

  defaultProps: ButtonProps = {
    title: 'Hello4 Popup Action',
  };
}
```
