:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/request)을 참조하세요.
:::

# ctx.request()

RunJS에서 인증이 포함된 HTTP 요청을 보냅니다. 요청 시 현재 애플리케이션의 `baseURL`, `Token`, `locale`, `role` 등이 자동으로 포함되며, 애플리케이션의 요청 인터셉터 및 에러 처리 로직을 그대로 따릅니다.

## 적용 사례

JSBlock, JSField, JSItem, JSColumn, 워크플로우, 연동, JSAction 등 RunJS에서 원격 HTTP 요청이 필요한 모든 시나리오에서 사용할 수 있습니다.

## 타입 정의

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions`는 Axios의 `AxiosRequestConfig`를 기반으로 확장되었습니다:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // 요청 실패 시 전역 에러 메시지 표시 건너뛰기 여부
  skipAuth?: boolean;                                 // 인증 리다이렉션 건너뛰기 여부 (예: 401 발생 시 로그인 페이지로 이동하지 않음)
};
```

## 주요 파라미터

| 파라미터 | 타입 | 설명 |
|------|------|------|
| `url` | string | 요청 URL. 리소스 스타일(예: `users:list`, `posts:create`) 또는 전체 URL을 지원합니다. |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP 메서드, 기본값은 `'get'`입니다. |
| `params` | object | 쿼리 파라미터, URL로 직렬화됩니다. |
| `data` | any | 요청 본문(Body), post/put/patch에서 사용됩니다. |
| `headers` | object | 사용자 정의 요청 헤더 |
| `skipNotify` | boolean \| (error) => boolean | true이거나 함수가 true를 반환하면, 실패 시 전역 에러 메시지를 표시하지 않습니다. |
| `skipAuth` | boolean | true일 경우 401 에러 등이 발생해도 인증 리다이렉션(예: 로그인 페이지 이동)을 트리거하지 않습니다. |

## 리소스 스타일 URL

NocoBase 리소스 API는 `리소스:액션` 형식의 축약형을 지원합니다:

| 형식 | 설명 | 예시 |
|------|------|------|
| `collection:action` | 단일 컬렉션 CRUD | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | 관계 리소스 (`resourceOf` 또는 URL을 통해 기본 키를 전달해야 함) | `posts.comments:list` |

상대 경로는 애플리케이션의 `baseURL`(보통 `/api`)과 결합됩니다. 교차 도메인(CORS) 요청의 경우 전체 URL을 사용해야 하며, 대상 서비스에 CORS 설정이 되어 있어야 합니다.

## 응답 구조

반환값은 Axios 응답 객체이며, 주요 필드는 다음과 같습니다:

- `response.data`: 응답 본문
- 목록 인터페이스는 보통 `data.data`(레코드 배열) + `data.meta`(페이지네이션 등)를 반환합니다.
- 단일 조회/생성/수정 인터페이스는 대부분 `data.data`에 단일 레코드가 담깁니다.

## 예시

### 목록 조회

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // 페이지네이션 등 정보
```

### 데이터 제출

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: '홍길동', email: 'hong@example.com' },
});

const newRecord = res?.data?.data;
```

### 필터링 및 정렬 포함

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### 에러 메시지 건너뛰기

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // 실패 시 전역 메시지를 표시하지 않음
});

// 또는 에러 유형에 따라 건너뛰기 여부 결정
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### 교차 도메인 요청

전체 URL을 사용하여 다른 도메인에 요청할 때, 대상 서비스는 현재 애플리케이션의 오리진(Origin)을 허용하도록 CORS가 설정되어 있어야 합니다. 대상 인터페이스에 별도의 토큰이 필요한 경우 headers를 통해 전달할 수 있습니다:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <대상 서비스의 토큰>',
  },
});
```

### ctx.render와 함께 사용하기

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('사용자 목록') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## 주의 사항

- **에러 처리**: 요청 실패 시 예외가 발생하며, 기본적으로 전역 에러 메시지가 표시됩니다. `skipNotify: true`를 사용하여 직접 에러를 포착하고 처리할 수 있습니다.
- **인증**: 동일 도메인 요청은 현재 사용자의 Token, locale, role을 자동으로 포함합니다. 교차 도메인 요청은 대상 서버의 CORS 지원이 필요하며, 필요에 따라 헤더에 토큰을 전달해야 합니다.
- **리소스 권한**: 요청은 ACL(액세스 제어 목록)의 제한을 받으며, 현재 사용자가 권한을 가진 리소스에만 접근할 수 있습니다.

## 관련 문서

- [ctx.message](./message.md) - 요청 완료 후 가벼운 메시지 표시
- [ctx.notification](./notification.md) - 요청 완료 후 알림 표시
- [ctx.render](./render.md) - 요청 결과를 화면에 렌더링
- [ctx.makeResource](./make-resource.md) - 체이닝 방식의 데이터 로딩을 위한 리소스 객체 생성 (`ctx.request` 대신 사용 가능)