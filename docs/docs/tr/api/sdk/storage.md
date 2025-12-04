:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Depolama

## Genel Bakış

`Storage` sınıfı, istemci tarafı bilgi depolama için kullanılır ve varsayılan olarak `localStorage` kullanır.

### Temel Kullanım

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

## Sınıf Metotları

### `setItem()`

İçeriği depolar.

#### İmza

- `setItem(key: string, value: string): void`

### `getItem()`

İçeriği alır.

#### İmza

- `getItem(key: string): string | null`

### `removeItem()`

İçeriği kaldırır.

#### İmza

- `removeItem(key: string): void`

### `clear()`

Tüm içeriği temizler.

#### İmza

- `clear(): void`