# Default Value

## Introduction

A default value is the initial value of a field when a new record is created. You can set a default value for a field when configuring it in a collection, or specify a default value for a field in an Add Form block. It can be set as a constant or a variable.

## Where to Set Default Values

### Collection Fields


![20240411095933](https://static-docs.nocobase.com/20240411095933.png)


### Fields in an Add Form

Most fields in an Add Form support setting a default value.


![20251028161801](https://static-docs.nocobase.com/20251028161801.png)


### Adding in a Sub-form

Sub-data added via a sub-form field in either an Add or Edit form will have a default value.

Add new in a sub-form

![20251028163455](https://static-docs.nocobase.com/20251028163455.png)


When editing existing data, an empty field will not be populated with the default value. Only newly added data will be filled with the default value.

### Default Values for Association Fields

Only **Many-to-One** and **Many-to-Many** type relationships have default values when using selector components (Select, RecordPicker).


![20251028164128](https://static-docs.nocobase.com/20251028164128.png)


## Default Value Variables

### What Variables are Available

- Current user;
- Current record; this only applies to existing records;
- Current form, ideally only lists the fields in the form;
- Current item, a concept within sub-forms (the data object for each row in the sub-form);
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
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
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


### Why Don't One-to-One and One-to-Many Have Default Values?

For example, in an A.B relationship, if b1 is associated with a1, it cannot be associated with a2. If b1 becomes associated with a2, its association with a1 will be removed. In this case, the data is not shared, whereas the default value is a shared mechanism (all can be associated). Therefore, One-to-One and One-to-Many relationships cannot have default values.

### Why Can't Many-to-One and Many-to-Many Sub-forms or Sub-tables Have Default Values?

Because the focus of sub-forms and sub-tables is to directly edit the association data (including adding and removing), while the association default value is a shared mechanism where all can be associated, but the association data cannot be modified. Therefore, it is not suitable to provide default values in this scenario.

Additionally, sub-forms or sub-tables have sub-fields, and it would be unclear whether the default value for a sub-form or sub-table is a row default or a column default.

Considering all factors, it is more appropriate that sub-forms or sub-tables cannot have default values set directly, regardless of the relationship type.
