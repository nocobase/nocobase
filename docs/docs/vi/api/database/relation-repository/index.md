---
title: "RelationRepository"
description: "Repository quan hệ của NocoBase: thao tác dữ liệu quan hệ mà không cần load quan hệ, các triển khai BelongsTo/HasMany/BelongsToMany."
keywords: "RelationRepository,BelongsTo,HasMany,BelongsToMany,Repository quan hệ,NocoBase"
---

# RelationRepository

`RelationRepository` là đối tượng `Repository` kiểu quan hệ. `RelationRepository` có thể thực hiện thao tác dữ liệu quan hệ mà không cần load quan hệ. Dựa trên `RelationRepository`, mỗi loại quan hệ có triển khai tương ứng:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Constructor

**Chữ ký**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Tham số**

| Tên tham số        | Kiểu               | Giá trị mặc định | Mô tả                                                          |
| ------------------ | ------------------ | ---------------- | -------------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -                | Collection tương ứng với quan hệ tham chiếu (referencing relation) trong quan hệ |
| `association`      | `string`           | -                | Tên quan hệ                                                    |
| `sourceKeyValue`   | `string \| number` | -                | Giá trị key tương ứng trong quan hệ tham chiếu                 |

## Thuộc tính lớp cơ sở

### `db: Database`

Đối tượng cơ sở dữ liệu.

### `sourceCollection`

Collection tương ứng với quan hệ tham chiếu (referencing relation) trong quan hệ.

### `targetCollection`

Collection tương ứng với quan hệ được tham chiếu (referenced relation) trong quan hệ.

### `association`

Đối tượng association của sequelize tương ứng với quan hệ hiện tại.

### `associationField`

Field trong collection tương ứng với quan hệ hiện tại.

### `sourceKeyValue`

Giá trị key tương ứng trong quan hệ tham chiếu.
