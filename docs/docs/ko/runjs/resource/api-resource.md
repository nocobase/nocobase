:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/resource/api-resource)을 참조하세요.
:::

# APIResource

URL을 기반으로 요청을 보내는 **범용 API 리소스**로, 모든 HTTP 인터페이스에 적합합니다. `FlowResource` 기본 클래스를 상속받으며, 요청 설정과 `refresh()` 기능이 확장되었습니다. [MultiRecordResource](./multi-record-resource.md) 및 [SingleRecordResource](./single-record-resource.md)와 달리 APIResource는 리소스 이름에 의존하지 않고 URL로 직접 요청하므로, 커스텀 인터페이스나 서드파티 API 등의 시나리오에 적합합니다.

**생성 방식**: `ctx.makeResource('APIResource')` 또는 `ctx.initResource('APIResource')`. 사용 전 `setURL()`을 설정해야 합니다. RunJS 컨텍스트에서는 `ctx.api`(APIClient)가 자동으로 주입되므로 `setAPIClient`를 수동으로 호출할 필요가 없습니다.

---

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **커스텀 인터페이스** | 비표준 리소스 API 호출 (예: `/api/custom/stats`, `/api/reports/summary`) |
| **서드파티 API** | 전체 URL을 통해 외부 서비스 요청 (대상 서버의 CORS 지원 필요) |
| **일회성 쿼리** | 데이터를 임시로 가져오고 폐기하며, `ctx.resource`에 바인딩할 필요가 없는 경우 |
| **ctx.request와의 선택** | 반응형 데이터, 이벤트, 에러 상태 관리가 필요한 경우 APIResource를 사용하고, 단순 일회성 요청은 `ctx.request()`를 사용합니다. |

---

## 기본 클래스 기능 (FlowResource)

모든 리소스는 다음 기능을 갖추고 있습니다:

| 메서드 | 설명 |
|------|------|
| `getData()` | 현재 데이터 가져오기 |
| `setData(value)` | 데이터 설정 (로컬 전용) |
| `hasData()` | 데이터 존재 여부 확인 |
| `getMeta(key?)` / `setMeta(meta)` | 메타데이터 읽기/쓰기 |
| `getError()` / `setError(err)` / `clearError()` | 에러 상태 관리 |
| `on(event, callback)` / `once` / `off` / `emit` | 이벤트 구독 및 발생 |

---

## 요청 설정

| 메서드 | 설명 |
|------|------|
| `setAPIClient(api)` | APIClient 인스턴스 설정 (RunJS에서는 보통 컨텍스트에서 자동 주입) |
| `getURL()` / `setURL(url)` | 요청 URL 설정 및 조회 |
| `loading` | 로딩 상태 읽기/쓰기 (get/set) |
| `clearRequestParameters()` | 요청 파라미터 초기화 |
| `setRequestParameters(params)` | 요청 파라미터 병합 설정 |
| `setRequestMethod(method)` | 요청 메서드 설정 (예: `'get'`, `'post'`, 기본값 `'get'`) |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | 요청 헤더 관리 |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | 단일 파라미터 추가/조회/삭제 |
| `setRequestBody(data)` | 요청 본문 설정 (POST/PUT/PATCH 시 사용) |
| `setRequestOptions(key, value)` / `getRequestOptions()` | 공통 요청 옵션 설정 |

---

## URL 형식

- **리소스 스타일**: `users:list`, `posts:get`과 같은 NocoBase 리소스 약칭을 지원하며, baseURL과 결합됩니다.
- **상대 경로**: `/api/custom/endpoint`와 같이 애플리케이션의 baseURL과 결합됩니다.
- **전체 URL**: 교차 도메인 요청 시 전체 주소를 사용하며, 대상 서버에 CORS 설정이 되어 있어야 합니다.

---

## 데이터 가져오기

| 메서드 | 설명 |
|------|------|
| `refresh()` | 현재 설정된 URL, 메서드, 파라미터, 헤더, 데이터를 사용하여 요청을 보냅니다. 응답받은 `data`를 `setData(data)`에 기록하고 `'refresh'` 이벤트를 발생시킵니다. 실패 시 `setError(err)`를 설정하고 `ResourceError`를 던지며, `refresh` 이벤트는 발생하지 않습니다. `api`와 URL이 미리 설정되어 있어야 합니다. |

---

## 예시

### 기본 GET 요청

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### 리소스 스타일 URL

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST 요청 (요청 본문 포함)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: '테스트', type: 'report' });
await res.refresh();
const result = res.getData();
```

### refresh 이벤트 리스닝

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>통계: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### 에러 처리

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? '요청 실패');
}
```

### 사용자 정의 요청 헤더

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## 주의사항

- **ctx.api 의존성**: RunJS에서 `ctx.api`는 실행 환경에 의해 주입되므로 보통 수동으로 `setAPIClient`를 호출할 필요가 없습니다. 컨텍스트가 없는 환경에서 사용할 경우 직접 설정해야 합니다.
- **refresh는 곧 요청**: `refresh()`는 호출 시점의 설정을 바탕으로 요청을 실행합니다. 메서드, 파라미터, 데이터 등은 호출 전에 미리 설정되어야 합니다.
- **에러 시 데이터 미갱신**: 요청 실패 시 `getData()`는 이전 값을 유지하며, `getError()`를 통해 에러 정보를 확인할 수 있습니다.
- **ctx.request와의 차이**: 단순 일회성 요청은 `ctx.request()`를 사용하고, 반응형 데이터, 이벤트, 에러 상태 관리가 필요한 경우 APIResource를 사용하십시오.

---

## 관련 문서

- [ctx.resource](../context/resource.md) - 현재 컨텍스트의 리소스 인스턴스
- [ctx.initResource()](../context/init-resource.md) - 리소스 초기화 및 ctx.resource에 바인딩
- [ctx.makeResource()](../context/make-resource.md) - 바인딩 없이 새 리소스 인스턴스 생성
- [ctx.request()](../context/request.md) - 단순 일회성 호출에 적합한 범용 HTTP 요청
- [MultiRecordResource](./multi-record-resource.md) - 컬렉션/목록 대상, CRUD 및 페이지네이션 지원
- [SingleRecordResource](./single-record-resource.md) - 단일 레코드 대상