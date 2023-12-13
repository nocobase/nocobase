# Record

Record 类。

## 类型

```tsx | pure
interface RecordOptions<DataType = {}, ParentDataType = {}> {
  data?: DataType;
  parentRecord?: RecordV2<ParentDataType>;
}

class RecordV2<DataType = {}, ParentDataType = {}> {
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

## 示例

### 基本使用

```tsx | pure
const record = new RecordV2({
  data: {
    name: 'foo',
  }
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
