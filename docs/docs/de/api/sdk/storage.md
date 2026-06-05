:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Speicher

## Überblick

Die `Storage`-Klasse dient der clientseitigen Informationsspeicherung und verwendet standardmäßig `localStorage`.

### Grundlegende Verwendung

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

## Klassenmethoden

### `setItem()`

Speichert Inhalte.

#### Signatur

- `setItem(key: string, value: string): void`

### `getItem()`

Ruft Inhalte ab.

#### Signatur

- `getItem(key: string): string | null`

### `removeItem()`

Entfernt Inhalte.

#### Signatur

- `removeItem(key: string): void`

### `clear()`

Löscht alle Inhalte.

#### Signatur

- `clear(): void`