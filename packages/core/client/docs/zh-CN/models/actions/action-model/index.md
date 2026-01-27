# ActionModel

所有操作按钮的基类，有三类使用场景：

`ActionSceneEnum.collection`：数据表操作，如添加、批量编辑、批量删除等
`ActionSceneEnum.record`：当前记录的操作，如编辑、查看、删除当前记录等
`ActionSceneEnum.all`：所有场景都可以使用的操作

## 扩展说明

```ts
class Hello1ActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    title: 'Hello1 Action',
  };
}
```

```ts
class Hello2ActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    title: 'Hello2 Action',
  };
}
```

```ts
class Hello3ActionModel extends ActionModel {
  static scene = ActionSceneEnum.all;

  defaultProps: ButtonProps = {
    title: 'Hello3 Action',
  };
}
```
