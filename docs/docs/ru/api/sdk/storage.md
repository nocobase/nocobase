:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Storage

## Обзор

Класс `Storage` предназначен для хранения информации на стороне клиента и по умолчанию использует `localStorage`.

### Базовое использование

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

## Методы класса

### `setItem()`

Сохраняет содержимое.

#### Сигнатура

- `setItem(key: string, value: string): void`

### `getItem()`

Получает содержимое.

#### Сигнатура

- `getItem(key: string): string | null`

### `removeItem()`

Удаляет содержимое.

#### Сигнатура

- `removeItem(key: string): void`

### `clear()`

Очищает всё содержимое.

#### Сигнатура

- `clear(): void`