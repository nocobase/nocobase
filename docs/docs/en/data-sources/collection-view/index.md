---
pkg: "@nocobase/plugin-data-source-main"
title: "Database views"
description: "Connect an existing database view as a data source, then configure its fields and display in NocoBase. Suitable for visual management of complex query results."
keywords: "database view,Collection View,view,NocoBase"
---

# Connect a database view

## Introduction

Connect a database view, such as a financial-report view maintained by a DBA, a filtered customer view, or an aggregated view synchronized across systems. This lets you reuse query logic that is already defined in the database.

:::tip Tip

Only regular views in the owner scope of the main database connection account are supported; materialized views are not supported. Even when the account has query permission for views owned by others, those views do not appear in the connection list. Before connecting a view, make sure it has stable column names and field types that NocoBase can identify.

:::

## Connect a database view

1. Open the data-source home page from the **Data sources** menu in system settings.
2. Select the **Main** data source in the data-source list and click **Configure** to open the main database.
3. In main database management, click **Create collection** and select **Connect to database view**.

![Configure the Main data source](https://static-docs.nocobase.com/configure_main_datasource.png)
![Connect to a database view](https://static-docs.nocobase.com/connect_view.png)
![Configure a database view](https://static-docs.nocobase.com/connect_view_configure.png)

| Setting | Description |
| --- | --- |
| Collection display name | The name displayed for the database view, such as `Financial report view` or `Customer statistics view`. Use a name that explains the purpose of the view. |
| Collection name | The identifier of the database view in NocoBase, used internally by APIs, relation fields, permissions, and workflows. It is generated automatically and can be changed manually. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Database view | Select the database view to connect. NocoBase reads its field structure and query results. When editing, you can view the connected view but cannot switch to a different view. |
| Categories | Collection categories affect only organization in Data source management; they do not change the database view itself. |
| Description | A collection description. State who maintains the view, which data it queries, and which pages or reports use it. |
| Use simple pagination mode | Simple pagination mode. When enabled, Table blocks skip total-record-count queries during pagination. It is suitable for large views and can reduce query load. |
| Record unique key | The unique identifier for a record. Database views usually have no primary key, so choose a field that can uniquely locate a record. Without it, blocks might not view or edit records correctly. |
| Source collections | The sources of database view fields. This relates view fields to fields in existing collections so that NocoBase can identify Field types and Field interfaces. |
| Fields | Field-mapping settings. Confirm the name, title, data type, and interface type for each field in the view. |
| Preview | Preview database view results. Before saving, confirm that field mappings and display results meet expectations. |
| Allow add new, update and delete actions | Whether to allow create, update, and delete operations on the database view. When enabled, NocoBase provides the related page actions. Whether writes succeed still depends on whether the database view itself is writable and whether the database account has `INSERT`, `UPDATE`, and `DELETE` permissions. |

:::tip Tip

`Source collections` are source collections inferred from the database view. NocoBase identifies which existing collections most view fields originate from and limits the selectable **Field source** values during field mapping.

The inference result helps configure a view quickly. If the view has renamed fields, calculated fields, aggregations, or complex joins, the result might be incomplete, inaccurate, or impossible to infer. Confirm it manually in **Fields**.

:::

### Field mapping

Field mapping must be confirmed after connecting a database view. After a view is connected, NocoBase first infers the source and database type of each view field. When it can infer a source field, it automatically uses the existing field's Field type, Field interface, and Field display name. When it cannot infer a source, it provides an initial Field type based on the database type; then confirm the field type and interface manually.

[Learn more about field configuration](../data-modeling/collection-fields/index.md)

![Configure a view field source](https://static-docs.nocobase.com/connect_view_configure_field_source.png)
![Configure a view field interface](https://static-docs.nocobase.com/connect_view_configure_field_interface.png)

| Setting | Description |
| --- | --- |
| Field source | Select the existing collection and field from which the view field originates. After choosing a source, NocoBase can reuse its Field type and Field interface. |
| Field type | When a view field has no clear source, confirm its data type manually. |
| Field interface | Confirm how the field is displayed and entered in pages, such as Input, Number, Date, or Select. |
| Field display name | The name displayed for the field. Use a name that business users can recognize. |

For example, if a view returns `customer_name` and it comes from the **Customer name** field in the Customers collection, map it to that field. NocoBase can then reuse the original field's title, type, and interface configuration.

For fields returned by aggregations or calculations, such as `count(*) as total` or `sum(amount) as amount_total`, manually select the Field type and an appropriate Field interface.

:::tip Tip

`Field source` comes from NocoBase's inference of the database view and indicates which existing field a view field might correspond to. When a field has a `Field source`, NocoBase preferentially reuses the source field's Field type and Field interface.

When a source field cannot be inferred, or the inferred result does not match the business meaning, remove the `Field source` and select the `Field type`, `Field interface`, and `Field display name` manually.

:::

### Record unique key

A database view requires a Record unique key. Without one, you cannot create blocks in pages or view and edit records correctly. You can select one field or a combination of fields as the unique key. Suitable Record unique key fields usually meet these conditions:

- Field values are unique
- Field values are stable and do not change due to sorting, pagination, or statistical-calculation changes
- Fields are not empty
- Fields are always returned by the view

For a single-table view, return the original table primary key first. For a view based on multi-table joins or aggregations, retain a stable business ID in the database view or generate a stable unique field in the database.

### Allow create, update, and delete actions

If a database view supports writes, enable **Allow add new, update and delete actions**. NocoBase then allows create, update, and delete operations on the view in pages.

Database views are better suited to query results and are treated as read-only collections by default. Enable writes only after confirming that the database view supports the corresponding write operations and that database permissions allow them.

### Preview view results

Before saving, use **Preview** to inspect the view query result. Check the following:

- The view can be queried normally
- Fields are complete
- Field types and Field interfaces match the business meaning
- A Record unique key exists and is unique
- Unsupported field types need adjustment in the database

![Preview database view results](https://static-docs.nocobase.com/connect_view_configure_preview.png)

## Configure fields

After creating a database view, click **Configure fields** beside the view in the collection list to open field settings. Field settings maintain the view fields, how they display in the interface, and how database view fields map to NocoBase Field types and Field interfaces.

Ordinary database-view fields come from the database view. NocoBase does not add, modify, or delete actual columns in the view. In field settings, you can add only many-to-one relation fields to supplement business relations in NocoBase. A database view cannot be the target collection of a relation field, and it usually does not need a title field.

[Learn more about field configuration](../data-modeling/collection-fields/index.md)

![Configure fields for a database view](https://static-docs.nocobase.com/configure_view.png)

### Add a relation field

Database views can add only many-to-one relation fields. A many-to-one relation field maps an existing view field to a primary key or unique field in a target collection. It lets pages display related records, but does not create actual fields or foreign-key constraints in the database view.

Click **Add field** to add a many-to-one relation field.

[Learn more about field configuration](../data-modeling/collection-fields/index.md)

![Add a database view field](https://static-docs.nocobase.com/add_view_field.png)
![Configure a database view relation field](https://static-docs.nocobase.com/add_view_field_configure.png)

| Setting | Description |
| --- | --- |
| Field display name | The name shown for the many-to-one relation field. Use a name that business users recognize, such as `Customer` or `Related order`. |
| Field name | The identifier used for the many-to-one relation field in NocoBase, including APIs, permissions, and workflows. |
| Source collection | The source collection, which is the current database view collection. It determines which collection field is selected for `Foreign key`; when adding a many-to-one relation to a database view, it normally remains the current view. |
| Target collection | The target collection to relate to. Usually choose a real collection, such as a general collection or an external database collection; you cannot select a database view. |
| Foreign key | The field in the current database view that stores the target-record identifier. This field must be returned reliably by the view query. |
| Target key | The target-collection field matched by `Foreign key`, usually a primary key or unique field. |
| Description | A field description. Record the relation meaning, data source, maintenance method, or cautions. |

### Field mapping

After a database view is connected, NocoBase infers its Field type from the view fields and source fields, then assigns a default Field interface. If the field source, display method, or business meaning does not meet expectations, adjust the mapping in field settings.

[Learn more about field configuration](../data-modeling/collection-fields/index.md)

![Edit database view field mapping](https://static-docs.nocobase.com/edit_view_field_configure.png)

:::tip Tip

- **Field interface** (interface type / UI type) determines how a field displays and interacts in the client, such as Input, Number, Select, or DateTime. It is the user-facing field classification
- **Field type** (data type) determines how NocoBase identifies the field's data. For view fields without a source field, it is normally inferred from the database field type, such as `string`, `integer`, `decimal`, `boolean`, or `datetime`

:::

:::warning Note

Changing Field source, Field type, or Field interface does not change the database view field type. It primarily affects page display, validation rules, and how NocoBase identifies the field.

:::

### Synchronize from database

When the database-side view field structure changes, open **Configure fields** and click **Sync from database** to read the field structure again. After synchronization, NocoBase updates fields: it adds fields newly returned by the view, removes fields that no longer exist in the view, and reconfirms field types and field sources.

![Synchronize view fields from database](https://static-docs.nocobase.com/edit_view_sync_from_database.png)
![Configure view field synchronization](https://static-docs.nocobase.com/edit_view_sync_from_database_configure.png)

:::warning Note

Renaming a field usually appears during synchronization as deleting the old field and adding a new field. Before synchronizing, confirm whether the old field is used by pages, permissions, workflows, or external APIs, to avoid broken configuration afterwards. Recheck Field type and Field interface after synchronization.

:::

### Edit a field

Click **Edit** beside a field to edit its configuration. Field editing is suitable for adjusting how a field displays and is used in NocoBase, such as its display name, description, validation rules, or field-specific settings.

[Learn more about field configuration](../data-modeling/collection-fields/index.md)

![Edit a field](https://static-docs.nocobase.com/edit_field.png)
![Configure an edited field](https://static-docs.nocobase.com/edit_field_configure.png)

:::warning Note

Editing field configuration does not change the actual column name, field type, SQL expression, or index in the database view. To change the actual view structure, change the view in the database first, then use **Sync from database**.

:::

### Delete a field

Click **Delete** beside a field to delete it. Deleting a field removes only the field stored in NocoBase; it does not delete the actual column in the database view.

[Learn more about field configuration](../data-modeling/collection-fields/index.md)

![Delete a field](https://static-docs.nocobase.com/delete_field.png)

:::warning Note

Deleting a field can affect page blocks, filters, sorting, permissions, workflows, APIs, and existing configuration. Before deleting it, confirm whether the field is still used. If the database view still returns the column, NocoBase might identify the field again when you later run **Sync from database**.

:::

## Edit a view

The SQL definition of a database view is maintained in the database. In the collection list, click **Edit** beside a database view to adjust its metadata and runtime settings in NocoBase; this does not modify the database view. To connect another database view, create a new database view collection.

![Edit a database view](https://static-docs.nocobase.com/edit_view.png)
![Configure an edited database view](https://static-docs.nocobase.com/edit_view_configure.png)

| Setting | Description |
| --- | --- |
| Collection display name | The name displayed for the database view. Change it to a business-friendly name, such as `Financial report view` or `Customer statistics view`. |
| Collection name | The identifier of the database view in NocoBase. It cannot be changed when editing. |
| Database view | The currently connected database view. It is read-only when editing and cannot be switched to a different view. |
| Categories | Collection categories affect only organization in Data source management; they do not change the database view. |
| Description | A collection description. Record the view maintainer, query source, pages that use it, or reporting purpose. |
| Use simple pagination mode | When enabled, Table blocks skip total-record-count queries during pagination. It is suitable for database views with large data volumes. |
| Record unique key | The unique identifier for locating one record. Usually select a stable, unique view field or combination of fields. |
| Allow add new, update and delete actions | Whether to allow create, update, and delete operations. Enable it only when the database view itself supports writes and the database account has the required permissions. |

:::warning Note

After changing Record unique key or Allow add new, update and delete actions, recheck whether page blocks, permissions, and workflows still behave as expected.

:::

## Delete a view

In the collection list, click **Delete** beside a database view to delete the database view collection. Deleting it removes only the connection configuration and fields stored in NocoBase; it does not delete the view in the database.

Database views in the main database can also be selected and deleted in bulk. Before deleting, check whether page blocks, charts, permissions, workflows, or external APIs still use the database view collection.

![Delete a database view](https://static-docs.nocobase.com/delete_view.png)
![Confirm database view deletion](https://static-docs.nocobase.com/delete_view_second_confirmation.png)
