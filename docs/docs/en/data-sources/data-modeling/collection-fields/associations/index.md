# Relationship Fields

In NocoBase, relationship fields are not actual fields but are used to establish connections between collections. This concept is equivalent to relationships in relational databases.

In relational databases, the most common types of relationships include the following:

- [One-to-One](./o2o/index.md): Each entity in two collections corresponds to only one entity in the other collection. This type of relationship is usually used to store different aspects of an entity in separate collections to reduce redundancy and improve data consistency.
- [One-to-Many](./o2m/index.md): Each entity in one collection can be associated with multiple entities in another collection. This is one of the most common relationship types. For example, one author can write multiple articles, but each article can have only one author.
- [Many-to-One](./m2o/index.md): Multiple entities in one collection can be associated with one entity in another collection. This type of relationship is also common in data modeling. For instance, multiple students can belong to the same class.
- [Many-to-Many](./m2m/index.md): Multiple entities in two collections can be associated with each other. This type of relationship typically requires an intermediary collection to record the associations between the entities. For example, the relationship between students and courses—a student can enroll in multiple courses, and a course can have multiple students.

These types of relationships play an important role in database design and data modeling, helping to describe complex real-world relationships and data structures.
