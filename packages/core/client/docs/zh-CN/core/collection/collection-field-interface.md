# CollectionFieldInterface

用于创建数据字段。

![](./images/collection-field-interface.png)

```ts
class CollectionFieldInterfaceV2 {
  constructor(options: CollectionFieldInterfaceOptions): {}
  name: SchemaKey;

  getOption<K extends keyof IField>(key: K): CollectionFieldInterfaceOptions[K]
  getOptions(): CollectionFieldInterfaceOptions
}
```

其需要结合 [CollectionManager](/core/collection/collection-manager#cmaddcollectionfieldinterfacesinterfaces) 使用。

```ts
const email = new CollectionFieldInterfaceV2({
  name: 'email',
  type: 'object',
  group: 'basic',
  order: 4,
  title: '{{t("Email")}}',
  sortable: true,
  default: {
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
      'x-validator': 'email',
    },
  },
});

class MyPlugin extends Plugin {
  load() {
    this.app.addCollectionFieldInterfaces([ email ]);
  }
}
```

## CollectionFieldInterfaceOptions

```ts
import { ISchema } from '@formily/react';

interface CollectionFieldInterfaceOptions extends ISchema {
  default?: {
    type: string;
    uiSchema?: ISchema;
    [key: string]: any;
  };
  operators?: any[];
  filterable?: {
    operators?: any[];
    children?: any[];
    [key: string]: any;
  };
  titleUsable?: boolean;
  [key: string]: any;
}
```

- `default`：配置表单默认值字段 schema

![](./images/collection-field-interface-form.png)


TODO：类型不完整且含义不清楚，需要补充。

## 实例属性

### name

唯一标识符。

## 实例方法

### collectionFieldInterface.getOptions()

获取所有配置项。

```tsx | pure
import { useCollectionManagerV2 } from '@nocobase/client';

const Demo = () => {
  const collectionManager = useCollectionManagerV2();
  const options = useMemo(() => {
    const email = collectionManager.getCollectionFieldInterface('email');
    const options = email.getOptions();
  }, [collectionManager]);

  return <pre>{ JSON.stringify(options, null, 2) }</pre>
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
    const email = collectionManager.getCollectionFieldInterface('email');
    const title = email.getOption('title');
  }, [collectionManager]);

  return <pre>{compile(title)}</pre>
}
```
