---
title: "Icon"
description: "The Icon field stores icon identifiers for menus, categories, statuses, and other interface elements."
keywords: "Icon,icon,field,Field interface,NocoBase"
---

# Icon

## Introduction

In NocoBase, the **Icon** field stores icon identifiers.

It is suitable for menu icons, category icons, status icons, and other visual labels. Use a normal Input field when you need to store an arbitrary text value instead of an icon.

## Use cases

Icon fields are suitable for these business scenarios:

- Menu and navigation icons
- Category and classification icons
- Status and label icons
- Visual identification for business records

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Icon** to create this field.

![Configure a Icon field](https://static-docs.nocobase.com/20240512180027.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Icon uses `icon`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Menu icon`, `Category icon`, or `Status icon`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Icon uses `string` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Icon field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `icon`. |
| Default Field type | `string`. |
| Available Field types | `string`. |
| Page component | Uses an icon selector in edit mode. |
| Filtering | Supports text-value filters such as equals, is empty, and is not empty. |
| Sorting | Supports sorting in Table blocks. |
| Validation | Supports required validation. |

## Edit configuration

After creation, click **Edit** beside the field to edit its configuration. Edit fields to adjust how they are displayed and used in NocoBase, such as the display name, description, default value, validation rules, or field-specific settings.

When a field comes from a synchronized main-database table, editing usually maps the database field to a NocoBase Field type and Field interface.

| Setting | Can be edited | Description |
| --- | --- | --- |
| Field display name | Yes | Changes the name displayed in the interface without changing the field identifier. |
| Field name | No | The field identifier normally cannot be changed in the edit form after creation. |
| Field interface | Conditional | Main-database fields and synchronized fields can be adjusted during field mapping. Changes affect page input, display, and validation. |
| Field type | Conditional | Main-database fields and synchronized fields can be adjusted during field mapping. Confirm that existing values can be used by the new type first. |
| Default value | Yes | Adjusts the default value for new records. |
| Validation rules | Yes | Adjusts field validation rules. |
| Description | Yes | Adds the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Changing a Field type or Field interface is more than changing a display name. It affects field storage, input components, validation rules, filters, and workflow-variable usage. When the field contains substantial existing data, confirm that its data format is compatible first.

:::

## Delete field

Click **Delete** beside a Icon field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Icon field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Icon fields are suitable for visual configuration and record identification.

![Use a Icon field in a page](https://static-docs.nocobase.com/20260709225630.png)


| Scenario | Use |
| --- | --- |
| Form block | Select an icon. |
| Details block | Display the selected icon. |
| Table block | Display icon values in a list. |
| Interface configuration | Use the icon as a visual identifier. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
