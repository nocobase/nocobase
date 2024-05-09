# CollectionTemplate

用于创建数据表的模板。

![](./images/collection-template.png)

```ts
interface AvailableFieldInterfacesInclude {
  include?: any[];
}

interface AvailableFieldInterfacesExclude {
  exclude?: any[];
}

interface CollectionTemplateDefaultOptions {
  /**
   * Auto-generate id
   * @default true
   * */
  autoGenId?: boolean;
  /** Created by */
  createdBy?: boolean;
  /** Updated by */
  updatedBy?: boolean;
  /** Created at */
  createdAt?: boolean;
  /** Updated at */
  updatedAt?: boolean;
  /** Sortable */
  sortable?: boolean;
  /* Tree structure */
  tree?: string;
  /* Logging */
  logging?: boolean;
  /** Inherits */
  inherits?: string | string[];
  /* Field list */
  fields?: CollectionOptions['fields'];
}

class CollectionTemplate {
  constructor(public collectionTemplateManager: CollectionTemplateManager) {}
  name: string;
  Collection?: typeof Collection;
  title?: string;
  color?: string;
  /** Sorting */
  order?: number;
  /** Default configuration */
  default?: CollectionTemplateDefaultOptions;
  events?: any;
  /** UI configurable CollectionOptions parameters (fields for adding or editing Collection forms) */
  configurableProperties?: Record<string, ISchema>;
  /** Available field types for the current template */
  availableFieldInterfaces?: AvailableFieldInterfacesInclude | AvailableFieldInterfacesExclude;
  /** Whether it is a divider */
  divider?: boolean;
  /** Template description */
  description?: string;
  /** Configure buttons in the configuration fields */
  configureActions?: Record<string, ISchema>;
  // Whether to prohibit deleting fields
  forbidDeletion?: boolean;

  supportDataSourceType?: string[];
  notSupportDataSourceType?: string[];

  transform?(collection: CollectionOptions, app: Application): CollectionOptions;
}
```

其需要结合 [CollectionManager](./collection-template-manager.md) 使用。

```ts
import { Plugin, Collection, CollectionTemplate } from '@nocobase/client';

class SqlCollection extends Collection {
  otherMethods() {
    // ...
  }
}

class SqlCollectionTemplate extends CollectionTemplate {
  name = 'sql';
  Collection = SqlCollection; // 自定义的数据表类
  title = '{{t("SQL collection")}}';
  order = 4;
  color = 'yellow';
  default = {
    fields: [],
  };
  configurableProperties = {
    // ...
  }
}

class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.collectionTemplateManager.addCollectionTemplates([ SqlCollectionTemplate ]);

    // or
    this.app.dataSourceManager.addCollectionTemplates([ SqlCollectionTemplate ]);
  }
}
```

## 实例属性

### name

模板的唯一标识符。


### Collection

模板对应的数据表类。

在创建数据表后，Collection 会有 [template 字段](/core/data-source/collection#collectionoptions)，用于标识该数据表是由哪个模板创建的。

当通过 `collectionManager.addCollections()` 添加数据表对象时，会先读取 `collection.template` 字段，然后通过 `collectionManager.getCollectionTemplate(collection.template)` 获取到 `collectionTemplate`。

读取 `collectionTemplate.Collection` 字段，并通过 `new collectionTemplate.Collection(collection)` 创建对应的实例。

如果不传递 `Collection`，则会通过 `new Collection(collection)` 创建对应的实例。

```ts
class SqlCollection extends Collection {
  otherMethods() {
    // ...
  }
}

class SqlCollectionTemplate extends CollectionTemplate {
  name = 'sql';
  Collection = SqlCollection; // 自定义的数据表类
  // ...
}

const userCollection = {
  name: 'users',
  template: 'sql',
  // ...
}

// 内部会调用 new SqlCollection(userCollection)
```

### title

模板的标题。

### color

模板的颜色。

### order

模板的排序。

### events

- `beforeSubmit`：提交前触发


### configurableProperties

表单配置项。

![](./images//collection-template-form.png)

```ts
class SqlCollectionTemplate extends CollectionTemplate {
  name = 'sql',
  // ...
  configurableProperties = {
    title: {
      type: 'string',
      title: '{{ t("Collection display name") }}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Collection name")}}',
      required: true,
      'x-disabled': '{{ !createOnly }}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-validator': 'uid',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
    },
    // ...
  },
}
```

### default

表单默认值。



## 实例方法

### collectionTemplate.transform(collection)

collection 创建后，会调用该方法，用于对 collection 进行转换。

## Utils

### getConfigurableProperties()

用于获取内置的配置项字段。

- 类型

```tsx | pure
export type DefaultConfigurableKeys =
  | 'name'
  | 'title'
  | 'inherits'
  | 'category'
  | 'autoGenId'
  | 'createdBy'
  | 'updatedBy'
  | 'createdAt'
  | 'updatedAt'
  | 'sortable'
  | 'description'
  | 'moreOptions';

const getConfigurableProperties: (...keys: DefaultConfigurableKeys[]) => Record<DefaultConfigurableKeys, any>
```

- 示例

```tsx | pure
import { getConfigurableProperties } from '@nocobase/client';

const sqlCollectionTemplate = new CollectionTemplate({
  name: 'sql',
  // ...
  configurableProperties: {
    ...getConfigurableProperties('name', 'title', 'description'),
    // ...
  },
});
```
