:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# ResourceManager 리소스 관리

NocoBase의 리소스 관리 기능은 기존의 `컬렉션`(데이터 테이블)과 연관(association)을 자동으로 리소스로 변환하며, 다양한 내장 작업 유형을 제공하여 개발자가 REST API 리소스 작업을 빠르게 구축할 수 있도록 돕습니다. 기존 REST API와는 조금 다르게, NocoBase의 리소스 작업은 HTTP 요청 메서드에 의존하지 않고, 명시적인 `:action` 정의를 통해 실행할 특정 작업을 결정합니다.

## 리소스 자동 생성

NocoBase는 데이터베이스에 정의된 `컬렉션`과 `association`을 자동으로 리소스로 변환합니다. 예를 들어, `posts`와 `tags` 두 개의 컬렉션을 정의하면 다음과 같습니다:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

이렇게 하면 다음 리소스가 자동으로 생성됩니다:

* `posts` 리소스
* `tags` 리소스
* `posts.tags` 연관 리소스

요청 예시:

| 요청 방식   | 경로                     | 작업       |
| -------- | ---------------------- | -------- |
| `GET`  | `/api/posts:list`      | 목록 조회    |
| `GET`  | `/api/posts:get/1`     | 단일 항목 조회 |
| `POST` | `/api/posts:create`    | 추가       |
| `POST` | `/api/posts:update/1`  | 업데이트     |
| `POST` | `/api/posts:destroy/1` | 삭제       |

| 요청 방식   | 경로                     | 작업       |
| -------- | ---------------------- | -------- |
| `GET`  | `/api/tags:list`       | 목록 조회    |
| `GET`  | `/api/tags:get/1`      | 단일 항목 조회 |
| `POST` | `/api/tags:create`     | 추가       |
| `POST` | `/api/tags:update/1`   | 업데이트     |
| `POST` | `/api/tags:destroy/1`  | 삭제       |

| 요청 방식   | 경로                             | 작업                               |
| -------- | ------------------------------ | ---------------------------------- |
| `GET`  | `/api/posts/1/tags:list`       | 특정 `post`에 연관된 모든 `tags` 조회  |
| `GET`  | `/api/posts/1/tags:get/1`      | 특정 `post`에 속한 단일 `tags` 조회    |
| `POST` | `/api/posts/1/tags:create`     | 특정 `post`에 속한 단일 `tags` 생성    |
| `POST` | `/api/posts/1/tags:update/1`   | 특정 `post`에 속한 단일 `tags` 업데이트 |
| `POST` | `/api/posts/1/tags:destroy/1`  | 특정 `post`에 속한 단일 `tags` 삭제    |
| `POST` | `/api/posts/1/tags:add`        | 특정 `post`에 연관된 `tags` 추가       |
| `POST` | `/api/posts/1/tags:remove`     | 특정 `post`에서 연관된 `tags` 제거     |
| `POST` | `/api/posts/1/tags:set`        | 특정 `post`의 모든 연관 `tags` 설정    |
| `POST` | `/api/posts/1/tags:toggle`     | 특정 `post`의 `tags` 연관 토글       |

:::tip 팁

NocoBase의 리소스 작업은 요청 메서드에 직접 의존하지 않고, 명시적인 `:action` 정의를 통해 실행할 작업을 결정합니다.

:::

## 리소스 작업

NocoBase는 다양한 비즈니스 요구사항을 충족하기 위해 풍부한 내장 작업 유형을 제공합니다.

### 기본 CRUD 작업

| 작업 이름       | 설명               | 적용 리소스 유형 | 요청 방식     | 예시 경로                   |
| --------- | ---------------- | ---------- | -------- | ---------------------- |
| `list`    | 목록 데이터 조회       | 모든       | GET/POST | `/api/posts:list`      |
| `get`     | 단일 데이터 조회       | 모든       | GET/POST | `/api/posts:get/1`     |
| `create`  | 새 레코드 생성         | 모든       | POST     | `/api/posts:create`    |
| `update`  | 레코드 업데이트        | 모든       | POST     | `/api/posts:update/1`  |
| `destroy` | 레코드 삭제          | 모든       | POST     | `/api/posts:destroy/1` |
| `firstOrCreate`  | 첫 번째 레코드 찾기, 없으면 생성 | 모든 | POST     |  `/api/users:firstOrCreate`  |
| `updateOrCreate` | 레코드 업데이트, 없으면 생성    | 모든 | POST     |  `/api/users:updateOrCreate` |

