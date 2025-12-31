---
pkg: "@nocobase/plugin-ui-templates"
---

# Block template

## Introduction

Block templates let you reuse a configured block without rebuilding it each time.

## Create a block template

1) Open a configured block’s settings menu and click `Save as template`  
2) Fill in `Template name` / `Template description` and choose a save mode:
   - `Convert current block to template`: replaces the current block with a `Block template` block (referencing the template)
   - `Duplicate current block as template`: only creates the template; the current block stays unchanged

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

## Use a block template

1) Add a block → Other blocks → `Block template`  
2) Configure:
   - `Template`: select a template
   - `Mode`:
     - `Reference`: all places that reference the template stay in sync
     - `Duplicate`: creates an independent copy; later changes won’t sync

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Reference vs Duplicate

- `Reference`: all references share the same configuration. Changes made in the template (or in any referenced place) will be reflected everywhere.
- `Duplicate`: creates a standalone copy at the time of duplication. Later changes won’t be synchronized.

## Manage templates

Go to Settings → `UI templates` → `Block templates (v2)` to search/edit/delete templates.

> Note: If a template is currently referenced, it cannot be deleted. Use `Convert reference to duplicate` on those blocks to detach from the template first, then delete the template.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

## Convert reference to duplicate (detach from template)

If a block is currently referencing a template, use `Convert reference to duplicate` in the block menu to turn it into an independent block.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

## Notes

- In `Duplicate` mode, all UIDs (including child node UIDs) will be regenerated. Some UID-based configurations may need to be reconfigured.
