---
pkg: "@nocobase/plugin-kanban"
title: "Kanban Block"
description: "Kanban Block: Displays data records in grouped columns, supporting drag-and-drop sorting, card click to open, and configurable column width and grouping options."
keywords: "Kanban Block, Kanban, Data Grouping, Drag-and-Drop Sorting, Card Layout, Interface Builder, NocoBase"
---

# Kanban

## Introduction

The Kanban block displays data records in grouped columns. It is suitable for scenarios such as task status workflows, sales pipeline tracking, and ticket processing, where data needs to be viewed and progressed by stages.

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_51_PM.png)

## Block Settings

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_52_PM.png)

### Grouping Settings

The Kanban block requires a grouping field to be specified first. Records will be distributed into different columns based on the field values.

- The grouping field supports single select fields and many-to-one fields.
- For single select fields, grouping options usually come from the field's predefined options.
- For many-to-one fields, grouping options are loaded from related table records.
- You can customize the display name, color, enabled status, and order of grouping options.
- Records that do not match any enabled grouping option will be displayed in the "Unknown" column.

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_53_PM.png)

### Drag Settings

After enabling drag-and-drop, cards can be moved directly to adjust their order.

- Drag-and-drop sorting depends on a sort field. It cannot be enabled without configuring one.
- The sort field must be compatible with the current grouping field.
- You can select an existing sort field or create a new one in the settings.
- When a card is moved to another column, both the grouping field value and the sort order will be updated.

For more details, refer to [Sort Field](/data-sources/field-sort).

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_53_PM%20(1).png)

### Page size

Controls the number of records initially loaded in each column. When there are many records, more can be loaded by scrolling.

### Column Width

Sets the width of each column, allowing you to adjust the display based on card content density.

### Data Scope

Used to limit the data displayed in the Kanban block.

For example: show only tasks created by the current user, or only records under a specific project.

For more details, refer to [Data Scope](/interface-builder/blocks/block-settings/data-scope).

## Field Configuration

The Kanban card uses a detail-style field layout to display summary information of records.

### Add Fields

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM.png)

For field configuration options, refer to [Detail Fields](/interface-builder/fields/generic/detail-form-item).

### Card Settings

The card itself supports the following configurations:

- Enable click to open: when enabled, clicking a card will open the current record.
- Open mode: supports drawer, modal, or page.
- Layout: allows adjusting how fields are displayed within the card.

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM%20(1).png)
![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM%20(2).png)

## Actions Configuration

The Kanban block supports configuring global actions at the top. The available action types depend on the enabled capabilities in the current environment.

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_59_PM.png)

### Global Actions

- [Add New](/interface-builder/actions/types/add-new)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Link](/interface-builder/actions/types/link)
- [Refresh](/interface-builder/actions/types/refresh)
- [Custom Request](/interface-builder/actions/types/custom-request)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)