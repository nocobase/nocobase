# CollectionProvider

Used to provide an instance of [Collection](/core/data-source/collection).

## Component

### CollectionProvider

- Type

```tsx | pure
interface CollectionProviderProps {
  name: string;
  dataSource?: string;
  children?: ReactNode;
}
```

- Details

The component will query the table information from the [CollectionManager](/core/data-source/collection-manager) based on the `name`. If the query fails, it will not be rendered.

The `dataSource` is used to specify the namespace of the table in the [CollectionManager](/core/data-source/collection-manager#datasource). If not specified, the default namespace will be used.

- Example

```tsx | pure
import { CollectionProvider } from '@nocobase/client';

const MyComponent = () => {
  return (
    <CollectionProvider name="users">
      <div>...</div>
    </CollectionProvider>
  )
}
```

## Hooks

### useCollection()

Used to retrieve the `Collection` instance passed by `CollectionProvider`.

```tsx | pure
const collection = useCollection()

console.log(collection instanceof Collection) // true
console.log(collection);
```

Using Mixins:

```tsx | pure
const collection = useCollection<TestMixin>()
const collection = useCollection<TestMixin & TestMixin2>()
```

## Example

<code src="./demos/collection/demo1.tsx"></code>

