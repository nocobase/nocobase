# Inheritance Collection

<PluginInfo name="data-source-main"></PluginInfo>

## Introduction

You can create a parent collection and derive child collection from that parent collection. The child collection will inherit the structure of the parent collection, and can also define its own columns. This design pattern helps organize and manage data with similar structures but possible differences.

Here are some common features of support for inheritable collections:

- Parent Collection: The parent collection contains common columns and data, defining the basic structure of the entire inheritance hierarchy.
- Child Collection: The child collection inherits the structure of the parent collection, but can also define its own columns. This allows each child collection to have the common properties of the parent collection while containing attributes specific to the subclass.
- Querying: When querying, you can choose to query the entire inheritance hierarchy, just the parent collection, or a specific child collection. This allows different levels of data to be retrieved and processed as needed.
- Inheritance Relationship: An inheritance relationship is established between the parent collection and the child collection, meaning that the structure of the parent collection can be used to define consistent attributes, while allowing the child collection to extend or override these attributes.

This design pattern helps to reduce data redundancy, simplify the database model, and make the data easier to maintain. However, it needs to be used with caution as inheritable collections can increase the complexity of queries, especially when dealing with the entire inheritance hierarchy. Databases that support inheritable collections generally provide specific syntax and tools to manage and query these collection structures.

## User Manual

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)