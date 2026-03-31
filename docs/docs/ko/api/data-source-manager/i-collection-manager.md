:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# ICollectionManager

`ICollectionManager` 인터페이스는 데이터 소스의 `컬렉션` 인스턴스를 관리하는 데 사용됩니다.

## API

### registerFieldTypes()

`컬렉션` 내의 필드 타입을 등록합니다.

#### 시그니처

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

`컬렉션`의 `Interface`를 등록합니다.

#### 시그니처

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

`컬렉션 템플릿`을 등록합니다.

#### 시그니처

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

`Model`을 등록합니다.

#### 시그니처

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

`Repository`를 등록합니다.

#### 시그니처

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

등록된 리포지토리 인스턴스를 가져옵니다.

#### 시그니처

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

`컬렉션`을 정의합니다.

#### 시그니처

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

기존 `컬렉션`의 속성을 수정합니다.

#### 시그니처

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

`컬렉션`이 존재하는지 확인합니다.

#### 시그니처

- `hasCollection(name: string): boolean`

### getCollection()

`컬렉션` 인스턴스를 가져옵니다.

#### 시그니처

- `getCollection(name: string): ICollection`

### getCollections()

모든 `컬렉션` 인스턴스를 가져옵니다.

#### 시그니처

- `getCollections(): Array<ICollection>`

### getRepository()

`Repository` 인스턴스를 가져옵니다.

#### 시그니처

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

데이터 소스를 동기화합니다. 이 로직은 서브클래스에서 구현됩니다.

#### 시그니처

- `sync(): Promise<void>`