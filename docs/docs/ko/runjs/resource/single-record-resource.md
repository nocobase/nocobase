:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/resource/single-record-resource)을 참조하세요.
:::

# SingleRecordResource

**단일 레코드**를 대상으로 하는 리소스(Resource)입니다. 데이터는 단일 객체이며, 주키(Primary Key)를 통한 조회, 생성/업데이트(save) 및 삭제를 지원합니다. 상세 보기, 폼(Form) 등 "단일 레코드" 시나리오에 적합합니다. [MultiRecordResource](./multi-record-resource.md)와 달리 SingleRecordResource의 `getData()`는 단일 객체를 반환하며, `setFilterByTk(id)`를 통해 주키를 지정하면 `save()` 호출 시 `isNewRecord` 상태에 따라 자동으로 create 또는 update를 수행합니다.

**상속 관계**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**생성 방법**: `ctx.makeResource('SingleRecordResource')` 또는 `ctx.initResource('SingleRecordResource')`. 사용 전 반드시 `setResourceName('컬렉션명')`을 호출해야 하며, 주키를 기반으로 작업할 때는 `setFilterByTk(id)`를 설정해야 합니다. RunJS 환경에서는 `ctx.api`가 실행 환경에 의해 주입됩니다.

---

## 주요 시나리오

| 시나리오 | 설명 |
|------|------|
| **상세 블록** | 상세 블록은 기본적으로 SingleRecordResource를 사용하여 주키별로 단일 레코드를 로드합니다. |
| **폼 블록** | 생성/수정 폼은 SingleRecordResource를 사용하며, `save()` 시 자동으로 create와 update를 구분합니다. |
| **JSBlock 상세** | JSBlock 내에서 특정 사용자, 주문 등을 로드하고 커스텀 화면을 구성할 때 사용합니다. |
| **연관 리소스** | `users.profile`과 같은 형식으로 연관된 단일 레코드를 로드할 때 사용하며, `setSourceId(부모 레코드 ID)`와 함께 사용해야 합니다. |

---

## 데이터 형식

- `getData()`는 **단일 레코드 객체**(get 인터페이스의 `data` 필드)를 반환합니다.
- `getMeta()`는 메타 정보가 있을 경우 이를 반환합니다.

---

## 리소스 이름과 주키

| 메서드 | 설명 |
|------|------|
| `setResourceName(name)` / `getResourceName()` | 리소스 이름. 예: `'users'`, `'users.profile'`(연관 리소스) |
| `setSourceId(id)` / `getSourceId()` | 연관 리소스 사용 시 부모 레코드의 ID (예: `users.profile`인 경우 users의 주키 전달) |
| `setDataSourceKey(key)` / `getDataSourceKey()` | 데이터 소스 식별자 (다중 데이터 소스 사용 시) |
| `setFilterByTk(tk)` / `getFilterByTk()` | 현재 레코드의 주키. 설정 시 `isNewRecord`는 false가 됩니다. |

---

## 상태

| 속성/메서드 | 설명 |
|----------|------|
| `isNewRecord` | "신규 레코드" 상태 여부 (filterByTk가 설정되지 않았거나 새로 생성된 경우 true) |

---

## 요청 파라미터 (필터 / 필드)

| 메서드 | 설명 |
|------|------|
| `setFilter(filter)` / `getFilter()` | 필터 설정 (신규 생성 상태가 아닐 때 사용 가능) |
| `setFields(fields)` / `getFields()` | 요청할 필드 목록 |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | 관계 확장(Appends) 설정 |

---

## CRUD

| 메서드 | 설명 |
|------|------|
| `refresh()` | 현재 `filterByTk`를 기반으로 get 요청을 보내고 `getData()`를 갱신합니다. 신규 생성 상태에서는 요청하지 않습니다. |
| `save(data, options?)` | 신규 상태일 때는 create, 그렇지 않으면 update를 호출합니다. `{ refresh: false }` 옵션으로 자동 갱신을 끌 수 있습니다. |
| `destroy(options?)` | 현재 `filterByTk`에 해당하는 레코드를 삭제하고 로컬 데이터를 비웁니다. |
| `runAction(actionName, options)` | 리소스의 임의의 액션(Action)을 호출합니다. |

---

## 설정 및 이벤트

| 메서드 | 설명 |
|------|------|
| `setSaveActionOptions(options)` | save 실행 시의 요청 구성(Configuration)을 설정합니다. |
| `on('refresh', fn)` / `on('saved', fn)` | 새로고침 완료 또는 저장 후에 트리거되는 이벤트입니다. |

---

## 예시

### 기본 조회 및 업데이트

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// 업데이트
await ctx.resource.save({ name: '홍길동' });
```

### 신규 레코드 생성

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: '김철수', email: 'chulsoo@example.com' });
```

### 레코드 삭제

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// destroy 후 getData()는 null이 됩니다.
```

### 관계 확장 및 필드 지정

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### 연관 리소스 (예: users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // 부모 레코드 주키
res.setFilterByTk(profileId);    // profile이 hasOne 관계라면 filterByTk 생략 가능
await res.refresh();
const profile = res.getData();
```

### save 시 자동 새로고침 방지

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// 저장 후 refresh를 트리거하지 않으므로 getData()는 이전 값을 유지합니다.
```

### refresh / saved 이벤트 리스닝

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>사용자: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('저장에 성공했습니다');
});
await ctx.resource?.refresh?.();
```

---

## 주의사항

- **setResourceName 필수**: 사용 전에 반드시 `setResourceName('컬렉션명')`을 호출해야 합니다. 그렇지 않으면 요청 URL을 생성할 수 없습니다.
- **filterByTk와 isNewRecord**: `setFilterByTk`를 설정하지 않으면 `isNewRecord`는 true가 되며, 이 상태에서 `refresh()`는 요청을 보내지 않고 `save()`는 create 액션을 수행합니다.
- **연관 리소스**: 리소스 이름이 `parent.child` 형식(예: `users.profile`)일 경우, 반드시 `setSourceId(부모 레코드 주키)`를 먼저 호출해야 합니다.
- **getData는 객체 반환**: 단일 레코드 인터페이스가 반환하는 `data`는 레코드 객체이며, `getData()`는 이 객체를 직접 반환합니다. `destroy()` 호출 후에는 null이 됩니다.

---

## 관련 문서

- [ctx.resource](../context/resource.md) - 현재 컨텍스트의 리소스 인스턴스
- [ctx.initResource()](../context/init-resource.md) - 리소스를 초기화하고 ctx.resource에 바인딩
- [ctx.makeResource()](../context/make-resource.md) - 바인딩 없이 새 리소스 인스턴스 생성
- [APIResource](./api-resource.md) - URL 기반의 일반 API 리소스
- [MultiRecordResource](./multi-record-resource.md) - 컬렉션/목록 대상, CRUD 및 페이징 지원