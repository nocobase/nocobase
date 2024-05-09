# CollectionRecord

A record in a data table.

## 类型

```tsx | pure
interface CollectionRecordOptions<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  data?: DataType;
  parentRecord?: CollectionRecord<ParentDataType>;
  /**
  * The collection name to which the current record belongs
   */
  collectionName?: string;
}

class CollectionRecord<DataType = {}, ParentDataType = {}> {
  public isNew?: boolean;
  public data?: DataType;
  public parentRecord?: CollectionRecord<ParentDataType>;
  public collectionName?: string;
  constructor(options: CollectionRecordOptions<DataType, ParentDataType>) {}

  setData(data: DataType) {
    this.data = data;
  }

  setParentRecord(parentRecord: CollectionRecord<ParentDataType>) {
    this.parentRecord = parentRecord;
  }
}
```

## Details

### Basic Concepts of CollectionRecord

The CollectionRecord class is used to provide data records, which typically correspond to a single record in a backend database table. Taking the user table as an example, the CollectionRecord class for a single data record is as follows:

```tsx | pure
const useCollectionRecord = new CollectionRecord({
  data: {
    "id": 1,
    "roleId": 10,
    "appLang": null,
    "createdById": null,
    "email": "test@nocobase.com",
    "nickname": "Admin",
    "phone": null,
    "systemSettings": {},
    "updatedById": null,
    "username": "nocobase",
    "createdAt": "2023-12-04T09:42:52.953Z",
    "updatedAt": "2023-12-04T09:42:52.953Z",
  }
});
```

### Relationship between CollectionRecord and Collection

CollectionRecord refers to the data, while Collection represents the table structure. For the user table mentioned above, its corresponding Collection is as follows:

```tsx | pure
const usersCollection = new Collection({
  name: 'users',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
    },
    {
      type: 'string',
      name: 'username',
    },
    {
      type: 'integer',
      name: 'age',
    },
    {
      "name": "email",
      "type": "string",
    },
    // ....
  ],
});
```

### Parent-Child Relationship and Relationship Fields

For [relationship fields](https://docs.nocobase.com/development/server/collections/association-fields), such as the relationship between users and roles, there will be a `roleId` field in the users table, with its value being the `id` in the roles table. When we query the role of a user using the `users.roleId` field:

```bash | pure
GET /api/users/1/roles:get/10
```

Where `1` is the user's `id` and `10` is the role's `id`, we can obtain the user's role data:

```tsx | pure
const roleRecord = new CollectionRecord({
  data: {
    "id": 10,
    "name": "member",
    "title": "test role",
    "strategy": {
      "actions": [
        "view",
        "update:own",
        "destroy:own",
        "create"
      ]
    },
    "createdAt": "2023-03-30T07:53:10.924Z",
    "updatedAt": "2023-12-15T02:51:43.577Z",
  }
})
```

The record with `users` id 1 is referred to as the parent record:

```tsx | pure
roleRecord.setParentRecord(userRecord);
```

### New Record

For new forms, we can identify them using the `isNew` property:

```tsx | pure
const record = new CollectionRecord({
  isNew: true,
});
```

## Example

### Basic Usage

```tsx | pure
import { CollectionRecord } from '@nocobase/client';

const record = new CollectionRecord({
  data: {
    name: 'foo',
  }
});
```

### Creating an Empty Record

```tsx | pure
import { CollectionRecord } from '@nocobase/client';

const record = new CollectionRecord({
  isNew: true,
});
```

### Set parentRecord

Method 1: Setting through the constructor

```tsx | pure
const parentRecord = new CollectionRecord({
  data: {
    foo: 'foo',
  }
});

const record = new CollectionRecord({
  data: {
    name: 'bar',
  },
  parentRecord,
});
```

Method 2: Setting via the `setParentRecord` method

```tsx | pure
const parentRecord = new CollectionRecord({
  data: {
    foo: 'foo',
  }
});

const record = new CollectionRecord({
  data: {
    name: 'bar',
  }
});

record.setParentRecord(parentRecord);
```
