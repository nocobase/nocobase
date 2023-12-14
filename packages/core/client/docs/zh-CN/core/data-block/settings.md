# BlockSettingsProvider

用于传递 [DataBlockProvider 的属性](xxx)，其内置在 [DataBlockProvider](xxx) 中。

## Hooks

### useBlockSettingsV2()

用于获取[DataBlockProvider 的属性](xxx)，通常配合 [SchemaSettings](/core/ui-schema/schema-settings) 使用。

- 类型

```tsx | pure
interface BlockSettingsProps {
  collection?: string;
  association?: string;
  sourceId?: string | number;
  filterByTk?: string | number;
  record?: RecordV2;
  action?: 'list' | 'get';
  params?: Record<string, any>;
  parentRecord?: RecordV2;
  [index: string]: any;
}

interface Result<T = {}> {
  props: BlockSettingsContextProps & T;
  dn: Designable;
}

const useBlockSettingsV2: <T extends {}>() => Result<T>
```

- 详细说明

其中 `props` 就是 DataBlockProvider 的属性，`dn` 是 Designable 对象，可以通过 `dn.deepMerge()` 等方法来修改 schema [静态属性](xxx)。

- 示例

```tsx | pure
const schema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    collection: 'users',
    action: 'list',
    bordered: true, // 用于设置是否显示边框
  },
  'x-component': 'MyTable',
  'x-settings': 'MyTableSettings',
}

const MyTable = (props) => {
  // 获取
  const { props: blockSettingsProps } = useBlockSettingsV2()
  const { bordered } = blockSettingsProps

  // 应用到 Table 组价
  return <Table bordered={bordered} />
}

const MyTableSettings = new SchemaSettings({
  name: 'MyTableSettings',
  items: [
    {
      name: 'bordered',
      type: 'switch',
      useComponentProps() {
        // 获取
        const { props: blockSettingsProps, dn } = useBlockSettingsV2()
        const { bordered } = blockSettingsProps

        return {
          title: 'Bordered',
          checked: bordered,
          onChange: (checked) => {
            // 修改
            dn.deepMerge({ 'x-decorator-props': { bordered: checked } })
          },
        }
      }
    }
  ]
});
```

<code src="./demos/settings/demo1.tsx"></code>

### useBlockSettingsPropsV2()

更加方面的获取区块的属性，等同于 `useBlockSettingsV2().props`。

```tsx | pure
const { props: blockSettingsProps } = useBlockSettingsV2()
const { bordered } = blockSettingsProps

// 或者
const { bordered } = useBlockSettingsPropsV2()
```
