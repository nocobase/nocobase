:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/sql)을 참조하세요.
:::

# ctx.sql

`ctx.sql`은 SQL 실행 및 관리 기능을 제공하며, 주로 RunJS(JSBlock, 이벤트 흐름 등)에서 데이터베이스에 직접 접근할 때 사용됩니다. 임시 SQL 실행, ID를 통한 저장된 SQL 템플릿 실행, 파라미터 바인딩, 템플릿 변수(`{{ctx.xxx}}`) 및 결과 유형 제어를 지원합니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock** | 사용자 정의 통계 보고서, 복잡한 필터링 목록, 테이블 간 집계 쿼리 |
| **차트 블록** | 차트 데이터 소스를 구동하기 위한 SQL 템플릿 저장 |
| **이벤트 흐름 / 연동** | 미리 설정된 SQL을 실행하여 데이터를 가져오고 후속 로직에 활용 |
| **SQLResource** | 페이지네이션 목록 등의 시나리오에서 `ctx.initResource('SQLResource')`와 함께 사용 |

> 주의: `ctx.sql`은 `flowSql` API를 통해 데이터베이스에 접근하므로, 현재 사용자에게 해당 데이터 소스에 대한 실행 권한이 있는지 확인해야 합니다.

## 권한 설명

| 권한 | 메서드 | 설명 |
|------|------|------|
| **로그인 사용자** | `runById` | 설정된 SQL 템플릿 ID에 따라 실행 |
| **SQL 설정 권한** | `run`, `save`, `destroy` | 임시 SQL 실행, SQL 템플릿 저장/업데이트/삭제 |

일반 사용자를 대상으로 하는 프론트엔드 로직에서는 `ctx.sql.runById(uid, options)`를 사용할 수 있습니다. 동적 SQL이 필요하거나 템플릿을 관리해야 하는 경우에는 현재 역할에 SQL 설정 권한이 있는지 확인해야 합니다.

## 타입 정의

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## 주요 메서드

| 메서드 | 설명 | 권한 요구 사항 |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | 임시 SQL 실행, 파라미터 바인딩 및 템플릿 변수 지원 | SQL 설정 권한 필요 |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | 재사용을 위해 ID별로 SQL 템플릿 저장/업데이트 | SQL 설정 권한 필요 |
| `ctx.sql.runById(uid, options?)` | 저장된 SQL 템플릿을 ID로 실행 | 모든 로그인 사용자 |
| `ctx.sql.destroy(uid)` | 특정 ID의 SQL 템플릿 삭제 | SQL 설정 권한 필요 |

주의 사항:

- `run`은 SQL 디버깅에 사용되며 설정 권한이 필요합니다.
- `save`, `destroy`는 SQL 템플릿 관리에 사용되며 설정 권한이 필요합니다.
- `runById`는 일반 사용자에게 개방되어 있으며, 저장된 템플릿에 따라서만 실행 가능하고 SQL을 디버깅하거나 수정할 수 없습니다.
- SQL 템플릿에 변경 사항이 있는 경우 `save`를 호출하여 저장해야 합니다.

## 파라미터 설명

### run / runById의 options

| 파라미터 | 타입 | 설명 |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | 바인딩 변수. 객체 형태는 `:name`, 배열 형태는 `?`와 함께 사용 |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | 결과 유형: 여러 행, 단일 행, 단일 값. 기본값은 `selectRows` |
| `dataSourceKey` | `string` | 데이터 소스 식별자, 기본값은 메인 데이터 소스 사용 |
| `filter` | `Record<string, any>` | 추가 필터 조건 (인터페이스 지원 여부에 따름) |

### save의 options

| 파라미터 | 타입 | 설명 |
|------|------|------|
| `uid` | `string` | 템플릿 고유 식별자, 저장 후 `runById(uid, ...)`로 실행 가능 |
| `sql` | `string` | SQL 내용, `{{ctx.xxx}}` 템플릿 변수 및 `:name` / `?` 자리 표시자 지원 |
| `dataSourceKey` | `string` | 선택 사항, 데이터 소스 식별자 |

## SQL 템플릿 변수 및 파라미터 바인딩

### 템플릿 변수 `{{ctx.xxx}}`

SQL에서 `{{ctx.xxx}}`를 사용하여 컨텍스트 변수를 참조할 수 있으며, 실행 전에 실제 값으로 해석됩니다.

```js
// ctx.user.id 참조
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

참조 가능한 변수 소스는 `ctx.getVar()`와 동일합니다 (예: `ctx.user.*`, `ctx.record.*`, 사용자 정의 `ctx.defineProperty` 등).

### 파라미터 바인딩

- **명명된 파라미터(Named Parameters)**: SQL에서 `:name` 사용, `bind`에 `{ name: value }` 객체 전달
- **위치 파라미터(Positional Parameters)**: SQL에서 `?` 사용, `bind`에 `[value1, value2]` 배열 전달

```js
// 명명된 파라미터
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// 위치 파라미터
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Seoul', 'active'], type: 'selectVar' }
);
```

## 예제

### 임시 SQL 실행 (SQL 설정 권한 필요)

```js
// 여러 행 결과 (기본값)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// 단일 행 결과
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// 단일 값 결과 (예: COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### 템플릿 변수 사용

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### 템플릿 저장 및 재사용

```js
// 저장 (SQL 설정 권한 필요)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// 모든 로그인 사용자가 실행 가능
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// 템플릿 삭제 (SQL 설정 권한 필요)
await ctx.sql.destroy('active-users-report');
```

### 페이지네이션 목록 (SQLResource)

```js
// 페이지네이션, 필터링이 필요한 경우 SQLResource 사용 가능
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // 저장된 SQL 템플릿 ID
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // page, pageSize 등 포함
```

## ctx.resource, ctx.request와의 관계

| 용도 | 권장 사용법 |
|------|----------|
| **SQL 쿼리 실행** | `ctx.sql.run()` 또는 `ctx.sql.runById()` |
| **SQL 페이지네이션 목록 (블록)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **일반 HTTP 요청** | `ctx.request()` |

`ctx.sql`은 SQL 시나리오에 특화된 `flowSql` API를 캡슐화한 것이며, `ctx.request`는 모든 API를 호출할 수 있습니다.

## 주의 사항

- SQL 인젝션을 방지하기 위해 문자열 연결 대신 파라미터 바인딩(`:name` / `?`)을 사용하세요.
- `type: 'selectVar'`는 스칼라 값을 반환하며, 일반적으로 `COUNT`, `SUM` 등에 사용됩니다.
- 템플릿 변수 `{{ctx.xxx}}`는 실행 전에 해석되므로, 컨텍스트에 해당 변수가 정의되어 있는지 확인하세요.

## 관련 문서

- [ctx.resource](./resource.md): 데이터 리소스, SQLResource는 내부적으로 `flowSql` API를 호출합니다.
- [ctx.initResource()](./init-resource.md): 페이지네이션 목록 등을 위한 SQLResource 초기화
- [ctx.request()](./request.md): 일반 HTTP 요청