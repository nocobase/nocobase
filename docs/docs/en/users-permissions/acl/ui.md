# Application in the UI

## Data Block Permissions

The visibility of a collection's data block is controlled by the View action permission (individually configured permissions have higher priority than global ones).

As shown below: Under global permissions, the admin has all permissions. The Orders collection is configured with individual permissions (not visible).

The global permission configuration is as follows:


![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)


The individual permission configuration for the Orders collection is as follows:


![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)


In the UI, this means that all blocks for the Orders collection will not be displayed.

The complete configuration process is as follows:


![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)


## Field Permissions

View: Controls whether a field is visible at the field level. For example, controlling which fields of the Orders collection are visible to a certain role.


![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)


In the UI, this means that only fields with configured permissions are displayed in the blocks of the Orders collection. System fields (Id, CreateAt, Last updated at) have view permission even if not configured.


![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)


- Edit: Controls whether a field can be edited and saved (updated).

As shown, configure the edit permissions for the fields of the Orders collection (Quantity and the associated Product have edit permissions).


![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)


In the UI, this means that the form block for the edit action in the Orders collection's block will only display fields with edit permissions.


![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)


The complete configuration process is as follows:


![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)


- Add: Controls whether a field can be added (created).

As shown, configure the add permissions for the fields of the Orders collection (Order Number, Quantity, Product, and Waybill have add permissions).


![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)


In the UI, this means that the form block for the add action in the Orders collection's block will only display fields with add permissions.


![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)


- Export: Controls whether a field can be exported.
- Import: Controls whether a field is supported for import.

## Action Permissions

Individually configured permissions have the highest priority. If individual permissions are configured, they are used; otherwise, the global configuration is followed.

- Add, controls whether the add action button is displayed in the block.

As shown, the Orders collection is individually configured with action permissions, allowing adding.


![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)


In the UI, this means the add button is displayed in the action area of the Orders collection's block.


![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)


- View

Controls whether the data block is displayed.

As shown, the global permission configuration is as follows (no view permission).


![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)


The individual permission configuration for the Orders collection is as follows:


![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)


In the UI, this means: all blocks for other collections are not displayed, while the blocks for the Orders collection are displayed.

The complete example configuration process is as follows:


![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)


- Edit

Controls whether the edit action button within the block is displayed.


![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)


By setting the data scope, you can further control the action's permissions.

As shown, set it so that users can only edit their own data in the Orders collection.


![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)


- Delete

Controls the display of the delete action button in the block.


![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)


- Export

Controls the display of the export action button in the block.

- Import

Controls the display of the import action button in the block.

## Relationship Permissions

### As a Field

- The permission of an association field is controlled by the field permissions of the source collection, which determines whether the entire association field component is displayed.

As shown, the Customer association field in the Orders collection only has view, import, and export permissions.


![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)


In the UI, this means the Customer association field will not be displayed in the add and edit action blocks of the Orders collection's block.

The complete example configuration process is as follows:


![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)


- The permissions for fields within an association field component (such as a sub-table/sub-form) are determined by the permissions of the target collection.

When the association field component is a sub-form:

As shown below, for the "Customer" association field in the Orders collection, the "Customer" association field itself has all permissions, but the Customers collection is set with individual read-only permissions.

The individual permission configuration for the Orders collection is as follows, the "Customer" association field has all field permissions:


![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)


The individual permission configuration for the Customers collection is as follows, the fields in the Customers collection only have view permission:


![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)


In the UI, this means: the Customer association field is visible in the Orders collection's block, but when switched to a sub-form, the fields within the sub-form are visible in the details view but not displayed in the create and edit actions.

The complete example configuration process is as follows:


![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)


Further control field permissions within the sub-form: individual fields have permissions.

As shown, individually configure field permissions for the Customers collection (Customer Name is not visible and not editable).


![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)


The complete example configuration process is as follows:


![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)


The situation is the same when the association field component is a sub-table as it is for a sub-form:

As shown, the Orders collection has a "Waybill" association field. The "Waybill" association field in the order has all permissions, but the Waybills collection is set with individual read-only permissions.

In the UI, this means: the association field is visible, but when switched to a sub-table, the fields within the sub-table are visible in the view action but not in the create and edit actions.


![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)


Further control field permissions within the sub-table: individual fields have permissions.


![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)


### As a Block

- The permission of an association block is controlled by the permissions of the target collection of the corresponding association field, and is independent of the association field's permission.

As shown, whether the "Customer" association block is displayed is controlled by the permissions of the Customers collection.


![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)


- The fields within an association block are controlled by the field permissions in the target collection.

As shown, set individual fields in the Customers collection to have view permission.


![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)