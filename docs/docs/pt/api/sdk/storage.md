:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Storage

## Visão Geral

A classe `Storage` é usada para armazenar informações no lado do cliente, utilizando `localStorage` por padrão.

### Uso Básico

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

## Métodos da Classe

### `setItem()`

Armazena conteúdo.

#### Assinatura

- `setItem(key: string, value: string): void`

### `getItem()`

Obtém conteúdo.

#### Assinatura

- `getItem(key: string): string | null`

### `removeItem()`

Remove conteúdo.

#### Assinatura

- `removeItem(key: string): void`

### `clear()`

Limpa todo o conteúdo.

#### Assinatura

- `clear(): void`