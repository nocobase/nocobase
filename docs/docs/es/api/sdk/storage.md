:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Storage

## Resumen

La clase `Storage` se utiliza para el almacenamiento de información en el lado del cliente, usando `localStorage` por defecto.

### Uso básico

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

## Métodos de la clase

### `setItem()`

Almacena contenido.

#### Firma

- `setItem(key: string, value: string): void`

### `getItem()`

Obtiene contenido.

#### Firma

- `getItem(key: string): string | null`

### `removeItem()`

Elimina contenido.

#### Firma

- `removeItem(key: string): void`

### `clear()`

Borra todo el contenido.

#### Firma

- `clear(): void`