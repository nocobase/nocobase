---
pkg: "@nocobase/plugin-action-bulk-update"
---
# Bulk Update

## Introduction

The bulk update action is used when you need to apply the same update to a group of records. Before performing a bulk update, the user needs to pre-define the field assignment logic for the update. This logic will be applied to all selected records when the user clicks the update button.


![20251029195320](https://static-docs.nocobase.com/20251029195320.png)


## Action Configuration


![20251029195729](https://static-docs.nocobase.com/20251029195729.png)


### Data to update

Selected/All, defaults to Selected.


![20251029200034](https://static-docs.nocobase.com/20251029200034.png)


### Field assignment

Set the fields for bulk update. Only the set fields will be updated.

As shown in the figure, configure the bulk update action in the orders table to bulk update the selected data to "Pending Approval".


![20251029200109](https://static-docs.nocobase.com/20251029200109.png)


- [Edit button](/interface-builder/actions/action-settings/edit-button): Edit the button's title, type, and icon;
- [Linkage rule](/interface-builder/actions/action-settings/linkage-rule): Dynamically show/hide the button;
- [Double check](/interface-builder/actions/action-settings/double-check)