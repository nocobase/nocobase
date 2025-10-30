# Hand book

## **Management Center**

##### **Role Management**

The application comes with two predefined roles: "Admin" and "Member," each with distinct default permission settings tailored to their functionalities.

![](https://static-docs.nocobase.com/da7083c67d794e23dc6eb0f85b1de86c.png)

##### **Adding, Deleting, and Modifying Roles**

The role identifier, a unique system identifier, allows customization of default roles, but the system's predefined roles cannot be deleted.

![](https://static-docs.nocobase.com/35f323b346db4f9f12f9bee4dea63302.png)

##### **Setting the Default Role**

The default role is the one automatically assigned to new users if no specific role is provided during their creation.

![](https://static-docs.nocobase.com/f41bba7ff55ca28715c486dc45bc1708.png)

##### **Configuring Permissions**

###### **General Permission Settings**

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

1. **Allows to configure interface**: This permission governs whether a user can configure the interface. Activating it adds a UI configuration button. The "admin" role has this permission enabled by default.
2. **Allows to install, activate, disable plugins**: This permission dictates whether a user can enable or disable plugins. When active, the user gains access to the plugin manager interface. The "admin" role has this permission enabled by default.
3. **Allows to configure plugins**: This permission lets the user configure plugin parameters or manage plugin backend data. The "admin" role has this permission enabled by default.
4. **Allows to clear cache, reboot application**: This permission is tied to system maintenance tasks like clearing the cache and restarting the application. Once activated, related operation buttons appear in the personal center. This permission is disabled by default.
5. **New menu items are allowed to be accessed by default.**: Newly created menus are accessible by default, and this setting is enabled by default.

###### **Action permissions**

Action permissions apply universally to all data tables and are categorized by operation type. These permissions can be configured based on data scope: all data or the user's own data. The former allows operations on the entire data table, while the latter restricts operations to data relevant to the user.

##### **Data Table Operation Permissions**

![](https://static-docs.nocobase.com/6a6e0281391cecdea5b5218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Collection operation permissions allow fine-tuning of Action permissions by configuring access to resources within each data table. These permissions include:

1. **Action permissions**: These include adding, viewing, editing, deleting, exporting, and importing actions. Permissions are set based on data scope:
- **All records**: Grants the user the ability to perform actions on all records within the data table.
- **Own records**: Restricts the user to perform actions only on records they have created.

2. **Field Permissions**: Field permissions enable you to set specific permissions for each field during different operations. For instance, certain fields can be configured to be view-only, without editing privileges.

##### **Menu permissions**

Menu permissions control access based on menu items.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

##### **Plugin Configuration Permissions**

Plugin configuration permissions control the ability to configure specific plugin parameters. When enabled, the corresponding plugin management interface appears in the management center.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)

#### **Personal Center**

##### **Role Switching**

Users can be assigned multiple roles and switch between them in the personal center. The default role when logging in is determined by the most recently switched role (this value updates with each switch) or, if not applicable, the first role (system default role).

![](https://static-docs.nocobase.com/e331d11ec1ca3b8b7e0472105b167819.png)

#### **Application in UI**

##### **Data Block Permissions**

Visibility of data blocks in a data table is controlled by view operation permissions, with individual configurations taking precedence over global settings.

For example, under global permissions, the "admin" role has full access, but the order table may have individual permissions configured, making it invisible.

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

###### **Field Permissions**

- **View**: Determines whether specific fields are visible at the field level, allowing control over which fields are visible to certain roles within the order table.

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

In the UI, only fields with configured permissions are visible within the order table block. System fields (Id, CreatedAt, LastUpdatedAt) retain view permissions even without specific configuration.

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- **Edit**: Controls whether fields can be edited and saved (updated).

  In the UI, only fields with edit permissions are shown in the edit operation form block within the order table.

![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

Similarly, only fields with add permissions are shown in the add operation form block within the order table.

![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Add**: Determines whether fields can be added (created).

![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

In the UI, only fields with add permissions are displayed within the add operation form block of the order table.

![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Export**: Controls whether fields can be exported.
- **Import**: Controls whether fields can be imported.

##### **Operation Permissions**

Individually configured permissions take the highest priority. If specific permissions are configured, they override global settings; otherwise, the global settings are applied.

- **Add new**: Controls whether the add operation button is visible within a block.

![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

When the add operation is permitted, the add button appears within the operation area of the order table block in the UI.

![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **View**: Determines whether the data block is visible.

![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

In the UI, data blocks for other data tables remain hidden, but the order table block is shown if individual permissions are set.

![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Edit**: Controls whether the edit operation button is displayed within a block.

![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

Operation permissions can be further refined by setting the data scope.

![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Delete**: Controls whether the delete operation button is visible within a block.

![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Export**: Controls whether the export operation button is visible within a block.
- **Import**: Controls whether the import operation button is visible within a block.

#### Relationship Permissions

##### When Used as a Field

- The visibility of a relationship field is determined by the permissions set on the source table's fields. These permissions control whether the entire relationship field component appears in the user interface.

For example, in the Order table, the "Customer" relationship field is restricted to view and import/export permissions, as depicted below:

![Relationship Permissions Example](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

In the UI, this configuration ensures that the "Customer" relationship field does not appear in the add and edit operation sections of the Order table.

The complete configuration process is illustrated below:

![Example Configuration Process](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- The permissions for fields within the relationship field component (such as those found in sub-tables or sub-forms) are determined by the permissions of the target data table.

When the relationship field component is a sub-form:

In this case, as shown, the "Customer" relationship field in the Order table is granted full permissions, while the Customer table itself is configured to be read-only.

The permissions for the Order table are set as follows, granting the "Customer" relationship field full access:

![Order Table Permissions](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

The permissions for the Customer table are configured to allow view-only access:

![Customer Table Permissions](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

In the UI, this configuration results in the "Customer" relationship field being visible in the Order table section. However, when the interface is switched to a sub-form (where fields within the sub-form are visible in the details but hidden during new or edit operations), the behavior changes accordingly.

The complete configuration process is demonstrated below:

![Example Configuration Process](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Further refinement of sub-form field permissions allows individual fields to be specifically controlled.

For instance, as shown below, the Customer table can be configured so that the "Customer Name" field is neither visible nor editable:

![Customer Table Field Permissions](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

The complete configuration process for this setting is illustrated here:

![Example Configuration Process](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

When dealing with a sub-table instead of a sub-form, the configuration principles remain the same:

As illustrated, the "shipment" relationship field in the Order table has full permissions, while the shipment collection itself is set to read-only.

In the UI, this setup allows the relationship field to be visible. However, when the interface is switched to a sub-table (where fields within the sub-table are visible during viewing operations but hidden during new or edit operations), the behavior adjusts accordingly.

![shipment Relationship Field Permissions](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Fine-tuning sub-collection field permissions also enables specific control over individual fields.

![Sub-table Field Permissions](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

##### When Used as a Block

- The visibility of a relationship block is governed by the permissions set on the target table associated with the relationship field, independent of the permissions on the relationship field itself.

For example, the visibility of the "Customer" relationship block is controlled by the permissions configured for the Customer table:

![Relationship Block Visibility](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- The fields within a relationship block are controlled by the permissions set on the target table’s fields.

As depicted below, the Customer table can be configured to allow viewing of specific fields only:

![Customer Table Field View Permissions](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)
