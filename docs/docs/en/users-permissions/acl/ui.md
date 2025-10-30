# Application in UI

## Data Block Permissions

Visibility of data blocks in a data table is controlled by view operation permissions, with individual configurations taking precedence over global settings.

For example, under global permissions, the "admin" role has full access, but the order table may have individual permissions configured, making it invisible.

Global permission configuration:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Order table individual permission configuration:

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

In the UI, all blocks in the order table are not displayed.

Complete configuration process:

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Field Permissions

**View**: Determines whether specific fields are visible at the field level, allowing control over which fields are visible to certain roles within the order table.

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

In the UI, only fields with configured permissions are visible within the order table block. System fields (Id, CreatedAt, LastUpdatedAt) retain view permissions even without specific configuration.

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- **Edit**: Controls whether fields can be edited and saved (updated).

  Configure edit permissions for order table fields (quantity and associated items have edit permissions):

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  In the UI, only fields with edit permissions are shown in the edit operation form block within the order table.

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Complete configuration process:

  ![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Add**: Determines whether fields can be added (created).

  Configure add permissions for order table fields (order number, quantity, items, and shipment have add permissions):

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  In the UI, only fields with add permissions are displayed within the add operation form block of the order table.

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Export**: Controls whether fields can be exported.
- **Import**: Controls whether fields can be imported.

## Operation Permissions

Individually configured permissions take the highest priority. If specific permissions are configured, they override global settings; otherwise, the global settings are applied.

- **Add**: Controls whether the add operation button is visible within a block.

  Configure individual operation permissions for the order table to allow adding:

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  When the add operation is permitted, the add button appears within the operation area of the order table block in the UI.

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **View**: Determines whether the data block is visible.

  Global permission configuration (no view permission):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  Order table individual permission configuration:

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  In the UI, data blocks for other data tables remain hidden, but the order table block is shown.

  Complete example configuration process:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Edit**: Controls whether the edit operation button is displayed within a block.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  Operation permissions can be further refined by setting the data scope.

  For example, setting the order data table so users can only edit their own data:

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Delete**: Controls whether the delete operation button is visible within a block.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Export**: Controls whether the export operation button is visible within a block.

- **Import**: Controls whether the import operation button is visible within a block.

## Relationship Permissions

### When Used as a Field

- The visibility of a relationship field is determined by the permissions set on the source table's fields. These permissions control whether the entire relationship field component appears in the user interface.

For example, in the Order table, the "Customer" relationship field is restricted to view and import/export permissions:

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

In the UI, this configuration ensures that the "Customer" relationship field does not appear in the add and edit operation sections of the Order table.

Complete example configuration process:

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- The permissions for fields within the relationship field component (such as those found in sub-tables or sub-forms) are determined by the permissions of the target data table.

When the relationship field component is a sub-form:

As shown, the "Customer" relationship field in the Order table is granted full permissions, while the Customer table itself is configured to be read-only.

Order table individual permission configuration, "Customer" relationship field has all field permissions:

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

Customer table individual permission configuration, fields in the Customer table have view-only permissions:

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

In the UI, this configuration results in the "Customer" relationship field being visible in the Order table section. However, when the interface is switched to a sub-form (where fields within the sub-form are visible in the details but hidden during new or edit operations), the behavior changes accordingly.

Complete example configuration process:

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Further refinement of sub-form field permissions allows individual fields to be specifically controlled.

For instance, the Customer table can be configured so that the "Customer Name" field is neither visible nor editable:

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Complete example configuration process:

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

When the relationship field component is a sub-table, the situation is consistent with sub-forms:

As illustrated, the "Shipment" relationship field in the Order table has full permissions, while the Shipment table is set to read-only.

In the UI, this setup allows the relationship field to be visible. However, when the interface is switched to a sub-table (where fields within the sub-table are visible during viewing operations but hidden during new or edit operations), the behavior adjusts accordingly.

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Fine-tuning sub-table field permissions also enables specific control over individual fields:

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### When Used as a Block

- The visibility of a relationship block is governed by the permissions set on the target table associated with the relationship field, independent of the permissions on the relationship field itself.

For example, the visibility of the "Customer" relationship block is controlled by the permissions configured for the Customer table:

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- The fields within a relationship block are controlled by the permissions set on the target table's fields.

As depicted below, the Customer table can be configured to allow viewing of specific fields only:

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)
