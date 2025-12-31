---
pkg: "@nocobase/plugin-ui-templates"
---

# Field template

## Introduction

Field templates are used to reuse the field section configuration (field selection, layout, and field settings) in **Form blocks** and **Details blocks**, so you don’t need to add the same fields repeatedly across pages/blocks.

> A field template only applies to the field section and does not replace the entire block. To reuse an entire block, use [Block template](/interface-builder/blocks/other-blocks/block-template).

## Prerequisite: create a block template first

Field templates come from **Block templates**. It is recommended to first create a block template from a Form/Details block that already has the fields configured:

1) Open the block settings menu and click `Save as template`  
2) Fill in the template name/description and save

![save-as-template-form-20251228](https://static-docs.nocobase.com/save-as-template-form-20251228.png)

## Use a field template in Form/Details blocks

1) Enter configure mode and open the “Fields” menu in a Form block or Details block  
2) Select `Field template`  
3) Select a template and choose a mode:
   - `Reference`: reference the template fields and keep all references in sync
   - `Duplicate`: duplicate the template fields as an independent configuration; later changes won’t sync

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

### Reference vs Duplicate

- `Reference`: all references share the same field section configuration. Changes made to the template (or in any referenced place) will be synchronized everywhere.
- `Duplicate`: creates a standalone field configuration at the time of duplication. Later changes to the template or other blocks will not be synchronized here.

### Overwrite prompt

If the block already has fields, using **Reference** mode usually asks for confirmation (because referenced fields will replace the current field section).

## Convert referenced fields to duplicate

When a block is referencing a field template, you can use `Convert reference fields to duplicate` in the block settings menu to make the current field section an independent configuration.

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

## Notes

- Field templates are supported only in **Form blocks** and **Details blocks**.
- If the template’s collection binding does not match the current block, the template will be disabled in the selector with a reason.
- If you need to customize fields in the current block, use `Duplicate` mode, or run “Convert reference fields to duplicate” first.
