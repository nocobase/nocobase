# Collection

Collection 数据表类。

## 类型

```tsx | pure
interface CollectionOptions {
  name: string;
  title?: string;
  fields?: FieldOptions[];
  // ....
}

class CollectionV2 {
  data: CollectionOptions;
  constructor(data: CollectionOptions) {}
  getFields(): CollectionField[];
}
```

```tsx | pure
const usersCollection = new Collection({
  name: 'users',
  title: '用户',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'integer',
      name: 'age',
    },
  ],
});
```


## CollectionOptions 详解

- name

- title

- fields

## 实例方法

### collection.getFields()
