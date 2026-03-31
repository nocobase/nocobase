---

pkg: '@nocobase/plugin-action-duplicate'

---

# Duplicate

## Introduction

The Duplicate action allows users to quickly create new records based on existing data. Two duplication modes are supported: **Direct duplicate** and **Copy into the form and continue to fill in**.

## Installation

Built-in plugin, no separate installation required.

## Duplication Modes

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Direct Duplicate

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Executes as "Direct duplicate" by default;
- **Template fields**: Specify the fields to duplicate. At least one field must be selected.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Click the button to duplicate the data after configuration.

### Copy into the Form and Continue to Fill in

The configured template fields are populated into the form as **default values**, allowing users to modify and submit to complete the duplication.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Configure template fields**: Only selected fields will be carried over as default values.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Sync from Form Fields

- Automatically parses the fields configured in the current form block as template fields;
- If the form block fields are modified later (e.g., association field component changes), you need to reopen the template configuration and click **Sync from form fields** to ensure consistency.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Template data is populated as form default values. Users can modify and submit to complete the duplication.

### Additional Notes

#### Copy, Reference, and Preload

Different fields (association types) have different processing logic: **Copy / Reference / Preload**. The **field component** of association fields also affects the processing logic:

- Select / Record picker: Used for **Reference**
- Sub-form / Sub-table: Used for **Copy**

**Copy**

- Regular fields are copied;
- hasOne / hasMany can only be copied (these associations should not use select-type field components like dropdown select or record picker; use sub-form or sub-table components instead);
- Component changes for hasOne / hasMany **will not** change the processing logic (remains as copy);
- For copied association fields, all sub-fields can be selected.

**Reference**

- belongsTo / belongsToMany use reference;
- If the field component is changed from "Dropdown select" to "Sub-form", the association changes from **reference to copy** (once changed to copy, all sub-fields become selectable).

**Preload**

- Association fields under a referenced field use preload;
- Preloaded fields may change to reference or copy after component changes.

#### Select All

- Selects all **copy fields** and **reference fields**.

#### Fields Filtered from Template Records

- Primary keys of copied association data are filtered; primary keys for reference and preload are not filtered;
- Foreign keys;
- Fields that do not allow duplicates;
- Sort fields;
- Auto-encoding fields;
- Password;
- Created by, Created date;
- Last updated by, Last updated date.

#### Sync from Form Fields

- Automatically parses the fields configured in the current form block as template fields;
- After modifying form block fields (e.g., association field component changes), re-sync is required to ensure consistency.
