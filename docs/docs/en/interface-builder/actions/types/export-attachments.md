---
pkg: "@nocobase/plugin-action-export-pro"
---
# Export Attachments

:::tip Tip
This feature is provided by the commercial plugin `plugin-action-export-pro`. Please check the commercial license for details.
:::

## Introduction

Attachment export supports exporting attachment-related fields as a compressed package.

#### Attachment Export Configuration



![20251029173251](https://static-docs.nocobase.com/20251029173251.png)





![20251029173425](https://static-docs.nocobase.com/20251029173425.png)





![20251029173345](https://static-docs.nocobase.com/20251029173345.png)



- Configure the attachment fields to be exported; multiple selections are supported.
- You can choose whether to generate a folder for each record.

File naming rules:

- If you choose to generate a folder for each record, the file naming rule is: `{Title field value of the record}/{Attachment field name}[-{File sequence number}].{File extension}`.
- If you choose not to generate a folder, the file naming rule is: `{Title field value of the record}-{Attachment field name}[-{File sequence number}].{File extension}`.

The file sequence number is automatically generated when an attachment field contains multiple attachments.


- [Linkage Rule](/interface-builder/actions/action-settings/linkage-rule): Dynamically show/hide the button;
- [Edit Button](/interface-builder/actions/action-settings/edit-button): Edit the button's title, type, and icon;