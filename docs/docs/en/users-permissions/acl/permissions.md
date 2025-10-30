# Configure Permissions

## General Permission Configuration


![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)


### Configure Permissions

1. Allow configuring interface: This permission controls whether users are allowed to configure the interface. After activating this permission, the UI configuration button appears. The "admin" role has this permission enabled by default.
2. Allow installing, activating, and disabling plugins: This permission controls whether users are allowed to enable or disable plugins. After activating this permission, users can access the plugin manager interface. The "admin" role has this permission enabled by default.
3. Allow configuring plugins: This permission controls whether users are allowed to configure plugin parameters or manage plugin backend data. The "admin" role has this permission enabled by default.
4. Allow clearing cache and restarting the application: This permission controls the user's system operation and maintenance permissions: clearing the cache and restarting the application. After activation, the relevant action buttons will appear in the personal center. It is disabled by default.
5. New menu items are allowed access by default: By default, newly created menus are allowed access. Enabled by default.

### Global Action Permissions

Global action permissions take effect globally (for all collections) and are divided by action type. They support configuration based on the data scope dimension: all data and own data. The former allows performing actions on the entire collection, while the latter restricts actions to only one's own data.

## Collection Action Permissions


![](https://static-docs.nocobase.com/6a6e0281391cecdea5b5218e6173c5d7.png)



![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)


Collection action permissions further refine global action permissions, allowing for individual permission configuration for resource access to each collection. These permissions are divided into two aspects:

1. Action Permissions: Action permissions include add, view, edit, delete, export, and import actions. These permissions are configured based on the data scope dimension:
   - All data: Allows users to perform actions on all records in the collection.
   - Own data: Restricts users to performing actions only on the data records they have created.

2. Field Permissions: Field permissions allow for configuring permissions for each field in different actions. For example, some fields can be configured to be view-only and not editable.

## Menu Access Permissions

Menu access permissions control access rights based on the menu dimension.


![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)


## Plugin Configuration Permissions

Plugin configuration permissions are used to control the permission to configure specific plugin parameters. When the plugin configuration permission is checked, the corresponding plugin management interface will appear in the admin center.


![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)