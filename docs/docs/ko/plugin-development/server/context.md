:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Context 컨텍스트

NocoBase에서는 모든 요청이 `ctx` 객체를 생성하며, 이 객체는 Context의 인스턴스입니다. Context는 요청 및 응답 정보를 캡슐화하고, 동시에 데이터베이스 접근, 캐시 작업, 권한 관리, 국제화, 로깅 등 NocoBase 고유의 다양한 기능을 제공합니다.

NocoBase의 `Application`은 Koa를 기반으로 구현되었기 때문에, `ctx`는 본질적으로 Koa Context입니다. 하지만 NocoBase는 여기에 풍부한 API를 확장하여 개발자가 미들웨어(Middleware)와 액션(Action)에서 비즈니스 로직을 편리하게 처리할 수 있도록 합니다. 각 요청은 독립적인 `ctx`를 가지며, 요청 간의 데이터 격리 및 보안을 보장합니다.

## ctx.action

`ctx.action`은 현재 요청에서 실행되는 액션(Action)에 대한 접근을 제공합니다. 다음과 같은 속성을 포함합니다:

- `ctx.action.params`
- `ctx.action.actionName`
- `ctx.action.resourceName`

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // 현재 액션(Action) 이름 출력
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

국제화(i18n)를 지원합니다.

- `ctx.i18n`은 언어 환경 정보를 제공합니다.
- `ctx.t()`는 언어에 따라 문자열을 번역하는 데 사용됩니다.

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // 요청 언어에 따라 번역된 문자열 반환
  ctx.body = msg;
});
```

## ctx.db

`ctx.db`는 데이터베이스 접근 인터페이스를 제공하여 모델을 직접 조작하고 쿼리를 실행할 수 있습니다.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache`는 캐시 작업을 제공합니다. 캐시 읽기 및 쓰기를 지원하며, 주로 데이터 접근 속도를 높이거나 임시 상태를 저장하는 데 사용됩니다.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // 60초 동안 캐시
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app`은 NocoBase 애플리케이션 인스턴스입니다. 전역 설정, 플러그인(Plugin) 및 서비스에 접근할 수 있습니다.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user`는 현재 인증된 사용자 정보를 가져옵니다. 권한 확인 또는 비즈니스 로직에서 사용하기에 적합합니다.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state`는 미들웨어 체인에서 데이터를 공유하는 데 사용됩니다.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger`는 로깅 기능을 제공하며, 다단계 로그 출력을 지원합니다.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission`은 권한 관리에 사용되며, `ctx.can()`은 현재 사용자가 특정 작업을 실행할 권한이 있는지 확인하는 데 사용됩니다.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## 요약

- 각 요청은 독립적인 `ctx` 객체에 해당합니다.
- `ctx`는 Koa Context의 확장으로, NocoBase 기능을 통합합니다.
- 자주 사용되는 속성은 `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` 등이 있습니다.
- 미들웨어(Middleware)와 액션(Action)에서 `ctx`를 사용하면 요청, 응답, 권한, 로그 및 데이터베이스를 편리하게 조작할 수 있습니다.