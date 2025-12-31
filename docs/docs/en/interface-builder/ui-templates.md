---
pkg: "@nocobase/plugin-ui-templates"
---

# UI Templates

## Introduction

UI templates are used to reuse configurations in interface building, reducing repetitive setup and keeping multiple configurations in sync when needed.

Currently supported template types include:

- Block Template: Reuse entire block configurations
- Field Template: Reuse "fields" configurations in form/detail blocks
- Popup Template: Reuse popup configurations triggered by actions/fields

## Core Concepts

### Reference and Duplicate

There are typically two ways to use templates:

- `Reference`: Multiple places share the same template configuration; modifying the template or any reference point will sync updates to all other reference points.
- `Duplicate`: Duplicate as an independent configuration; subsequent modifications do not affect each other.

### Save as Template

When a block/popup is already configured, you can use `Save as template` in its settings menu and choose the save method:

- `Convert current... to template`: After saving, the current position will switch to referencing that template.
- `Duplicate current... as template`: Only creates the template, the current position remains unchanged.

## Block Template

### Save Block as Template

1) Open the settings menu of the target block, click `Save as template`
2) Fill in `Template name` / `Template description`, and choose the save mode:
   - `Convert current block to template`: After saving, the current position will be replaced with a `Block template` block (i.e., referencing that template)
   - `Duplicate current block as template`: Only creates the template, the current block remains unchanged

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Use Block Template

1) Add block → "Other blocks" → `Block Template`
2) In the configuration, select:
   - `Template`: Choose a template
   - `Mode`:
     - `Reference`
     - `Duplicate`

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Convert Reference to Duplicate

When a block is referencing a template, you can use `Convert reference to duplicate` in the block settings menu to change the current block to a regular block (disconnect the reference), subsequent modifications will not affect each other.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Notes

- `Duplicate` mode will regenerate UIDs for the block and its child nodes, some configurations that depend on UIDs may need to be reconfigured.

## Field Template

Field templates are used to reuse field area configurations (field selection, layout, and field settings) in **form blocks** and **detail blocks**, avoiding repetitive field addition across multiple pages/blocks.

> Field templates only affect the "field area" and do not replace the entire block. To reuse an entire block, please use Block Template described above.

### Use Field Template in Form/Detail Blocks

1) Enter configuration mode, open the "Fields" menu in a form block or detail block
2) Select `Field Template`
3) Choose a template and select mode:
   - `Reference`
   - `Duplicate`

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Override Prompt

When fields already exist in the block, using **Reference** mode will usually prompt for confirmation (because referenced fields will replace the current field area).

### Convert Referenced Fields to Duplicate

When a block is referencing a field template, you can use `Convert referenced fields to duplicate` in the block settings menu to make the current field area an independent configuration (disconnect the reference), subsequent modifications will not affect each other.

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Notes

- Field templates only apply to **form blocks** and **detail blocks**.
- When the template and current block are bound to different data tables, the template will be shown as unavailable in the selector with the reason displayed.
- If you want to make "personalized adjustments" to fields in the current block, it is recommended to use `Duplicate` mode directly, or first execute "Convert referenced fields to duplicate".

## Popup Template

Popup templates are used to reuse a set of popup interfaces and interaction logic. For general configurations like popup opening method and size, refer to [Edit Popup](/interface-builder/actions/action-settings/edit-popup).

### Save Popup as Template

1) Open the settings menu of a button/field that can trigger a popup, click `Save as template`
2) Fill in the template name/description and choose the save mode:
   - `Convert current popup to template`: After saving, the current popup will switch to referencing that template
   - `Duplicate current popup as template`: Only creates the template, the current popup remains unchanged

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Use Template in Popup Configuration

1) Open the popup configuration of the button/field
2) Select a template in `Popup template` to reuse

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Usage Conditions (Template Availability Range)

Popup templates are related to the action scenario that triggers the popup. The selector will automatically filter/disable incompatible templates based on the current scenario (with reasons displayed when conditions are not met).

- **Collection Action Button**: Can only use popup templates created by **Collection actions**, and the **Collection (data table) must match**.
- **Non-association Record Action**: Can use popup templates created by **Non-association Record actions**, as well as templates created by **Collection actions**, and the **Collection (data table) must match**.
- **Association Record Action**: Can use popup templates created by **Non-association Record actions** and **Collection actions** (Collection must match); can also use templates created by **Association Record actions**, but must strictly match operations on the **same association field** (same association relationship).

### Convert Reference to Duplicate

When a popup is referencing a template, you can use `Convert reference to duplicate` in the settings menu to make the current popup an independent configuration (disconnect the reference), subsequent modifications will not affect each other.

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Template Management

In System settings → `UI Templates`, you can view and manage all templates:

- **Block Templates (v2)**: Manage block templates
- **Popup Templates (v2)**: Manage popup templates

> Field templates originate from block templates and are managed within block templates.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Supported operations: View, Filter, Edit, Delete.

> **Note**: If a template is currently being referenced, it cannot be directly deleted. Please first use `Convert reference to duplicate` at the positions referencing that template to disconnect the reference, then delete the template.
