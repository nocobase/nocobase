:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/resource/multi-record-resource)을 참조하세요.
:::

# MultiRecordResource

데이터 테이블을 위한 Resource입니다. 요청 시 배열을 반환하며 페이지네이션, 필터링, 정렬 및 CRUD(생성, 조회, 수정, 삭제)를 지원합니다. 테이블, 리스트 등 "여러 개의 레코드"가 필요한 시나리오에 적합합니다. [APIResource](./api-resource.md)와 달리, MultiRecordResource는 `setResourceName()`을 통해 리소스 이름을 지정하며, `users:list`, `users:create`와 같은 URL을 자동으로 생성하고 페이지네이션, 필터링, 행 선택 등의 기능을 내장하고 있습니다.

**상속 관계**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**생성 방식**: `ctx.makeResource('MultiRecordResource')` 또는 `ctx.initResource('MultiRecordResource')`. 사용 전 `setResourceName('컬렉션명')`(예: `'users'`)을 호출해야 합니다. RunJS에서 `ctx.api`는 실행 환경에 의해 주입됩니다.

---

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **테이블 블록** | 테이블, 리스트 블록은 기본적으로 MultiRecordResource를 사용하며 페이지네이션, 필터링, 정렬을 지원합니다. |
| **JSBlock 리스트** | JSBlock에서 사용자, 주문 등 컬렉션 데이터를 로드하고 커스텀 렌더링을 수행합니다. |
| **일괄 작업** | `getSelectedRows()`를 통해 선택된 행을 가져오고, `destroySelectedRows()`로 일괄 삭제를 수행합니다. |
| **관계 리소스** | `users.tags`와 같은 형식으로 관계된 컬렉션 데이터를 로드하며, `setSourceId(부모 레코드 ID)`와 함께 사용해야 합니다. |

---

## 데이터 형식

- `getData()`는 **레코드 배열**을 반환하며, 이는 list API의 `data` 필드에 해당합니다.
- `getMeta()`는 페이지네이션 등 메타 정보를 반환합니다: `page`, `pageSize`, `count`, `totalPage` 등.

---

## 리소스 이름과 데이터 소스

| 메서드 | 설명 |
|------|------|
| `setResourceName(name)` / `getResourceName()` | 리소스 이름. 예: `'users'`, `'users.tags'` (관계 리소스). |
| `setSourceId(id)` / `getSourceId()` | 관계 리소스 사용 시 부모 레코드 ID (예: `users.tags`의 경우 users의 기본 키를 전달). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | 데이터 소스 식별자 (다중 데이터 소스 사용 시). |

---

## 요청 파라미터 (필터 / 필드 / 정렬)

| 메서드 | 설명 |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | 기본 키 필터링 (단일 항목 get 등). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | 필터 조건. `$eq`, `$ne`, `$in` 등의 연산자를 지원합니다. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | 필터 그룹 (여러 조건 조합). |
| `setFields(fields)` / `getFields()` | 요청 필드 (화이트리스트). |
| `setSort(sort)` / `getSort()` | 정렬. 예: `['-createdAt']`은 생성일 기준 내림차순을 의미합니다. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | 관계 로드 (예: `['user', 'tags']`). |

---

## 페이지네이션

| 메서드 | 설명 |
|------|------|
| `setPage(page)` / `getPage()` | 현재 페이지 (1부터 시작). |
| `setPageSize(size)` / `getPageSize()` | 페이지당 항목 수. 기본값은 20입니다. |
| `getTotalPage()` | 총 페이지 수. |
| `getCount()` | 총 레코드 수 (서버측 meta에서 가져옴). |
| `next()` / `previous()` / `goto(page)` | 페이지를 이동하고 `refresh`를 트리거합니다. |

---

## 선택된 행 (테이블 시나리오)

| 메서드 | 설명 |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | 현재 선택된 행 데이터. 일괄 삭제 등의 작업에 사용됩니다. |

---

## CRUD 및 리스트 작업

| 메서드 | 설명 |
|------|------|
| `refresh()` | 현재 파라미터로 list를 요청하고 `getData()`와 페이지네이션 meta를 업데이트하며 `'refresh'` 이벤트를 트리거합니다. |
| `get(filterByTk)` | 단일 레코드를 요청하고 해당 데이터를 반환합니다 (`getData`에 저장하지 않음). |
| `create(data, options?)` | 생성합니다. `{ refresh: false }` 옵션으로 자동 새로고침을 방지할 수 있으며, `'saved'`를 트리거합니다. |
| `update(filterByTk, data, options?)` | 기본 키로 업데이트를 수행합니다. |
| `destroy(target)` | 삭제합니다. target은 기본 키, 행 객체 또는 기본 키/행 객체의 배열(일괄 삭제)이 될 수 있습니다. |
| `destroySelectedRows()` | 현재 선택된 행을 삭제합니다 (선택된 행이 없으면 에러가 발생합니다). |
| `setItem(index, item)` | 로컬에서 특정 행의 데이터를 교체합니다 (네트워크 요청을 보내지 않음). |
| `runAction(actionName, options)` | 임의의 리소스 액션을 호출합니다 (예: 커스텀 액션). |

---

## 설정 및 이벤트

| 메서드 | 설명 |
|------|------|
| `setRefreshAction(name)` | 새로고침 시 호출할 액션. 기본값은 `'list'`입니다. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | create/update 요청 설정을 지정합니다. |
| `on('refresh', fn)` / `on('saved', fn)` | 새로고침 완료 또는 저장 후에 트리거됩니다. |

---

## 예시

### 기본 리스트

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### 필터링 및 정렬

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### 관계 로드

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### 생성 및 페이지 이동

```js
await ctx.resource.create({ name: '홍길동', email: 'hong@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### 선택된 행 일괄 삭제

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('데이터를 먼저 선택해 주세요');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('삭제되었습니다'));
```

### refresh 이벤트 리스닝

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### 관계 리소스 (서브 테이블)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## 주의사항

- **setResourceName 필수**: 사용 전 반드시 `setResourceName('컬렉션명')`을 호출해야 합니다. 그렇지 않으면 요청 URL을 생성할 수 없습니다.
- **관계 리소스**: 리소스 이름이 `parent.child` 형식(예: `users.tags`)인 경우, 먼저 `setSourceId(부모 레코드 기본 키)`를 호출해야 합니다.
- **refresh 디바운싱**: 동일한 이벤트 루프 내에서 `refresh()`를 여러 번 호출하면 마지막 호출만 실행되어 중복 요청을 방지합니다.
- **getData는 배열**: 리스트 인터페이스가 반환하는 `data`는 레코드 배열이며, `getData()`는 이 배열을 직접 반환합니다.

---

## 관련 정보

- [ctx.resource](../context/resource.md) - 현재 컨텍스트의 resource 인스턴스
- [ctx.initResource()](../context/init-resource.md) - 초기화 및 ctx.resource에 바인딩
- [ctx.makeResource()](../context/make-resource.md) - 바인딩 없이 새로운 resource 인스턴스 생성
- [APIResource](./api-resource.md) - URL 기반의 일반 API 리소스
- [SingleRecordResource](./single-record-resource.md) - 단일 레코드 대상 전용 리소스