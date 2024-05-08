# ExtendCollectionsProvider

Used to extend [Collection](./collection.md).

## Component

- Type

```tsx | pure
interface ExtendCollectionsProviderProps {
  collections: CollectionOptions[];
  children?: ReactNode;
}
```

- Example

```tsx | pure
import { ExtendCollectionsProvider, CollectionOptions } from '@nocobase/client';

const userCollection: CollectionOptions = {
  name: 'users',
  title: '{{t("Users")}}',
  fields: [
    {
      type: 'string',
      name: 'name',
      title: '{{t("Name")}}',
    },
    {
      type: 'string',
      name: 'email',
      title: '{{t("Email")}}',
    },
  ],
}

const MyPlugin = () => {
  return (
    <ExtendCollectionsProvider collections={[ userCollection ]}>
      <CollectionProvider name="users">
        <ChildComponent />
      </CollectionProvider>
    </ExtendCollectionsProvider>
  );
}

const ChildComponent = () => {
  const collection = useCollection();

  return (
    <div>
      <h1>{collection.name}</h1>
    </div>
  );
}
```

## Hooks

### useExtendCollections()

Get the extended collections.

```tsx | pure
import { useExtendCollections } from '@nocobase/client';

const MyComponent = () => {
  const collections = useExtendCollections();

  return (
    <div>
      {collections.map((collection) => (
        <div key={collection.name}>{collection.title}</div>
      ))}
    </div>
  );
}
```
