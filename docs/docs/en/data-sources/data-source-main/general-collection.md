---
pkg: "@nocobase/plugin-data-source-main"
---

# General Collection

## Introduction
It is used in most scenarios. A general collection can be used unless a special collection template is needed.

## User Manual


![20240324085739](https://static-docs.nocobase.com/20240324085739.png)

### Set Primary Key

When creating a collection, you need to specify a primary key field. It is recommended to enable the preset ID field when creating a new collection. The default primary key type for the ID field is Snowflake ID (53-bit).

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

Hover over the Interface of the ID field to select other primary key types.

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

Available primary key types include:
- [Text](/data-sources/data-modeling/collection-fields/basic/input)
- [Integer](/data-sources/data-modeling/collection-fields/basic/integer)
- [Snowflake ID (53-bit)](/data-sources/data-modeling/collection-fields/advanced/snowflake-id)
- [UUID](/data-sources/data-modeling/collection-fields/advanced/uuid)
- [Nano ID](/data-sources/data-modeling/collection-fields/advanced/nano-id)
