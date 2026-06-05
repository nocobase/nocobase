:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# DataSourceManager

`DataSourceManager`는 여러 `dataSource` 인스턴스를 관리하는 클래스입니다.

## API

### add()
`dataSource` 인스턴스를 추가합니다.

#### 시그니처

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

`dataSource` 인스턴스에 전역 미들웨어를 추가합니다.

### middleware()

현재 `dataSourceManager` 인스턴스의 미들웨어를 가져옵니다. 이 미들웨어는 HTTP 요청에 응답하는 데 사용할 수 있습니다.

### afterAddDataSource()

새로운 `dataSource`가 추가된 후 호출되는 훅 함수입니다.

#### 시그니처

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

데이터 소스 타입과 해당 클래스를 등록합니다.

#### 시그니처

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

데이터 소스 클래스를 가져옵니다.

#### 시그니처

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

등록된 데이터 소스 타입과 인스턴스 옵션을 기반으로 데이터 소스 인스턴스를 생성합니다.

#### 시그니처

- `buildDataSourceByType(type: string, options: any): DataSource`