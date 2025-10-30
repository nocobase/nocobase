# Many-to-One

In a library database, there are two entities: books and authors. An author can write multiple books, but each book usually has only one author. In this case, the relationship between authors and books is many-to-one. Multiple books can be associated with the same author, but each book can have only one author.

ER Diagram:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Field Configuration:

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Parameter Description

### Source Collection

The source collection, which is the collection where the current field resides.

### Target Collection

The target collection, which is the collection to be associated with.

### Foreign Key

The field in the source collection that is used to establish the association between the two collections.

### Target Key

The field in the target collection that is referenced by the foreign key. It must be unique.

### ON DELETE

ON DELETE refers to the rules applied to foreign key references in related child collections when records in the parent collection are deleted. It is an option used when defining a foreign key constraint. Common ON DELETE options include:

- **CASCADE**: When a record in the parent collection is deleted, all related records in the child collection are automatically deleted.
- **SET NULL**: When a record in the parent collection is deleted, the foreign key values in the related child collection records are set to NULL.
- **RESTRICT**: The default option, it prevents the deletion of a parent collection record if there are related records in the child collection.
- **NO ACTION**: Similar to RESTRICT, it prevents the deletion of a parent collection record if there are related records in the child collection.
