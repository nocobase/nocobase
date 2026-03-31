---
pkg: "@nocobase/plugin-action-export"
---
# Export

## Introduction

The export feature allows filtered records to be exported in **Excel** format, and supports configuring the fields to be exported. Users can select the fields they need to export for subsequent data analysis, processing, or archiving. This feature enhances the flexibility of data operations, especially in scenarios where data needs to be transferred to other platforms or further processed.

### Feature Highlights:
- **Field Selection**: Users can configure and select the fields to be exported, ensuring the exported data is accurate and concise.
- **Excel Format Support**: The exported data will be saved as a standard Excel file, making it easy to integrate and analyze with other data.

With this feature, users can easily export key data from their work for external use, improving work efficiency.


![20251029170811](https://static-docs.nocobase.com/20251029170811.png)

## Action Configuration


![20251029171452](https://static-docs.nocobase.com/20251029171452.png)


### Exportable Fields

- First level: All fields of the current collection;
- Second level: If it is an association field, you need to select fields from the associated collection;
- Third level: Only three levels are processed; the association fields at the last level are not displayed;


![20251029171557](https://static-docs.nocobase.com/20251029171557.png)


- [Linkage Rule](/interface-builder/actions/action-settings/linkage-rule): Dynamically show/hide the button;
- [Edit Button](/interface-builder/actions/action-settings/edit-button): Edit the button's title, color, and icon;