:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 필드

## 개요

컬렉션 필드 관리 클래스(추상 클래스)입니다. 모든 필드 유형의 기본 클래스이며, 다른 모든 필드 유형은 이 클래스를 상속하여 구현됩니다.

필드를 사용자 정의하는 방법은 [필드 유형 확장]을 참고해 주세요.

## 생성자

일반적으로 개발자가 직접 호출하지 않으며, 주로 `db.collection({ fields: [] })` 메서드를 프록시 진입점으로 사용하여 호출됩니다.

필드를 확장할 때는 `Field` 추상 클래스를 상속한 다음, Database 인스턴스에 등록하여 구현합니다.

**시그니처**

- `constructor(options: FieldOptions, context: FieldContext)`

**매개변수**

| 매개변수 이름 | 타입 | 기본값 | 설명 |
| :------------------- | :------------- | :----- | :--------------------------------------- |
| `options` | `FieldOptions` | - | 필드 설정 객체 |
| `options.name` | `string` | - | 필드 이름 |
| `options.type` | `string` | - | 필드 타입 (DB에 등록된 필드 타입 이름과 일치) |
| `context` | `FieldContext` | - | 필드 컨텍스트 객체 |
| `context.database` | `Database` | - | 데이터베이스 인스턴스 |
| `context.collection` | `Collection` | - | 컬렉션 인스턴스 |

## 인스턴스 멤버

### `name`

필드 이름입니다.

### `type`

필드 타입입니다.

### `dataType`

필드의 데이터베이스 저장 타입입니다.

### `options`

필드 초기화 설정 매개변수입니다.

### `context`

필드 컨텍스트 객체입니다.

## 설정 메서드

### `on()`

컬렉션 이벤트를 기반으로 하는 간편한 정의 방식입니다. `db.on(this.collection.name + '.' + eventName, listener)`와 동일합니다.

상속 시 일반적으로 이 메서드를 재정의할 필요는 없습니다.

**시그니처**

- `on(eventName: string, listener: (...args: any[]) => void)`

**매개변수**

| 매개변수 이름 | 타입 | 기본값 | 설명 |
| :---------- | :------------------------- | :----- | :--------- |
| `eventName` | `string` | - | 이벤트 이름 |
| `listener` | `(...args: any[]) => void` | - | 이벤트 리스너 |

### `off()`

컬렉션 이벤트를 기반으로 하는 간편한 제거 방식입니다. `db.off(this.collection.name + '.' + eventName, listener)`와 동일합니다.

상속 시 일반적으로 이 메서드를 재정의할 필요는 없습니다.

**시그니처**

- `off(eventName: string, listener: (...args: any[]) => void)`

**매개변수**

| 매개변수 이름 | 타입 | 기본값 | 설명 |
| :---------- | :------------------------- | :----- | :--------- |
| `eventName` | `string` | - | 이벤트 이름 |
| `listener` | `(...args: any[]) => void` | - | 이벤트 리스너 |

### `bind()`

필드가 컬렉션에 추가될 때 실행되는 내용입니다. 일반적으로 컬렉션 이벤트 리스너 및 기타 처리를 추가하는 데 사용됩니다.

상속 시에는 먼저 해당 `super.bind()` 메서드를 호출해야 합니다.

**시그니처**

- `bind()`

### `unbind()`

필드가 컬렉션에서 제거될 때 실행되는 내용입니다. 일반적으로 컬렉션 이벤트 리스너 및 기타 처리를 제거하는 데 사용됩니다.

상속 시에는 먼저 해당 `super.unbind()` 메서드를 호출해야 합니다.

**시그니처**

- `unbind()`

### `get()`

필드의 설정 항목 값을 가져옵니다.

**시그니처**

- `get(key: string): any`

**매개변수**

| 매개변수 이름 | 타입 | 기본값 | 설명 |
| :----- | :------- | :----- | :--------- |
| `key` | `string` | - | 설정 항목 이름 |

**예시**

```ts
const field = db.collection('users').getField('name');

// 필드 이름 설정 항목의 값을 가져옵니다. 'name'을 반환합니다.
console.log(field.get('name'));
```

### `merge()`

필드의 설정 항목 값들을 병합합니다.

