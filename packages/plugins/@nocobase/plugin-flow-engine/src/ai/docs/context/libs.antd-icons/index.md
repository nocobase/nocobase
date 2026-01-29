# ctx.libs.antdIcons

Ant Design 图标库命名空间，在 RunJS 环境中可直接使用，用于搭配 `ctx.libs.antd` 组件渲染图标。

## 类型定义（简化）

```ts
libs.antdIcons: typeof import('@ant-design/icons');
```

## 使用示例

```ts
const { Button } = ctx.libs.antd;
const { UserOutlined } = ctx.libs.antdIcons;

ctx.render(
  <Button icon={<UserOutlined />}>用户</Button>,
);
```

> 提示：
> - 图标组件命名与 `@ant-design/icons` 保持一致，如 `PlusOutlined`、`UserOutlined` 等
> - 建议从 `ctx.libs.antdIcons` 获取，而不是自行通过 CDN 导入图标库
