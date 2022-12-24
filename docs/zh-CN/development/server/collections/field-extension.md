# 字段扩展

在 NocoBase 中 Collection Field 的构成包括：

<img src="./collection-field.svg" />

## Field Type 扩展

例如扩展密码类型字段 `type: 'password'`

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

- [更多内置 field types 的实现点此查看](https://github.com/nocobase/nocobase/tree/main/packages/core/database/src/fields)
- 也可以查看完整的 samples 插件 [packages/samples/shop-modeling](https://github.com/nocobase/nocobase/tree/main/packages/samples/shop-modeling) 

## Field Component 扩展

相关扩展文档查看：

- [扩展 Schema 组件](/development/client/ui-schema-designer/extending-schema-components)
- [Schema 组件库](/development/client/ui-schema-designer/component-library)

## Field Interface 扩展

- [内置 field interfaces 点此查看](https://github.com/nocobase/nocobase/tree/main/packages/core/client/src/collection-manager/interfaces)