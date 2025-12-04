:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Storage

## Przegląd

Klasa `Storage` służy do przechowywania informacji po stronie klienta i domyślnie używa `localStorage`.

### Podstawowe użycie

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

## Metody klasy

### `setItem()`

Przechowuje zawartość.

#### Sygnatura

- `setItem(key: string, value: string): void`

### `getItem()`

Pobiera zawartość.

#### Sygnatura

- `getItem(key: string): string | null`

### `removeItem()`

Usuwa zawartość.

#### Sygnatura

- `removeItem(key: string): void`

### `clear()`

Czyści całą zawartość.

#### Sygnatura

- `clear(): void`