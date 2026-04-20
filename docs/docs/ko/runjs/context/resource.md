:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/resource)을 참조하세요.
:::

# ctx.resource

현재 컨텍스트의 **FlowResource** 인스턴스로, 데이터를 액세스하고 조작하는 데 사용됩니다. 대부분의 블록(폼, 테이블, 상세 등)과 팝업 시나리오에서는 실행 환경이 `ctx.resource`를 미리 바인딩합니다. JSBlock 등 기본적으로 resource가 없는 시나리오에서는 먼저 [ctx.initResource()](./init-resource.md)를 호출하여 초기화한 후 `ctx.resource`를 통해 사용해야 합니다.

## 적용 시나리오

RunJS에서 구조화된 데이터(목록, 단일 레코드, 사용자 정의 API, SQL)에 액세스해야 하는 모든 시나리오에서 사용할 수 있습니다. 폼, 테이블, 상세 블록 및 팝업은 일반적으로 미리 바인딩되어 있습니다. JSBlock, JSField, JSItem, JSColumn 등에서 데이터 로드가 필요한 경우, 먼저 `ctx.initResource(type)`를 호출한 후 `ctx.resource`에 액세스할 수 있습니다.

## 타입 정의

```ts
resource: FlowResource | undefined;
```

- 미리 바인딩된 컨텍스트에서 `ctx.resource`는 해당 resource 인스턴스가 됩니다.
- JSBlock 등 기본적으로 resource가 없는 경우 `undefined`이며, `ctx.initResource(type)`를 호출해야 값이 생성됩니다.

## 주요 메서드

리소스 유형(MultiRecordResource, SingleRecordResource, APIResource, SQLResource)에 따라 제공되는 메서드가 약간씩 다르지만, 다음은 공통 또는 자주 사용되는 메서드입니다.

| 메서드 | 설명 |
|------|------|
| `getData()` | 현재 데이터(목록 또는 단일 항목)를 가져옵니다. |
| `setData(value)` | 로컬 데이터를 설정합니다. |
| `refresh()` | 현재 파라미터로 요청을 보내 데이터를 새로고침합니다. |
| `setResourceName(name)` | 리소스 이름을 설정합니다 (예: `'users'`, `'users.tags'`). |
| `setFilterByTk(tk)` | 기본 키 필터를 설정합니다 (단일 항목 get 등). |
| `runAction(actionName, options)` | 임의의 리소스 액션을 호출합니다 (예: `create`, `update`). |
| `on(event, callback)` / `off(event, callback)` | 이벤트(예: `refresh`, `saved`)를 구독하거나 구독을 취소합니다. |

**MultiRecordResource 전용**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()` 등.

## 예시

### 목록 데이터 (initResource 필요)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### 테이블 시나리오 (미리 바인딩됨)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('삭제되었습니다'));
```

### 단일 레코드

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### 사용자 정의 액션 호출

```js
await ctx.resource.runAction('create', { data: { name: '홍길동' } });
```

## ctx.initResource / ctx.makeResource와의 관계

- **ctx.initResource(type)**: `ctx.resource`가 존재하지 않으면 생성하여 바인딩하고, 이미 존재하면 그대로 반환합니다. `ctx.resource`를 사용할 수 있도록 보장합니다.
- **ctx.makeResource(type)**: 새로운 resource 인스턴스를 생성하여 반환하며, `ctx.resource`에 **기록하지 않습니다**. 여러 개의 독립적인 resource가 필요하거나 임시로 사용하는 시나리오에 적합합니다.
- **ctx.resource**: 현재 컨텍스트에 이미 바인딩된 resource에 액세스합니다. 대부분의 블록/팝업은 미리 바인딩되어 있으며, 바인딩되지 않은 경우 `undefined`이므로 먼저 `ctx.initResource`를 호출해야 합니다.

## 주의 사항

- 사용 전 `ctx.resource?.refresh()`와 같이 null 체크를 하는 것이 권장됩니다. 특히 JSBlock 등 미리 바인딩되지 않았을 가능성이 있는 시나리오에서 중요합니다.
- 초기화 후에는 `setResourceName(name)`을 호출하여 컬렉션을 지정해야 하며, 그 다음 `refresh()`를 통해 데이터를 로드합니다.
- 각 Resource 유형의 전체 API는 아래 링크를 참조하십시오.

## 관련 정보

- [ctx.initResource()](./init-resource.md) - 리소스 초기화 및 현재 컨텍스트에 바인딩
- [ctx.makeResource()](./make-resource.md) - 새로운 리소스 인스턴스 생성 (ctx.resource에 바인딩하지 않음)
- [MultiRecordResource](../resource/multi-record-resource.md) - 다중 레코드/목록
- [SingleRecordResource](../resource/single-record-resource.md) - 단일 레코드
- [APIResource](../resource/api-resource.md) - 일반 API 리소스
- [SQLResource](../resource/sql-resource.md) - SQL 쿼리 리소스