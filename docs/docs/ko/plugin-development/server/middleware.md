:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 미들웨어

NocoBase 서버의 미들웨어는 본질적으로 **Koa 미들웨어**입니다. Koa에서와 마찬가지로 `ctx` 객체를 조작하여 요청과 응답을 처리할 수 있습니다. 하지만 NocoBase는 다양한 비즈니스 계층의 로직을 관리해야 하므로, 모든 미들웨어를 한곳에 두면 유지보수 및 관리가 매우 어려워집니다.

이를 위해 NocoBase는 미들웨어를 **네 가지 계층**으로 나눕니다.

1.  **데이터 소스 계층 미들웨어**: `app.dataSourceManager.use()`
    **특정 데이터 소스**에 대한 요청에만 적용되며, 해당 데이터 소스의 데이터베이스 연결, 필드 유효성 검사 또는 트랜잭션 처리 로직 등에 주로 사용됩니다.

2.  **리소스 계층 미들웨어**: `app.resourceManager.use()`
    정의된 리소스(Resource)에만 적용되며, 데이터 권한, 포맷팅 등 리소스 수준의 로직을 처리하는 데 적합합니다.

3.  **권한 계층 미들웨어**: `app.acl.use()`
    권한 확인 전에 실행되며, 사용자 권한 또는 역할을 검증하는 데 사용됩니다.

4.  **애플리케이션 계층 미들웨어**: `app.use()`
    모든 요청에 대해 실행되며, 로깅, 일반적인 오류 처리, 응답 처리 등에 적합합니다.

## 미들웨어 등록

미들웨어는 일반적으로 플러그인의 `load` 메서드에서 등록합니다. 예를 들어 다음과 같습니다:

```ts
export class MyPlugin extends Plugin {
  load() {
    // 애플리케이션 계층 미들웨어
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // 데이터 소스 미들웨어
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // 권한 미들웨어
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // 리소스 미들웨어
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### 실행 순서

미들웨어 실행 순서는 다음과 같습니다:

1.  `acl.use()`로 추가된 권한 미들웨어가 먼저 실행됩니다.
2.  그다음 `resourceManager.use()`로 추가된 리소스 미들웨어가 실행됩니다.
3.  이어서 `dataSourceManager.use()`로 추가된 데이터 소스 미들웨어가 실행됩니다.
4.  마지막으로 `app.use()`로 추가된 애플리케이션 미들웨어가 실행됩니다.

## `before` / `after` / `tag` 삽입 메커니즘

미들웨어 순서를 더욱 유연하게 제어하기 위해 NocoBase는 `before`, `after`, `tag` 매개변수를 제공합니다:

-   **tag**: 미들웨어에 태그를 지정하여 후속 미들웨어에서 참조할 수 있도록 합니다.
-   **before**: 지정된 태그를 가진 미들웨어 앞에 삽입합니다.
-   **after**: 지정된 태그를 가진 미들웨어 뒤에 삽입합니다.

예시:

```ts
// 일반 미들웨어
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4는 m1 앞에 위치합니다.
app.use(m4, { before: 'restApi' });

// m5는 m2와 m3 사이에 삽입됩니다.
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

위치를 지정하지 않으면, 새로 추가되는 미들웨어의 기본 실행 순서는 다음과 같습니다:
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`

:::

## 양파 모델 예시

미들웨어 실행 순서는 Koa의 **양파 모델**을 따릅니다. 즉, 미들웨어 스택에 먼저 진입한 후 마지막에 스택에서 나옵니다.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourceManager.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

다양한 인터페이스에 대한 출력 순서 예시는 다음과 같습니다:

-   **일반 요청**: `/api/hello`
    출력: `[1,2]` (리소스가 정의되지 않아 `resourceManager` 및 `acl` 미들웨어가 실행되지 않습니다.)

-   **리소스 요청**: `/api/test:list`
    출력: `[5,3,7,1,2,8,4,6]`
    미들웨어는 계층 순서와 양파 모델에 따라 실행됩니다.

## 요약

-   NocoBase 미들웨어는 Koa 미들웨어의 확장입니다.
-   네 가지 계층: 애플리케이션 -> 데이터 소스 -> 리소스 -> 권한
-   `before` / `after` / `tag`를 사용하여 실행 순서를 유연하게 제어할 수 있습니다.
-   Koa 양파 모델을 따르며, 미들웨어가 조합 가능하고 중첩 가능하도록 보장합니다.
-   데이터 소스 계층 미들웨어는 지정된 데이터 소스 요청에만 적용되며, 리소스 계층 미들웨어는 정의된 리소스 요청에만 적용됩니다.