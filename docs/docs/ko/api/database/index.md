:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Database

## 개요

NocoBase의 Database는 데이터베이스와 상호작용하는 도구입니다. 노코드(No-code) 및 로우코드(Low-code) 애플리케이션에서 데이터베이스를 편리하게 다룰 수 있는 기능을 제공합니다. 현재 지원하는 데이터베이스는 다음과 같습니다:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### 데이터베이스 연결하기

`Database` 생성자(constructor)에서 `options` 파라미터를 전달하여 데이터베이스 연결을 설정할 수 있습니다.

```javascript
const { Database } = require('@nocobase/database');

// SQLite 데이터베이스 설정 파라미터
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// MySQL \ PostgreSQL 데이터베이스 설정 파라미터
const database = new Database({
  dialect: /* 'postgres' 또는 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

자세한 설정 파라미터는 [생성자](#생성자) 섹션을 참고해 주세요.

### 데이터 모델 정의하기

`Database`는 **컬렉션(Collection)**을 통해 데이터베이스 구조를 정의합니다. 하나의 **컬렉션** 객체는 데이터베이스의 테이블 하나를 나타냅니다.

```javascript
// 컬렉션 정의
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

데이터베이스 구조 정의가 완료되면, `sync()` 메서드를 사용하여 데이터베이스 구조를 동기화할 수 있습니다.

```javascript
await database.sync();
```

**컬렉션** 사용법에 대한 더 자세한 내용은 [컬렉션](/api/database/collection) 문서를 참고해 주세요.

### 데이터 읽기/쓰기

`Database`는 리포지토리(Repository)를 통해 데이터를 조작합니다.

```javascript
const UserRepository = UserCollection.repository();

// 생성
await UserRepository.create({
  name: '홍길동',
  age: 18,
});

// 조회
const user = await UserRepository.findOne({
  filter: {
    name: '홍길동',
  },
});

// 수정
await UserRepository.update({
  values: {
    age: 20,
  },
});

// 삭제
await UserRepository.destroy(user.id);
```

데이터 CRUD 사용법에 대한 더 자세한 내용은 [리포지토리](/api/database/repository) 문서를 참고해 주세요.

## 생성자

**시그니처**

- `constructor(options: DatabaseOptions)`

데이터베이스 인스턴스를 생성합니다.

**파라미터**

| 파라미터                 | 유형           | 기본값        | 설명                                                                                                                |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | 데이터베이스 호스트                                                                                                          |
| `options.port`         | `number`       | -             | 데이터베이스 서비스 포트입니다. 사용하는 데이터베이스에 따라 기본 포트가 다릅니다.                                                                      |
| `options.username`     | `string`       | -             | 데이터베이스 사용자 이름                                                                                                        |
| `options.password`     | `string`       | -             | 데이터베이스 비밀번호                                                                                                          |
| `options.database`     | `string`       | -             | 데이터베이스 이름                                                                                                          |
| `options.dialect`      | `string`       | `'mysql'`     | 데이터베이스 유형                                                                                                          |
| `options.storage?`     | `string`       | `':memory:'`  | SQLite의 저장 모드                                                                                                   |
| `options.logging?`     | `boolean`      | `false`       | 로그 활성화 여부                                                                                                        |
| `options.define?`      | `Object`       | `{}`          | 기본 테이블 정의 파라미터                                                                                                    |
| `options.tablePrefix?` | `string`       | `''`          | NocoBase 확장 기능으로, 테이블 이름 접두사                                                                                             |
| `options.migrator?`    | `UmzugOptions` | `{}`          | NocoBase 확장 기능으로, 마이그레이션 관리자 관련 파라미터입니다. [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) 구현을 참고해 주세요. |

## 마이그레이션 관련 메서드

### `addMigration()`

단일 마이그레이션 파일을 추가합니다.

**시그니처**

- `addMigration(options: MigrationItem)`

**파라미터**

| 파라미터               | 유형               | 기본값 | 설명                   |
| -------------------- | ------------------ | ------ | ---------------------- |
| `options.name`       | `string`           | -      | 마이그레이션 파일 이름           |
| `options.context?`   | `string`           | -      | 마이그레이션 파일의 컨텍스트       |
| `options.migration?` | `typeof Migration` | -      | 마이그레이션 파일의 사용자 정의 클래스     |
| `options.up`         | `Function`         | -      | 마이그레이션 파일의 `up` 메서드   |
| `options.down`       | `Function`         | -      | 마이그레이션 파일의 `down` 메서드 |

