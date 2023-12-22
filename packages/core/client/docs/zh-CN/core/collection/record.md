# Record

数据表中的一条记录。

## 类型

```tsx | pure
interface RecordOptions<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  data?: DataType;
  parentRecord?: RecordV2<ParentDataType>;
}

class RecordV2<DataType = {}, ParentDataType = {}> {
  public isNew?: boolean;
  public data?: DataType;
  public parentRecord?: RecordV2<ParentDataType>;
  constructor(options: RecordOptions<DataType, ParentDataType>) {}

  setData(data: DataType) {
    this.data = data;
  }

  setParentRecord(parentRecord: RecordV2<ParentDataType>) {
    this.parentRecord = parentRecord;
  }
}
```

## 详解

### Record 基本概念

Record 类用于提供数据记录，通常情况下对应着后端数据表中的一条记录。以用户表为例，其一条数据对应的 Record 类如下：

```tsx | pure
const useRecord = new RecordV2({
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

### Record 和 Collection 的关系

Record 是指的数据，而 Collection 则是表结构。对于上面的用户表，其对应的 Collection 如下：

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

### 父子关系和关系字段

对于[关系字段](https://docs.nocobase.com/development/server/collections/association-fields)，例如用户和角色的关系，在用户表中会有一个 `roleId` 字段，其值为角色表中的 `id`，当我们通过 `users.roleId` 字段查询用户的角色时：

```bash | pure
GET /api/users/1/roles:get/10
```

其中 `1` 为用户的 `id`，`10` 为角色的 `id`，我们可以得到用户的角色数据：

```tsx | pure
const roleRecord = new Record({
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

其中 `users` id 为 1 的记录我们称之为父记录：

```tsx | pure
roleRecord.setParentRecord(userRecord);
```

### 新记录

对于新表单，我们可以通过 `isNew` 属性来标识：

```tsx | pure
const record = new Record({
  isNew: true,
});
```

## 示例

### 基本使用

```tsx | pure
import { RecordV2 } from '@nocobase/client';

const record = new RecordV2({
  data: {
    name: 'foo',
  }
});
```

### 创建空记录

```tsx | pure
import { RecordV2 } from '@nocobase/client';

const record = new RecordV2({
  isNew: true,
});
```

### 设置 parentRecord

方式1: 通过构造函数设置

```tsx | pure
const parentRecord = new RecordV2({
  data: {
    foo: 'foo',
  }
});

const record = new RecordV2({
  data: {
    name: 'bar',
  },
  parentRecord,
});
```

方式2: 通过 `setParentRecord` 方法设置

```tsx | pure
const parentRecord = new RecordV2({
  data: {
    foo: 'foo',
  }
});

const record = new RecordV2({
  data: {
    name: 'bar',
  }
});

record.setParentRecord(parentRecord);
```
