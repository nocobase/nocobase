# CollectionField

NocoBase divides the schema of a field into two parts: one in the schema and the other in the collection. For example:

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

The two are connected through `name: username`. The `CollectionField` automatically reads the `name` property from the schema and looks for the corresponding `uiSchema` property in the collection. It then concatenates it to the schema for rendering.

The benefit of doing this is that for content created with the same field, the same schema can be shared in different places. When the schema changes, only one modification is needed. For example, if we change `title: "UserName"` to `title: "Name"`, it will be reflected in all places where this field is used.

<code src="./demos/collection-field/demo1.tsx"></code>

## CollectionFieldOptions

Configuration options for the field.

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

### Regular Fields and Relationship Fields

There are two types of fields: regular fields and [relationship fields](https://docs-cn.nocobase.com/development/server/collections/association-fields).

A relationship field refers to a field whose value is data from another collection. For example, if there are two collections, `users` and `roles`, and the `users` collection has a field called `roles` whose value is data from the `roles` collection, then `roles` is a relationship field.

Here is an example of a regular field:

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

Here is an example of a relationship field:

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

Compared to regular fields, relationship fields have the following additional properties:

- xx
- xx

### Field Descriptions

- `name`: Field name
- `collectionName`: Table name
- `sourceKey`: When the field is a relationship field, it corresponds to the relationship field name.

TODO

## Hooks

### useCollectionField()

Used to retrieve field information.

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

It is usually used in [SchemaSettings](/core/ui-schema/schema-settings) to retrieve and modify field properties.

<code src="./demos/collection-field/demo2.tsx"></code>



