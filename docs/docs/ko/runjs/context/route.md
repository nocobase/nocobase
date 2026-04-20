:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/route)을 참조하세요.
:::

# ctx.route

현재 라우트 매칭 정보이며, React Router의 route 개념과 대응됩니다. 현재 매칭된 라우트 설정, 파라미터 등을 가져오는 데 사용됩니다. 보통 `ctx.router`, `ctx.location`과 함께 사용됩니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock / JSField** | `route.pathname` 또는 `route.params`에 따라 조건부 렌더링을 수행하거나 현재 페이지 식별자를 표시합니다. |
| **연동 규칙 / 이벤트 흐름** | 라우트 파라미터(예: `params.name`)를 읽어 로직 분기를 처리하거나 하위 컴포넌트에 전달합니다. |
| **뷰 내비게이션** | 내부적으로 `ctx.route.pathname`과 대상 경로를 비교하여 `ctx.router.navigate` 트리거 여부를 결정합니다. |

> 주의: `ctx.route`는 라우트 컨텍스트가 존재하는 RunJS 환경(페이지 내 JSBlock, 워크플로우 페이지 등)에서만 사용할 수 있습니다. 순수 백엔드나 라우트가 없는 컨텍스트(예: 백그라운드 워크플로우)에서는 값이 비어 있을 수 있습니다.

## 타입 정의

```ts
type RouteOptions = {
  name?: string;   // 라우트 고유 식별자
  path?: string;   // 라우트 템플릿 (예: /admin/:name)
  params?: Record<string, any>;  // 라우트 파라미터 (예: { name: 'users' })
  pathname?: string;  // 현재 라우트의 전체 경로 (예: /admin/users)
};
```

## 주요 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `pathname` | `string` | 현재 라우트의 전체 경로이며, `ctx.location.pathname`과 일치합니다. |
| `params` | `Record<string, any>` | 라우트 템플릿에서 파싱된 동적 파라미터입니다 (예: `{ name: 'users' }`). |
| `path` | `string` | 라우트 템플릿입니다 (예: `/admin/:name`). |
| `name` | `string` | 라우트 고유 식별자로, 주로 다중 탭이나 다중 뷰 시나리오에서 사용됩니다. |

## ctx.router, ctx.location과의 관계

| 용도 | 권장 사용법 |
|------|----------|
| **현재 경로 읽기** | `ctx.route.pathname` 또는 `ctx.location.pathname`, 매칭 시 두 값은 동일합니다. |
| **라우트 파라미터 읽기** | `ctx.route.params`, 예: 현재 페이지 UID를 나타내는 `params.name`. |
| **내비게이션 이동** | `ctx.router.navigate(path)` |
| **쿼리 파라미터, state 읽기** | `ctx.location.search`, `ctx.location.state` |

`ctx.route`는 '매칭된 라우트 설정'에 중점을 두고, `ctx.location`은 '현재 URL 위치'에 중점을 둡니다. 두 가지를 함께 사용하여 현재 라우트 상태를 완전하게 설명할 수 있습니다.

## 예시

### pathname 읽기

```ts
// 현재 경로 표시
ctx.message.info('현재 페이지: ' + ctx.route.pathname);
```

### params에 따른 분기 처리

```ts
// params.name은 보통 현재 페이지 UID(예: 워크플로우 페이지 식별자)입니다.
if (ctx.route.params?.name === 'users') {
  // 사용자 관리 페이지에서 특정 로직 실행
}
```

### 워크플로우 페이지에서 표시

```tsx
<div>
  <h1>현재 페이지 - {ctx.route.pathname}</h1>
  <p>라우트 식별자: {ctx.route.params?.name}</p>
</div>
```

## 관련 문서

- [ctx.router](./router.md): 라우트 내비게이션. `ctx.router.navigate()`로 경로가 변경되면 `ctx.route`도 그에 따라 업데이트됩니다.
- [ctx.location](./location.md): 현재 URL 위치(pathname, search, hash, state)이며, `ctx.route`와 함께 사용됩니다.