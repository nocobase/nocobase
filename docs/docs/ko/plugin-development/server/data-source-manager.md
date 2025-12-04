:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# DataSourceManager 데이터 소스 관리

NocoBase는 다중 데이터 소스 관리를 위한 `DataSourceManager`를 제공합니다. 각 `DataSource`는 자체 `Database`, `ResourceManager`, `ACL` 인스턴스를 포함하고 있어, 개발자가 여러 데이터 소스를 유연하게 관리하고 확장할 수 있도록 돕습니다.

## 기본 개념

각 `DataSource` 인스턴스는 다음을 포함합니다:

- **`dataSource.collectionManager`**: 컬렉션과 필드를 관리합니다.
- **`dataSource.resourceManager`**: 리소스 관련 작업(예: 생성, 조회, 업데이트, 삭제 등)을 처리합니다.
- **`dataSource.acl`**: 리소스 작업에 대한 접근 제어(ACL)를 담당합니다.

편리한 접근을 위해 주 데이터 소스 멤버에 대한 단축 별칭이 제공됩니다:

- `app.db`는 `dataSourceManager.get('main').collectionManager.db`와 동일합니다.
- `app.acl`은 `dataSourceManager.get('main').acl`과 동일합니다.
- `app.resourceManager`는 `dataSourceManager.get('main').resourceManager`와 동일합니다.

## 주요 메서드

### dataSourceManager.get(dataSourceKey)

이 메서드는 지정된 `DataSource` 인스턴스를 반환합니다.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

모든 데이터 소스에 미들웨어를 등록합니다. 이 미들웨어는 모든 데이터 소스의 작업에 영향을 미칩니다.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

데이터 소스가 로드되기 전에 실행됩니다. 주로 모델 클래스, 필드 타입 등록과 같은 정적 클래스 등록에 사용됩니다:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // 사용자 정의 필드 타입
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

데이터 소스가 로드된 후에 실행됩니다. 주로 작업 등록, 접근 제어 설정 등에 사용됩니다.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // 접근 권한 설정
});
```

## 데이터 소스 확장

전체 데이터 소스 확장에 대한 자세한 내용은 데이터 소스 확장 챕터를 참조하십시오.