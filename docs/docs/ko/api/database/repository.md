:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 리포지토리

## 개요

주어진 `컬렉션` 객체에서 해당 컬렉션의 데이터를 읽고 쓰는 작업을 수행하기 위해 `Repository` 객체를 가져올 수 있습니다.

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### 조회

#### 기본 조회

`Repository` 객체에서 `find*` 관련 메서드를 호출하여 조회 작업을 수행할 수 있습니다. 모든 조회 메서드는 데이터를 필터링하기 위한 `filter` 매개변수를 지원합니다.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### 연산자

`Repository`의 `filter` 매개변수는 더욱 다양한 조회 작업을 수행할 수 있도록 여러 연산자를 제공합니다.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

연산자에 대한 더 자세한 내용은 [필터 연산자](/api/database/operators)를 참고하시기 바랍니다.

#### 필드 제어

조회 작업을 수행할 때 `fields`, `except`, `appends` 매개변수를 통해 출력 필드를 제어할 수 있습니다.

- `fields`: 출력 필드를 지정합니다.
- `except`: 출력 필드에서 제외합니다.
- `appends`: 연관 필드를 출력에 추가합니다.

```javascript
// 결과는 id와 name 필드만 포함합니다.
userRepository.find({
  fields: ['id', 'name'],
});

// 결과는 password 필드를 포함하지 않습니다.
userRepository.find({
  except: ['password'],
});

// 결과는 연관 객체 posts의 데이터를 포함합니다.
userRepository.find({
  appends: ['posts'],
});
```

#### 연관 필드 조회

`filter` 매개변수는 연관 필드를 기준으로 필터링을 지원합니다. 예를 들어:

```javascript
// 연관된 posts에 'post title'이라는 제목을 가진 객체가 있는 user 객체를 조회합니다.
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

연관 필드는 중첩하여 사용할 수도 있습니다.

```javascript
// posts의 comments에 keywords가 포함된 user 객체를 조회합니다.
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### 정렬

`sort` 매개변수를 사용하여 조회 결과를 정렬할 수 있습니다.

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

연관 객체의 필드를 기준으로 정렬할 수도 있습니다.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### 생성

#### 기본 생성

`Repository`를 통해 새로운 데이터 객체를 생성합니다.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// 일괄 생성을 지원합니다.
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### 연관 관계 생성

생성 시 연관 객체를 동시에 생성할 수 있습니다. 조회와 마찬가지로 연관 객체의 중첩 사용도 지원합니다. 예를 들어:

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// 사용자를 생성하는 동시에, 게시물(post)을 생성하여 사용자와 연관시키고, 태그(tags)를 생성하여 게시물과 연관시킵니다.
```

만약 연관 객체가 이미 데이터베이스에 존재한다면, 해당 ID를 전달하여 생성 시 기존 연관 객체와의 관계를 설정할 수 있습니다.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // 기존 연관 객체와 관계 설정
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### 업데이트

#### 기본 업데이트

데이터 객체를 가져온 후, 해당 데이터 객체(`Model`)에서 직접 속성을 수정한 다음 `save` 메서드를 호출하여 변경 사항을 저장할 수 있습니다.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

데이터 객체인 `Model`은 Sequelize Model을 상속받습니다. `Model`에 대한 작업은 [Sequelize Model](https://sequelize.org/master/manual/model-basics.html)을 참고하시기 바랍니다.

`Repository`를 통해 데이터를 업데이트할 수도 있습니다:

```javascript
// 필터링 조건을 만족하는 데이터 레코드를 수정합니다.
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

업데이트 시 `whitelist`, `blacklist` 매개변수를 사용하여 업데이트할 필드를 제어할 수 있습니다. 예를 들어:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // age 필드만 업데이트합니다.
});
```

#### 연관 필드 업데이트

업데이트 시 연관 객체를 설정할 수 있습니다. 예를 들어:

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // tag1과 연관 관계 설정
      },
      {
        name: 'tag2', // 새로운 태그를 생성하고 연관 관계 설정
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // 게시물(post)과 태그(tags)의 연관 관계 해제
  },
});
```

### 삭제

`Repository`의 `destroy()` 메서드를 호출하여 삭제 작업을 수행할 수 있습니다. 삭제 시 필터링 조건을 지정해야 합니다:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## 생성자

일반적으로 개발자가 직접 호출하지 않습니다. 주로 `db.registerRepositories()`를 통해 타입을 등록한 후, `db.collection()` 매개변수에서 해당 등록된 리포지토리 타입을 지정하여 인스턴스화됩니다.

**시그니처**

- `constructor(collection: Collection)`

**예시**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // here link to the registered repository
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## 인스턴스 멤버

### `database`

컨텍스트가 속한 데이터베이스 관리 인스턴스입니다.

### `collection`

해당 컬렉션 관리 인스턴스입니다.

### `model`

해당 모델 클래스입니다.

## 인스턴스 메서드

### `find()`

데이터베이스에서 데이터셋을 조회하며, 필터링 조건, 정렬 등을 지정할 수 있습니다.

**시그니처**

- `async find(options?: FindOptions): Promise<Model[]>`

**타입**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**세부 정보**

#### `filter: Filter`

데이터 결과를 필터링하는 데 사용되는 조회 조건입니다. 전달되는 조회 매개변수에서 `key`는 조회할 필드 이름이고, `value`는 조회할 값을 전달하거나 연산자와 함께 사용하여 다른 조건으로 데이터를 필터링할 수 있습니다.

