# HasOneRepository

## Overview

`HasOneRepository` is the repository for `HasOne` type associations.

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

// Get the association repository
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Can also be initialized directly
new HasOneRepository(User, 'profile', user.get('id'));
```

## Class Methods

### `find()`

Finds the associated object

**Signature**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**Type**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**Details**

The query parameters are the same as [`Repository.find()`](../repository.md#find).

**Example**

```typescript
const profile = await UserProfileRepository.find();
// Returns null if the associated object does not exist
```

### `create()`

Creates an associated object

**Signature**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Example**

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

Updates the associated object

**Signature**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Example**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Removes the associated object. This only unlinks the association, it does not delete the associated object.

**Signature**

- `async remove(options?: Transactionable): Promise<void>`

**Details**

- `transaction`: Transaction object. If no transaction parameter is passed, the method will automatically create an internal transaction.

**Example**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Deletes the associated object

**Signature**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Details**

- `transaction`: Transaction object. If no transaction parameter is passed, the method will automatically create an internal transaction.

**Example**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Sets the associated object

**Signature**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Type**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Details**

- `tk`: The targetKey of the associated object to be set.
- `transaction`: Transaction object. If no transaction parameter is passed, the method will automatically create an internal transaction.

**Example**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```