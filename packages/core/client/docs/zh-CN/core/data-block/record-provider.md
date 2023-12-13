# RecordProvider

用于提供数据记录，通常情况下对应着后端数据表中的一条记录。

## 组件

- 类型

```tsx | pure
interface RecordProviderProps<DataType = {}, ParentDataType = {}> {
  record?: RecordV2<DataType, ParentDataType> | DataType;
  parentRecord?: RecordV2<ParentDataType> | DataType;
}
```

- 详解

当数据为[关系字段](xx)时，其存在父子关系，此时可以通过 `parentRecord` 来指定父记录。

`record` 和 `parentRecord` 即可以是普通的对象，也可以是 [RecordV2]() 实例，最终向子组件传递的数据为 `RecordV2` 实例，并通过 context 传递给子组件。

- 示例

```tsx | pure
const record = new RecordV2({ id: 1, name: 'foo' });

<RecordProvider record={record} />
// 最终向子组件传递的数据为： props.record
```

```tsx | pure
<RecordProvider record={{ id: 1, name: 'foo' }} />
// 最终向子组件传递的数据为： const record = new RecordV2({ id: 1, name: 'foo' });
```

```tsx | pure
const parentRecord = new RecordV2({ id: 1, role: 'admin', });
const record = new RecordV2({ id: 1, name: 'foo', parentRecord: parentRecord });

<RecordProvider record={record} />
// 最终向子组件传递的数据为： props.record
```

```tsx | pure
const parentRecord = new RecordV2({ id: 1, role: 'admin' });
const record = new RecordV2({ id: 1, name: 'foo' });

<RecordProvider record={record} parentRecord={parentRecord} />

// 首先设置父记录：record.setParentRecord(parentRecord);
// 最终向子组件传递的数据为：record（带有父记录）
```

```tsx | pure
<RecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} />

// 首先实例化父记录：const parentRecord = new RecordV2({ id: 1, role: 'admin' });
// 然后实例化记录：const record = new RecordV2({ id: 1, name: 'foo' });
// 最后设置父记录：record.setParentRecord(parentRecord);
// 最终向子组件传递的数据为：record（带有父记录）
```

## Hooks

### useRecordV2()

用于获取 `RecordProvider` 组件传递的数据记录。

- 示例

```tsx | pure
const record = useRecordV2();

console.log(record, record.data, record.parentRecord);
```

### useRecordDataV2()

直接获取 Record 的 `data` 属性，等同于 `useRecordV2().data`。

- 示例

```tsx | pure
const data = useRecordDataV2();
const record = useRecordV2();
console.log(data === record.data);
```

### useParentRecordV2()

直接获取 Record 的数据 `parentRecord`，等同于 `useRecordV2().parentRecord`。

- 示例

```tsx | pure
const parentRecord = useParentRecordV2();
const record = useRecordV2();
console.log(parentRecord === record.parentRecord);
```

### useParentRecordDataV2()

直接获取 Record 的数据 `parentRecord.data`，等同于 `useRecordV2().parentRecord.data`。

- 示例

```tsx | pure
const record = useRecordV2();
const parentData = useParentRecordDataV2();
const parentRecord = useParentRecordV2();
console.log(parentData === parentRecord.data === record.parentRecord.data);
```
<!--
## 使用场景

### 传递数据记录
- `DataBlockProvider` 组件中的 [BlocRequestProvider]() 组件对于 `action: "get"` 类型的请求在获取数据后会 *自动* 向子组件传递数据记录，此时可以通过 `useRecordV2()` 来获取数据记录

```tsx {5,13}| pure
const schema = {
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    collection: 'users',
    action: 'get',
  },
  "properties": {
    "x-component": "MyForm",
  }
}

const MyForm = () => {
  const record = useRecordV2();
  const [form] = useForm();
  useEffect(() => {
    form.setFieldsValue(record.data);
  }, [record.data]);
  return <Form form={form} />;
}
```

- 对于 `action: "list"` 列表数据获取的是多条记录，则需要根据组件的使用自己使用 `<RecordProvider />` 向子组件传递数据记录。

```tsx {5,13}| pure
const schema = {
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    collection: 'users',
    action: 'list',
  },
  "properties": {
    "x-component": "MyTable",
  }
}

const MyTable = () => {
  const record = useRecordV2();
  return <Form form={form} />;
}
```


### 使用数据记录

- 在子组件中使用 `useRecordV2()` 获取数据记录，然后通过 `record.data`、`record.parentRecord` 来获取数据记录的数据，用于组件的渲染。
- 可以将获取到的 `useRecordV2()` 传递给祖先组件，以便在非子组件中使用数据记录，例如将 Table 组件点击单元格弹窗，其弹窗数据可以由单元格中的数据记录决定，并且弹窗组件可以放到 Table 组件外部。 -->
