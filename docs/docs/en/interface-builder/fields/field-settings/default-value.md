# Default Value

## Introduction

A default value is the initial value of a field when a new record is created. You can:

- Set a default value when configuring a field in a collection.
- Configure default values in Form/Filter form blocks through **Field values**, using either constants or variables.

For more details, see [Field values](/interface-builder/blocks/block-settings/field-values).

## Where to Set Default Values

### Collection Fields


![20240411095933](https://static-docs.nocobase.com/20240411095933.png)


### Fields in an Add Form

Default values for fields in an Add Form are configured in the Form block’s **Field values**.

Path: Form block settings → **Form settings** → **Field values**.

:::info{title=Tip}
The legacy `Default value` entry in field settings has been moved to `Form block settings → Field values`. It remains only for backward compatibility.
:::

![Form block Field values (Default value)](https://static-docs.nocobase.com/placeholder.png)


### Adding in a Sub-form

Sub-data added via a sub-form field in either an Add or Edit form will have a default value.

Add new in a sub-form

![20251028163455](https://static-docs.nocobase.com/20251028163455.png)


When editing existing data, an empty field will not be populated with the default value. Only newly added data will be filled with the default value.

### Field Values for Association Fields

Association fields can also be preset through **Field values**, but the behavior differs by scenario:

- **Form block**: supports **Default value** and **Fixed value**, with optional conditions.
- **Filter form**: used as default filter values, and only supports **Default value**.
- **Update record** action: writes values when the action runs (equivalent to a fixed write).

For more details, see [Field values](/interface-builder/blocks/block-settings/field-values).

For One-to-One or One-to-Many relationships, read the notes below to make sure your business can accept the risk of association being taken over or changed.

![Association field - Field values example](https://static-docs.nocobase.com/placeholder.png)


## Default Value Variables

### What Variables are Available

- Current user;
- Current record; this only applies to existing records;
- Current form, ideally only lists the fields in the form;
- Current item, a concept within sub-forms (the data object for each row in the sub-form);
- Parent item, the parent object of the current item (e.g. the parent form record or upper-level association object);
- URL parameters
  For more information on variables, see [Variables](/interface-builder/variables)

### Field Default Value Variables

Divided into two categories: non-association fields and association fields.

#### Association Field Default Value Variables

- The variable object must be a collection record;
- It must be a collection in the inheritance chain, which can be the current collection or a parent/child collection;
- The "Table selected records" variable is only available for "Many-to-Many" and "One-to-Many/Many-to-One" association fields;
- **For multi-level scenarios, it needs to be flattened and deduplicated**

```typescript
// Table selected records:
[{id:1},{id:2},{id:3},{id:4}]

// Table selected records/to-one:
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Flatten and deduplicate
[{id: 2}, {id: 3}]

// Table selected records/to-many:
[{toMany: [{id: 1}, {id:2}]}, {toMany: [{id:3}, {id:4}]}]
// Flatten
[{id:1},{id:2},{id:3},{id:4}]
```

#### Non-association Default Value Variables

- Types must be consistent or compatible, e.g., strings are compatible with numbers, and all objects that provide a toString method;
- The JSON field is special and can store any type of data;

### Field Level (Optional Fields)


![20240411101157](https://static-docs.nocobase.com/20240411101157.png)


- Non-association default value variables
  - When selecting multi-level fields, it is limited to to-one relationships and does not support to-many relationships;
  - The JSON field is special and can be unrestricted;

- Association default value variables
  - hasOne, only supports to-one relationships;
  - hasMany, both to-one (internal conversion) and to-many are supported;
  - belongsToMany, both to-one (internal conversion) and to-many are supported;
  - belongsTo, generally for to-one, but when the parent relationship is hasMany, it also supports to-many (because hasMany/belongsTo is essentially a many-to-many relationship);

## Special Cases

### "Many-to-Many" is Equivalent to a "One-to-Many/Many-to-One" Combination

Model


![20240411101558](https://static-docs.nocobase.com/20240411101558.png)


### Why Should You Be Cautious When Configuring Field Values for One-to-One and One-to-Many?

The current version allows you to configure field values (default value or fixed value) for One-to-One / One-to-Many association fields via **Field values** in a Form block. However, these associations are usually **exclusive**: the same associated record can only belong to one record at a time.

When you configure field values for these fields, you may run into:

- **Association “takeover”**: if multiple new records point to the same associated record, the record saved later may take the association, causing earlier records to be unlinked or overwritten;
- **Hard-to-notice changes**: field values may change associations unintentionally, especially with concurrent edits or bulk creation;
- **Fixed value is riskier**: when conditions match, fixed values may overwrite the association chosen by users.

Recommendations:

- For association fields that require an explicit user choice, avoid configuring a fixed field value;
- If you must prefill, prefer variables (e.g., current user / parent item) over pointing to a single fixed record;
- After enabling it, double-check the association field before submitting.

### Sub-forms / Sub-tables: Notes on Field Values for Association Fields

Sub-forms and sub-tables also support field values through **Field values**. A default value is applied only when you add a new row/item—it won’t backfill existing data.

Notes:

- If you configure a “fixed field value” for an association field (e.g., always linking to the same customer/tag), each new row may inherit the same association, which can lead to duplicate or incorrect links;
- Since sub-forms/sub-tables contain multiple columns, it’s best to treat field values as the initial/fixed value of a field in a new row, not a global setting for the whole sub-table;
- With fixed values, users’ manual selections may also be overwritten.

Recommendations:

- Use it only when you truly want every new row to start with the same default/fixed association;
- More commonly, use variables (e.g., parent item) to derive context-aware values, or let users choose when adding a row.
