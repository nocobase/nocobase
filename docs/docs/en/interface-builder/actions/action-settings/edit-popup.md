# Edit popup

## Introduction

Any action or field that opens a popup when clicked supports configuring the popup's open mode, size, etc.
![20251027212617](https://static-docs.nocobase.com/20251027212617.png)



![edit-popup-full-20251228](https://static-docs.nocobase.com/edit-popup-full-20251228.png)


## Open Mode

- Drawer


![20251027212832](https://static-docs.nocobase.com/20251027212832.png)


- Dialog


![20251027212905](https://static-docs.nocobase.com/20251027212905.png)


- Sub-page


![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Popup Size

- Large
- Medium (default)
- Small

## Popup templates

Popup templates let you reuse a popup UI and interaction logic.

### Save a popup as a template

1) Open the settings menu of a button/field that opens a popup, click `Save as template`  
2) Fill in template name/description and choose a save mode:
   - `Convert current popup to template`: after saving, the current popup will start referencing this template
   - `Duplicate current popup as template`: only creates the template; the current popup stays unchanged

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Use a template in popup settings

1) Open the popup settings of the button/field  
2) Select a template in `Popup template`

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Requirements (template availability)

Popup templates depend on the action context. The selector will automatically filter/disable incompatible templates (and show a reason).

- **Collection action buttons**: only templates created from **Collection actions**, and the **collection must match**.
- **Non-association Record actions**: templates created from **Non-association Record actions** and **Collection actions** are available, and the **collection must match**.
- **Association Record actions**: templates created from **Non-association Record actions** and **Collection actions** are available (the **collection must match**). Templates created from **Association Record actions** are also available, but they must match the **same association field** (the same association).

### Reference vs Duplicate

- `Reference`: opens the popup from a template; updates to the template affect all references.
- `Duplicate`: detach via `Convert reference to duplicate`; later changes only affect the current popup.

### Manage popup templates

Go to Settings → `UI templates` → `Popup templates (v2)` to search/edit/delete templates.

> Note: If a template is currently referenced, it cannot be deleted. Use `Convert reference to duplicate` to detach first, then delete the template.

### Convert reference to duplicate

When the popup is referencing a template, use `Convert reference to duplicate` in the settings menu to make it independent.

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)
