---
pkg: '@nocobase/plugin-acl'
---

# Application in UI

## Data Block Permissions

Visibility of data blocks in a collection is controlled by view action permissions, with individual configurations taking precedence over global settings.

For example, under global permissions, the "admin" role has full access, but the Orders collection may have individual permissions configured, making it invisible.

Global permission configuration:


![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)


Orders collection individual permission configuration:


![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)


In the UI, all blocks in the Orders collection are not displayed.

Complete configuration process:


![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)


## Field Permissions

**View**: Determines whether specific fields are visible at the field level, allowing control over which fields are visible to certain roles within the Orders collection.


![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)


In the UI, only fields with configured permissions are visible within the Orders collection block. System fields (Id, CreatedAt, LastUpdatedAt) retain view permissions even without specific configuration.


![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)


- **Edit**: Controls whether fields can be edited and saved (updated).

  Configure edit permissions for Orders collection fields (quantity and associated items have edit permissions):

  
![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)


  In the UI, only fields with edit permissions are shown in the edit action form block within the Orders collection.

  
![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)


  Complete configuration process:

  
![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)


- **Add**: Determines whether fields can be added (created).

  Configure add permissions for Orders collection fields (order number, quantity, items, and shipment have add permissions):

  
![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)


  In the UI, only fields with add permissions are displayed within the add action form block of the Orders collection.

  
![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)


- **Export**: Controls whether fields can be exported.
- **Import**: Controls whether fields support import.

## Action Permissions

Individually configured permissions take the highest priority. If specific permissions are configured, they override global settings; otherwise, the global settings are applied.

- **Add**: Controls whether the add action button is visible within a block.

  Configure individual action permissions for the Orders collection to allow adding:

  
![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)


  When the add action is permitted, the add button appears within the action area of the Orders collection block in the UI.

  
![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)


- **View**: Determines whether the data block is visible.

  Global permission configuration (no view permission):

  
![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)


  Orders collection individual permission configuration:

  
![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)


  In the UI, data blocks for all other collections remain hidden, but the Orders collection block is shown.

  Complete example configuration process:

  
![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)


- **Edit**: Controls whether the edit action button is displayed within a block.

  
![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)


  Action permissions can be further refined by setting the data scope.

  For example, setting the Orders collection so users can only edit their own data:

  
![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)


- **Delete**: Controls whether the delete action button is visible within a block.

  
![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)


- **Export**: Controls whether the export action button is visible within a block.

- **Import**: Controls whether the import action button is visible within a block.

## Association Permissions

### As a Field

- The permissions of an association field are controlled by the field permissions of the source collection. This controls whether the entire association field component is displayed.

For example, in the Orders collection, the association field "Customer" only has view, import, and export permissions.


![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)


In the UI, this means the "Customer" association field will not be displayed in the add and edit action blocks of the Orders collection.

Complete example configuration process:


![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)


- The permissions for fields within the association field component (such as a sub-table or sub-form) are determined by the permissions of the target collection.

When the association field component is a sub-form:

As shown below, the "Customer" association field in the Orders collection has all permissions, while the Customers collection itself is set to read-only.

Individual permission configuration for the Orders collection, where the "Customer" association field has all field permissions:


![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)


Individual permission configuration for the Customers collection, where fields have view-only permissions:


![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)


In the UI, the "Customer" association field is visible in the Orders collection block. However, when switched to a sub-form, the fields within the sub-form are visible in the details view but are not displayed in the add and edit actions.

Complete example configuration process:


![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)


To further control permissions for fields within the sub-form, you can grant permissions to individual fields.

As shown, the Customers collection is configured with individual field permissions (Customer Name is not visible and not editable).


![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)


Complete example configuration process:


![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)


When the association field component is a sub-table, the situation is consistent with that of a sub-form:

As shown, the "Shipment" association field in the Orders collection has all permissions, while the Shipments collection is set to read-only.

In the UI, this association field is visible. However, when switched to a sub-table, the fields within the sub-table are visible in the view action but not in the add and edit actions.


![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)


To further control permissions for fields within the sub-table, you can grant permissions to individual fields:


![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)


### As a Block

- The visibility of an association block is controlled by the permissions of the target collection of the corresponding association field, and is independent of the association field's permissions.

For example, whether the "Customer" association block is displayed is controlled by the permissions of the Customers collection.


![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)


- The fields within an association block are controlled by the field permissions in the target collection.

As shown, you can set view permissions for individual fields in the Customers collection.


![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)