```typescript
// name이 foo이고 age가 18보다 큰 레코드를 조회합니다.
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

더 많은 연산자는 [조회 연산자](./operators.md)를 참고하시기 바랍니다.

#### `filterByTk: TargetKey`

`TargetKey`를 통해 데이터를 조회하는 `filter` 매개변수의 편리한 메서드입니다. `TargetKey`가 어떤 필드인지는 `컬렉션`에서 [설정](./collection.md#filtertargetkey)할 수 있으며, 기본값은 `primaryKey`입니다.

```typescript
// 기본적으로 id가 1인 레코드를 찾습니다.
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

데이터 필드 결과를 제어하는 데 사용되는 조회 열입니다. 이 매개변수를 전달하면 지정된 필드만 반환됩니다.

#### `except: string[]`

데이터 필드 결과를 제어하는 데 사용되는 제외 열입니다. 이 매개변수를 전달하면 전달된 필드는 출력되지 않습니다.

#### `appends: string[]`

연관 데이터를 로드하는 데 사용되는 추가 열입니다. 이 매개변수를 전달하면 지정된 연관 필드도 함께 출력됩니다.

#### `sort: string[] | string`

조회 결과의 정렬 방식을 지정합니다. 매개변수는 필드 이름이며, 기본적으로 오름차순(`asc`)으로 정렬됩니다. 내림차순(`desc`)으로 정렬하려면 필드 이름 앞에 `-` 기호를 추가합니다. 예: `['-id', 'name']`은 `id desc, name asc`로 정렬됨을 의미합니다.

#### `limit: number`

결과 수를 제한하며, `SQL`의 `limit`과 동일합니다.

#### `offset: number`

조회 오프셋이며, `SQL`의 `offset`과 동일합니다.

**예시**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

데이터베이스에서 특정 조건을 만족하는 단일 데이터를 조회합니다. Sequelize의 `Model.findOne()`과 동일합니다.

**시그니처**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**예시**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

데이터베이스에서 특정 조건을 만족하는 데이터의 총 개수를 조회합니다. Sequelize의 `Model.count()`와 동일합니다.

**시그니처**

- `count(options?: CountOptions): Promise<number>`

**타입**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**예시**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

데이터베이스에서 특정 조건을 만족하는 데이터셋과 총 결과 수를 조회합니다. Sequelize의 `Model.findAndCountAll()`과 동일합니다.

**시그니처**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**타입**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**세부 정보**

조회 매개변수는 `find()`와 동일합니다. 반환 값은 배열이며, 첫 번째 요소는 조회 결과이고 두 번째 요소는 총 개수입니다.

### `create()`

컬렉션에 새로 생성된 데이터를 삽입합니다. Sequelize의 `Model.create()`와 동일합니다. 생성할 데이터 객체에 관계 필드 정보가 포함되어 있으면, 해당 관계 데이터 레코드도 함께 생성되거나 업데이트됩니다.

**시그니처**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**예시**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 발표 로그',
    tags: [
      // 관계 테이블의 기본 키 값이 있을 경우 해당 데이터를 업데이트합니다.
      { id: 1 },
      // 기본 키 값이 없을 경우 새 데이터를 생성합니다.
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

컬렉션에 여러 개의 새로 생성된 데이터를 삽입합니다. `create()` 메서드를 여러 번 호출하는 것과 동일합니다.

**시그니처**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**타입**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**세부 정보**

- `records`: 생성할 레코드의 데이터 객체 배열입니다.
- `transaction`: 트랜잭션 객체입니다. 트랜잭션 매개변수가 전달되지 않으면, 이 메서드는 자동으로 내부 트랜잭션을 생성합니다.

**예시**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 발표 로그',
      tags: [
        // 관계 테이블의 기본 키 값이 있을 경우 해당 데이터를 업데이트합니다.
        { id: 1 },
        // 기본 키 값이 없을 경우 새 데이터를 생성합니다.
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 발표 로그',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

컬렉션의 데이터를 업데이트합니다. Sequelize의 `Model.update()`와 동일합니다. 업데이트할 데이터 객체에 관계 필드 정보가 포함되어 있으면, 해당 관계 데이터 레코드도 함께 생성되거나 업데이트됩니다.

**시그니처**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**예시**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 발표 로그',
    tags: [
      // 관계 테이블의 기본 키 값이 있을 경우 해당 데이터를 업데이트합니다.
      { id: 1 },
      // 기본 키 값이 없을 경우 새 데이터를 생성합니다.
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

컬렉션의 데이터를 삭제합니다. Sequelize의 `Model.destroy()`와 동일합니다.

**시그니처**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**타입**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**세부 정보**

- `filter`: 삭제할 레코드의 필터링 조건을 지정합니다. `Filter`의 자세한 사용법은 [`find()`](#find) 메서드를 참고하시기 바랍니다.
- `filterByTk`: `TargetKey`를 기준으로 삭제할 레코드의 필터링 조건을 지정합니다.
- `truncate`: 테이블 데이터를 비울지 여부를 나타냅니다. `filter` 또는 `filterByTk` 매개변수가 전달되지 않았을 때 유효합니다.
- `transaction`: 트랜잭션 객체입니다. 트랜잭션 매개변수가 전달되지 않으면, 이 메서드는 자동으로 내부 트랜잭션을 생성합니다.