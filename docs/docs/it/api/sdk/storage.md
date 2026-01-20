:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Storage

## Panoramica

La classe `Storage` viene utilizzata per l'archiviazione delle informazioni lato client, utilizzando `localStorage` per impostazione predefinita.

### Utilizzo di Base

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

## Metodi della Classe

### `setItem()`

Memorizza il contenuto.

#### Firma

- `setItem(key: string, value: string): void`

### `getItem()`

Recupera il contenuto.

#### Firma

- `getItem(key: string): string | null`

### `removeItem()`

Rimuove il contenuto.

#### Firma

- `removeItem(key: string): void`

### `clear()`

Cancella tutto il contenuto.

#### Firma

- `clear(): void`