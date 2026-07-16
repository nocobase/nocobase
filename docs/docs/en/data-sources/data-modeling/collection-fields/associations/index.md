---
title: "Relation fields"
description: "Relation fields create connections between collections. They support one-to-one, one-to-many, many-to-one, many-to-many, and many-to-many array relations."
keywords: "relation field,BelongsTo,HasMany,O2O,O2M,M2O,M2M,association field,NocoBase"
---

# Relation fields

In NocoBase, **relation fields** create connections between different collections. They let one record refer to records in another collection, such as an order related to a customer, a task related to an owner, or a student related to courses.

Relation fields differ from ordinary fields. Ordinary fields usually correspond to actual database columns and store values such as text, numbers, and dates. Relation fields store collection-connection configuration and the keys used to locate related records. In the main database, creating a relation field can create the necessary relation configuration. In external databases, relations are usually based on existing primary keys, foreign keys, or unique fields and do not automatically modify the external database schema.

## Choose a relation type

Common relation types are as follows:

| Relation type | Use cases |
| --- | --- |
| [One-to-one](./o2o/index.md) | One record is related to only one record in another collection, such as an employee related to one onboarding profile. |
| [One-to-many](./o2m/index.md) | One record is related to multiple records in another collection, such as a customer related to multiple orders. |
| [Many-to-one](./m2o/index.md) | Multiple records are related to the same target record, such as multiple orders related to the same customer. |
| [Many-to-many](./m2m/index.md) | Multiple records in both collections can be related to each other, such as students and courses. |
| [Many-to-many (array)](../../../field-m2m-array/index.md) | Stores multiple target-record identifiers in an array field. Suitable when an existing schema already stores relation values in an array. |

Use business semantics as the default decision rule: use many-to-one when the current record belongs to only one target record; use one-to-many when the current record needs to show multiple records in the target collection; use many-to-many when both sides can relate to multiple records.

## Configuration points

When configuring a relation field, confirm the following:

- Target collection: the collection to relate to
- Relation type: one-to-one, one-to-many, many-to-one, many-to-many, or many-to-many array
- Relation keys: the fields that locate records on both sides, usually primary keys, foreign keys, or unique fields
- Title field: the field displayed by default for related records in selectors and blocks

:::warning Note

Relation fields in external databases are primarily relation metadata stored by NocoBase. Adding a relation field does not automatically create actual foreign keys, indexes, or join tables in the external database. If you need database-level foreign-key constraints, create them in the database first, then synchronize and configure fields in NocoBase.

:::

## Related links

- [One-to-one](./o2o/index.md) - Configure a one-to-one relation field.
- [One-to-many](./o2m/index.md) - Configure a one-to-many relation field.
- [Many-to-one](./m2o/index.md) - Configure a many-to-one relation field.
- [Many-to-many](./m2m/index.md) - Configure a many-to-many relation field.
- [Many-to-many (array)](../../../field-m2m-array/index.md) - Configure an array-based many-to-many relation.