**예시**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* 여기에 마이그레이션 SQL을 작성합니다 */);
  },
});
```

### `addMigrations()`

지정된 디렉터리에 있는 마이그레이션 파일들을 추가합니다.

**시그니처**

- `addMigrations(options: AddMigrationsOptions): void`

**파라미터**

| 파라미터               | 유형       | 기본값         | 설명             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | `''`           | 마이그레이션 파일이 있는 디렉터리 |
| `options.extensions` | `string[]` | `['js', 'ts']` | 파일 확장자       |
| `options.namespace?` | `string`   | `''`           | 네임스페이스         |
| `options.context?`   | `Object`   | `{ db }`       | 마이그레이션 파일의 컨텍스트 |

**예시**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## 유틸리티 메서드

### `inDialect()`

현재 데이터베이스 유형이 지정된 유형 중 하나인지 확인합니다.

**시그니처**

- `inDialect(dialect: string[]): boolean`

**파라미터**

| 파라미터    | 유형       | 기본값 | 설명                                             |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | -      | 데이터베이스 유형입니다. 가능한 값은 `mysql`/`postgres`/`mariadb`입니다. |

### `getTablePrefix()`

설정에서 테이블 이름 접두사를 가져옵니다.

**시그니처**

- `getTablePrefix(): string`

## 컬렉션 설정

### `collection()`

**컬렉션**을 정의합니다. 이 메서드는 Sequelize의 `define` 메서드와 유사하게 메모리에만 테이블 구조를 생성합니다. 데이터베이스에 영구적으로 저장하려면 `sync` 메서드를 호출해야 합니다.

**시그니처**

- `collection(options: CollectionOptions): Collection`

**파라미터**

`options`의 모든 설정 파라미터는 `Collection` 클래스의 생성자와 동일합니다. [컬렉션](/api/database/collection#생성자) 문서를 참고해 주세요.

**이벤트**

- `'beforeDefineCollection'`: **컬렉션**을 정의하기 전에 트리거됩니다.
- `'afterDefineCollection'`: **컬렉션**을 정의한 후에 트리거됩니다.

**예시**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// 컬렉션을 데이터베이스 테이블로 동기화
await db.sync();
```

### `getCollection()`

정의된 **컬렉션**을 가져옵니다.

**시그니처**

- `getCollection(name: string): Collection`

**파라미터**

| 파라미터 | 유형     | 기본값 | 설명 |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | **컬렉션** 이름 |

**예시**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

지정된 **컬렉션**이 정의되었는지 확인합니다.

**시그니처**

- `hasCollection(name: string): boolean`

**파라미터**

| 파라미터 | 유형     | 기본값 | 설명 |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | **컬렉션** 이름 |

**예시**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

정의된 **컬렉션**을 제거합니다. 메모리에서만 제거되며, 변경 사항을 영구적으로 저장하려면 `sync` 메서드를 호출해야 합니다.

**시그니처**

- `removeCollection(name: string): void`

**파라미터**

| 파라미터 | 유형     | 기본값 | 설명 |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | **컬렉션** 이름 |

**이벤트**

- `'beforeRemoveCollection'`: **컬렉션**을 제거하기 전에 트리거됩니다.
- `'afterRemoveCollection'`: **컬렉션**을 제거한 후에 트리거됩니다.

**예시**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

지정된 디렉터리 내의 모든 파일을 **컬렉션** 설정으로 메모리에 로드합니다.

**시그니처**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**파라미터**

| 파라미터               | 유형       | 기본값         | 설명             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | -              | 가져올 디렉터리 경로 |
| `options.extensions` | `string[]` | `['ts', 'js']` | 특정 확장자를 스캔합니다.     |

**예시**

`./collections/books.ts` 파일에 정의된 **컬렉션**은 다음과 같습니다:

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

플러그인 로드 시 관련 설정을 가져옵니다:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## 확장 기능 등록 및 가져오기

### `registerFieldTypes()`

사용자 정의 필드 유형을 등록합니다.

**시그니처**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**파라미터**

`fieldTypes`는 키-값 쌍으로, 키는 필드 유형 이름이고 값은 필드 유형 클래스입니다.

**예시**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

사용자 정의 데이터 모델 클래스를 등록합니다.

**시그니처**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**파라미터**

`models`는 키-값 쌍으로, 키는 데이터 모델 이름이고 값은 데이터 모델 클래스입니다.

