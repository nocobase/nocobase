:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Lagring

## Översikt

Klassen `Storage` används för klientbaserad informationslagring och använder `localStorage` som standard.

### Grundläggande användning

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

## Klassmetoder

### `setItem()`

Lagrar innehåll.

#### Signatur

- `setItem(key: string, value: string): void`

### `getItem()`

Hämtar innehåll.

#### Signatur

- `getItem(key: string): string | null`

### `removeItem()`

Tar bort innehåll.

#### Signatur

- `removeItem(key: string): void`

### `clear()`

Rensar allt innehåll.

#### Signatur

- `clear(): void`