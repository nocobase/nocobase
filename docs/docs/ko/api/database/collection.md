:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 컬렉션

## 개요

`컬렉션`은 시스템의 데이터 모델을 정의하는 데 사용됩니다. 여기에는 모델 이름, 필드, 인덱스, 연관 관계 등의 정보가 포함됩니다.
일반적으로 `Database` 인스턴스의 `collection` 메서드를 통해 프록시 진입점(proxy entry)으로 호출합니다.

```javascript
const { Database } = require('@nocobase/database')

// 데이터베이스 인스턴스 생성
const db = new Database({...});

// 데이터 모델 정의
db.collection({
  name: 'users',
  // 모델 필드 정의
  fields: [
    // 스칼라 필드
    {
      name: 'name',
      type: 'string',
    },

    // 연관 필드
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

더 많은 필드 유형은 [필드](/api/database/field)를 참조하십시오.

## 생성자

**시그니처**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**매개변수**

| 매개변수명                | 타입                                                        | 기본값 | 설명                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -      | 컬렉션 식별자                                                                        |
| `options.tableName?`  | `string`                                                    | -      | 데이터베이스 테이블 이름입니다. 값을 전달하지 않으면 `options.name` 값이 사용됩니다.            |
| `options.fields?`     | `FieldOptions[]`                                            | -      | 필드 정의입니다. 자세한 내용은 [필드](./field)를 참조하십시오.                                                        |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | Sequelize의 Model 타입입니다. `string`을 사용하는 경우, 해당 모델 이름이 db에 미리 등록되어 있어야 합니다. |
| `options.repository?` | `string \| RepositoryType`                                  | -      | 데이터 저장소(Repository) 타입입니다. `string`을 사용하는 경우, 해당 저장소 타입이 db에 미리 등록되어 있어야 합니다. |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | 데이터 정렬 가능 필드 설정입니다. 기본적으로 정렬되지 않습니다.                                                         |
| `options.autoGenId?`  | `boolean`                                                   | `true` | 고유 기본 키를 자동으로 생성할지 여부입니다. 기본값은 `true`입니다.                                                    |
| `context.database`    | `Database`                                                  | -      | 현재 컨텍스트에 속한 데이터베이스입니다.                                                                 |

**예시**

게시물 컬렉션을 생성합니다:

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // 기존 데이터베이스 인스턴스
    database: db,
  },
);
```

## 인스턴스 멤버

### `options`

컬렉션의 초기 설정 매개변수입니다. 생성자의 `options` 매개변수와 동일합니다.

### `context`

현재 컬렉션이 속한 컨텍스트 환경이며, 주로 데이터베이스 인스턴스입니다.

### `name`

컬렉션 이름입니다.

### `db`

속한 데이터베이스 인스턴스입니다.

### `filterTargetKey`

기본 키로 사용되는 필드 이름입니다.

### `isThrough`

중간 컬렉션(through collection)인지 여부입니다.

### `model`

Sequelize의 Model 타입과 일치합니다.

### `repository`

데이터 저장소(Repository) 인스턴스입니다.

## 필드 설정 메서드

### `getField()`

컬렉션에 정의된 해당 이름의 필드 객체를 가져옵니다.

**시그니처**

- `getField(name: string): Field`

**매개변수**

| 매개변수명 | 타입     | 기본값 | 설명     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | 필드 이름 |

**예시**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

컬렉션에 필드를 설정합니다.

**시그니처**

- `setField(name: string, options: FieldOptions): Field`

**매개변수**

| 매개변수명    | 타입           | 기본값 | 설명                            |
| --------- | -------------- | ------ | ------------------------------- |
| `name`    | `string`       | -      | 필드 이름                        |
| `options` | `FieldOptions` | -      | 필드 설정입니다. 자세한 내용은 [필드](./field)를 참조하십시오. |

**예시**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

컬렉션에 여러 필드를 일괄적으로 설정합니다.

**시그니처**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**매개변수**

| 매개변수명        | 타입             | 기본값 | 설명                            |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields`      | `FieldOptions[]` | -      | 필드 설정입니다. 자세한 내용은 [필드](./field)를 참조하십시오. |
| `resetFields` | `boolean`        | `true` | 기존 필드를 재설정할지 여부입니다.            |

**예시**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

컬렉션에 정의된 해당 이름의 필드 객체를 제거합니다.

**시그니처**

- `removeField(name: string): void | Field`

**매개변수**

| 매개변수명 | 타입     | 기본값 | 설명     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | 필드 이름 |

**예시**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

컬렉션의 필드를 재설정(초기화)합니다.

**시그니처**

- `resetFields(): void`

**예시**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

컬렉션에 해당 이름의 필드 객체가 정의되어 있는지 확인합니다.

**시그니처**

- `hasField(name: string): boolean`

**매개변수**

| 매개변수명 | 타입     | 기본값 | 설명     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | 필드 이름 |

**예시**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

컬렉션에서 조건에 맞는 필드 객체를 찾습니다.

**시그니처**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**매개변수**

| 매개변수명      | 타입                        | 기본값 | 설명     |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | -      | 찾기 조건 |

**예시**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

컬렉션의 필드 객체를 반복 처리합니다.

**시그니처**

- `forEachField(callback: (field: Field) => void): void`

**매개변수**

| 매개변수명     | 타입                     | 기본값 | 설명     |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | -      | 콜백 함수 |

**예시**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## 인덱스 설정 메서드

### `addIndex()`

컬렉션에 인덱스를 추가합니다.

**시그니처**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**매개변수**

| 매개변수명  | 타입                                                         | 기본값 | 설명                 |
| ------- | ------------------------------------------------------------ | ------ | -------------------- |
| `index` | `string \| string[]`                                         | -      | 인덱스를 설정할 필드 이름입니다. |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | 전체 설정입니다.             |

**예시**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

컬렉션에서 인덱스를 제거합니다.

**시그니처**

- `removeIndex(fields: string[])`

**매개변수**

| 매개변수명   | 타입       | 기본값 | 설명                     |
| -------- | ---------- | ------ | ------------------------ |
| `fields` | `string[]` | -      | 제거할 인덱스의 필드 이름 조합입니다. |

**예시**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## 컬렉션 설정 메서드

### `remove()`

컬렉션을 삭제합니다.

**시그니처**

- `remove(): void`

**예시**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## 데이터베이스 작업 메서드

### `sync()`

컬렉션 정의를 데이터베이스에 동기화합니다. Sequelize의 기본 `Model.sync` 로직 외에도, 연관 필드에 해당하는 컬렉션도 함께 처리합니다.

**시그니처**

- `sync(): Promise<void>`

**예시**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

컬렉션이 데이터베이스에 존재하는지 확인합니다.

**시그니처**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**매개변수**

| 매개변수명                 | 타입          | 기본값 | 설명     |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | -      | 트랜잭션 인스턴스 |

**예시**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**시그니처**

- `removeFromDb(): Promise<void>`

**예시**

```ts
const books = db.collection({
  name: 'books',
});

// books 컬렉션을 데이터베이스에 동기화합니다.
await db.sync();

// 데이터베이스에서 books 컬렉션을 삭제합니다.
await books.removeFromDb();
```