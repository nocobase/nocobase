# Sub-table

## Introduction

The sub-table is suitable for handling to-many relationship fields. It supports batch creation and association of new data in the target collection, or selecting and associating existing data.

## Usage Instructions


![20251027223350](https://static-docs.nocobase.com/20251027223350.png)


Different types of fields in the sub-table display different field components. Large fields (such as Rich Text, JSON, Long Text) are edited through a pop-up modal.


![20251027223426](https://static-docs.nocobase.com/20251027223426.png)


Relationship fields in the sub-table.

Orders (One-to-Many) > Order Products (One-to-One) > Opportunity


![20251027223530](https://static-docs.nocobase.com/20251027223530.png)


The default component for a relationship field is the Dropdown (supports Dropdown/Data Picker).


![20251027223754](https://static-docs.nocobase.com/20251027223754.png)


## Field Configuration Options

### Allow selecting existing data (disabled by default)

Supports selecting and associating existing data.


![20251027224008](https://static-docs.nocobase.com/20251027224008.png)



![20251027224023](https://static-docs.nocobase.com/20251027224023.gif)


### Field Component

[Field Component](/interface-builder/fields/association-field): Switch to other relationship field components, such as Dropdown, Data Picker, etc.

### Allow unlinking existing data

> Whether to allow unlinking existing data for the relationship field in the edit form.


![20251028153425](https://static-docs.nocobase.com/20251028153425.gif)