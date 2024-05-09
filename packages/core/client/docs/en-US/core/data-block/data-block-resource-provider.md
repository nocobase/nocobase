# DataBlockResourceProvider

Builds the `resource` object based on the `collection`, `association`, `sourceId`, and other attributes in the `DataBlockProvider`, facilitating the CRUD operations on block data for child components. It is built-in within the [DataBlockProvider](/core/data-block/data-block-provider).

## useDataBlockResource

Used to retrieve the `resource` object for the current data block.

- Type

```ts | pure
function useDataBlockResource(): IResource
```

- Example

```ts | pure
const  resource = useDataBlockResource();

const onSubmit = async (values) => {
  // create
  await resource.create({ values });
}
```

```ts | pure
const  resource = useDataBlockResource();

const onDelete = async () => {
  // delete
  await resource.destroy();
}
```