### 관계 작업

| 작업 이름      | 설명             | 적용 관계 유형                                   | 예시 경로                           |
| -------- | -------------- | ---------------------------------------- | ------------------------------ |
| `add`    | 연관 추가        | `hasMany`, `belongsToMany`               | `/api/posts/1/tags:add`        |
| `remove` | 연관 제거        | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`    | 연관 재설정      | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle` | 연관 추가 또는 제거 | `belongsToMany`                          | `/api/posts/1/tags:toggle`     |

### 작업 파라미터

일반적인 작업 파라미터는 다음과 같습니다:

* `filter`: 조회 조건
* `values`: 설정할 값
* `fields`: 반환할 필드 지정
* `appends`: 연관 데이터 포함
* `except`: 제외할 필드
* `sort`: 정렬 규칙
* `page`, `pageSize`: 페이지네이션 파라미터
* `paginate`: 페이지네이션 활성화 여부
* `tree`: 트리 구조 반환 여부
* `whitelist`, `blacklist`: 필드 화이트리스트/블랙리스트
* `updateAssociationValues`: 연관 값 업데이트 여부

## 사용자 정의 리소스 작업

NocoBase는 기존 리소스에 추가 작업을 등록할 수 있도록 합니다. `registerActionHandlers`를 사용하여 모든 리소스 또는 특정 리소스에 대한 작업을 사용자 정의할 수 있습니다.

### 전역 작업 등록

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### 특정 리소스 작업 등록

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

요청 예시:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

명명 규칙: `resourceName:actionName`이며, 연관 관계를 포함할 때는 점 구문(`posts.comments`)을 사용합니다.

## 사용자 정의 리소스

데이터 테이블과 관련 없는 리소스를 제공해야 할 경우, `resourceManager.define` 메서드를 사용하여 정의할 수 있습니다:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

요청 방식은 자동 생성 리소스와 동일합니다:

* `GET /api/app:getInfo`
* `POST /api/app:getInfo` (기본적으로 GET/POST 모두 지원)

## 사용자 정의 미들웨어

`resourceManager.use()` 메서드를 사용하여 전역 미들웨어를 등록할 수 있습니다. 예를 들어:

전역 로깅 미들웨어

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Context의 특수 속성

`resourceManager` 레이어의 미들웨어 또는 액션에 진입할 수 있다는 것은 해당 리소스가 반드시 존재한다는 것을 의미합니다.

### ctx.action

- `ctx.action.actionName`: 작업 이름
- `ctx.action.resourceName`: 컬렉션 또는 association일 수 있습니다.
- `ctx.action.params`: 작업 파라미터

### ctx.dataSource

현재 데이터 소스 객체입니다.

### ctx.getCurrentRepository()

현재 repository 객체입니다.

## 다양한 데이터 소스의 resourceManager 객체 가져오기

`resourceManager`는 데이터 소스에 속하며, 각기 다른 데이터 소스에 대해 별도로 작업을 등록할 수 있습니다.

### 주 데이터 소스

주 데이터 소스의 경우, `app.resourceManager`를 직접 사용하여 작업할 수 있습니다:

```ts
app.resourceManager.registerActionHandlers();
```

### 다른 데이터 소스

다른 데이터 소스의 경우, `dataSourceManager`를 통해 특정 데이터 소스 인스턴스를 가져와 해당 인스턴스의 `resourceManager`를 사용하여 작업할 수 있습니다:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### 모든 데이터 소스 반복 처리

추가된 모든 데이터 소스에 대해 동일한 작업을 수행해야 하는 경우, `dataSourceManager.afterAddDataSource` 메서드를 사용하여 반복 처리할 수 있습니다. 이를 통해 각 데이터 소스의 `resourceManager`가 해당 작업을 등록하도록 보장합니다:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```