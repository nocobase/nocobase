:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# キャッシュ

## 基本的なメソッド

<a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> のドキュメントを参考にしてください。

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

## その他のメソッド

### `wrapWithCondition()`

`wrap()` と同様の機能ですが、キャッシュを使用するかどうかを条件によって決定できます。

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // キャッシュされた結果を使用するかどうかを制御する外部パラメータ
    useCache?: boolean;
    // データの結果に基づいてキャッシュするかどうかを決定します
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

キャッシュの内容がオブジェクトの場合、特定のキーの値を変更します。

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

キャッシュの内容がオブジェクトの場合、特定のキーの値を取得します。

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

キャッシュの内容がオブジェクトの場合、特定のキーを削除します。

```ts
async delValueInObject(key: string, objectKey: string)
```