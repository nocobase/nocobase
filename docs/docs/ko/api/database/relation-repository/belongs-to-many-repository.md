:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# BelongsToManyRepository

`BelongsToManyRepository`는 `BelongsToMany` 관계를 처리하는 `Relation Repository`입니다.

다른 관계 유형과 달리, `BelongsToMany` 관계는 중간 테이블을 통해 기록해야 합니다.
NocoBase에서 연관 관계를 정의할 때, 중간 테이블을 자동으로 생성하거나 명시적으로 지정할 수 있습니다.

## 클래스 메서드

### `find()`

연관된 객체를 찾습니다.

**시그니처**

- `async find(options?: FindOptions): Promise<M[]>`

**상세 정보**

쿼리 파라미터는 [`Repository.find()`](../repository.md#find)와 동일합니다.

### `findOne()`

연관된 객체를 찾아 한 개의 레코드만 반환합니다.

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

특정 조건에 맞는 데이터셋과 전체 개수를 데이터베이스에서 쿼리합니다.

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

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

새로운 연관된 객체를 추가합니다.

**시그니처**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**타입**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**상세 정보**

연관된 객체의 `targetKey`를 직접 전달하거나, `targetKey`와 중간 테이블의 필드 값을 함께 전달할 수 있습니다.

**예시**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// targetKey 전달
PostTagRepository.add([t1.id, t2.id]);

// 중간 테이블 필드 전달
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

연관된 객체를 설정합니다.

**시그니처**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**상세 정보**

파라미터는 [add()](#add)와 동일합니다.

### `remove()`

주어진 객체와의 연관 관계를 제거합니다.

**시그니처**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**타입**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

연관된 객체를 토글합니다.

일부 비즈니스 시나리오에서는 연관된 객체를 토글해야 하는 경우가 많습니다. 예를 들어, 사용자가 상품을 즐겨찾기하거나, 즐겨찾기를 취소하거나, 다시 즐겨찾기할 수 있습니다. `toggle` 메서드를 사용하면 이러한 기능을 빠르게 구현할 수 있습니다.

**시그니처**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**상세 정보**

`toggle` 메서드는 연관된 객체가 이미 존재하는지 자동으로 확인합니다. 객체가 존재하면 제거하고, 존재하지 않으면 추가합니다.