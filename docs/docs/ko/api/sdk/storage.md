:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Storage

## 개요

`Storage` 클래스는 클라이언트 측 정보 저장에 사용되며, 기본적으로 `localStorage`를 사용합니다.

### 기본 사용법

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

## 클래스 메서드

### `setItem()`

내용을 저장합니다.

#### 시그니처

- `setItem(key: string, value: string): void`

### `getItem()`

내용을 가져옵니다.

#### 시그니처

- `getItem(key: string): string | null`

### `removeItem()`

내용을 제거합니다.

#### 시그니처

- `removeItem(key: string): void`

### `clear()`

모든 내용을 지웁니다.

#### 시그니처

- `clear(): void`