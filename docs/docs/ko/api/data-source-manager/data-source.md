:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# DataSource (추상 클래스)

`DataSource`는 데이터베이스, API 등 한 가지 유형의 **데이터 소스**를 나타내는 데 사용되는 추상 클래스입니다.

## 멤버

### collectionManager

**데이터 소스**의 **컬렉션** 관리자(CollectionManager) 인스턴스이며, [`ICollectionManager`](/api/data-source-manager/i-collection-manager) 인터페이스를 구현해야 합니다.

### resourceManager

**데이터 소스**의 resourceManager 인스턴스입니다.

### acl

**데이터 소스**의 ACL 인스턴스입니다.

## API

### constructor()

생성자 함수로, `DataSource` 인스턴스를 생성합니다.

#### 시그니처

- `constructor(options: DataSourceOptions)`

### init()

초기화 함수로, `constructor` 호출 직후에 호출됩니다.

#### 시그니처

- `init(options: DataSourceOptions)`

### name

#### 시그니처

- `get name()`

**데이터 소스**의 인스턴스 이름을 반환합니다.

### middleware()

DataSource의 미들웨어를 가져옵니다. 이 미들웨어는 서버에 마운트되어 요청을 수신하는 데 사용됩니다.

### testConnection()

정적 메서드로, 연결 테스트 작업 중에 호출됩니다. 매개변수 유효성 검사에 사용될 수 있으며, 구체적인 로직은 서브클래스에서 구현합니다.

#### 시그니처

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### 시그니처

- `async load(options: any = {})`

**데이터 소스**의 로드(load) 작업입니다. 로직은 서브클래스에서 구현합니다.

### createCollectionManager()

#### 시그니처
- `abstract createCollectionManager(options?: any): ICollectionManager`

**데이터 소스**의 **컬렉션** 관리자(CollectionManager) 인스턴스를 생성합니다. 로직은 서브클래스에서 구현합니다.

### createResourceManager()

**데이터 소스**의 ResourceManager 인스턴스를 생성합니다. 서브클래스에서 구현을 오버라이드할 수 있으며, 기본적으로 `@nocobase/resourcer`의 `ResourceManager`를 생성합니다.

### createACL()

DataSource의 ACL 인스턴스를 생성합니다. 서브클래스에서 구현을 오버라이드할 수 있으며, 기본적으로 `@nocobase/acl`의 `ACL`을 생성합니다.