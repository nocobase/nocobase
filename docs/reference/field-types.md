---
toc: menu
---

# Field Types

## Field <Badge>abstract</Badge>
## RelationField <Badge>abstract</Badge>
## HasOneField

```ts
interface HasOneFieldOptions {

  type: 'hasOne';

  /**
   * The name of the field to use as the key for the association in the source table. Defaults to the primary
   * key of the source table
   */
  sourceKey?: string;

  /**
   * A string or a data type to represent the identifier in the table
   */
  keyType?: DataType;

  /**
   * The alias of this model, in singular form. See also the `name` option passed to `sequelize.define`. If
   * you create multiple associations between the same tables, you should provide an alias to be able to
   * distinguish between them. If you provide an alias when creating the assocition, you should provide the
   * same alias when eager loading and when getting associated models. Defaults to the singularized name of
   * target
   */
  as?: string | { singular: string; plural: string };

  /**
   * The name of the foreign key in the target table or an object representing the type definition for the
   * foreign column (see `Sequelize.define` for syntax). When using an object, you can add a `name` property
   * to set the name of the column. Defaults to the name of source + primary key of source
   */
  foreignKey?: string | ForeignKeyOptions;

  /**
   * What happens when delete occurs.
   *
   * Cascade if this is a n:m, and set null if it is a 1:m
   *
   * @default 'SET NULL' or 'CASCADE'
   */
  onDelete?: string;

  /**
   * What happens when update occurs
   *
   * @default 'CASCADE'
   */
  onUpdate?: string;

  /**
   * Should on update and on delete constraints be enabled on the foreign key.
   */
  constraints?: boolean;
  foreignKeyConstraint?: boolean;

  scope?: AssociationScope;

  /**
   * If `false` the applicable hooks will not be called.
   * The default value depends on the context.
   */
  hooks?: boolean;
}
```

## HasManyField

```ts
interface HasManyFieldOptions {

  type: 'hasMany';

  /**
   * The name of the field to use as the key for the association in the source table. Defaults to the primary
   * key of the source table
   */
  sourceKey?: string;

  /**
   * A string or a data type to represent the identifier in the table
   */
  keyType?: DataType;

  /**
   * The alias of this model, in singular form. See also the `name` option passed to `sequelize.define`. If
   * you create multiple associations between the same tables, you should provide an alias to be able to
   * distinguish between them. If you provide an alias when creating the assocition, you should provide the
   * same alias when eager loading and when getting associated models. Defaults to the singularized name of
   * target
   */
  as?: string | { singular: string; plural: string };

  /**
   * The name of the foreign key in the target table or an object representing the type definition for the
   * foreign column (see `Sequelize.define` for syntax). When using an object, you can add a `name` property
   * to set the name of the column. Defaults to the name of source + primary key of source
   */
  foreignKey?: string | ForeignKeyOptions;

  /**
   * What happens when delete occurs.
   *
   * Cascade if this is a n:m, and set null if it is a 1:m
   *
   * @default 'SET NULL' or 'CASCADE'
   */
  onDelete?: string;

  /**
   * What happens when update occurs
   *
   * @default 'CASCADE'
   */
  onUpdate?: string;

  /**
   * Should on update and on delete constraints be enabled on the foreign key.
   */
  constraints?: boolean;
  foreignKeyConstraint?: boolean;

  scope?: AssociationScope;

  /**
   * If `false` the applicable hooks will not be called.
   * The default value depends on the context.
   */
  hooks?: boolean;
}
```

## BelongsToField

```ts
interface BelongsToFieldOptions {

  type: 'belongsTo';

  /**
   * The name of the field to use as the key for the association in the target table. Defaults to the primary
   * key of the target table
   */
  targetKey?: string;

  /**
   * A string or a data type to represent the identifier in the table
   */
  keyType?: DataType;

  /**
   * The alias of this model, in singular form. See also the `name` option passed to `sequelize.define`. If
   * you create multiple associations between the same tables, you should provide an alias to be able to
   * distinguish between them. If you provide an alias when creating the assocition, you should provide the
   * same alias when eager loading and when getting associated models. Defaults to the singularized name of
   * target
   */
  as?: string | { singular: string; plural: string };

  /**
   * The name of the foreign key in the target table or an object representing the type definition for the
   * foreign column (see `Sequelize.define` for syntax). When using an object, you can add a `name` property
   * to set the name of the column. Defaults to the name of source + primary key of source
   */
  foreignKey?: string | ForeignKeyOptions;

  /**
   * What happens when delete occurs.
   *
   * Cascade if this is a n:m, and set null if it is a 1:m
   *
   * @default 'SET NULL' or 'CASCADE'
   */
  onDelete?: string;

  /**
   * What happens when update occurs
   *
   * @default 'CASCADE'
   */
  onUpdate?: string;

  /**
   * Should on update and on delete constraints be enabled on the foreign key.
   */
  constraints?: boolean;
  foreignKeyConstraint?: boolean;

  scope?: AssociationScope;

  /**
   * If `false` the applicable hooks will not be called.
   * The default value depends on the context.
   */
  hooks?: boolean;
}
```

