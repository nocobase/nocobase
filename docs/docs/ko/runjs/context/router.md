:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/router)을 참조하세요.
:::

# ctx.router

React Router 기반의 라우터 인스턴스로, RunJS에서 코드를 통해 내비게이션을 수행할 때 사용됩니다. 보통 `ctx.route`, `ctx.location`과 함께 사용됩니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock / JSField** | 버튼 클릭 후 상세 페이지, 목록 페이지 또는 외부 링크로 이동 |
| **연동 규칙 / 이벤트 흐름** | 제출 성공 후 목록이나 상세 페이지로 `navigate` 하거나, 대상 페이지로 state 전달 |
| **JSAction / 이벤트 처리** | 폼 제출, 링크 클릭 등의 로직 내에서 라우트 이동 실행 |
| **뷰 내비게이션** | 내부 뷰 스택 전환 시 `navigate`를 통해 URL 업데이트 |

> 주의: `ctx.router`는 라우팅 컨텍스트가 존재하는 RunJS 환경(예: 페이지 내 JSBlock, 워크플로우 페이지, 이벤트 흐름 등)에서만 사용할 수 있습니다. 순수 백엔드나 라우팅이 없는 컨텍스트(예: 워크플로우)에서는 null일 수 있습니다.

## 타입 정의

```typescript
router: Router
```

`Router`는 `@remix-run/router`에서 제공됩니다. RunJS에서는 `ctx.router.navigate()`를 통해 이동, 뒤로 가기, 새로고침 등의 내비게이션 작업을 구현합니다.

## 메서드

### ctx.router.navigate()

대상 경로로 이동하거나 뒤로 가기/새로고침을 실행합니다.

**시그니처:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**매개변수:**

- `to`: 대상 경로(string), 상대적 히스토리 위치(number, 예: `-1`은 뒤로 가기) 또는 `null`(현재 페이지 새로고침)
- `options`: 선택적 설정
  - `replace?: boolean`: 현재 히스토리 기록을 대체할지 여부 (기본값은 `false`이며, 새로운 기록을 push함)
  - `state?: any`: 대상 라우트로 전달할 state. 이 데이터는 URL에 표시되지 않으며, 대상 페이지에서 `ctx.location.state`를 통해 접근할 수 있습니다. 민감한 정보, 임시 데이터 또는 URL에 포함하기 부적절한 정보에 적합합니다.

## 예시

### 기본 이동

```ts
// 사용자 목록으로 이동 (새 히스토리 push, 뒤로 가기 가능)
ctx.router.navigate('/admin/users');

// 상세 페이지로 이동
ctx.router.navigate(`/admin/users/${recordId}`);
```

### 히스토리 대체 (기록 추가 없음)

```ts
// 로그인 후 메인 페이지로 리다이렉트, 사용자가 뒤로 가기를 해도 로그인 페이지로 돌아가지 않음
ctx.router.navigate('/admin', { replace: true });

// 폼 제출 성공 후 현재 페이지를 상세 페이지로 대체
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### state 전달

```ts
// 이동 시 데이터를 함께 전달, 대상 페이지에서 ctx.location.state로 획득
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### 뒤로 가기 및 새로고침

```ts
// 한 페이지 뒤로 가기
ctx.router.navigate(-1);

// 두 페이지 뒤로 가기
ctx.router.navigate(-2);

// 현재 페이지 새로고침
ctx.router.navigate(null);
```

## ctx.route, ctx.location과의 관계

| 용도 | 권장 용법 |
|------|----------|
| **내비게이션 이동** | `ctx.router.navigate(path)` |
| **현재 경로 읽기** | `ctx.route.pathname` 또는 `ctx.location.pathname` |
| **이동 시 전달된 state 읽기** | `ctx.location.state` |
| **라우트 파라미터 읽기** | `ctx.route.params` |

`ctx.router`는 '내비게이션 동작'을 담당하고, `ctx.route`와 `ctx.location`은 '현재 라우트 상태'를 담당합니다.

## 주의사항

- `navigate(path)`는 기본적으로 새로운 히스토리 기록을 push하며, 사용자는 브라우저의 뒤로 가기 버튼으로 돌아갈 수 있습니다.
- `replace: true`는 현재 히스토리 기록을 대체하고 새로 추가하지 않습니다. 로그인 후 리다이렉트나 제출 성공 후 이동 등의 시나리오에 적합합니다.
- **`state` 파라미터에 대하여**:
  - `state`를 통해 전달된 데이터는 URL에 나타나지 않으므로 민감하거나 임시적인 데이터 전달에 적합합니다.
  - 대상 페이지에서 `ctx.location.state`를 통해 접근할 수 있습니다.
  - `state`는 브라우저 히스토리에 저장되어 앞/뒤로 가기 시에도 유지됩니다.
  - 페이지를 새로고침하면 `state`는 소실됩니다.

## 관련 정보

- [ctx.route](./route.md): 현재 라우트 매칭 정보 (pathname, params 등)
- [ctx.location](./location.md): 현재 URL 위치 (pathname, search, hash, state), 이동 후 `state`는 여기서 읽습니다.