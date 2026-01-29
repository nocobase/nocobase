# ctx.libs.antdIcons

Namespace for Ant Design icons, usable directly in RunJS to render icons alongside `ctx.libs.antd` components.

## Type Definition (Simplified)

```ts
libs.antdIcons: typeof import('@ant-design/icons');
```

## Examples

```ts
const { Button } = ctx.libs.antd;
const { UserOutlined } = ctx.libs.antdIcons;

ctx.render(
  <Button icon={<UserOutlined />}>User</Button>,
);
```

> Tip:
> - Icon component names match `@ant-design/icons`, such as `PlusOutlined`, `UserOutlined`
> - Prefer loading icons from `ctx.libs.antdIcons` rather than importing the icon library via CDN
