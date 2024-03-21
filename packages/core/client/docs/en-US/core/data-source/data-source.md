# DataSource

主要是用于获取数据源和数据源的数据表结构列表，并在获取后交给 [CollectionManager](./collection-manager.md) 进行管理，其被 [DataSourceManager](./data-source-manager.md) 管理。

## 数据源定义

数据源的定义需要继承 `DataSource` 类，并实现 `getDataSource` 方法，当调用 `reload` 方法时，会调用 `getDataSource` 方法获取数据表结构。

```tsx | pure
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

### 数据源注册

数据源需要在插件中注册，通过 `DataSourceManager` 的 `addDataSource` 方法进行注册。

初始化添加的时候 `collections` 可以为空，当调用 `reload` 方法时，会调用 `getDataSource` 方法获取数据表结构。

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

- `key`：数据源的唯一标识
- `displayName`：数据源的显示名称
- `status`：数据源的状态，`loaded` 表示已加载，`loading` 表示正在加载，`loading-failed` 表示加载失败
- `collections`：数据表结构
- `errorMessage`：错误信息

## 实例方法

### getDataSource()

用于获取数据源信息，其会被 `reload` 方法内部调用，外部不需要调用。

### addReloadCallback()

用于添加数据源加载完成后的回调函数。

- 类型

```tsx | pure
type LoadCallback = (collections: CollectionOptions[]) => void;

class DataSource {
  addReloadCallback(callback: LoadCallback): void;
}
```

### removeReloadCallback()

用于移除数据源加载完成后的回调函数。

- 类型

```tsx | pure
type LoadCallback = (collections: CollectionOptions[]) => void;
class DataSource {
  removeReloadCallback(callback: LoadCallback): void;
}
```

- 示例

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

用于重新加载数据源，会调用 `getDataSource` 方法获取数据表结构，并内部调用 `addReloadCallback` 添加的回调函数。

- 类型

```tsx | pure
class DataSource {
  reload(): Promise<void>;
}
```

- 示例

```tsx | pure
const MyComponent = () => {
  const dataSource = useDataSource();

  const handleClick = async () => {
    await dataSource.reload();
  };
};
```

### getOptions()

获取数据源的配置信息。

- 类型

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

获取数据源的配置信息。

- 类型

```tsx | pure
class DataSource {
  getOption(key: string): any;
}
```

- 示例

```tsx | pure
const MyComponent = () => {
  const dataSource = useDataSource();

  const handleClick = async () => {
    console.log(dataSource.getOption('key'));
  };
};
```
