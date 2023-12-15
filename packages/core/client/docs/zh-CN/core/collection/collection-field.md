# CollectionField

Collection Field 字段类。

## 类型

```tsx | pure
interface CollectionFieldOptions {
  type: string;
  name: string;
  // ...
}

class CollectionField {
  data: CollectionFieldOptions;
  constructor(data: CollectionFieldOptions) {}
}
```

```tsx | pure
//  users Collection
{
  name: 'users',
  fields: [
    // CollectionField
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'integer',
      name: 'age',
    },
  ],
}

const nameCollectionField = new CollectionField({
  type: 'string',
  name: 'name',
});

const ageCollectionField = new CollectionField({
  type: 'integer',
  name: 'age',
});
```


## CollectionFieldOptions 详解

```tsx | pure
// 全部属性
```

- type

- name

- collectionName

- uiSchema


<!-- 关于 `CollectionField` 的更多信息，请参考 [数据表和字段](https://docs.nocobase.com/development/server/collections) 和 [关系字段](https://docs.nocobase.com/development/server/collections/association-fields) -->

## 实例方法

暂无