**시그니처**

- `merge(options: { [key: string]: any }): void`

**매개변수**

| 매개변수 이름 | 타입 | 기본값 | 설명 |
| :-------- | :----------------------- | :----- | :----------------- |
| `options` | `{ [key: string]: any }` | - | 병합할 설정 항목 객체 |

**예시**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // 인덱스 설정 추가
  index: true,
});
```

### `remove()`

컬렉션에서 필드를 제거합니다 (메모리에서만 제거).

**예시**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// 실제로 DB에서 제거
await books.sync();
```

## 데이터베이스 메서드

### `removeFromDb()`

데이터베이스에서 필드를 제거합니다.

**시그니처**

- `removeFromDb(options?: Transactionable): Promise<void>`

**매개변수**

| 매개변수 이름 | 타입 | 기본값 | 설명 |
| :--------------------- | :------------ | :----- | :------- |
| `options.transaction?` | `Transaction` | - | 트랜잭션 인스턴스 |

### `existsInDb()`

필드가 데이터베이스에 존재하는지 확인합니다.

**시그니처**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**매개변수**

| 매개변수 이름 | 타입 | 기본값 | 설명 |
| :--------------------- | :------------ | :----- | :------- |
| `options.transaction?` | `Transaction` | - | 트랜잭션 인스턴스 |

## 내장 필드 타입 목록

NocoBase는 몇 가지 일반적인 필드 타입을 내장하고 있습니다. 컬렉션의 필드를 정의할 때 해당 `type` 이름을 직접 사용하여 타입을 지정할 수 있습니다. 각 필드 타입마다 매개변수 설정이 다르므로, 자세한 내용은 아래 목록을 참고해 주세요.

아래에서 추가로 설명하는 항목을 제외한 모든 필드 타입의 설정 항목은 Sequelize로 전달됩니다. 따라서 `allowNull`, `defaultValue` 등 Sequelize가 지원하는 모든 필드 설정 항목을 여기서 사용할 수 있습니다.

또한, 서버 측 필드 타입은 주로 데이터베이스 저장 및 일부 알고리즘 문제를 해결하며, 프런트엔드의 필드 표시 타입 및 사용되는 컴포넌트와는 기본적으로 관련이 없습니다. 프런트엔드 필드 타입에 대해서는 해당 튜토리얼 설명을 참고해 주세요.

### `'boolean'`

논리값 타입입니다.

**예시**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published',
    },
  ],
});
```

### `'integer'`

정수 타입 (32비트)입니다.

**예시**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages',
    },
  ],
});
```

### `'bigInt'`

큰 정수 타입 (64비트)입니다.

**예시**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words',
    },
  ],
});
```

### `'double'`

배정밀도 부동 소수점 타입 (64비트)입니다.

**예시**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
  ],
});
```

### `'real'`

실수 타입 (PG에만 적용됩니다).

### `'decimal'`

십진수 타입입니다.

### `'string'`

문자열 타입입니다. 대부분의 데이터베이스에서 `VARCHAR` 타입과 동일합니다.

**예시**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});
```

### `'text'`

텍스트 타입입니다. 대부분의 데이터베이스에서 `TEXT` 타입과 동일합니다.

**예시**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
  ],
});
```

### `'password'`

비밀번호 타입 (NocoBase 확장)입니다. Node.js 네이티브 `crypto` 패키지의 `scrypt` 메서드를 기반으로 비밀번호를 암호화합니다.

**예시**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // 길이, 기본값 64
      randomBytesSize: 8, // 무작위 바이트 길이, 기본값 8
    },
  ],
});
```

**매개변수**

| 매개변수 이름 | 타입 | 기본값 | 설명 |
| :---------------- | :------- | :----- | :----------- |
| `length` | `number` | 64 | 문자 길이 |
| `randomBytesSize` | `number` | 8 | 무작위 바이트 크기 |

### `'date'`

날짜 타입입니다.

### `'time'`

시간 타입입니다.

### `'array'`

배열 타입 (PG에만 적용됩니다).

### `'json'`

JSON 타입입니다.

### `'jsonb'`

JSONB 타입 (PG에만 적용되며, 다른 데이터베이스에서는 `'json'` 타입으로 호환됩니다).

### `'uuid'`

UUID 타입입니다.

### `'uid'`

UID 타입 (NocoBase 확장)입니다. 짧은 무작위 문자열 식별자 타입입니다.

### `'formula'`

수식 타입 (NocoBase 확장)입니다. [mathjs](https://www.npmjs.com/package/mathjs) 기반의 수학 공식을 설정할 수 있으며, 수식 내에서 동일한 레코드의 다른 컬럼 값을 참조하여 계산에 참여시킬 수 있습니다.

**예시**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity',
    },
  ],
});
```

