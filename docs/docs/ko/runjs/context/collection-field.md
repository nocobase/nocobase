:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/collection-field)을 참조하세요.
:::

# ctx.collectionField

현재 RunJS 실행 컨텍스트와 연결된 데이터 표 필드(CollectionField) 인스턴스입니다. 필드의 메타데이터, 타입, 유효성 검사 규칙 및 연결 정보를 확인하는 데 사용됩니다. 필드가 컬렉션 정의에 바인딩된 경우에만 존재하며, 사용자 정의/가상 필드의 경우 `null`일 수 있습니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSField** | 폼 필드에서 `interface`, `enum`, `targetCollection` 등에 따라 연동 또는 유효성 검사를 수행합니다. |
| **JSItem** | 하위 테이블 항목에서 현재 열에 해당하는 필드의 메타데이터에 접근합니다. |
| **JSColumn** | 테이블 열에서 `collectionField.interface`에 따라 렌더링 방식을 선택하거나 `targetCollection`에 접근합니다. |

> 주의: `ctx.collectionField`는 필드가 컬렉션(Collection) 정의에 바인딩된 경우에만 사용할 수 있습니다. JSBlock 독립 블록, 필드 바인딩이 없는 작업 이벤트 등의 시나리오에서는 보통 `undefined`이므로, 사용 전에 null 체크를 수행하는 것이 좋습니다.

## 타입 정의

```ts
collectionField: CollectionField | null | undefined;
```

## 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `name` | `string` | 필드 이름 (예: `status`, `userId`) |
| `title` | `string` | 필드 제목 (국제화 포함) |
| `type` | `string` | 필드 데이터 타입 (`string`, `integer`, `belongsTo` 등) |
| `interface` | `string` | 필드 인터페이스 타입 (`input`, `select`, `m2o`, `o2m`, `m2m` 등) |
| `collection` | `Collection` | 필드가 속한 컬렉션 |
| `targetCollection` | `Collection` | 연결 필드의 대상 컬렉션 (연결 타입인 경우에만 값이 존재) |
| `target` | `string` | 대상 컬렉션 이름 (연결 필드) |
| `enum` | `array` | 열거형 옵션 (select, radio 등) |
| `defaultValue` | `any` | 기본값 |
| `collectionName` | `string` | 소속 컬렉션 이름 |
| `foreignKey` | `string` | 외래 키 필드 이름 (belongsTo 등) |
| `sourceKey` | `string` | 연결 소스 키 (hasMany 등) |
| `targetKey` | `string` | 연결 대상 키 |
| `fullpath` | `string` | 전체 경로 (예: `main.users.status`), API 또는 변수 참조용으로 사용 |
| `resourceName` | `string` | 리소스 이름 (예: `users.status`) |
| `readonly` | `boolean` | 읽기 전용 여부 |
| `titleable` | `boolean` | 제목으로 표시 가능 여부 |
| `validation` | `object` | 유효성 검사 규칙 설정 |
| `uiSchema` | `object` | UI 설정 |
| `targetCollectionTitleField` | `CollectionField` | 연결 대상 컬렉션의 제목 필드 (연결 필드) |

## 주요 메서드

| 메서드 | 설명 |
|------|------|
| `isAssociationField(): boolean` | 연결 필드(belongsTo, hasMany, hasOne, belongsToMany 등) 여부를 확인합니다. |
| `isRelationshipField(): boolean` | 관계형 필드(o2o, m2o, o2m, m2m 등 포함) 여부를 확인합니다. |
| `getComponentProps(): object` | 필드 컴포넌트의 기본 props를 가져옵니다. |
| `getFields(): CollectionField[]` | 연결 대상 컬렉션의 필드 목록을 가져옵니다 (연결 필드 전용). |
| `getFilterOperators(): object[]` | 해당 필드에서 지원하는 필터 연산자(예: `$eq`, `$ne` 등)를 가져옵니다. |

## 예시

### 필드 타입에 따른 분기 렌더링

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // 연결 필드: 연결된 레코드 표시
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### 연결 필드 여부 판단 및 대상 컬렉션 접근

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // 대상 컬렉션 구조에 따라 처리
}
```

### 열거형(Enum) 옵션 가져오기

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### 읽기 전용/표시 전용 모드에 따른 조건부 렌더링

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### 연결 대상 컬렉션의 제목 필드 가져오기

```ts
// 연결 필드 표시 시, 대상 컬렉션의 targetCollectionTitleField를 사용하여 제목 필드명을 가져올 수 있습니다.
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## ctx.collection과의 관계

| 요구 사항 | 권장 용법 |
|------|----------|
| **현재 필드가 속한 컬렉션** | `ctx.collectionField?.collection` 또는 `ctx.collection` |
| **필드 메타데이터 (이름, 타입, 인터페이스, 열거형 등)** | `ctx.collectionField` |
| **연결 대상 컬렉션** | `ctx.collectionField?.targetCollection` |

`ctx.collection`은 보통 현재 블록에 바인딩된 컬렉션을 나타내며, `ctx.collectionField`는 컬렉션 내의 현재 필드 정의를 나타냅니다. 하위 테이블이나 연결 필드 등의 시나리오에서는 두 값이 다를 수 있습니다.

## 주의사항

- **JSBlock**, **JSAction(필드 바인딩 없음)** 등의 시나리오에서 `ctx.collectionField`는 보통 `undefined`입니다. 접근 전 옵셔널 체이닝을 사용하는 것이 좋습니다.
- 사용자 정의 JS 필드가 컬렉션 필드에 바인딩되지 않은 경우, `ctx.collectionField`는 `null`일 수 있습니다.
- `targetCollection`은 연결 타입 필드(예: m2o, o2m, m2m)에서만 존재하며, `enum`은 select, radioGroup 등 옵션이 있는 필드에서만 존재합니다.

## 관련 문서

- [ctx.collection](./collection.md): 현재 컨텍스트와 연결된 컬렉션
- [ctx.model](./model.md): 현재 실행 컨텍스트가 위치한 모델
- [ctx.blockModel](./block-model.md): 현재 JS를 포함하는 상위 블록
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): 현재 필드 값 읽기 및 쓰기