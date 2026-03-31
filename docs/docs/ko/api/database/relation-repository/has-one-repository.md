:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# HasOneRepository

## 개요

`HasOneRepository`는 `HasOne` 타입 연관 Repository입니다.

```typescript
const User = db.collection({
  name: 'users',
  fields: [
    { type: 'hasOne', name: 'profile' },
    { type: 'string', name: 'name' },
  ],
});

const Profile = db.collection({
  name: 'profiles',
  fields: [{ type: 'string', name: 'avatar' }],
});

const user = await User.repository.create({
  values: { name: 'u1' },
});

// 연관 Repository 가져오기
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// 또한 직접 초기화할 수도 있습니다
new HasOneRepository(User, 'profile', user.get('id'));
```

## 클래스 메서드

### `find()`

연관 객체를 찾습니다.

**시그니처**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**타입**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**상세 정보**

쿼리 파라미터는 [`Repository.find()`](../repository.md#find)와 동일합니다.

**예시**

```typescript
const profile = await UserProfileRepository.find();
// 연관 객체가 존재하지 않을 경우, null을 반환합니다.
```

### `create()`

연관 객체를 생성합니다.

**시그니처**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**예시**

```typescript
const profile = await UserProfileRepository.create({
  values: { avatar: 'avatar1' },
});

console.log(profile.toJSON());
/*
{
  id: 1,
  avatar: 'avatar1',
  userId: 1,
  updatedAt: 2022-09-24T13:59:40.025Z,
  createdAt: 2022-09-24T13:59:40.025Z
}
*/
```

### `update()`

연관 객체를 업데이트합니다.

**시그니처**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**예시**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

연관 객체를 제거합니다. 연관 관계만 해제하며, 연관 객체를 삭제하지는 않습니다.

**시그니처**

- `async remove(options?: Transactionable): Promise<void>`

**상세 정보**

- `transaction`: 트랜잭션 객체입니다. 트랜잭션 파라미터를 전달하지 않으면, 이 메서드가 자동으로 내부 트랜잭션을 생성합니다.

**예시**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

연관 객체를 삭제합니다.

**시그니처**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**상세 정보**

- `transaction`: 트랜잭션 객체입니다. 트랜잭션 파라미터를 전달하지 않으면, 이 메서드가 자동으로 내부 트랜잭션을 생성합니다.

**예시**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

연관 객체를 설정합니다.

**시그니처**

- `async set(options: TargetKey | SetOption): Promise<void>`

**타입**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**상세 정보**

- `tk`: 설정할 연관 객체의 targetKey입니다.
- `transaction`: 트랜잭션 객체입니다. 트랜잭션 파라미터를 전달하지 않으면, 이 메서드가 자동으로 내부 트랜잭션을 생성합니다.

**예시**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```