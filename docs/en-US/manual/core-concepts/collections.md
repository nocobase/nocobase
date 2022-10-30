# Collections

Before developing a system, we usually have to abstract the business and build a data model. It's called collections in NocoBase. Collections in NocoBase consists of fields (columns) and records (rows). The concept of a collection is similar to the concept of a data table in a relational database, but the concept of fields is slightly different.

For example, in a collection describing an order, each column contains information about a specific attribute of the order, such as the delivery address, while each row contains all the information about a specific order, such as order number, customer name, phone number, delivery address, etc.

## Separation of data and interfaces

NocoBase's `Data` and `View` are separated, managed and presented by `Collections` and `Blocks` respectively.

This means that,

- you can create **one collection** and design **one set of interfaces** for it, to enable the presentation and manipulation of data.
- You can also create **one collection** and design **many sets of interfaces** for it, for the presentation and manipulation of data in different scenarios or roles.
- You can also create **multiple collections** and then design **one set of interfaces** for them to display and manipulate multiple data tables at the same time.
- You can even create **multiple collections** and then design **multiple sets of interfaces** for them, each of which can operate on multiple data tables and perform unique functions.

Simply put, the separation of data and interfaces makes **the organization and management of data more flexible**, and how you present the data depends on how you configure the interfaces.

## Field Types

NocoBase currently supports the following dozens of fields, and more can be supported in the future by way of plug-ins.

| Name | Type |
| --- | --- |
| single-line text | basic type |
| Icon | Basic Type |
| Multi-line text | Basic type |
| Password | Basic type |
| Mobile Number | Basic Type |
| Number | Basic Type |
| Integer | Basic Type |
| Email | Basic Type |
| Percent | Basic Type |
| Drop-down menu (single selection) | Select type |
| Drop-down menu (multiple choice) | Select type |
| China Administrative Region | Select Type |
| Check | Select Type |
| Radio | Select Type |
| Checkbox | Select Type |
| Link to | Relationship Type |
| One-to-One (has one) | Relationship Type |
| One-to-One (belongs to) | Relationship Type |
| One-to-many | Relationship Type |
| Many-to-one | relationship type |
| Many-to-many | relationship type |
| Formula | advanced type |
| AutoCoding | Advanced Types |
| JSON | Advanced Types |
| Markdown | Multimedia |
| Rich Text | Multimedia |
| Attachments | Multimedia |
| Date | Date & Time |
| Time | Date & Time |
| ID | System Information |
| Created by | System Information |
| Date Created | System Information |
| Last Modified By | System Information |
| Last Modified Date | System Information |
| Formula | Advanced Type |