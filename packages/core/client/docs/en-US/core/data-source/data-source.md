# DataSource

It is mainly used to obtain the data source and the list of data table structures, and then hand them over to the [CollectionManager](./collection-manager.md) for management, which is managed by the [DataSourceManager](./data-source-manager.md).

## Data Source Definition

The definition of the data source needs to inherit the `DataSource` class and implement the `getDataSource` method. When the `reload` method is called, the `getDataSource` method will be called to obtain the data table structure.

```ts
import { DataSource } from '@nocobase/client';

class MyDataSource extends DataSource {
  async getDataSource() {
    return this.app.request({
      url: 'xxx',
      method: 'GET',
    });
  }
}
```

### Data Source Registration

Data sources need to be registered in plugins using the `addDataSource` method of `DataSourceManager`.

When initially adding a data source, the `collections` parameter can be empty. When the `reload` method is called, the `getDataSource` method will be invoked to obtain the data table structure.

```tsx | pure
import { Plugin, DataSource, DataSourceOptions } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.addDataSource(MyDataSource, {
      key: 'my-data-source',
      displayName: 'My Data Source',
      status: 'loaded',
      collections: [
        {
          name: 'users',
          fields: [
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
      ],
    });
  }
}
```

- `key`: The unique identifier of the data source
- `displayName`: The display name of the data source
- `status`: The status of the data source, `loaded` indicates loaded, `loading` indicates loading, `loading-failed` indicates loading failed
- `collections`: The table structure of the data source
- `errorMessage`: The error message

## Instance Methods

### getDataSource()

Used to retrieve information about the data source, it is called internally by the `reload` method and does not need to be called externally.

### addReloadCallback()

Used to add a callback function that is called after the data source is loaded.

- Type

```tsx | pure
type LoadCallback = (collections: CollectionOptions[]) => void;

class DataSource {
  addReloadCallback(callback: LoadCallback): void;
}
```

### removeReloadCallback()

Used to remove the callback function after the data source is loaded.

- Type

```tsx | pure
type LoadCallback = (collections: CollectionOptions[]) => void;
class DataSource {
  removeReloadCallback(callback: LoadCallback): void;
}
```

- Example

```tsx | pure
const MyComponent = () => {
  const dataSource = useDataSource();

  useEffect(() => {
    const callback = (collections) => {
      console.log(collections);
    };
    dataSource.addReloadCallback(callback);
    return () => {
      dataSource.removeReloadCallback(callback);
    };
  }, []);
};
```

### reload()

Used to reload the data source, it calls the `getDataSource` method to retrieve the table structure and internally calls the callback functions added by `addReloadCallback`.

- Type

```tsx | pure
class DataSource {
  reload(): Promise<void>;
}
```

- Example

```tsx | pure
const MyComponent = () => {
  const dataSource = useDataSource();

  const handleClick = async () => {
    await dataSource.reload();
  };
};
```

### getOptions()

Get the configuration information of the data source.

- Type

```tsx | pure
interface DataSourceOptions {
  key: string;
  displayName: string;
  collections?: CollectionOptions[];
  errorMessage?: string;
  status?: 'loaded' | 'loading-failed' | 'loading';
}

class DataSource {
  getOptions(): DataSourceOptions;
}
```

### getOption()

Get the configuration information of the data source.

- Type

```tsx | pure
class DataSource {
  getOption(key: string): any;
}
```

- Example

```tsx | pure
const MyComponent = () => {
  const dataSource = useDataSource();

  const handleClick = async () => {
    console.log(dataSource.getOption('key'));
  };
};
```
