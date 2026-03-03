:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/data-source)을 참조하세요.
:::

# ctx.dataSource

현재 RunJS 실행 컨텍스트에 바인딩된 데이터 소스 인스턴스(`DataSource`)로, **현재 데이터 소스 내**에서 컬렉션, 필드 메타데이터 액세스 및 컬렉션 구성을 관리하는 데 사용됩니다. 일반적으로 현재 페이지나 블록에서 선택된 데이터 소스(예: 메인 데이터베이스 `main`)에 해당합니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **단일 데이터 소스 작업** | 현재 데이터 소스를 알고 있을 때, 컬렉션 및 필드 메타데이터 가져오기 |
| **컬렉션 관리** | 현재 데이터 소스 하위의 컬렉션 가져오기/추가/업데이트/삭제 |
| **경로별 필드 가져오기** | `collectionName.fieldPath` 형식을 사용하여 필드 정의 가져오기 (연결 경로 지원) |

> 주의: `ctx.dataSource`는 현재 컨텍스트의 단일 데이터 소스를 나타냅니다. 다른 데이터 소스를 열거하거나 액세스하려면 [ctx.dataSourceManager](./data-source-manager.md)를 사용하세요.

## 타입 정의

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // 읽기 전용 속성
  get flowEngine(): FlowEngine;   // 현재 FlowEngine 인스턴스
  get displayName(): string;      // 표시 이름 (i18n 지원)
  get key(): string;              // 데이터 소스 키 (예: 'main')
  get name(): string;             // key와 동일

  // 컬렉션 읽기
  getCollections(): Collection[];                      // 모든 컬렉션 가져오기
  getCollection(name: string): Collection | undefined; // 이름으로 컬렉션 가져오기
  getAssociation(associationName: string): CollectionField | undefined; // 연결 필드 가져오기 (예: users.roles)

  // 컬렉션 관리
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // 필드 메타데이터
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `key` | `string` | 데이터 소스 키 (예: `'main'`) |
| `name` | `string` | key와 동일 |
| `displayName` | `string` | 표시 이름 (i18n 지원) |
| `flowEngine` | `FlowEngine` | 현재 FlowEngine 인스턴스 |

## 주요 메서드

| 메서드 | 설명 |
|------|------|
| `getCollections()` | 현재 데이터 소스 하위의 모든 컬렉션 가져오기 (정렬됨, 숨겨진 항목 필터링됨) |
| `getCollection(name)` | 이름으로 컬렉션 가져오기. `name`은 연결된 대상 컬렉션을 가져오기 위해 `collectionName.fieldName` 형식을 사용할 수 있습니다. |
| `getAssociation(associationName)` | `collectionName.fieldName`으로 연결 필드 정의 가져오기 |
| `getCollectionField(fieldPath)` | `collectionName.fieldPath`로 필드 정의 가져오기. `users.profile.avatar`와 같은 연결 경로를 지원합니다. |

## ctx.dataSourceManager와의 관계

| 요구 사항 | 권장 용법 |
|------|----------|
| **현재 컨텍스트에 바인딩된 단일 데이터 소스** | `ctx.dataSource` |
| **모든 데이터 소스 진입점** | `ctx.dataSourceManager` |
| **현재 데이터 소스 내에서 컬렉션 가져오기** | `ctx.dataSource.getCollection(name)` |
| **여러 데이터 소스에 걸쳐 컬렉션 가져오기** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **현재 데이터 소스 내에서 필드 가져오기** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **여러 데이터 소스에 걸쳐 필드 가져오기** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## 예시

### 컬렉션 및 필드 가져오기

```ts
// 모든 컬렉션 가져오기
const collections = ctx.dataSource.getCollections();

// 이름으로 컬렉션 가져오기
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// 「컬렉션명.필드경로」로 필드 정의 가져오기 (연결 지원)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### 연결 필드 가져오기

```ts
// collectionName.fieldName으로 연결 필드 정의 가져오기
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // 대상 컬렉션 구조에 따라 처리
}
```

### 컬렉션을 순회하며 동적 처리 수행

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### 필드 메타데이터를 기반으로 유효성 검사 또는 동적 UI 구현

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // interface, enum, validation 등을 기반으로 UI 또는 유효성 검사 수행
}
```

## 주의사항

- `getCollectionField(fieldPath)`의 경로 형식은 `collectionName.fieldPath`이며, 첫 번째 세그먼트는 컬렉션 이름이고 이후는 필드 경로입니다 (연결 지원, 예: `user.name`).
- `getCollection(name)`은 `collectionName.fieldName` 형식을 지원하며, 연결 필드의 대상 컬렉션을 반환합니다.
- RunJS 컨텍스트에서 `ctx.dataSource`는 일반적으로 현재 블록/페이지의 데이터 소스에 의해 결정됩니다. 컨텍스트에 바인딩된 데이터 소스가 없는 경우 `undefined`일 수 있으므로 사용 전에 null 체크를 권장합니다.

## 관련 문서

- [ctx.dataSourceManager](./data-source-manager.md): 데이터 소스 관리자, 모든 데이터 소스 관리
- [ctx.collection](./collection.md): 현재 컨텍스트와 연관된 컬렉션
- [ctx.collectionField](./collection-field.md): 현재 필드의 컬렉션 필드 정의