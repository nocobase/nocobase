:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/init-resource)을 참조하세요.
:::

# ctx.initResource()

현재 컨텍스트의 리소스를 **초기화**합니다. `ctx.resource`가 아직 존재하지 않으면 지정된 유형으로 생성하여 컨텍스트에 바인딩하고, 이미 존재하면 해당 리소스를 직접 사용합니다. 이후에는 `ctx.resource`를 통해 접근할 수 있습니다.

## 적용 시나리오

일반적으로 **JSBlock**(독립 블록) 시나리오에서만 사용됩니다. 대부분의 블록, 팝업 등은 `ctx.resource`가 미리 바인딩되어 있어 수동으로 호출할 필요가 없습니다. JSBlock은 기본적으로 리소스가 없으므로, `ctx.initResource(type)`를 먼저 호출한 후 `ctx.resource`를 통해 데이터를 로드해야 합니다.

## 타입 정의

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| 매개변수 | 타입 | 설명 |
|------|------|------|
| `type` | `string` | 리소스 유형: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**반환값**: 현재 컨텍스트의 리소스 인스턴스(즉, `ctx.resource`)입니다.

## ctx.makeResource()와의 차이점

| 메서드 | 동작 |
|------|------|
| `ctx.initResource(type)` | `ctx.resource`가 존재하지 않으면 생성하여 바인딩하고, 이미 존재하면 그대로 반환합니다. `ctx.resource`를 사용할 수 있도록 보장합니다. |
| `ctx.makeResource(type)` | 새 인스턴스를 생성하여 반환만 하며, `ctx.resource`에 기록하지 **않습니다**. 여러 개의 독립적인 리소스가 필요하거나 임시로 사용하는 시나리오에 적합합니다. |

## 예시

### 목록 데이터 (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### 단일 레코드 (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // 기본 키 지정
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### 데이터 소스 지정

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## 주의사항

- 대부분의 블록(폼, 테이블, 상세 정보 등) 및 팝업 시나리오에서는 실행 환경에 의해 `ctx.resource`가 이미 바인딩되어 있으므로 `ctx.initResource`를 호출할 필요가 없습니다.
- JSBlock과 같이 기본적으로 리소스가 없는 컨텍스트에서만 수동 초기화가 필요합니다.
- 초기화 후에는 `setResourceName(name)`을 호출하여 컬렉션을 지정하고, `refresh()`를 통해 데이터를 로드해야 합니다.

## 관련 정보

- [ctx.resource](./resource.md): 현재 컨텍스트의 리소스 인스턴스
- [ctx.makeResource()](./make-resource.md): 새 리소스 인스턴스를 생성하며, `ctx.resource`에 바인딩하지 않음
- [MultiRecordResource](../resource/multi-record-resource.md) — 여러 레코드/목록
- [SingleRecordResource](../resource/single-record-resource.md) — 단일 레코드
- [APIResource](../resource/api-resource.md) — 일반 API 리소스
- [SQLResource](../resource/sql-resource.md) — SQL 쿼리 리소스