:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/location)을 참조하세요.
:::

# ctx.location

현재 라우트의 위치 정보이며, React Router의 `location` 객체와 동일합니다. 보통 `ctx.router`, `ctx.route`와 함께 사용되어 현재 경로, 쿼리 문자열, hash 및 라우트를 통해 전달된 state를 읽는 데 사용됩니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock / JSField** | 현재 경로, 쿼리 파라미터 또는 hash에 따라 조건부 렌더링이나 로직 분기를 수행합니다. |
| **연동 규칙 / 이벤트 흐름** | URL 쿼리 파라미터를 읽어 연동 필터링을 수행하거나, `location.state`를 기반으로 유입 소스를 판단합니다. |
| **라우트 이동 후 처리** | 대상 페이지에서 `ctx.router.navigate`를 통해 이전 페이지에서 전달된 데이터를 `ctx.location.state`로 수신합니다. |

> 주의: `ctx.location`은 라우팅 컨텍스트가 존재하는 RunJS 환경(페이지 내 JSBlock, 이벤트 흐름 등)에서만 사용할 수 있습니다. 순수 백엔드나 라우팅이 없는 컨텍스트(예: 워크플로우)에서는 값이 비어 있을 수 있습니다.

## 타입 정의

```ts
location: Location;
```

`Location`은 `react-router-dom`에서 제공되며, React Router의 `useLocation()` 반환 값과 일치합니다.

## 주요 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `pathname` | `string` | 현재 경로이며, `/`로 시작합니다 (예: `/admin/users`). |
| `search` | `string` | 쿼리 문자열이며, `?`로 시작합니다 (예: `?page=1&status=active`). |
| `hash` | `string` | hash 세그먼트이며, `#`으로 시작합니다 (예: `#section-1`). |
| `state` | `any` | `ctx.router.navigate(path, { state })`를 통해 전달된 임의의 데이터이며, URL에는 표시되지 않습니다. |
| `key` | `string` | 해당 location의 고유 식별자입니다. 초기 페이지는 `"default"`입니다. |

## ctx.router, ctx.urlSearchParams와의 관계

| 용도 | 권장 사용법 |
|------|----------|
| **경로, hash, state 읽기** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **쿼리 파라미터 읽기 (객체 형태)** | `ctx.urlSearchParams`를 통해 파싱된 객체를 직접 얻을 수 있습니다. |
| **search 문자열 파싱** | `new URLSearchParams(ctx.location.search)`를 사용하거나 직접 `ctx.urlSearchParams`를 사용합니다. |

`ctx.urlSearchParams`는 `ctx.location.search`를 파싱하여 생성됩니다. 쿼리 파라미터만 필요한 경우 `ctx.urlSearchParams`를 사용하는 것이 더 편리합니다.

## 예시

### 경로에 따른 분기 처리

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('현재 사용자 관리 페이지입니다');
}
```

### 쿼리 파라미터 파싱

```ts
// 방법 1: ctx.urlSearchParams 사용 (권장)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// 방법 2: URLSearchParams를 사용하여 search 파싱
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### 라우트 이동 시 전달된 state 수신

```ts
// 이전 페이지에서 이동 시: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('대시보드에서 이동해 왔습니다');
}
```

### hash를 이용한 앵커 위치 확인

```ts
const hash = ctx.location.hash; // 예: "#edit"
if (hash === '#edit') {
  // 편집 영역으로 스크롤하거나 해당 로직 실행
}
```

## 관련 정보

- [ctx.router](./router.md): 라우트 탐색 도구입니다. `ctx.router.navigate`의 `state`는 대상 페이지에서 `ctx.location.state`를 통해 가져올 수 있습니다.
- [ctx.route](./route.md): 현재 라우트 매칭 정보(파라미터, 설정 등)이며, 보통 `ctx.location`과 함께 사용됩니다.