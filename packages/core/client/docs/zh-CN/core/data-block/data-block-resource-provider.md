# DataBlockResourceProvider

根据 `DataBlockProvider` 中的 `collection`、`association`、`sourceId` 等属性，构建好 [resource](https://docs.nocobase.com/api/sdk#resource-action) 对象，方便子组件对区块数据的增删改查操作，其内置在 [DataBlockProvider](/core/data-block/data-block-provider) 中


## useDataBlockResource

用于获取当前数据块的 resource 对象。

- 类型

```ts | pure
function useDataBlockResource(): IResource
```

- 示例

```ts | pure
const  resource = useDataBlockResource();

const onSubmit = async (values) => {
  // 创建
  await resource.create({ values });
}
```

```ts | pure
const  resource = useDataBlockResource();

const onDelete = async () => {
  // 删除
  await resource.destroy();
}
```

可运行示例
