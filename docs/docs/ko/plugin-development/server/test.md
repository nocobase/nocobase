:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 테스트

NocoBase는 개발자가 플러그인 개발 과정에서 데이터베이스 로직, API 인터페이스, 기능 구현의 정확성을 빠르게 검증할 수 있도록 완벽한 테스트 도구를 제공합니다. 이 문서에서는 이러한 테스트를 작성하고, 실행하며, 구성하는 방법을 소개합니다.

## 테스트를 작성해야 하는 이유

플러그인 개발에서 자동화된 테스트를 작성하면 다음과 같은 이점이 있습니다.

- 데이터베이스 모델, API, 비즈니스 로직의 정확성을 빠르게 검증할 수 있습니다.
- 회귀 오류를 방지할 수 있습니다 (코어 업그레이드 후 플러그인 호환성을 자동으로 감지합니다).
- 지속적 통합(CI) 환경에서 테스트를 자동으로 실행할 수 있도록 지원합니다.
- 전체 서비스를 시작하지 않고도 플러그인 기능을 테스트할 수 있도록 지원합니다.

## 테스트 환경 기본 사항

NocoBase는 두 가지 핵심 테스트 도구를 제공합니다.

| 도구 | 설명 | 용도 |
|------|------|------|
| `createMockDatabase` | 인메모리 데이터베이스 인스턴스를 생성합니다. | 데이터베이스 모델 및 로직 테스트 |
| `createMockServer` | 완전한 애플리케이션 인스턴스(데이터베이스, 플러그인, API 등 포함)를 생성합니다. | 비즈니스 프로세스 및 인터페이스 동작 테스트 |

## `createMockDatabase`를 사용한 데이터베이스 테스트

`createMockDatabase`는 모델 정의, 필드 타입, 관계, CRUD 작업 등 데이터베이스와 직접 관련된 기능을 테스트하는 데 적합합니다.

### 기본 예시

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('Database test', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create and query data', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'integer', name: 'age' },
      ],
    });

    await User.sync();

    const user = await db.getRepository('users').create({
      values: { username: 'testuser', age: 25 },
    });

    const found = await db.getRepository('users').findOne({
      filter: { username: 'testuser' },
    });

    expect(found.get('age')).toBe(25);
  });
});
```

### CRUD 작업 테스트

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// Create
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// Update
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### 모델 연관 관계 테스트

```ts
const Users = db.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'username' },
    { type: 'hasMany', name: 'posts' },
  ],
});

const Posts = db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'belongsTo', name: 'author' },
  ],
});
await db.sync();

const user = await db.getRepository('users').create({ values: { username: 'tester' } });
await db.getRepository('posts').create({
  values: { title: 'Post 1', authorId: user.get('id') },
});

const result = await db.getRepository('users').findOne({
  filterByTk: user.get('id'),
  appends: ['posts'],
});
expect(result.get('posts')).toHaveLength(1);
```

## `createMockServer`를 사용한 API 테스트

`createMockServer`는 데이터베이스, 플러그인, API 라우트를 포함하는 완전한 애플리케이션 인스턴스를 자동으로 생성하므로, 플러그인 인터페이스를 테스트하는 데 매우 적합합니다.

### 기본 예시

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('User API test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: ['users', 'auth'] });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create a user', async () => {
    const response = await app.agent()
      .post('/users:create')
      .send({ username: 'test', email: 'a@b.com', password: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('test');
  });
});
```

### API 쿼리 및 업데이트 테스트

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### 로그인 상태 또는 권한 테스트 시뮬레이션

`MockServer`를 생성할 때 `auth` 플러그인을 활성화한 다음, 로그인 인터페이스를 사용하여 토큰 또는 세션을 얻을 수 있습니다.

```ts
const res = await app
  .agent()
  .post('/auth:signin')
  .send({ 
    username: 'admin',
    password: 'admin123',
  });

const token = res.body.data.token;

await app
  .agent()
  .set('Authorization', `Bearer ${token}`)
  .get('/protected-endpoint');
```

더 간단한 `login()` 메서드를 사용할 수도 있습니다.

```ts
await app.agent().login(userOrId);
```

## 플러그인에서 테스트 파일 구성하기

플러그인의 `./src/server/__tests__` 폴더에 서버 측 로직과 관련된 테스트 파일을 저장하는 것을 권장합니다.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # 소스 코드 디렉터리
│   └── server/              # 서버 측 코드
│       ├── __tests__/       # 테스트 파일 디렉터리
│       │   ├── db.test.ts   # 데이터베이스 관련 테스트 (createMockDatabase 사용)
│       │   └── api.test.ts  # API 관련 테스트
```

## 테스트 실행하기

```bash
# 디렉터리 지정
yarn test packages/plugins/@my-project/plugin-hello/src/server
# 파일 지정
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```