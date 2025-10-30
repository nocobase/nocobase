# One-to-One

In the relationship between employees and personal profiles, each employee can only have one personal profile record, and each personal profile record can only correspond to one employee. In this case, the relationship between the employee and the personal profile is one-to-one.

The foreign key in a one-to-one relationship can be placed in either the source collection or the target collection. If it represents "having one," the foreign key is more appropriately placed in the target collection; if it represents "belonging to," then the foreign key is better placed in the source collection.

For example, in the case mentioned above, where an employee has only one personal profile and the personal profile belongs to the employee, it is appropriate to place the foreign key in the personal profile collection.

## One-to-One (Having One)

This indicates that an employee has a personal profile record.

ER Relationship

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Field Configuration

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## One-to-One (Belonging Relationship)

This indicates that a personal profile belongs to a specific employee.

ER Relationship

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Field Configuration

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Parameter Descriptions

### Source Collection

The source collection, which is the collection where the current field is located.

### Target Collection

The target collection, the collection that is being related.

### Foreign Key

Used to establish a relationship between two collections. In a one-to-one relationship, the foreign key can be placed in either the source collection or the target collection. If it represents "having one," the foreign key is more appropriately placed in the target collection; if it represents "belonging to," then the foreign key is better placed in the source collection.

### Source Key <- Foreign Key (Foreign Key in the Target collection)

The field referenced by the foreign key constraint must be unique. When the foreign key is placed in the target collection, it indicates "having one."

### Target Key <- Foreign Key (Foreign Key in the Source collection)

The field referenced by the foreign key constraint must be unique. When the foreign key is placed in the source collection, it indicates a "belonging relationship."

### ON DELETE

ON DELETE refers to the action rules for the foreign key reference in the related child collection when deleting records from the parent collection. It is an option defined when establishing a foreign key constraint. Common ON DELETE options include:

- CASCADE: When a record in the parent collection is deleted, automatically delete all related records in the child collection.
- SET NULL: When a record in the parent collection is deleted, set the foreign key value in the related child collection to NULL.
- RESTRICT: The default option, where deletion of a parent collection record is refused if there are related records in the child collection.
- NO ACTION: Similar to RESTRICT, deletion of a parent collection record is refused if there are related records in the child collection.
