:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Stockage

## Vue d'ensemble

La classe `Storage` est utilisée pour le stockage d'informations côté client, en utilisant `localStorage` par défaut.

### Utilisation de base

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

## Méthodes de la classe

### `setItem()`

Stocke du contenu.

#### Signature

- `setItem(key: string, value: string): void`

### `getItem()`

Récupère du contenu.

#### Signature

- `getItem(key: string): string | null`

### `removeItem()`

Supprime du contenu.

#### Signature

- `removeItem(key: string): void`

### `clear()`

Efface tout le contenu.

#### Signature

- `clear(): void`