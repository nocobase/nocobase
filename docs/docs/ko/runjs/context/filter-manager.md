:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/filter-manager)을 참조하세요.
:::

# ctx.filterManager

필터 연결 관리자로, 필터 양식(FilterForm)과 데이터 블록(테이블, 목록, 차트 등) 사이의 필터 연결을 관리합니다. `BlockGridModel`에서 제공하며, 해당 컨텍스트(예: 필터 양식 블록, 데이터 블록) 내에서만 사용할 수 있습니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **필터 양식 블록** | 필터 항목과 대상 블록 간의 연결 설정을 관리하며, 필터 변경 시 대상 데이터를 새로고침합니다. |
| **데이터 블록 (테이블/목록)** | 필터링 대상이 되며, `bindToTarget`을 통해 필터 조건을 바인딩합니다. |
| **연동 규칙 / 사용자 정의 FilterModel** | `doFilter`, `doReset` 호출 시 `refreshTargetsByFilter`를 사용하여 대상 새로고침을 실행합니다. |
| **연결 필드 설정** | `getConnectFieldsConfig`, `saveConnectFieldsConfig`를 사용하여 필터와 대상 간의 필드 매핑을 유지 관리합니다. |

> 주의: `ctx.filterManager`는 `BlockGridModel`이 있는 RunJS 컨텍스트(예: 필터 양식이 포함된 페이지 내)에서만 사용할 수 있습니다. 일반 JSBlock이나 독립 페이지에서는 `undefined`이므로, 사용 전 옵셔널 체이닝(?.)을 사용하는 것을 권장합니다.

## 타입 정의

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // 필터 모델 UID
  targetId: string;   // 대상 데이터 블록 모델 UID
  filterPaths?: string[];  // 대상 블록의 필드 경로
  operator?: string;  // 필터 연산자
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## 주요 메서드

| 메서드 | 설명 |
|------|------|
| `getFilterConfigs()` | 현재 모든 필터 연결 설정을 가져옵니다. |
| `getConnectFieldsConfig(filterId)` | 특정 필터의 연결 필드 설정을 가져옵니다. |
| `saveConnectFieldsConfig(filterId, config)` | 필터의 연결 필드 설정을 저장합니다. |
| `addFilterConfig(config)` | 필터 설정(filterId + targetId + filterPaths)을 추가합니다. |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | filterId, targetId 또는 둘 다를 기준으로 필터 설정을 삭제합니다. |
| `bindToTarget(targetId)` | 필터 설정을 대상 블록에 바인딩하여 해당 리소스(resource)가 필터를 적용하도록 트리거합니다. |
| `unbindFromTarget(targetId)` | 대상 블록에서 필터 바인딩을 해제합니다. |
| `refreshTargetsByFilter(filterId 또는 filterId[])` | 필터와 연관된 대상 블록 데이터를 새로고침합니다. |

## 핵심 개념

- **FilterModel**: 필터 조건을 제공하는 모델(예: FilterFormItemModel)입니다. 현재 필터 값을 반환하는 `getFilterValue()`를 구현해야 합니다.
- **TargetModel**: 필터링되는 데이터 블록입니다. 해당 `resource`는 `addFilterGroup`, `removeFilterGroup`, `refresh`를 지원해야 합니다.

## 예시

### 필터 설정 추가

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### 대상 블록 새로고침

```ts
// 필터 양식의 doFilter / doReset 내에서
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// 여러 필터와 연관된 대상 새로고침
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### 연결 필드 설정

```ts
// 연결 설정 가져오기
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// 연결 설정 저장
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### 설정 삭제

```ts
// 특정 필터의 모든 설정 삭제
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// 특정 대상의 모든 필터 설정 삭제
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## 관련 문서

- [ctx.resource](./resource.md): 대상 블록의 리소스는 필터 인터페이스를 지원해야 합니다.
- [ctx.model](./model.md): filterId / targetId로 사용할 현재 모델의 UID를 가져오는 데 사용됩니다.