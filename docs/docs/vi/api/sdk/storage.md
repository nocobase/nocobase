:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Storage

## Tổng quan

Lớp `Storage` được dùng để lưu trữ thông tin phía client, mặc định sử dụng `localStorage`.

### Cách sử dụng cơ bản

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

## Các phương thức của lớp

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

Xóa tất cả nội dung.

#### Chữ ký

- `clear(): void`