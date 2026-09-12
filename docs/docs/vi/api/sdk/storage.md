---
title: "Storage (SDK)"
description: "Storage trong SDK frontend của NocoBase: bao bọc lưu trữ cục bộ, sessionStorage."
keywords: "Storage SDK,lưu trữ cục bộ,sessionStorage,lưu trữ frontend,NocoBase"
---

# Storage

## Tổng quan

Lớp `Storage` được dùng để lưu trữ thông tin phía client, mặc định sử dụng `localStorage`.

### Cách dùng cơ bản

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

## Phương thức của lớp

### `setItem()`

Lưu trữ nội dung.

#### Chữ ký

- `setItem(key: string, value: string): void`

### `getItem()`

Lấy nội dung.

#### Chữ ký

- `getItem(key: string): string | null`

### `removeItem()`

Xóa nội dung.

#### Chữ ký

- `removeItem(key: string): void`

### `clear()`

Xóa toàn bộ nội dung.

#### Chữ ký

- `clear(): void`
