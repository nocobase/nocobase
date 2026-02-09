# Filter form

## Introduction

The filter form allows users to filter data by filling in form fields. It can be used to filter table blocks, chart blocks, list blocks, and more.

## How to use

Let's start with a simple example to quickly understand how to use the filter form. Suppose we have a table block containing user information, and we want to filter the data using a filter form, like this:


![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)


Configuration steps:

1. Enable Edit mode and add a "Filter form" block and a "Table" block to the page.

![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)

2. Add the "Nickname" field to both the table block and the filter form block.

![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)

3. Now you can start using it.

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)


## Advanced usage

The filter form block supports more advanced configurations. Here are some common use cases.

### Connecting multiple blocks

A single form field can filter data across multiple blocks simultaneously. Here's how:

1. Click on the "Connect fields" configuration option for the field.

![20251031170300](https://static-docs.nocobase.com/20251031170300.png)

2. Add the target blocks you want to connect. In this example, we'll select the list block on the page.

![20251031170718](https://static-docs.nocobase.com/20251031170718.png)

3. Select one or more fields from the list block to connect. Here we select the "Nickname" field.

![20251031171039](https://static-docs.nocobase.com/20251031171039.png)

4. Click the save button to complete the configuration. The result looks like this:

![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)


### Connecting chart blocks

Reference: [Page filters and linkage](../../../data-visualization/guide/filters-and-linkage.md)

### Custom fields

In addition to selecting fields from collections, you can also create form fields using "Custom fields". For example, you can create a dropdown select field with custom options. Here's how:

1. Click the "Custom fields" option to open the configuration panel.

![20251031173833](https://static-docs.nocobase.com/20251031173833.png)

2. Fill in the field title, select "Select" as the field model, and configure the options.

![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)

3. Newly added custom fields need to be manually connected to fields in target blocks. Here's how:

![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)

4. Configuration complete. The result looks like this:

![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)


Currently supported field models:

- Input: Single-line text input
- Number: Numeric input
- Date: Date picker
- Select: Dropdown (can be configured for single or multiple selection)
- Radio group: Radio buttons
- Checkbox group: Checkboxes
- Record select: Relationship record picker for filtering related data

#### Record select (custom relationship field)

`Record select` is suitable for scenarios where you filter by related records. For example, filtering orders by customer, or filtering tasks by assignee.

Configuration options:

- **Target collection**: The collection to load selectable records from.
- **Title field**: The field used as display text in the dropdown and selected tags (for example, name or title).
- **Value field**: The field used as the actual submitted filter value, usually the primary key (for example, `id`).
- **Multiple**: Whether multiple selections are allowed.
- **Operator**: Defines how the filter condition is matched (see Operator below).

Recommended setup:

1. Use a readable field for `Title field` (such as name), instead of raw IDs.
2. Use a primary key for `Value field` to keep filtering stable and unique.
3. For single-select scenarios, usually disable `Multiple`; for multi-select scenarios, enable `Multiple` and choose a matching `Operator`.

#### Operator

`Operator` defines the matching rule between the filter form value and the connected target field value.

Common options:

- **Equals / Not equals**: Common for single-value matching.
- **Contains / Not contains**: Common for text or collection-style matching.
- **In / Not in**: Common for multi-value matching (for example, selecting multiple customers and matching any of them).

Selection tips:

1. For single-select fields, prefer `Equals`.
2. For multi-select fields, prefer `In`.
3. If the result looks incorrect, first check whether `Multiple` and `Operator` are aligned, then verify the `Connect fields` mapping.

### Collapse

Add a collapse button to fold and expand the filter form content, saving page space.


![20251031182743](https://static-docs.nocobase.com/20251031182743.png)


Supported configurations:


![20251031182849](https://static-docs.nocobase.com/20251031182849.png)


- **Collapsed rows**: Sets how many rows of form fields are displayed in the collapsed state.
- **Default collapsed**: When enabled, the filter form is displayed in collapsed state by default.
