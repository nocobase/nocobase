:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/resource/sql-resource)을 참조하세요.
:::

# SQLResource

**저장된 SQL 설정** 또는 **동적 SQL**을 기반으로 쿼리를 실행하는 리소스(Resource)입니다. 데이터 소스는 `flowSql:run` / `flowSql:runById` 등의 인터페이스를 사용합니다. 보고서, 통계, 사용자 정의 SQL 목록 등의 시나리오에 적합합니다. [MultiRecordResource](./multi-record-resource.md)와 달리 SQLResource는 데이터 표(컬렉션)에 의존하지 않고 SQL 쿼리를 직접 실행하며, 페이지네이션, 파라미터 바인딩, 템플릿 변수(`{{ctx.xxx}}`) 및 결과 유형 제어를 지원합니다.

**상속 관계**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**생성 방식**: `ctx.makeResource('SQLResource')` 또는 `ctx.initResource('SQLResource')`. 저장된 설정에 따라 실행할 때는 `setFilterByTk(uid)`(SQL 템플릿의 uid)를 설정해야 합니다. 디버깅 시에는 `setDebug(true)` + `setSQL(sql)`을 사용하여 SQL을 직접 실행할 수 있습니다. RunJS에서 `ctx.api`는 실행 환경에 의해 주입됩니다.

---

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **보고서 / 통계** | 복잡한 집계, 테이블 간 조인 쿼리, 사용자 정의 통계 지표 |
| **JSBlock 사용자 정의 목록** | SQL을 사용하여 특수한 필터링, 정렬 또는 관계를 구현하고 사용자 정의 렌더링 적용 |
| **차트 블록** | 저장된 SQL 템플릿으로 차트 데이터 소스를 구동하며 페이지네이션 지원 |
| **ctx.sql과의 선택 기준** | 페이지네이션, 이벤트, 반응형 데이터가 필요한 경우 SQLResource를 사용하고, 단순한 일회성 쿼리는 `ctx.sql.run()` / `ctx.sql.runById()`를 사용합니다. |

---

## 데이터 형식

- `getData()`는 `setSQLType()` 설정에 따라 다른 형식을 반환합니다:
  - `selectRows` (기본값): **배열**, 다중 행 결과
  - `selectRow`: **단일 객체**
  - `selectVar`: **스칼라 값** (예: COUNT, SUM)
- `getMeta()`는 페이지네이션 등의 메타 정보를 반환합니다: `page`, `pageSize`, `count`, `totalPage` 등

---

## SQL 설정 및 실행 모드

| 메서드 | 설명 |
|------|------|
| `setFilterByTk(uid)` | 실행할 SQL 템플릿의 uid를 설정합니다 (runById에 대응하며, 관리자 화면에서 먼저 저장되어야 함). |
| `setSQL(sql)` | 원시 SQL을 설정합니다 (디버그 모드 `setDebug(true)`인 경우에만 runBySQL에서 사용). |
| `setSQLType(type)` | 결과 유형 설정: `'selectVar'` / `'selectRow'` / `'selectRows'` |
| `setDebug(enabled)` | true로 설정하면 `refresh` 시 `runBySQL()`을 호출하고, 그렇지 않으면 `runById()`를 호출합니다. |
| `run()` | 디버그 상태에 따라 `runBySQL()` 또는 `runById()`를 호출합니다. |
| `runBySQL()` | 현재 `setSQL`로 설정된 SQL을 실행합니다 (`setDebug(true)` 필요). |
| `runById()` | 현재 uid를 사용하여 저장된 SQL 템플릿을 실행합니다. |

---

## 파라미터 및 컨텍스트

| 메서드 | 설명 |
|------|------|
| `setBind(bind)` | 변수를 바인딩합니다. 객체 형식은 `:name`과 함께 사용하고, 배열 형식은 `?`와 함께 사용합니다. |
| `setLiquidContext(ctx)` | 템플릿 컨텍스트(Liquid)를 설정하여 `{{ctx.xxx}}`를 해석하는 데 사용합니다. |
| `setFilter(filter)` | 추가 필터 조건 (요청 데이터로 전달됨) |
| `setDataSourceKey(key)` | 데이터 소스 식별자 (다중 데이터 소스 사용 시) |

---

## 페이지네이션

| 메서드 | 설명 |
|------|------|
| `setPage(page)` / `getPage()` | 현재 페이지 (기본값 1) |
| `setPageSize(size)` / `getPageSize()` | 페이지당 항목 수 (기본값 20) |
| `next()` / `previous()` / `goto(page)` | 페이지를 이동하고 `refresh`를 트리거합니다. |

SQL 내에서 `{{ctx.limit}}`, `{{ctx.offset}}`을 사용하여 페이지네이션 파라미터를 참조할 수 있으며, SQLResource는 컨텍스트에 `limit`, `offset`을 자동으로 주입합니다.

---

## 데이터 가져오기 및 이벤트

| 메서드 | 설명 |
|------|------|
| `refresh()` | SQL을 실행(runById 또는 runBySQL)하고 결과를 `setData(data)`에 기록하며 meta를 업데이트하고 `'refresh'` 이벤트를 트리거합니다. |
| `runAction(actionName, options)` | 하위 인터페이스(예: `getBind`, `run`, `runById`)를 호출합니다. |
| `on('refresh', fn)` / `on('loading', fn)` | 새로고침 완료 또는 로딩 시작 시 트리거됩니다. |

---

## 예제

### 저장된 템플릿으로 실행 (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // 저장된 SQL 템플릿 uid
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count 등
```

### 디버그 모드: SQL 직접 실행 (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### 페이지네이션 및 페이지 이동

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// 페이지 이동
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### 결과 유형

```js
// 다중 행 (기본값)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// 단일 행
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// 단일 값 (예: COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### 템플릿 변수 사용

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### refresh 이벤트 리스닝

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## 주의사항

- **runById는 템플릿을 먼저 저장해야 함**: `setFilterByTk(uid)`의 uid는 반드시 관리자 화면에서 이미 저장된 SQL 템플릿 ID여야 합니다. `ctx.sql.save({ uid, sql })`를 통해 저장할 수 있습니다.
- **디버그 모드 권한 필요**: `setDebug(true)` 설정 시 `flowSql:run`을 사용하므로 현재 역할에 SQL 설정 권한이 있어야 합니다. `runById`는 로그인만 되어 있으면 가능합니다.
- **refresh 디바운싱**: 동일한 이벤트 루프 내에서 `refresh()`를 여러 번 호출하면 마지막 호출만 실행되어 중복 요청을 방지합니다.
- **인젝션 방지를 위한 파라미터 바인딩**: 문자열 연결 대신 `setBind()`와 `:name` / `?` 자리표시자를 사용하여 SQL 인젝션을 방지하십시오.

---

## 관련 정보

- [ctx.sql](../context/sql.md) - SQL 실행 및 관리, `ctx.sql.runById`는 단순 일회성 쿼리에 적합합니다.
- [ctx.resource](../context/resource.md) - 현재 컨텍스트의 리소스 인스턴스
- [ctx.initResource()](../context/init-resource.md) - 리소스를 초기화하고 ctx.resource에 바인딩
- [ctx.makeResource()](../context/make-resource.md) - 바인딩 없이 새 리소스 인스턴스 생성
- [APIResource](./api-resource.md) - 범용 API 리소스
- [MultiRecordResource](./multi-record-resource.md) - 데이터 표/목록 지향 리소스