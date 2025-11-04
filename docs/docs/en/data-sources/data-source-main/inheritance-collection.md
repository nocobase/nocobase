---
pkg: "@nocobase/plugin-data-source-main"
---

# Inheritance Collection

## Introduction

You can create a parent collection and derive child collections from that parent collection. The child collection will inherit the structure of the parent collection and can also define its own columns. This design pattern helps organize and manage data with similar structures but some differences.

Here are some common features of inheritable collections:

- **Parent Collection**: Contains common columns and data, defining the basic structure of the entire inheritance hierarchy.
- **Child Collection**: Inherits the structure of the parent collection but can also define its own columns. This allows each child collection to share common attributes with the parent while including subclass-specific ones.
- **Querying**: You can query the entire inheritance hierarchy, just the parent collection, or a specific child collection. This enables retrieving and processing data at different hierarchy levels as needed.
- **Inheritance Relationship**: An inheritance relationship between the parent and child collections allows consistent attribute definitions while enabling extensions or overrides in child collections.

This design pattern reduces data redundancy, simplifies the database model, and makes data maintenance easier. However, it should be used with caution, as inheritance structures may increase query complexity, especially when working with entire hierarchies. Databases that support inheritance typically provide specific syntax and tools to manage and query such structures.

## User Manual

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)