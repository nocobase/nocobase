# Storage

## 概览

`Storage` 类用于客户端信息存储，默认使用 `localStorage`.

### 基本使用

```ts
export abstract class Storage {
  abstract clear(): void;
  abstract getItem(key: string): string | null;
  abstract removeItem(key: string): void;
  abstract setItem(key: string, value: string): void;
}

export class CustomStorage extends Storage {
  // ...
}
```

## 类方法

### `setItem()`

存储内容。

#### 签名

- `setItem(key: string, value: string): void`

### `getItem()`

获取内容。

#### 签名

- `getItem(key: string): string | null`

### `removeItem()`

删除内容。

#### 签名

- `removeItem(key: string): void`

### `clear()`

清除所有内容。

#### 签名

- `clear(): void`
