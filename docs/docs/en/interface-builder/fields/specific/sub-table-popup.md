# Sub-table (Popup Edit)

## Introduction

The Sub-table (Popup Edit) is used to manage to-many association data (such as one-to-many, many-to-many) within a form. The table only displays associated records; adding/editing is done in a popup, and data is saved together when the main form is submitted.

## Usage

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

Applicable scenarios:

- Association fields: o2m / m2m / mbm
- Typical use cases: order line items, sub-item lists, associated tags/members, etc.

## Field Configuration

### Allow Selection of Existing Records (Default: Enabled)

Supports selecting associations from existing records.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Field Component

[Field Component](/interface-builder/fields/association-field): Switch to other association field components, such as dropdown select, record picker, etc.

### Allow Dissociate (Default: Enabled)

> Controls whether existing associated data can be dissociated in the edit form. Newly added data can always be removed.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Allow Add New (Default: Enabled)

Controls whether the add button is displayed. When the user does not have create permission on the target table, the button will be disabled with a permission notice.

### Allow Quick Edit (Default: Disabled)

When enabled, hovering over a cell will display an edit icon for quick inline editing of cell content.

You can enable quick edit for all fields on the association field component.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

You can also enable quick edit for individual column fields.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Page Size (Default: 10)

Sets the number of records displayed per page in the sub-table.

## Behavior

- When selecting existing records, deduplication is performed by primary key to avoid duplicate associations
- Newly added records are populated directly into the sub-table, defaulting to the page containing the new record
- Inline editing only modifies the current row's data
- Removing only unlinks the association in the current form and does not delete the source data
- Data is saved together when the main form is submitted
