# CollectionField

NocoBase 将字段的 schema 分为 2 部分，一部分在 schema 中，一部分在 collection 中。例如：

```tsx | pure
const schema = {
  properties: {
    username: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
    },
  }
}

const collection = {
  fields: [
    {
      type: 'string',
      name: 'username',
      interface: 'input',
      uiSchema: {
        title: 'UserName',
        type: 'string',
        'x-component': 'Input',
        required: true,
        description: 'description1',
      } as ISchema,
    }
  ],
}
```

两者通过 `name: username` 联系起来，`CollectionField` 会自动读取 schema `name` 属性，并根据 `name` 属性查找 collection 中对应的 `uiSchema` 属性，然后拼接到 schema 中，进行渲染。

这样做的好处是，对于同一个字段创建的内容，可以在不同的地方共享同一个 schema，当 schema 变化时，只需要修改一处即可。比如通过上面的 `title:  "UserName"` 假设变化 `title: "Name"` 则所有使用到此字段的地方都会变化。

<code src="./demos/collection-field/demo1.tsx"></code>

## CollectionFieldOptions

字段的配置项。

```ts
interface CollectionFieldOptions {
  name?: any;
  collectionName?: string;
  sourceKey?: string;
  uiSchema?: ISchema;
  target?: string;

  [key: string]: any;
}
```

### 普通字段和关系字段

字段有 2 种情况，一种是普通字段，一种是 [关系字段](https://docs-cn.nocobase.com/development/server/collections/association-fields)。

关系字段是指，字段的值是另一个 collection 的数据，例如 `users` 和 `roles` 两个 collection，`users` 中有一个字段 `roles`，其值是 `roles` collection 的数据，那么 `roles` 就是一个关系字段。

普通字段的示例如下：

```json
{
  "key": "ootprgkoawo",
  "name": "email",
  "type": "string",
  "interface": "email",
  "description": null,
  "collectionName": "users",
  "parentKey": null,
  "reverseKey": null,
  "unique": true,
  "uiSchema": {
    "type": "string",
    "title": "{{t(\"Email\")}}",
    "x-component": "Input",
    "x-validator": "email",
    "required": true
  }
}
```

关系字段的示例如下：

```json
{
  "key": "t09bauwm0wb",
  "name": "roles",
  "type": "belongsToMany",
  "interface": "m2m",
  "description": null,
  "collectionName": "users",
  "parentKey": null,
  "reverseKey": null,
  "target": "roles",
  "foreignKey": "userId",
  "otherKey": "roleName",
  "onDelete": "CASCADE",
  "sourceKey": "id",
  "targetKey": "name",
  "through": "rolesUsers",
  "uiSchema": {
    "type": "array",
    "title": "{{t(\"Roles\")}}",
    "x-component": "AssociationField",
    "x-component-props": {
      "multiple": true,
      "fieldNames": {
        "label": "title",
        "value": "name"
      }
    }
  }
}
```

相对于普通字段，关系字段多了以下属性：

- xx
- xx

### 全部字段说明

- `name`：字段名称
- `collectionName`：数据表名称
- `sourceKey`：当字段为关系字段时，对应的关系字段名称。

TODO：补全

## Hooks

### useCollectionField()

用于获取字段信息。

```tsx | pure
const collection = {
  fields: [
    {
      type: 'string',
      name: 'username',
      interface: 'input',
      uiSchema: {
        title: 'UserName',
        type: 'string',
        'x-component': 'Input',
        required: true,
        description: 'description1',
      } as ISchema,
    }
  ],
}

const { uiSchema } = useCollectionField()
const required = uiSchema?.required
```

其通常在 [SchemaSettings](/core/ui-schema/schema-settings) 中使用，用来获取和修改字段的属性。

<code src="./demos/collection-field/demo2.tsx"></code>



