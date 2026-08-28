---
title: "Email"
description: "The Email field stores email addresses and provides email-format validation."
keywords: "Email,email,field,Field interface,NocoBase"
---

# Email

## Introduction

In NocoBase, the **Email** field stores email addresses.

It is suitable for customer, employee, and supplier email addresses. Compared with a normal Input field, it provides clearer email semantics and format validation. Use [Input](./input.md) when the content is not an email address.

## Use cases

Email fields are suitable for these business scenarios:

- Customer and contact email addresses
- Employee and sign-in contact email addresses
- Supplier and service email addresses
- Notification recipient addresses

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Email** to create this field.

![Configure a Email field](https://static-docs.nocobase.com/20240512175609.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Email uses `email`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Customer email`, `Contact email`, or `Recipient email`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Email uses `string` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports email-format and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Email field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `email`. |
| Default Field type | `string`. |
| Available Field types | `string`. |
| Page component | Uses an Input component with email-format validation in edit mode. |
| Filtering | Supports text filters such as contains, equals, is empty, and is not empty. |
| Sorting | Supports sorting in Table blocks. |
| Validation | Supports email-format and required validation. |

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

Click **Delete** beside a Email field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Email field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Email fields are suitable for forms, details, and notification flows.

![Use a Email field in a page](https://static-docs.nocobase.com/20260709224700.png)


| Scenario | Use |
| --- | --- |
| Form block | Enter an email address. |
| Details block | Display an email address. |
| Filter block | Filter records by email address. |
| Workflows and notifications | Use the value as an email-notification recipient. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
- [Input](./input.md) - Store ordinary short text.
- [Phone](./phone.md) - Store phone numbers.
