---
title: "RelationRepository"
description: "Repository tipe relasi NocoBase: dapat mengoperasikan data asosiasi tanpa memuat asosiasi, implementasi BelongsTo/HasMany/BelongsToMany, dll."
keywords: "RelationRepository,BelongsTo,HasMany,BelongsToMany,Repository asosiasi,NocoBase"
---

# RelationRepository

`RelationRepository` adalah objek `Repository` tipe relasi, `RelationRepository` dapat mengoperasikan data asosiasi tanpa memuat asosiasi. Berdasarkan `RelationRepository`, setiap tipe asosiasi memiliki implementasi yang sesuai, yaitu

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Constructor

**Signature**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------------------ | ------------------ | ------ | --------------------------------------------------------- |
| `sourceCollection` | `Collection` | - | Collection yang sesuai dengan referencing relation dalam asosiasi |
| `association` | `string` | - | Nama asosiasi |
| `sourceKeyValue` | `string \| number` | - | Nilai key yang sesuai dengan referencing relation |

## Properti Class Dasar

### `db: Database`

Objek database

### `sourceCollection`

Collection yang sesuai dengan referencing relation dalam asosiasi

### `targetCollection`

Collection yang sesuai dengan referenced relation dalam asosiasi

### `association`

Objek association di sequelize yang sesuai dengan asosiasi saat ini

### `associationField`

Field di collection yang sesuai dengan asosiasi saat ini

### `sourceKeyValue`

Nilai key yang sesuai dengan referencing relation