### `'radio'`

라디오 타입 (NocoBase 확장)입니다. 전체 컬렉션에서 이 필드 값이 `true`인 데이터는 최대 한 행만 존재할 수 있으며, 나머지는 모두 `false` 또는 `null`이 됩니다.

**예시**

전체 시스템에서 `root`로 표시된 사용자는 한 명만 존재합니다. 다른 사용자의 `root` 값이 `true`로 변경되면, 이전에 `root`가 `true`였던 모든 레코드는 `false`로 변경됩니다.

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    },
  ],
});
```

### `'sort'`

정렬 타입 (NocoBase 확장)입니다. 정수 숫자를 기반으로 정렬하며, 새 레코드에 대해 자동으로 새 순번을 생성하고, 데이터를 이동할 때 순번을 재정렬합니다.

컬렉션에 `sortable` 옵션이 정의되어 있으면, 해당 필드도 자동으로 생성됩니다.

**예시**

게시물은 소속된 사용자를 기준으로 정렬할 수 있습니다.

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'sort',
      name: 'priority',
      scopeKey: 'userId', // userId 값이 동일한 데이터 그룹별로 정렬
    },
  ],
});
```

### `'virtual'`

가상 타입입니다. 실제 데이터를 저장하지 않으며, 특별한 getter/setter 정의 시에만 사용됩니다.

### `'belongsTo'`

다대일 관계 타입입니다. 외래 키는 자체 컬렉션에 저장되며, `hasOne`/`hasMany`와는 반대입니다.

**예시**

모든 게시물은 특정 작성자에게 속합니다.

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // 설정하지 않으면 기본적으로 name의 복수형 이름이 컬렉션 이름으로 사용됩니다.
      foreignKey: 'authorId', // 설정하지 않으면 기본적으로 <name> + Id 형식으로 사용됩니다.
      sourceKey: 'id', // 설정하지 않으면 기본적으로 대상 컬렉션의 id가 사용됩니다.
    },
  ],
});
```

### `'hasOne'`

일대일 관계 타입입니다. 외래 키는 관계된 컬렉션에 저장되며, `belongsTo`와는 반대입니다.

**예시**

모든 사용자는 하나의 프로필을 가집니다.

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // 생략 가능
    },
  ],
});
```

### `'hasMany'`

일대다 관계 타입입니다. 외래 키는 관계된 컬렉션에 저장되며, `belongsTo`와는 반대입니다.

**예시**

모든 사용자는 여러 개의 게시물을 가질 수 있습니다.

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      foreignKey: 'authorId',
      sourceKey: 'id',
    },
  ],
});
```

### `'belongsToMany'`

다대다 관계 타입입니다. 양쪽의 외래 키를 저장하기 위해 중간 컬렉션을 사용합니다. 기존 컬렉션을 중간 컬렉션으로 지정하지 않으면, 중간 컬렉션이 자동으로 생성됩니다.

**예시**

모든 게시물은 여러 개의 태그를 가질 수 있으며, 모든 태그는 여러 게시물에 추가될 수 있습니다.

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // 이름이 같으면 생략 가능
      through: 'postsTags', // 중간 컬렉션을 설정하지 않으면 자동으로 생성됩니다.
      foreignKey: 'postId', // 중간 컬렉션에 있는 자체 컬렉션의 외래 키
      sourceKey: 'id', // 자체 컬렉션의 기본 키
      otherKey: 'tagId', // 중간 컬렉션에 있는 관계된 컬렉션의 외래 키
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // 동일한 관계 그룹은 동일한 중간 컬렉션을 가리킵니다.
    },
  ],
});
```