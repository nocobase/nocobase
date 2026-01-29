# ctx.api.storage

本地存储封装，基于浏览器 `localStorage`，会自动加上前缀（`storagePrefix`），避免与其他应用或实例的键名冲突。

## 说明

- 通过 `ctx.api.storage` 可以在本地保存简单的键值数据
- 所有键都会自动带上前缀（如 `NOCOBASE_`），无需手动处理
- 适合保存：当前空间 ID、最近访问记录、开关状态等轻量数据

## 常用方法

```ts
api.storage.getItem(key: string): string | null;
api.storage.setItem(key: string, value: string): void;
api.storage.removeItem(key: string): void;
```

> 注意：
> - 所有值都是字符串，若要保存对象，请使用 `JSON.stringify` / `JSON.parse`
> - 不适合保存敏感信息（如明文密码），敏感信息应放在服务端或更安全的存储方案中

## 使用示例

- [本地存储：使用 api.storage 保存状态](../api/api-storage-basic.md)
