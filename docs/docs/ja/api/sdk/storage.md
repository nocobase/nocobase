:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ストレージ

## 概要

`Storage` クラスは、クライアント側の情報ストレージに利用され、デフォルトでは `localStorage` が使用されます。

### 基本的な使い方

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

## クラスメソッド

### `setItem()`

コンテンツを保存します。

#### シグネチャ

- `setItem(key: string, value: string): void`

### `getItem()`

コンテンツを取得します。

#### シグネチャ

- `getItem(key: string): string | null`

### `removeItem()`

コンテンツを削除します。

#### シグネチャ

- `removeItem(key: string): void`

### `clear()`

すべてのコンテンツをクリアします。

#### シグネチャ

- `clear(): void`