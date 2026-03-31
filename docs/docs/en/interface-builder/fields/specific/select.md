# Dropdown

## Introduction

The Dropdown supports associating data by selecting from existing data in the target collection, or by adding new data to it for association. The dropdown options support fuzzy search.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Field Configuration

### Set Data Scope

Controls the data scope of the dropdown list.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

For more information, see [Set Data Scope](/interface-builder/fields/field-settings/data-scope)

### Set Sort Rules

Controls the sorting of data in the dropdown.

Example: Sort by service date in descending order.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Allow adding/associating multiple records

Restricts a to-many relationship to allow associating only one record.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Title Field

The title field is the label field displayed in the options.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Supports quick search based on the title field

For more information, see [Title Field](/interface-builder/fields/field-settings/title-field)

### Quick Create: Add First, Then Select

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Add via Dropdown

After creating a new record in the target table, the system automatically selects it and associates it when the form is submitted.

In the example below, the Orders table has a many-to-one relationship field **“Account.”**

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Add via Modal

Modal creation is suitable for more complex data entry scenarios and allows configuring a customized form for creating new records.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

Modal creation is suitable for more complex data entry scenarios and allows configuring a custom form for adding new records.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Field Component](/interface-builder/fields/association-field)
