# Field values

## Introduction

`Field values` lets you **preset values for fields** in the UI builder, and provides a unified way to manage both **Default value** and **Fixed value**.

Common use cases:

- **Form block**: Pre-fill default values for add forms, or write fixed values when conditions are met.
- **Filter form**: Set default filter values (auto-filled when the page is opened).
- **Update record** and similar actions: Preset the values to be saved/updated when the button is clicked.

:::info{title=Tip}
Field values supports **Constant / Variable / RunJS / Null** as value sources. For variables, see [Variables](/interface-builder/variables).
:::

## Where to configure

### Form block

Path: Enable edit mode → Select the Form block → Block settings → **Form settings** → **Field values**.

![Form block settings → Form settings → Field values](https://static-docs.nocobase.com/placeholder.png)

### Filter form

Path: Enable edit mode → Select the Filter form → Block settings → **Form settings** → **Field values**.

Notes:

- Filter form field values are used as **default filter values**, and only supports **Default value**.
- After saving, the filter form will be auto-filled when the page is opened, and the target blocks will be refreshed accordingly.

![Filter form settings → Form settings → Field values](https://static-docs.nocobase.com/placeholder.png)

### Update record action

Path: Enable edit mode → Select the **Update record** action → Action settings → **Field values**.

After configuration, when users click the button, the current record will be updated according to the field values defined here.

![Update record action → Field values entry and editor](https://static-docs.nocobase.com/placeholder.png)

## Default value vs Fixed value

### Default value

- **Editable**: users can still modify it.
- **For new entries only**: typically applied when adding new data.
- **Won’t overwrite user changes**: once users modify the value, it won’t be overwritten by default values.
- **Edit form notes**: default values won’t be applied to top-level fields in an edit form; for sub-forms/sub-tables, they apply only to **new rows/items**.

### Fixed value

- **Set by the system**: used to “force write” a value to a field.
- **May overwrite current value**: when rules run, it may overwrite the current value (including user input).

## How to configure field values

Take a Form block as an example:

1. Open **Field values**.
2. Click **Add** to create a rule.
3. Select the target field.
4. Choose a mode: **Default value** or **Fixed value**.
5. Choose a value source: **Constant / Variable / RunJS / Null**.
6. (Optional) Configure conditions.
7. Save the configuration.

![Field values editor overview](https://static-docs.nocobase.com/placeholder.png)

![Mode switch (Default value / Fixed value)](https://static-docs.nocobase.com/placeholder.png)

![Variable picker (Current user / Current form, etc.)](https://static-docs.nocobase.com/placeholder.png)

![RunJS editor (use `return` to output value)](https://static-docs.nocobase.com/placeholder.png)

![Condition example](https://static-docs.nocobase.com/placeholder.png)

## Sub-forms/sub-tables: Current item / Parent item / Index

In sub-forms/sub-tables and other “list item” scenarios, these variables help you configure field values more precisely:

- **Current item**: the current row/item data object in a sub-form/sub-table.
- **Parent item**: the parent object of the current item (such as the parent form record, or the upper-level association object).
- **Index (starts from 0)**: the position of the current item in the list, useful for calculations or distinguishing items.

**Example 1: Default value for new rows in a sub-form**

- Goal: when adding a new row, pre-fill `Owner/Created by` with the current user.
- Config: select the target field → choose **Default value** → select **Current user** as the value source.

**Example 2: Inherit values from the parent form**

- Goal: a field in the sub-form defaults to a field in the parent form (e.g., `Customer`, `Project`).
- Config: choose **Parent item** as the value source and pick the corresponding field.

![Variable panel (Current item / Parent item / Index)](https://static-docs.nocobase.com/placeholder.png)

![Sub-form default value (reading from Parent item)](https://static-docs.nocobase.com/placeholder.png)

## Priority & FAQ

### Priority

If the same field is configured in both:

- **Field values** (Form/Filter form), and
- **Assign value** actions in **Field linkage rules**,

then the linkage rule assignment takes precedence.

### Why doesn’t default value work in edit forms?

Default values are primarily designed for **new entries**, to avoid overwriting existing data. In edit forms, only new rows/items in sub-forms/sub-tables will apply default values.

### How to clear a value?

Choose **Null** as the value source and save.

### Rule ordering

Rules run in order, and later rules may override earlier ones. Put more specific/higher priority rules later.
