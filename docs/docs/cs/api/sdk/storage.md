:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Úložiště

## Přehled

Třída `Storage` se používá pro ukládání informací na straně klienta a ve výchozím nastavení využívá `localStorage`.

### Základní použití

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

## Metody třídy

### `setItem()`

Ukládá obsah.

#### Podpis

- `setItem(key: string, value: string): void`

### `getItem()`

Získává obsah.

#### Podpis

- `getItem(key: string): string | null`

### `removeItem()`

Odstraňuje obsah.

#### Podpis

- `removeItem(key: string): void`

### `clear()`

Vymaže veškerý obsah.

#### Podpis

- `clear(): void`