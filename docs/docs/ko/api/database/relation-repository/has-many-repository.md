:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# HasManyRepository

`HasManyRepository`는 `HasMany` 관계를 처리하는 데 사용되는 `Relation Repository`입니다.

## 클래스 메서드

### `find()`

연관된 객체를 찾습니다.

**시그니처**

- `async find(options?: FindOptions): Promise<M[]>`

**세부 정보**

쿼리 파라미터는 [`Repository.find()`](../repository.md#find)와 동일합니다.

### `findOne()`

연관된 객체를 찾아 단일 레코드만 반환합니다.

**시그니처**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

쿼리 조건에 맞는 레코드 수를 반환합니다.

**시그니처**

- `async count(options?: CountOptions)`

**타입**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

특정 조건에 맞는 데이터셋과 결과 수를 데이터베이스에서 쿼리합니다.

**시그니처**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**타입**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

연관된 객체를 생성합니다.

**시그니처**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

조건에 맞는 연관된 객체를 업데이트합니다.

**시그니처**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

조건에 맞는 연관된 객체를 삭제합니다.

**시그니처**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

객체 연관 관계를 추가합니다.

**시그니처**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**타입**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**세부 정보**

- `tk` - 연관된 객체의 `targetKey` 값으로, 단일 값 또는 배열이 될 수 있습니다.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

주어진 객체와의 연관 관계를 제거합니다.

**시그니처**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**세부 정보**

파라미터는 [`add()`](#add) 메서드와 동일합니다.

### `set()`

현재 관계에 대한 연관된 객체를 설정합니다.

**시그니처**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**세부 정보**

파라미터는 [`add()`](#add) 메서드와 동일합니다.