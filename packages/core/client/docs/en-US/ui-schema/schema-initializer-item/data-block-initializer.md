# DataBlockInitializer

## 介绍

这个是基于 `SchemaInitializerMenu` 和 `SchemaInitializerItem` 进行封装的一个组件，用于快捷创建一个区块。

## 用法

### Props 类型

```typescript | pure
interface DataBlockInitializerProps {
  /**
   * 选项的唯一标识
   */
  name: string;
  /**
   * 在页面上显示出来的标题
   */
  title: string;
  /**
   * 用来标识当前区块的类型，在区块模板中有使用
   */
  componentType: string;
  /**
   * 处理区块模板
   * @param templateSchema
   * @param options
   * @returns
   */
  templateWrap?: (
    templateSchema: any,
    options: {
      item: any;
      fromOthersInPopup?: boolean;
    },
  ) => any;
  /**
   * 用于自定义创建区块的方法
   * @param args
   * @returns
   */
  onCreateBlockSchema?: (args: any) => void;
  /**
   * 选项左侧的图标
   */
  icon?: string | React.ReactNode;
  /**
   * 用来筛选弹窗中的 “Current record” 和 “Associated records” 选项中的数据表
   */
  filter?: (options: { collection: Collection; associationField: CollectionFieldOptions }) => boolean;
  /**
   * 用来筛选数据源
   * @param dataSource
   * @returns
   */
  filterDataSource?: (dataSource: DataSource) => boolean;
  /**
   * 用来筛选弹窗中的 “Other records” 选项中的数据表
   */
  filterOtherRecordsCollection?: (collection: Collection) => boolean;
  /**
   * 是否只显示当前上下文中的数据源
   */
  onlyCurrentDataSource?: boolean;
  /**
   * 是否隐藏搜索框
   */
  hideSearch?: boolean;
  /**
   * 是否显示关联字段
   */
  showMoreOptions?: boolean;
  /** 如果只有一项数据表时，不显示 children 列表 */
  hideChildrenIfSingleCollection?: boolean;
  /**
   * 用于自定义子选项列表的内容
   */
  items?: ReturnType<typeof useCollectionDataSourceItems>[];
  /**
   * 隐藏弹窗中的 Other records 选项
   */
  hideOtherRecordsInPopup?: boolean;
  /**
   * 处理点击事件
   * @param options
   * @returns
   */
  onClick?: (options: { item: any; fromOthersInPopup?: boolean }) => void;
  /** 用于更改 Current record 的文案 */
  currentText?: string;
  /** 用于更改 Other records 的文案 */
  otherText?: string;
}
```

### 使用示例

下面我们实现一个简单的用于添加一个区块的选项：

```tsx | pure
const SimpleBlock = (props) => {
  const { insert } = useSchemaInitializer();
  const schema = {
    type: 'void',
    title: 'SimpleBlock',
    'x-decorator': 'DataBlockProvider',
    'x-component': 'Form',
  };

  const createBlockSchema = (args) => {
    insert(schema);
  };
  
  return <DataBlockInitializer title={'SimpleBlock'} onCreateBlockSchema={createBlockSchema} />;
};
```

然后把它添加到一个 SchemaInitializer 实例中：

```tsx
import { DataBlockInitializer, DataBlockProvider, Form, useSchemaInitializer } from '@nocobase/client';
import app from '../demos/schema-initializer-common';

const SimpleBlock = (props) => {
  const { insert } = useSchemaInitializer();
  const schema = {
    type: 'void',
    title: 'SimpleBlock',
    'x-decorator': 'DataBlockProvider',
    'x-component': 'Form',
  };

  const createBlockSchema = (args) => {
    insert(schema);
  };
  
  return <DataBlockInitializer title={'SimpleBlock'} onCreateBlockSchema={createBlockSchema} />;
};

app.addComponents({
  DataBlockProvider,
  Form
});

// 1. 先获取名为 myInitializer 的 SchemaInitializer 实例
// 2. 然后调用 add 方法，将 SimpleBlock 添加到 myInitializer 实例中
app.schemaInitializerManager.get('myInitializer').add('simpleBlock', {
  Component: SimpleBlock,
});

export default app.getRootComponent();
```
