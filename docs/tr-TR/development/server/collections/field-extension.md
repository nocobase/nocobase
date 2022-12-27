# How to extend fields

The composition of a Collection Field in NocoBase consists of

<img src="./collection-field.svg" />

## Extend Field Type

For example, to extend the password type field ``type: 'password'`

```ts
export class MyPlugin extends Plugin {
  beforeLoad() {
    this.db.registerFieldTypes({
      password: PasswordField
    });
  }
}

export class PasswordField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }
}
```

- [More implementations of the built-in field types can be found here](https://github.com/nocobase/nocobase/tree/main/packages/core/database/src/fields)
- Also see the full samples plugin [packages/samples/shop-modeling](https://github.com/nocobase/nocobase/tree/main/packages/samples/shop-modeling) 

## Extend Field Component

Related extension documentation can be found at

- [Extending Schema Components](/development/client/ui-schema-designer/extending-schema-components)
- [Schema component library](/development/client/ui-schema-designer/component-library)

## Extend Field Interface

- [Built-in field interfaces view here](https://github.com/nocobase/nocobase/tree/main/packages/core/client/src/collection-manager/interfaces)
