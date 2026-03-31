# Storage

## Overview

The `Storage` class is used for client-side information storage, using `localStorage` by default.

### Basic Usage

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

## Class Methods

### `setItem()`

Stores content.

#### Signature

- `setItem(key: string, value: string): void`

### `getItem()`

Gets content.

#### Signature

- `getItem(key: string): string | null`

### `removeItem()`

Removes content.

#### Signature

- `removeItem(key: string): void`

### `clear()`

Clears all content.

#### Signature

- `clear(): void`