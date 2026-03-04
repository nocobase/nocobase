:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/data-source-manager)을 참조하세요.
:::

# ctx.dataSourceManager

데이터 소스 관리자(`DataSourceManager` 인스턴스)는 여러 데이터 소스(예: 메인 데이터베이스 `main`, 로그 데이터베이스 `logging` 등)를 관리하고 액세스하는 데 사용됩니다. 다중 데이터 소스가 존재하거나 데이터 소스 간 메타데이터 액세스가 필요한 경우에 사용합니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **다중 데이터 소스** | 모든 데이터 소스 열거, 키(key)로 특정 데이터 소스 가져오기 |
| **데이터 소스 간 액세스** | 현재 컨텍스트의 데이터 소스를 알 수 없을 때, 「데이터 소스 키 + 컬렉션 이름」으로 메타데이터 액세스 |
| **전체 경로로 필드 가져오기** | `dataSourceKey.collectionName.fieldPath` 형식을 사용하여 데이터 소스 간 필드 정의 가져오기 |

> 주의: 현재 데이터 소스만 조작하는 경우 `ctx.dataSource`를 우선적으로 사용하세요. 데이터 소스를 열거하거나 전환해야 할 때만 `ctx.dataSourceManager`를 사용합니다.

## 타입 정의

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // 데이터 소스 관리
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // 데이터 소스 읽기
  getDataSources(): DataSource[];                     // 모든 데이터 소스 가져오기
  getDataSource(key: string): DataSource | undefined;  // 키로 데이터 소스 가져오기

  // 데이터 소스 + 컬렉션으로 메타데이터 직접 액세스
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## ctx.dataSource와의 관계

| 요구 사항 | 권장 용법 |
|------|----------|
| **현재 컨텍스트에 바인딩된 단일 데이터 소스** | `ctx.dataSource` (예: 현재 페이지/블록의 데이터 소스) |
| **모든 데이터 소스에 대한 진입점** | `ctx.dataSourceManager` |
| **데이터 소스 목록 표시 또는 전환** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **현재 데이터 소스 내에서 컬렉션 가져오기** | `ctx.dataSource.getCollection(name)` |
| **데이터 소스 간 컬렉션 가져오기** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **현재 데이터 소스 내에서 필드 가져오기** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **데이터 소스 간 필드 가져오기** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## 예시

### 특정 데이터 소스 가져오기

```ts
// 'main'이라는 이름의 데이터 소스 가져오기
const mainDS = ctx.dataSourceManager.getDataSource('main');

// 해당 데이터 소스의 모든 컬렉션 가져오기
const collections = mainDS?.getCollections();
```

### 데이터 소스 간 컬렉션 메타데이터 액세스

```ts
// dataSourceKey + collectionName으로 컬렉션 가져오기
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// 컬렉션의 기본 키(Primary Key) 가져오기
const primaryKey = users?.filterTargetKey ?? 'id';
```

### 전체 경로로 필드 정의 가져오기

```ts
// 형식: dataSourceKey.collectionName.fieldPath
// 「데이터 소스 키.컬렉션 이름.필드 경로」로 필드 정의 가져오기
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// 관계 필드 경로 지원
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### 모든 데이터 소스 순회하기

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`데이터 소스: ${ds.key}, 표시 이름: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - 컬렉션: ${col.name}`);
  }
}
```

### 변수에 따라 동적으로 데이터 소스 선택하기

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## 주의사항

- `getCollectionField`의 경로 형식은 `dataSourceKey.collectionName.fieldPath`이며, 첫 번째 세그먼트는 데이터 소스 키, 그 다음은 컬렉션 이름과 필드 경로입니다.
- `getDataSource(key)`는 데이터 소스가 존재하지 않을 경우 `undefined`를 반환하므로, 사용 전 null 체크를 권장합니다.
- `addDataSource`는 키가 이미 존재할 경우 예외를 발생시킵니다. `upsertDataSource`는 기존 항목을 덮어쓰거나 새로 추가합니다.

## 관련 문서

- [ctx.dataSource](./data-source.md): 현재 데이터 소스 인스턴스
- [ctx.collection](./collection.md): 현재 컨텍스트와 연관된 컬렉션
- [ctx.collectionField](./collection-field.md): 현재 필드의 컬렉션 필드 정의