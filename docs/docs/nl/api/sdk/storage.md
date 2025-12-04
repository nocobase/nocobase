:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Storage

## Overzicht

De `Storage`-klasse wordt gebruikt voor de opslag van client-side informatie en maakt standaard gebruik van `localStorage`.

### Basisgebruik

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

## Klasse-methoden

### `setItem()`

Slaat inhoud op.

#### Signatuur

- `setItem(key: string, value: string): void`

### `getItem()`

Haalt inhoud op.

#### Signatuur

- `getItem(key: string): string | null`

### `removeItem()`

Verwijdert inhoud.

#### Signatuur

- `removeItem(key: string): void`

### `clear()`

Wist alle inhoud.

#### Signatuur

- `clear(): void`