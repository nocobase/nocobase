:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Сховище

## Огляд

Клас `Storage` використовується для зберігання інформації на стороні клієнта, за замовчуванням застосовується `localStorage`.

### Базове використання

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

## Методи класу

### `setItem()`

Зберігає вміст.

#### Сигнатура

- `setItem(key: string, value: string): void`

### `getItem()`

Отримує вміст.

#### Сигнатура

- `getItem(key: string): string | null`

### `removeItem()`

Видаляє вміст.

#### Сигнатура

- `removeItem(key: string): void`

### `clear()`

Очищає весь вміст.

#### Сигнатура

- `clear(): void`