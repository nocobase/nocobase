---
title: "Collections"
description: "Learn the purpose of NocoBase collections, collection structure types, the difference between main and external collections, and how to choose general, inheritance, tree, file, SQL, and database-view collections."
keywords: "collection,general collection,inheritance collection,tree collection,file collection,SQL collection,database view,NocoBase"
---

# Collections

## Introduction

In NocoBase, a **Collection** is the data model used to describe one category of business data. It is more than a database table name: it is NocoBase's unified description of a category of data.

A collection usually defines three things:

| Definition | Description |
| --- | --- |
| Where data is stored | Data can come from a main-database table, external-database table, SQL query result, database view, REST API resource, or external NocoBase application. |
| Which fields it has | Fields describe the information in each record, such as a customer name, mobile number, order amount, creation time, or owner. |
| How NocoBase uses it | Blocks, permissions, workflows, APIs, and relation fields all work with collections. |

You can think of a collection as the data structure for a business object. For example, **Customers**, **Orders**, **Contracts**, and **Tasks** can each be a collection.

After you create or connect a collection, you usually need to do three more things:

- Configure fields so that the collection can store the required business information
- [Add blocks](../../interface-builder/blocks/index.md#add-blocks) to pages so that users can view, enter, and process data
- Configure permissions, workflows, and APIs so that data can be accessed and processed according to business rules

## Collection structure types

- **General collection** - Suitable for standard business data such as customers, orders, contracts, work orders, expense claims, projects, and tasks
- **Tree collection** - Suitable for hierarchical data such as organizational structures, product categories, regional hierarchies, department directories, and knowledge-base directories
- **Calendar collection** - Suitable for time-range data such as meeting-room reservations, project schedules, course schedules, duty rosters, and event calendars
- **Comment collection** - Suitable for discussion content around business records, such as task comments, article comments, approval opinions, and customer feedback. Create a [relation field](./collection-fields/associations/index.md) in a business collection (general, tree, or calendar) to relate it to a comment collection, then add a [comment block](../../plugins/@nocobase/plugin-comments/index.md) in a business-collection popup page to comment on business data
- **File collection** - Suitable for file metadata such as contract attachments, invoice files, product images, and employee certificates. The files themselves are stored by the file-storage engine. Create a [relation field](./collection-fields/associations/index.md) in a business collection (general, tree, or calendar) to relate it to a file collection, then configure the relation field for file upload in a business-collection block. File metadata is automatically saved to the file collection
- **Database view** - An existing database view, such as a financial-report view, filtered customer view, or aggregated view synchronized across systems
- **SQL collection** - Suitable for using SQL query results as collections, such as sales summaries, inventory alerts, cross-table statistical reports, and operational dashboards
- **Inheritance collection** - Suitable when several business objects share a group of common fields but each also has its own fields, such as an asset parent collection that has computer-asset, vehicle-asset, and office-furniture child collections
