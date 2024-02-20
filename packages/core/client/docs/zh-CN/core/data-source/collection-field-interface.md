# CollectionFieldInterface

用于创建数据字段。

![](./images/collection-field-interface.png)

```ts
class CollectionFieldInterface {
  app: Application;
  collectionManager: CollectionManager;

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
  usePathOptions(field: CollectionFieldOptions): any
  schemaInitialize(schema: ISchema, data: any): void

  getOption<K extends keyof IField>(key: K): CollectionFieldInterfaceOptions[K]
  getOptions(): CollectionFieldInterfaceOptions;
  setOptions(options: CollectionFieldInterfaceOptions): void;
}
```

其需要结合 [CollectionManager](./collection-field-interface-manager.md) 使用。

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
    this.app.dataSourceManager.addFieldInterfaces([ EmailFieldInterface ]);
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

### collectionFieldInterface.validateSchema(fieldSchema)


### collectionFieldInterface.usePathOptions(field: CollectionFieldOptions)


### collectionFieldInterface.schemaInitialize(schema: ISchema, data: any)

