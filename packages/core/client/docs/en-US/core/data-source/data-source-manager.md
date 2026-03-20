# DataSourceManager

The Nocobase front-end data source system includes the following:

- [DataSourceManager](./data-source-manager.md)
  - [DataSource](./data-source.md)
    - [CollectionManager](./collection-manager.md)
      - [Collection](./collection.md)
        - [Field](./collection-field.md)
  - [CollectionTemplateManager](./collection-template-manager.md)
    - [CollectionTemplate](./collection-template.md)
  - [CollectionFieldInterfaceManager](./collection-field-interface-manager.md)
    - [CollectionFieldInterface](./collection-field-interface.md)
  - [CollectionMixins](./collection-mixins.md)


## Instance Properties

- collectionTemplateManager

Used to manage instances of `CollectionTemplate`.

```tsx | pure
import { Plugin, CollectionTemplate } from '@nocobase/client';

class MyCollectionTemplate extends CollectionTemplate {
  name = 'my-collection-template';
}

class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.collectionTemplateManager.addCollectionTemplates([MyCollectionTemplate])
  }
}
```

Please refer to: [CollectionTemplateManager](./collection-template-manager.md)

- collectionFieldInterfaceManager

Used to manage instances of `CollectionFieldInterface`.

```tsx | pure
import { Plugin, CollectionFieldInterface } from '@nocobase/client';

class MyCollectionFieldInterface extends CollectionFieldInterface {
  name = 'my-collection-field-interface';
}

class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.collectionFieldInterfaceManager.addFieldInterfaces([MyCollectionFieldInterface])
  }
}
```

Please refer to: [CollectionTemplateManager](./collection-template-manager.md)

## Instance Methods

### addCollectionTemplates()

It is a shortcut method of `CollectionTemplateManager` used to add `CollectionTemplate`.

- Type

```tsx | pure
class DataSourceManager {
  addCollectionTemplates(templates: CollectionTemplate[]): void;
}
```

- Example

```tsx | pure
import { Plugin, CollectionTemplate } from '@nocobase/client';

class MyCollectionTemplate extends CollectionTemplate {
  name = 'my-collection-template';
}

class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.collectionTemplateManager.addCollectionTemplates([MyCollectionTemplate])
  }
}
```

Please refer to: [CollectionTemplateManager](./collection-template-manager.md)

### addFieldInterfaces()

It is a shortcut method of `CollectionFieldInterfaceManager` used to add `CollectionFieldInterface`.
- Type

```tsx | pure
class DataSourceManager {
  addFieldInterfaces(fieldInterfaces: CollectionFieldInterface[]): void;
}
```

- Example

```tsx | pure
import { Plugin, CollectionFieldInterface } from '@nocobase/client';

class MyCollectionFieldInterface extends CollectionFieldInterface {
  name = 'my-collection-field-interface';
}

class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.collectionFieldInterfaceManager.addFieldInterfaces([MyCollectionFieldInterface])
  }
}
```

Please refer to: [CollectionFieldInterfaceManager](./collection-field-interface-manager.md)

### addCollectionMixins()

Used to add mixins to `Collection`.

- Type

```tsx | pure
class DataSourceManager {
  addCollectionMixins(mixins: (typeof Collection)[]): void;
}
```

- Example

```tsx | pure
import { Plugin, Collection } from '@nocobase/client';

class MyCollectionMixin extends Collection {
  otherMethod() {
    console.log('otherMethod');
  }
}

class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.addCollectionMixins([MyCollectionMixin])
  }
}

const MyComponent = () => {
  const collection = useCollection<MyCollectionMixin>();
  collection.otherMethod();
}
```

Please refer to: [CollectionMixins](./collection-mixins.md)

### addDataSource()

Used to add `DataSource`.

- Type

```tsx | pure
class DataSourceManager {
  addDataSource(DataSource: DataSource, options: DataSourceOptions): void;
}
```

- Example

```tsx | pure
import { Plugin, DataSource, DataSourceOptions } from '@nocobase/client';

class MyDataSource extends DataSource {
  async getDataSource() {
    return {
      status: 'loaded',
      collections: [{ name: 'users' }]
    }
  }
}

class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.addDataSource(MyDataSource, {
      key: 'my-data-source',
      displayName: 'My Data Source',
    })
  }
}
```

Please refer to: [DataSource](./data-source.md)

### removeDataSources()

Remove `DataSource`。

- Type

```tsx | pure
class DataSourceManager {
  removeDataSources(keys: string[]): void;
}
```

- Example

```tsx | pure

const MyComponent = () => {
  const dataSourceManager = useDataSourceManager();
  dataSourceManager.removeDataSources(['my-data-source']);
}
```

### getDataSources()

Get a list of all `DataSource` instances.

- Type

```tsx | pure
class DataSourceManager {
  getDataSources(): DataSource[];
}
```

- Example

```tsx | pure
const MyComponent = () => {
  const dataSourceManager = useDataSourceManager();
  const dataSources = dataSourceManager.getDataSources();

  return (
    <div>
      {dataSources.map(dataSource => (
        <div key={dataSource.key}>{dataSource.displayName}</div>
      ))}
    </div>
  )
}
```

### getDataSource()

Get the `DataSource` instance.

- Type

```tsx | pure
class DataSourceManager {
  getDataSource(key: string): DataSource;
}
```

- Example

```tsx | pure
const MyComponent = () => {
  const dataSourceManager = useDataSourceManager();
  const dataSource = dataSourceManager.getDataSource('my-data-source');

  return (
    <div>
      {dataSource.displayName}
    </div>
  )
}
```

### getAllCollections()

Get all Collection instances of all DataSources.

- Type

```tsx | pure

class DataSourceManager {
  getAllCollections(options?: {
    filterCollection?: (collection: Collection) => boolean;
    filterDataSource?: (dataSource: DataSource) => boolean;
  }): (DataSourceOptions & { collections: Collection[] })[];
}
```

- Example

```tsx | pure
const MyComponent = () => {
  const dataSourceManager = useDataSourceManager();
  const collections = dataSourceManager.getAllCollections();

  return (
    <div>
      {collections.map(({ key, displayName, collections }) => (
        <div key={key}>
          <h3>{displayName}</h3>
          <ul>
            {collections.map(collection => (
              <li key={collection.name}>{collection.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

### reload()

Reload all `DataSource` instances.

- Type

```tsx | pure
class DataSourceManager {
  reload(): Promise<void>;
}
```

- Example

```tsx | pure
const MyComponent = () => {
  const dataSourceManager = useDataSourceManager();
  dataSourceManager.reload();
}
```

