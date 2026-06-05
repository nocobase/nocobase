:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# ICollection

`ICollection`은 모델의 이름, 필드, 연관 관계 등의 정보를 포함하는 데이터 모델의 인터페이스입니다.

```typescript
export interface ICollection {
  repository: IRepository;

  updateOptions(options: any): void;

  setField(name: string, options: any): IField;

  removeField(name: string): void;

  getFields(): Array<IField>;

  getField(name: string): IField;

  [key: string]: any;
}
```

## 멤버

### repository

`ICollection`이 속한 `Repository` 인스턴스입니다.

## API

### updateOptions()

`컬렉션`의 속성을 업데이트합니다.

#### 시그니처

- `updateOptions(options: any): void`

### setField()

`컬렉션`의 필드를 설정합니다.

#### 시그니처

- `setField(name: string, options: any): IField`

### removeField()

`컬렉션`의 필드를 제거합니다.

#### 시그니처

- `removeField(name: string): void`

### getFields()

`컬렉션`의 모든 필드를 가져옵니다.

#### 시그니처

- `getFields(): Array<IField>`

### getField()

이름으로 `컬렉션`의 필드를 가져옵니다.

#### 시그니처

- `getField(name: string): IField`