**예시**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

사용자 정의 리포지토리 클래스를 등록합니다.

**시그니처**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**파라미터**

`repositories`는 키-값 쌍으로, 키는 리포지토리 이름이고 값은 리포지토리 클래스입니다.

**예시**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

사용자 정의 데이터 쿼리 연산자를 등록합니다.

**시그니처**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**파라미터**

`operators`는 키-값 쌍으로, 키는 연산자 이름이고 값은 비교 구문을 생성하는 함수입니다.

**예시**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // 등록된 연산자
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

정의된 데이터 모델 클래스를 가져옵니다. 이전에 사용자 정의 모델 클래스를 등록하지 않았다면, Sequelize의 기본 모델 클래스를 반환합니다. 기본 이름은 **컬렉션** 정의의 이름과 동일합니다.

**시그니처**

- `getModel(name: string): Model`

**파라미터**

| 파라미터 | 유형     | 기본값 | 설명           |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | -      | 등록된 모델 이름 |

**예시**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

참고: **컬렉션**에서 가져온 모델 클래스는 등록 시의 모델 클래스와 엄격하게 동일하지 않으며, 등록 시의 모델 클래스를 상속합니다. Sequelize의 모델 클래스 속성은 초기화 과정에서 변경될 수 있으므로, NocoBase는 이 상속 관계를 자동으로 처리합니다. 클래스가 동일하지 않다는 점을 제외하고는 모든 다른 정의를 정상적으로 사용할 수 있습니다.

### `getRepository()`

사용자 정의 리포지토리 클래스를 가져옵니다. 이전에 사용자 정의 리포지토리 클래스를 등록하지 않았다면, NocoBase의 기본 리포지토리 클래스를 반환합니다. 기본 이름은 **컬렉션** 정의의 이름과 동일합니다.

리포지토리 클래스는 주로 데이터 모델을 기반으로 한 CRUD(생성, 읽기, 업데이트, 삭제) 작업에 사용됩니다. 자세한 내용은 [리포지토리](/api/database/repository) 문서를 참고해 주세요.

**시그니처**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**파라미터**

| 파라미터       | 유형                 | 기본값 | 설명               |
| ------------ | -------------------- | ------ | ------------------ |
| `name`       | `string`             | -      | 등록된 리포지토리 이름 |
| `relationId` | `string` \| `number` | -      | 관계 데이터의 외래 키 값   |

이름이 `'tables.relations'`와 같이 연관된 이름 형식일 경우, 연관된 리포지토리 클래스를 반환합니다. 두 번째 파라미터가 제공되면, 리포지토리는 사용 시(조회, 수정 등) 관계 데이터의 외래 키 값을 기반으로 작동합니다.

**예시**

*게시물*과 *작성자*라는 두 개의 **컬렉션**이 있고, 게시물 **컬렉션**에 작성자 **컬렉션**을 가리키는 외래 키가 있다고 가정해 봅시다:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## 데이터베이스 이벤트

### `on()`

데이터베이스 이벤트를 수신합니다.

**시그니처**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**파라미터**

| 파라미터   | 유형     | 기본값 | 설명       |
| -------- | -------- | ------ | ---------- |
| event    | string   | -      | 이벤트 이름   |
| listener | Function | -      | 이벤트 리스너 |

이벤트 이름은 기본적으로 Sequelize의 모델(Model) 이벤트를 지원합니다. 전역 이벤트의 경우 `<sequelize_model_global_event>` 형식으로 수신하며, 단일 모델 이벤트의 경우 `<model_name>.<sequelize_model_event>` 형식으로 수신합니다.

