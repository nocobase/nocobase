# ctx.route

## 参数说明

```ts
type RouteOptions = {
  name?: string; // 路由唯一标识
  path?: string; // 路由模板
  pathname?: string; // 路由的完整路径
  params?: Record<string, any>; // 路由参数
};
```

## 示例

## 基础用法

<code src="./basic.tsx"></code>

### 路由监听

<code src="./reaction.tsx"></code>

### 路由监听（高级）

<code src="./reaction2.tsx"></code>
