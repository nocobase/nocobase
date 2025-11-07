# Cache

## 基本方法

可参考 <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> 文档。

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

## 其他方法

### `wrapWithCondition()`

功能和 wrap() 类似，但是可以通过条件决定要不要使用缓存。

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // 外部参数控制是否使用缓存结果
    useCache?: boolean;
    // 通过数据结果决定是否缓存
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

当缓存内容是对象时，改变某个key的value.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

当缓存内容是对象时，获取某个key的value.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

当缓存内容是对象时，删除某个key.

```ts
async delValueInObject(key: string, objectKey: string)
```
