# HasOneRepository

## Overview

`HasOneRepository` is the associated repository of type `HasOne`.

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

// Get the associated repository
const userProfileRepository = User.repository.relation('profile').of(user.get('id'));

// Or to initialize directly
new HasOneRepository(User, 'profile', user.get('id'));
```

## Class Methods

### `find()`

Find associated objects.

**Signature**

* `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**Type**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**Detailed Information**

Query parameters are the same as [`Repository.find()`](../repository.md#find).

**Example**

```typescript
const profile = await UserProfileRepository.find();
// Return null if the associated object does not exist
```

### `create()`

Create associated objects.

**Signature**

* `async create(options?: CreateOptions): Promise<Model>`

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

Update associated objects.

**Signature**

* `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Example**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Remove associated objects. Only to unassociate, not to delete the associated object.

**Signature**

* `async remove(options?: Transactionable): Promise<void>`

**Detailed Information**

* `transaction`: Transaction object. If no transaction parameter is passed, the method will automatically create an internal transaction.

**Example**

```typescript
await UserProfileRepository.remove();
await UserProfileRepository.find() == null; // true

await Profile.repository.count() === 1; // true
```

### `destroy()`

Delete associated objects.

**Signature**

* `async destroy(options?: Transactionable): Promise<Boolean>`

**Detailed Information**

* `transaction`: Transaction object. If no transaction parameter is passed, the method will automatically create an internal transaction.

**Example**

```typescript
await UserProfileRepository.destroy();
await UserProfileRepository.find() == null; // true
await Profile.repository.count() === 0; // true
```

### `set()`

Set associated objects.

**Signature**

* `async set(options: TargetKey | SetOption): Promise<void>`

**Type**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
````
**Detailed Information**

* tk: Set the targetKey of the associated object.
* transaction: Transaction object. If no transaction parameter is passed, the method will automatically create an internal transaction.

**Example**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```