모든 내장 이벤트 유형의 파라미터 설명과 자세한 예시는 [내장 이벤트](#내장-이벤트) 섹션을 참고해 주세요.

### `off()`

이벤트 리스너 함수를 제거합니다.

**시그니처**

- `off(name: string, listener: Function)`

**파라미터**

| 파라미터   | 유형     | 기본값 | 설명       |
| -------- | -------- | ------ | ---------- |
| name     | string   | -      | 이벤트 이름   |
| listener | Function | -      | 이벤트 리스너 |

**예시**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## 데이터베이스 작업

### `auth()`

데이터베이스 연결을 인증합니다. 애플리케이션이 데이터와 연결되었는지 확인할 때 사용할 수 있습니다.

**시그니처**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**파라미터**

| 파라미터                 | 유형                  | 기본값  | 설명               |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?`             | `Object`              | -       | 인증 옵션           |
| `options.retry?`       | `number`              | `10`    | 인증 실패 시 재시도 횟수 |
| `options.transaction?` | `Transaction`         | -       | 트랜잭션 객체           |
| `options.logging?`     | `boolean \| Function` | `false` | 로그 출력 여부       |

**예시**

```ts
await db.auth();
```

### `reconnect()`

데이터베이스에 다시 연결합니다.

**예시**

```ts
await db.reconnect();
```

### `closed()`

데이터베이스 연결이 닫혔는지 확인합니다.

**시그니처**

- `closed(): boolean`

### `close()`

데이터베이스 연결을 닫습니다. `sequelize.close()`와 동일합니다.

### `sync()`

데이터베이스 테이블 구조를 동기화합니다. `sequelize.sync()`와 동일하며, 파라미터는 [Sequelize 문서](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync)를 참고해 주세요.

### `clean()`

데이터베이스를 비우고, 모든 테이블을 삭제합니다.

**시그니처**

- `clean(options: CleanOptions): Promise<void>`

**파라미터**

| 파라미터                | 유형          | 기본값  | 설명               |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop`        | `boolean`     | `false` | 모든 테이블 제거 여부 |
| `options.skip`        | `string[]`    | -       | 건너뛸 테이블 이름 설정     |
| `options.transaction` | `Transaction` | -       | 트랜잭션 객체           |

**예시**

`users` 테이블을 제외한 모든 테이블을 제거합니다.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## 패키지 레벨 내보내기

### `defineCollection()`

**컬렉션**의 설정 내용을 생성합니다.

**시그니처**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**파라미터**

| 파라미터              | 유형                | 기본값 | 설명                                |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | 모든 `db.collection()`의 파라미터와 동일합니다. |

**예시**

`db.import()`로 가져올 **컬렉션** 설정 파일의 예시입니다:

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

이미 메모리에 로드된 **컬렉션** 구조 설정 내용을 확장합니다. 주로 `import()` 메서드로 가져온 파일 내용에 사용됩니다. 이 메서드는 `@nocobase/database` 패키지에서 내보내는 최상위 메서드이며, `db` 인스턴스를 통해 호출되지 않습니다. `extend` 별칭을 사용할 수도 있습니다.

**시그니처**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**파라미터**

| 파라미터              | 유형                | 기본값 | 설명                                                           |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | 모든 `db.collection()`의 파라미터와 동일합니다.                            |
| `mergeOptions?`     | `MergeOptions`      | -      | npm 패키지 [deepmerge](https://npmjs.com/package/deepmerge)의 파라미터 |

**예시**

원본 books **컬렉션** 정의 (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

확장된 books **컬렉션** 정의 (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// 다시 확장
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

위 두 파일이 `import()` 호출 시 가져와지고 `extend()`를 통해 다시 확장되면, books **컬렉션**은 `title`과 `price` 두 필드를 모두 갖게 됩니다.

이 메서드는 기존 플러그인에 의해 이미 정의된 **컬렉션** 구조를 확장할 때 매우 유용합니다.

## 내장 이벤트

데이터베이스는 해당 라이프사이클에 따라 다음 이벤트들을 트리거합니다. `on()` 메서드를 통해 이벤트를 구독하고 특정 처리를 수행하여 다양한 비즈니스 요구사항을 충족할 수 있습니다.

### `'beforeSync'` / `'afterSync'`

새로운 **컬렉션** 구조 설정(필드, 인덱스 등)이 데이터베이스에 동기화되기 전후에 트리거됩니다. 일반적으로 `collection.sync()`(내부 호출)가 실행될 때 트리거되며, 주로 특정 필드 확장 로직을 처리하는 데 사용됩니다.

**시그니처**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**유형**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**예시**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // 여기에 로직을 작성합니다
});

db.on('users.afterSync', async (options) => {
  // 여기에 로직을 작성합니다
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

데이터를 생성하거나 업데이트하기 전에 **컬렉션**에 정의된 규칙에 따라 데이터 유효성 검사 과정이 진행됩니다. 이 유효성 검사 전후에 해당 이벤트가 트리거됩니다. `repository.create()` 또는 `repository.update()`가 호출될 때 발생합니다.

**시그니처**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**유형**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**예시**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// 모든 모델
db.on('beforeValidate', async (model, options) => {
  // 여기에 로직을 작성합니다
});
// tests 모델
db.on('tests.beforeValidate', async (model, options) => {
  // 여기에 로직을 작성합니다
});

// 모든 모델
db.on('afterValidate', async (model, options) => {
  // 여기에 로직을 작성합니다
});
// tests 모델
db.on('tests.afterValidate', async (model, options) => {
  // 여기에 로직을 작성합니다
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // 이메일 형식 확인
  },
});
// or
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // 이메일 형식 확인
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

데이터를 생성하기 전후에 해당 이벤트가 트리거됩니다. `repository.create()`가 호출될 때 발생합니다.

**시그니처**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**유형**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**예시**

```ts
db.on('beforeCreate', async (model, options) => {
  // 여기에 로직을 작성합니다
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

데이터를 업데이트하기 전후에 해당 이벤트가 트리거됩니다. `repository.update()`가 호출될 때 발생합니다.

**시그니처**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**유형**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**예시**

```ts
db.on('beforeUpdate', async (model, options) => {
  // 여기에 로직을 작성합니다
});

db.on('books.afterUpdate', async (model, options) => {
  // 여기에 로직을 작성합니다
});
```

### `'beforeSave'` / `'afterSave'`

데이터를 생성하거나 업데이트하기 전후에 해당 이벤트가 트리거됩니다. `repository.create()` 또는 `repository.update()`가 호출될 때 발생합니다.

**시그니처**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**유형**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**예시**

```ts
db.on('beforeSave', async (model, options) => {
  // 여기에 로직을 작성합니다
});

db.on('books.afterSave', async (model, options) => {
  // 여기에 로직을 작성합니다
});
```

### `'beforeDestroy'` / `'afterDestroy'`

데이터를 삭제하기 전후에 해당 이벤트가 트리거됩니다. `repository.destroy()`가 호출될 때 발생합니다.

**시그니처**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**유형**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**예시**

```ts
db.on('beforeDestroy', async (model, options) => {
  // 여기에 로직을 작성합니다
});

db.on('books.afterDestroy', async (model, options) => {
  // 여기에 로직을 작성합니다
});
```

### `'afterCreateWithAssociations'`

계층적 연관 관계 데이터를 포함하는 레코드를 생성한 후에 해당 이벤트가 트리거됩니다. `repository.create()`가 호출될 때 발생합니다.

**시그니처**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**유형**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**예시**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // 여기에 로직을 작성합니다
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // 여기에 로직을 작성합니다
});
```

### `'afterUpdateWithAssociations'`

계층적 연관 관계 데이터를 포함하는 레코드를 업데이트한 후에 해당 이벤트가 트리거됩니다. `repository.update()`가 호출될 때 발생합니다.

**시그니처**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**유형**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**예시**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // 여기에 로직을 작성합니다
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // 여기에 로직을 작성합니다
});
```

### `'afterSaveWithAssociations'`

계층적 연관 관계 데이터를 포함하는 레코드를 생성하거나 업데이트한 후에 해당 이벤트가 트리거됩니다. `repository.create()` 또는 `repository.update()`가 호출될 때 발생합니다.

**시그니처**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**유형**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**예시**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // 여기에 로직을 작성합니다
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // 여기에 로직을 작성합니다
});
```

### `'beforeDefineCollection'`

**컬렉션**을 정의하기 전에 트리거됩니다. 예를 들어 `db.collection()`이 호출될 때 발생합니다.

참고: 이 이벤트는 동기(synchronous) 이벤트입니다.

**시그니처**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**유형**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**예시**

```ts
db.on('beforeDefineCollection', (options) => {
  // 여기에 로직을 작성합니다
});
```

### `'afterDefineCollection'`

**컬렉션**을 정의한 후에 트리거됩니다. 예를 들어 `db.collection()`이 호출될 때 발생합니다.

참고: 이 이벤트는 동기(synchronous) 이벤트입니다.

**시그니처**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**유형**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**예시**

```ts
db.on('afterDefineCollection', (collection) => {
  // 여기에 로직을 작성합니다
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

메모리에서 **컬렉션**을 제거하기 전후에 트리거됩니다. 예를 들어 `db.removeCollection()`이 호출될 때 발생합니다.

참고: 이 이벤트는 동기(synchronous) 이벤트입니다.

**시그니처**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**유형**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**예시**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // 여기에 로직을 작성합니다
});

db.on('afterRemoveCollection', (collection) => {
  // 여기에 로직을 작성합니다
});
```