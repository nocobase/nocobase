# Collection Fields To Initializer Items

## 介绍

![20240718145531](https://static-docs.nocobase.com/20240718145531.png)

页面上有 `Configure columns` 和 `Configure fields` 两个按钮，鼠标悬浮后显示当前表的字段列表，当点击某个字段后，会插入表格列或者表单项到界面中，这个过程就是从 `Collection Fields` 到 `Initializer Items` 的过程。

## Configure fields 分类

`Configure fields` 分为三类：

- `self collection fields`：当前表的字段
- `parent collection fields`：父表的字段
- `associated collection fields`：关联表的字段

![20240718151313](https://static-docs.nocobase.com/20240718151313.png)

![20240718151040](https://static-docs.nocobase.com/20240718151040.png)

## CollectionFieldsToInitializerItems

我们将单个 `Collection Field` 转为 `Initializer Item` 的过程抽象为以下三个步骤：

- `filter`：过滤字段
- `getSchema`：获取字段对应的 schema
- `getInitializerItem`：获取字段对应的 initializer item

> 关于 Schema 请查看 [UI Schema](https://docs.nocobase.com/development/client/ui-schema/what-is-ui-schema)。 <br />
> 关于 Initializer item，可以参考 [SchemaInitializer](/core/ui-schema/schema-initializer)。<br />
> 两者的关系是 Initializer item 通过类似 `onClick` 的事件触发，将 Schema 插入到 Schema 树中，并渲染到界面上。

`CollectionFieldsToInitializerItems` 是一个组件，用于将 `Collection Fields` 转换为 `Initializer Items`。


```ts
const someInitializer = new SchemaInitializer({
  // ...
  items: [
    {
      name: 'collectionFields',
      Component: CollectionFieldsToInitializerItems,
    },
    // ...
  ]
})
```

### Types

```ts
interface CollectionFieldContext {
  fieldSchema: ISchema;
  collection?: InheritanceCollectionMixin & Collection;
  dataSource: DataSource;
  form: Form<any>;
  actionContext: ReturnType<typeof useActionContext>;
  t: TFunction<"translation", undefined>;
  collectionManager: CollectionManager;
  dataSourceManager: DataSourceManager;
  compile: (source: any, ext?: any) => any
  targetCollection?: Collection;
}

interface CommonCollectionFieldsProps {
  block: string;
  isReadPretty?: (context: CollectionFieldContext) => boolean;
  filter?: (collectionField: CollectionFieldOptions, context: CollectionFieldContext) => boolean;
  getSchema: (collectionField: CollectionFieldOptions, context: CollectionFieldContext) => CollectionFieldGetSchemaResult;
  getInitializerItem?: (collectionField: CollectionFieldOptions, context: CollectionFieldContext) => CollectionFieldGetInitializerItemResult;
}

interface SelfCollectionFieldsProps extends CommonCollectionFieldsProps {}
interface ParentCollectionFieldsProps extends CommonCollectionFieldsProps {}
interface AssociationCollectionFieldsProps extends Omit<CommonCollectionFieldsProps, 'filter'> {
  filterSelfField?: CommonCollectionFieldsProps['filter'];
  filterAssociationField?: CommonCollectionFieldsProps['filter'];
}

interface CollectionFieldsProps {
  /**
   * Block name.
   */
  block: string;
  selfField: Omit<SelfCollectionFieldsProps, 'block' | 'context'>;
  parentField?: Omit<ParentCollectionFieldsProps, 'block' | 'context'>;
  associationField?: Omit<AssociationCollectionFieldsProps, 'block' | 'context'>;
}
```

#### CollectionFieldsProps

- `block`：区块名称
- `selfField`：当前表字段配置
- `parentField`：父表字段配置
- `associationField`：关联表字段配置

#### CommonCollectionFieldsProps

- `block`：区块名称
- `isReadPretty`：是否为只读模式
- `filter`：过滤字段
- `getSchema`：获取字段对应的 schema
- `getInitializerItem`：获取字段对应的 initializer item

##### 公共 Schema

其中 `getSchema` 内部包含了公共的部分，所以并不要求返回整个 Schema，只需要返回差异部分即可。公共部分如下：

```ts
const defaultSchema: CollectionFieldDefaultSchema = {
  type: 'string',
  title: collectionField?.uiSchema?.title || collectionField.name,
  name: collectionField.name,
  'x-component': 'CollectionField',
  'x-collection-field': `${collection.name}.${collectionField.name}`,
  'x-read-pretty': collectionField?.uiSchema?.['x-read-pretty'],
};
```

其中 [CollectionField](/core/data-source/collection-field) 用于动态渲染字段。

##### 公共 Initializer Item

同样 `getInitializerItem` 内部包含了公共的部分，所以并不要求返回整个 Initializer Item，只需要返回 `CollectionFieldInitializer`（文档 TODO）组件对应的 `find` 和 `remove`。

#### AssociationCollectionFieldsProps

- `filterSelfField`：过滤当前表字段
- `filterAssociationField`：过滤关联表字段

其他属性同 `CommonCollectionFieldsProps`。

#### CollectionFieldContext

- [fieldSchema](/core/ui-schema/designable#usefieldschema)：当前 schema
- [collection](/core/data-source/collection)：当前表
- [dataSource](/core/data-source/data-source-provider#usedatasource)：数据源
- `form`：表单
- [actionContext](/components/action#actioncontext)：操作上下文
- `t`：国际化
- [collectionManager](/core/data-source/collection-manager-provider#usecollectionmanager)：表管理器
- [dataSourceManager](/core/data-source/data-source-manager-provider#usedatasourcemanager)：数据源管理器
- `compile`：编译函数
- `targetCollection`：如果是关联表字段，表示关联表

### Example

我们以 `Collection Field` 转为 `FormItem` 为例：

#### 定义

```tsx | pure

export const CollectionFieldsToFormInitializerItems: FC<{ block?: string }> = (props) => {
  const block = props?.block || 'Form';
  const fieldItemSchema = {
    'x-toolbar': 'FormItemSchemaToolbar',
    'x-settings': 'fieldSettings:FormItem',
    'x-decorator': 'FormItem',
  };

  const initializerItem = {
    remove: removeGridFormItem,
  }
  return <CollectionFieldsToInitializerItems
    block={block}
    selfField={{
      filter: (field) => !field.treeChildren,
      getSchema: (field, { targetCollection }) => {
        const isFileCollection = targetCollection?.template === 'file';
        const isAssociationField = targetCollection;
        const fieldNames = field?.uiSchema?.['x-component-props']?.['fieldNames'];

        return {
          ...fieldItemSchema,
          'x-component-props': isFileCollection
            ? { fieldNames: { label: 'preview', value: 'id' } }
            : isAssociationField && fieldNames? { fieldNames: { ...fieldNames, label: targetCollection?.titleField || fieldNames.label }}
            : {},
        }
      },
      getInitializerItem: () => {
        return {
          ...initializerItem,
          find: props?.block === 'Kanban' ? findKanbanFormItem : undefined
        }
      }
    }}
    parentField={{
      getSchema: () => fieldItemSchema,
      getInitializerItem: () => initializerItem,
    }}
    associationField={{
      filterSelfField: (field) => {
        if (block !== 'Form') return true;
        return field?.interface === 'm2o'
      },
      filterAssociationField(collectionField) {
        return collectionField?.interface && !['subTable'].includes(collectionField?.interface) && !collectionField.treeChildren
      },
      getSchema: () => fieldItemSchema,
      getInitializerItem: () => initializerItem,
    }}
  />
```

##### selfField

- `filter`：过滤字段

`filter: (field) => !field.treeChildren` 表示过滤掉树形结构的字段。

因为 ?

- `getSchema`：获取字段对应的 schema

参考 [FormItem](/components/form-item) 以及 [Field](/components/checkbox) 文档，希望最终获得的 Schema 如下：

```json
{
  "type": "string",
  "name": "nickname",
  "x-toolbar": "FormItemSchemaToolbar",
  "x-settings": "fieldSettings:FormItem",
  "x-component": "CollectionField",
  "x-decorator": "FormItem",
  "x-collection-field": "users.nickname",
  "x-component-props": {
    // ...
  },
}
```

其中 [公共部分](/core/data-source/collection-fields-initializer-items#commoncollectionfieldsprops) 如下：

```json
{
  "type": "string",
  "name": "nickname",
  "x-component": "CollectionField",
  "x-collection-field": "users.nickname",
  "x-read-pretty": true
}
```

所以我们只需要返回：

```json
{
  "x-toolbar": "FormItemSchemaToolbar",
  "x-settings": "fieldSettings:FormItem",
  "x-decorator": "FormItem",
  "x-component-props": {
    // ...
  },
}
```

- `getInitializerItem`：获取字段对应的 initializer item

因为其对应的 [SchemaInitializer](/core/ui-schema/schema-initializer) 有 wrap 属性，将每个字段包裹在 `Grid` 中，方便布局和拖拽。我们在删除时则不仅需要删除自身的 Schema 还需要删除对应的 `Grid`。所以我们返回：

```ts
{
  "remove": removeGridFormItem
}
```

##### parentField

略。

##### associationField

- `filterSelfField`：过滤当前表字段

表单这里仅需要展示多对一的关联字段，所以我们过滤掉非多对一关联字段。？

- `filterAssociationField`：过滤关联表字段

同样过滤掉树形结构的字段。


#### 使用

```diff
const formItemInitializers = new CompatibleSchemaInitializer({
  name: 'form:configureFields',
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
+   {
+     name: 'collectionFields',
+     Component: CollectionFieldsToFormInitializerItems,
+   },
    // ...
  ]
})
```

## CollectionFieldsToFormInitializerItems

`CollectionFieldsToFormInitializerItems` 是 `CollectionFieldsToInitializerItems` 的一个封装，用于表单场景。

目前使用在了 `Form`、`List`、`Kanban`、`Grid Card` 和 `Details` 区块中。

```ts
const someInitializer = new SchemaInitializer({
  // ...
  items: [
    {
      name: 'collectionFields',
      Component: CollectionFieldsToFormInitializerItems,
    },
    // ...
  ]
})
```

## CollectionFieldsToTableInitializerItems

`CollectionFieldsToTableInitializerItems` 是 `CollectionFieldsToInitializerItems` 的一个封装，用于表格场景。

目前使用在了 `Table` 和 `Gantt` 区块中。

```ts
const someInitializer = new SchemaInitializer({
  // ...
  items: [
    {
      name: 'collectionFields',
      Component: CollectionFieldsToTableInitializerItems,
    },
    // ...
  ]
})
```
