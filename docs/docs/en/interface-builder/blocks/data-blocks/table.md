# Table Block

## Introduction


The Table block is one of the core built-in data blocks in **NocoBase**, primarily used to display and manage structured data in a tabular format. It offers flexible configuration options, allowing users to customize table columns, column widths, sorting rules, and data scope to ensure the displayed data meets specific business needs.

#### Key Features:
- **Flexible Column Configuration**: You can customize the table's columns and column widths to suit different data display requirements.
- **Sorting Rules**: Supports sorting table data. Users can arrange data in ascending or descending order based on different fields.
- **Data Scope Setting**: By setting the data scope, users can control the range of data displayed, avoiding interference from irrelevant data.
- **Action Configuration**: The Table block has various built-in action options. Users can easily configure actions like Filter, Add New, Edit, and Delete for quick data management.
- **Quick Edit**: Supports direct data editing within the table, simplifying the operational process and improving work efficiency.

## Block Settings


![20251023150819](https://static-docs.nocobase.com/20251023150819.png)


### Block Linkage Rules

Control block behavior (e.g., whether to display or execute JavaScript) through linkage rules.


![20251023194550](https://static-docs.nocobase.com/20251023194550.png)


For more details, see [Linkage Rules](/interface-builder/linkage-rule)

### Set Data Scope

Example: By default, filter orders where the "Status" is "Paid".


![20251023150936](https://static-docs.nocobase.com/20251023150936.png)


For more details, see [Set Data Scope](/interface-builder/blocks/block-settings/data-scope)

### Set Sorting Rules

Example: Display orders in descending order by date.


![20251023155114](https://static-docs.nocobase.com/20251023155114.png)


For more details, see [Set Sorting Rules](/interface-builder/blocks/block-settings/sorting-rule)

### Enable Quick Edit

Activate "Enable Quick Edit" in the block settings and table column settings to customize which columns can be quickly edited.


![20251023190149](https://static-docs.nocobase.com/20251023190149.png)



![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

## Configure Fields

### Fields of This Collection

> **Note**: Fields from inherited collections (i.e., parent collection fields) are automatically merged and displayed in the current field list.


![20251023185113](https://static-docs.nocobase.com/20251023185113.png)


### Fields of Associated Collections

> **Note**: Supports displaying fields from associated collections (currently only supports to-one relationships).


![20251023185239](https://static-docs.nocobase.com/20251023185239.png)


### Other Custom Columns


![20251023185425](https://static-docs.nocobase.com/20251023185425.png)


- [Js field](/interface-builder/fields/specific/js-field)
- [Js column](/interface-builder/fields/specific/js-column)

## Configure Actions

### Global Actions


![20251023171655](https://static-docs.nocobase.com/20251023171655.png)


- [Filter](/interface-builder/actions/types/filter)
- [Add new](/interface-builder/actions/types/add-new)
- [Delete](/interface-builder/actions/types/delete)
- [Refresh](/interface-builder/actions/types/refresh)
- [Import](/interface-builder/actions/types/import)
- [Export](/interface-builder/actions/types/export)
- [Template Print](/interface-builder/actions/types/template-print)
- [Bulk update](/interface-builder/actions/types/bulk-update)
- [Export attachments](/interface-builder/actions/types/export-attachments)
- [Trigger workflow](/interface-builder/actions/types/trigger-workflow)
- [JS action ](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)

### Row Actions


![20251023181019](https://static-docs.nocobase.com/20251023181019.png)


- [View](/interface-builder/actions/types/view)
- [Edit](/interface-builder/actions/types/edit)
- [Delete](/interface-builder/actions/types/delete)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Link](/interface-builder/actions/types/link)
- [Update record](/interface-builder/actions/types/update-record)
- [Template Print](/interface-builder/actions/types/template-print)
- [Trigger workflow](/interface-builder/actions/types/trigger-workflow)
- [JS action ](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)