# CollectionFieldInterface

用于创建数据字段。

![](./images/collection-field-interface.png)

```ts
class CollectionFieldInterface {
  app: Application;
  collectionManager: CollectionManagerV2;

  name: string;
  group: string;
  title?: string;
  description?: string;
  order?: number;
  default?: {
    type: string;
    uiSchema?: ISchema;
    [key: string]: any;
  };
  sortable?: boolean;
  availableTypes?: string[];
  hasDefaultValue?: boolean;
  isAssociation?: boolean;
  operators?: any[];
  filterable?: {
    operators?: any[];
    children?: any[];
    [key: string]: any;
  };
  titleUsable?: boolean;

  validateSchema(fieldSchema: ISchema): Record<string, ISchema>
  usePathOptions(field: CollectionFieldOptionsV2): any
  schemaInitialize(schema: ISchema, data: any): void

  getOption<K extends keyof IField>(key: K): CollectionFieldInterfaceOptions[K]
  getOptions(): CollectionFieldInterfaceOptions;
  setOptions(options: CollectionFieldInterfaceOptions): void;
}
```

其需要结合 [CollectionManager](/core/collection/collection-manager#cmaddcollectionfieldinterfacesinterfaces) 使用。

```ts
class EmailFieldInterface extends CollectionFieldInterface {
  name = 'email';
  type = 'object';
  group = 'basic';
  order = 4;
  title = '{{t("Email")}}';
  sortable = true;
  // ...
}

class MyPlugin extends Plugin {
  load() {
    this.app.collectionManager.addFieldInterfaces([ EmailFieldInterface ]);
  }
}
```

## 实例属性

### name

唯一标识符。

### group

分组。

### title

标题。

### default

配置表单默认值字段 schema。

![](./images/collection-field-interface-form.png)


## 实例方法

### collectionFieldInterface.getOptions()

获取所有配置项。

```tsx | pure
import { useCollectionManagerV2 } from '@nocobase/client';

const Demo = () => {
  const collectionManager = useCollectionManagerV2();
  const options = useMemo(() => {
    const email = collectionManager.getFieldInterface('email');
    const options = email.getOptions();
  }, [collectionManager]);

  return <pre>{ JSON.stringify(options, null, 2) }</pre>
}
```

### collectionFieldInterface.setOptions(options)

设置配置项，会和原 options 深度合并。

- 类型

```tsx | pure
class CollectionFieldInterface {
  setOptions(options: CollectionFieldInterfaceOptions): void;
}
```

- 示例

```tsx | pure
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  load() {
    const collectionManager = this.app.collectionManager.getCollectionManager();
    const email = collectionManager.getFieldInterface('email');

    // deep merge
    email.setOptions({
      properties: {
        unique: {
          type: 'boolean',
          'x-content': '{{t("Unique")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
        }
      }
    });
  }
}
```

### collectionFieldInterface.getOption(key)

获取单个配置项。

```tsx | pure
import { useCollectionManagerV2, useCompile } from '@nocobase/client';

const Demo = () => {
  const collectionManager = useCollectionManagerV2();
  const compile = useCompile();
  const title = useMemo(() => {
    const email = collectionManager.getFieldInterface('email');
    const title = email.getOption('title');
  }, [collectionManager]);

  return <pre>{compile(title)}</pre>
}
```


### collectionFieldInterface.validateSchema(fieldSchema)


### collectionFieldInterface.usePathOptions(field: CollectionFieldOptionsV2)


### collectionFieldInterface.schemaInitialize(schema: ISchema, data: any)

