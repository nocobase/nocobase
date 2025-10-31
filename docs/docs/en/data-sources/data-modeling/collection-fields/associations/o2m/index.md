# One-to-Many

The relationship between a class and its students is an example of a one-to-many relationship: one class can have multiple students, but each student belongs to only one class.

ER Diagram:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Field Configuration:

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Parameter Description

### Source Collection

The source collection, which is the collection where the current field resides.

### Target Collection

The target collection, which is the collection to be associated with.

### Source Key

The field in the source collection that is referenced by the foreign key. It must be unique.

### Foreign Key

The field in the target collection that is used to establish the association between the two collections.

### Target Key

The field in the target collection used to view each row record in the relationship block, usually a unique field.

### ON DELETE

ON DELETE refers to the rules applied to foreign key references in related child collections when records in the parent collection are deleted. It is an option used when defining a foreign key constraint. Common ON DELETE options include:

- **CASCADE**: When a record in the parent collection is deleted, all related records in the child collection are automatically deleted.
- **SET NULL**: When a record in the parent collection is deleted, the foreign key values in the related child collection records are set to NULL.
- **RESTRICT**: The default option, it prevents the deletion of a parent collection record if there are related records in the child collection.
- **NO ACTION**: Similar to RESTRICT, it prevents the deletion of a parent collection record if there are related records in the child collection.