## BelongsToManyField

```ts
interface BelongsToManyFieldOptions {

  type: 'belongsToMany';

  /**
   * The name of the table that is used to join source and target in n:m associations. Can also be a
   * sequelize model if you want to define the junction table yourself and add extra attributes to it.
   */
  through: ModelType | string | ThroughOptions;

  /**
   * The name of the foreign key in the join table (representing the target model) or an object representing
   * the type definition for the other column (see `Sequelize.define` for syntax). When using an object, you
   * can add a `name` property to set the name of the colum. Defaults to the name of target + primary key of
   * target
   */
  otherKey?: string | ForeignKeyOptions;

  /**
   * The name of the field to use as the key for the association in the source table. Defaults to the primary
   * key of the source table
   */
  sourceKey?: string;

  /**
   * The name of the field to use as the key for the association in the target table. Defaults to the primary
   * key of the target table
   */
  targetKey?: string;

  /**
   * Should the join model have timestamps
   */
  timestamps?: boolean;

  /**
   * The unique key name to override the autogenerated one when primary key is not present on through model
   */
  uniqueKey?: string;

  /**
   * A key/value set that will be used for association create and find defaults on the target.
   * (sqlite not supported for N:M)
   */
  scope?: AssociationScope;

  /**
   * The alias of this model, in singular form. See also the `name` option passed to `sequelize.define`. If
   * you create multiple associations between the same tables, you should provide an alias to be able to
   * distinguish between them. If you provide an alias when creating the assocition, you should provide the
   * same alias when eager loading and when getting associated models. Defaults to the singularized name of
   * target
   */
  as?: string | { singular: string; plural: string };

  /**
   * The name of the foreign key in the target table or an object representing the type definition for the
   * foreign column (see `Sequelize.define` for syntax). When using an object, you can add a `name` property
   * to set the name of the column. Defaults to the name of source + primary key of source
   */
  foreignKey?: string | ForeignKeyOptions;

  /**
   * What happens when delete occurs.
   *
   * Cascade if this is a n:m, and set null if it is a 1:m
   *
   * @default 'SET NULL' or 'CASCADE'
   */
  onDelete?: string;

  /**
   * What happens when update occurs
   *
   * @default 'CASCADE'
   */
  onUpdate?: string;

  /**
   * Should on update and on delete constraints be enabled on the foreign key.
   */
  constraints?: boolean;
  foreignKeyConstraint?: boolean;

  /**
   * If `false` the applicable hooks will not be called.
   * The default value depends on the context.
   */
  hooks?: boolean;
}
```

## BooleanField

```ts
interface BooleanFieldOptions {
  type: 'boolean';
}
```

## StringField

```ts
interface StringFieldOptions {
  type: 'string';
  length?: number;
  binary?: boolean;
}
```

## TextField

```ts
type TextLength = 'tiny' | 'medium' | 'long';

interface TextFieldOptions {
  type: 'text';
  length?: TextLength;
}
```

## IntegerField

```ts
interface IntegerFieldOptions {
  type: 'integer';
  length?: number;
  zerofill?: boolean;
  unsigned?: boolean;
}
```

## FloatField

```ts
interface FloatFieldOptions {
  type: 'float';
  length?: number;
  decimals?: number;
}
```

## DoubleField

```ts
interface DoubleFieldOptions {
  type: 'double';
  length?: number;
  decimals?: number;
}
```

## RealField

```ts
interface RealFieldOptions {
  type: 'real';
  length?: number;
  decimals?: number;
}
```

## DecimalField

```ts
interface DecimalFieldOptions {
  type: 'decimal';
  precision?: number;
  scale?: number;
}
```

## DateField

```ts
interface DateFieldOptions {
  type: 'date';
}
```

## TimeField

```ts
interface TimeFieldOptions {
  type: 'time';
}
```

## JsonField

```ts
interface JsonFieldOptions {
  type: 'json';
}
```

## JsonbField

```ts
interface JsonbFieldOptions {
  type: 'jsonb';
}
```

## VirtualField

```ts
interface VirtualFieldOptions {
  type: 'virtual';
}
```

## SortField

```ts
interface SortFieldOptions {
  type: 'sort';
}
```

## PasswordField

```ts
interface PasswordFieldOptions {
  type: 'password';
}
```

## RadioField

```ts
interface RadioFieldOptions {
  type: 'radio';
}
```

## UIDField

```ts
interface UIDFieldOptions {
  type: 'uid';
}
```

## UUIDField

```ts
interface UUIDFieldOptions {
  type: 'uuid';
}
```

## CreatedByField

```ts
interface CreatedByFieldOptions {
  type: 'createdBy';
}
```

## UpdatedByField

```ts
interface UpdatedByFieldOptions {
  type: 'updatedBy';
}
```
