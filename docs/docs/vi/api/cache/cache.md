:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cache

## Các phương thức cơ bản

Tham khảo tài liệu của <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

- `get()`
- `set()`
- `del()`
- `reset()`
- `wrap()`
- `mset()`
- `mget()`
- `mdel()`
- `keys()`
- `ttl()`

## Các phương thức khác

### `wrapWithCondition()`

Tương tự như `wrap()`, nhưng cho phép bạn quyết định có sử dụng bộ nhớ đệm hay không dựa trên một điều kiện.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Tham số bên ngoài để kiểm soát việc sử dụng kết quả từ bộ nhớ đệm
    useCache?: boolean;
    // Quyết định có lưu vào bộ nhớ đệm hay không dựa trên kết quả dữ liệu
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Khi nội dung trong bộ nhớ đệm là một đối tượng, phương thức này thay đổi giá trị của một khóa cụ thể.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Khi nội dung trong bộ nhớ đệm là một đối tượng, phương thức này lấy giá trị của một khóa cụ thể.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Khi nội dung trong bộ nhớ đệm là một đối tượng, phương thức này xóa một khóa cụ thể.

```ts
async delValueInObject(key: string, objectKey: string)
```