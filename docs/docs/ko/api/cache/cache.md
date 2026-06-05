:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 캐시

## 기본 메서드

<a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> 문서를 참고하세요.

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

## 기타 메서드

### `wrapWithCondition()`

`wrap()`과 기능이 유사하지만, 조건을 통해 캐시 사용 여부를 결정할 수 있습니다.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // 캐시된 결과를 사용할지 제어하는 외부 매개변수
    useCache?: boolean;
    // 데이터 결과에 따라 캐시 여부를 결정
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

캐시된 내용이 객체일 때, 특정 키의 값을 변경합니다.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

캐시된 내용이 객체일 때, 특정 키의 값을 가져옵니다.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

캐시된 내용이 객체일 때, 특정 키를 삭제합니다.

```ts
async delValueInObject(key: string, objectKey: string)
```