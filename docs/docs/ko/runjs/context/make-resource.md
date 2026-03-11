:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/make-resource)을 참조하세요.
:::

# ctx.makeResource()

새로운 resource 인스턴스를 **생성**하여 반환하며, `ctx.resource`를 작성하거나 변경하지 **않습니다**. 여러 개의 독립적인 resource가 필요하거나 임시로 사용하는 시나리오에 적합합니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **여러 개의 resource** | 여러 데이터 소스(예: 사용자 목록 + 주문 목록)를 동시에 로드할 때, 각각 독립적인 resource를 사용합니다. |
| **임시 조회** | 일회성 조회로 사용 후 폐기하며, `ctx.resource`에 바인딩할 필요가 없는 경우입니다. |
| **보조 데이터** | 메인 데이터는 `ctx.resource`를 사용하고, 추가 데이터는 `makeResource`로 새로 생성하여 사용합니다. |

단일 resource만 필요하고 이를 `ctx.resource`에 바인딩하려는 경우, [ctx.initResource()](./init-resource.md)를 사용하는 것이 더 적절합니다.

## 타입 정의

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| 파라미터 | 타입 | 설명 |
|------|------|------|
| `resourceType` | `string` | 리소스 유형: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**반환 값**: 새로 생성된 resource 인스턴스입니다.

## ctx.initResource()와의 차이점

| 메서드 | 동작 |
|------|------|
| `ctx.makeResource(type)` | 새 인스턴스를 생성하여 반환만 하며, `ctx.resource`에 기록하지 **않습니다**. 여러 번 호출하여 여러 개의 독립적인 resource를 얻을 수 있습니다. |
| `ctx.initResource(type)` | `ctx.resource`가 존재하지 않으면 생성하여 바인딩하고, 이미 존재하면 즉시 반환합니다. `ctx.resource`를 사용할 수 있도록 보장합니다. |

## 예시

### 단일 resource

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource는 기존 값(있는 경우)을 유지합니다.
```

### 여러 개의 resource

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>사용자 수: {usersRes.getData().length}</p>
    <p>주문 수: {ordersRes.getData().length}</p>
  </div>
);
```

### 임시 조회

```ts
// 일회성 조회이며, ctx.resource를 오염시키지 않습니다.
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## 주의사항

- 새로 생성된 resource는 `setResourceName(name)`을 호출하여 컬렉션을 지정한 후, `refresh()`를 통해 데이터를 로드해야 합니다.
- 각 resource 인스턴스는 독립적이며 서로 영향을 주지 않습니다. 여러 데이터 소스를 병렬로 로드하는 데 적합합니다.

## 관련 정보

- [ctx.initResource()](./init-resource.md): 초기화 및 `ctx.resource`에 바인딩
- [ctx.resource](./resource.md): 현재 컨텍스트의 resource 인스턴스
- [MultiRecordResource](../resource/multi-record-resource) — 여러 레코드/목록
- [SingleRecordResource](../resource/single-record-resource) — 단일 레코드
- [APIResource](../resource/api-resource) — 일반 API 리소스
- [SQLResource](../resource/sql-resource) — SQL 쿼리 리소스