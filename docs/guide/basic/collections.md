---
order: 1
group:
  title: Basic Concepts
  path: /guide/basic
  order: 4
---

# Collections & Fields

The data table of NocoBase consists of fields (columns) and records (rows). The concept of a data table is similar to the concept of a relational database data table, but the concept of fields is not the same.

## Fields

In NocoBase, the most common fields have component forms, such as: single-line text, multi-line text, and single-select boxes. These components have values, which can be filled in by the user, and are called valued components. The structure is as follows:

```ts
{
  interface: 'textarea',
  type: 'text',
  name: 'description',
  uiSchema: {
    type: 'string',
    title: 'Description',
    'x-component': 'Input.TextArea',
    'x-decorator': 'FormItem',
  },
}
```

The above is a description of the field configuration.

- type indicates the field's storage type, which is text long text type
- uiSchema is the component parameter of the field
- uiSchema.type is the value type of the field's component
- uiSchema.x-component indicates the component type, which is a multi-line input box
- The fields bound to the component are set with an interface that indicates the type of the current field, the example describes the field as a multi-line text type

In addition to the common fields bound to components, there are also fields that do not need to be bound to components, such as token fields, which are not displayed on the interface. The structure of a field without a component is as follows.

```ts
{
  type: 'string',
  name: 'token',
}
```

**Why do fields distinguish between storage types and component types? **

1. Store types and component types are many-to-many relationships and do not lend themselves to merging.
The value of the same component may not be of the same type (storage type), e.g., the value of select may be string or integer, and the same storage type may be presented as different components, e.g., the component to which string is bound may be Input or Select.

2. A limited number of storage types and component types can be combined to create an infinite number of field types.
Single line text, email, URL, cell phone number are all the same storage type and component type, but the validation parameters are not the same, so you can create countless fields by simply adjusting the validate parameter.

## Field Types

| 名称     | Interface | Type   | Component      | 备注              |
| :------- | :-------- | :----- | :------------- | :---------------- |
| 单行文本 | string    | string | Input          |                   |
| 多行文本 | textarea  | text   | Input.TextArea |                   |
| Email     | email     | string | Input          | validate: 'email' |
| Phone   | phone     | string | Input          | validate: 'phone' |

## What can be done?

### Fast Modeling

Unlike professional modeling tools, NocoBase provides a more user-friendly approach to data table configuration.

- It can be written directly in code via app.collection(), mostly used to configure the underlying system tables.
- You can also configure data tables through the data table configuration portal of the no-code platform, which is mostly used to configure business tables.

### Create data blocks

The configured data table can be used to create corresponding blocks of data, e.g. to display the contents of a particular data table in a table format. The table allows you to select which fields are displayed as table columns.

More about blocks can be found in the Client-side Components chapter.

### HTTP API

Cross-platform operation of data tables (add, delete, configure, etc.) is also possible via HTTP API, see the REST API chapter for more details.
