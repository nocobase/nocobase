---
pkg: '@nocobase/plugin-acl'
---

# Configuring Permissions

## General Permission Settings


![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)


### Configuration Permissions

1. **Allows to configure interface**: This permission governs whether a user can configure the interface. Activating it adds a UI configuration button. The "admin" role has this permission enabled by default.
2. **Allows to install, activate, disable plugins**: This permission dictates whether a user can enable or disable plugins. When active, the user gains access to the plugin manager interface. The "admin" role has this permission enabled by default.
3. **Allows to configure plugins**: This permission lets the user configure plugin parameters or manage plugin backend data. The "admin" role has this permission enabled by default.
4. **Allows to clear cache, reboot application**: This permission is tied to system maintenance tasks like clearing the cache and restarting the application. Once activated, related operation buttons appear in the personal center. This permission is disabled by default.
5. **New menu items are allowed to be accessed by default**: Newly created menus are accessible by default, and this setting is enabled by default.

### Global Action Permissions

Global action permissions apply universally to all collections and are categorized by operation type. These permissions can be configured based on data scope: all data or the user's own data. The former allows operations on the entire collection, while the latter restricts operations to data relevant to the user.

## Collection Action Permissions


![](https://static-docs.nocobase.com/6a6e0281391cecdea5b5218e6173c5d7.png)



![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)


Collection action permissions allow fine-tuning of global action permissions by configuring access to resources within each collection. These permissions are divided into two aspects:

1. **Action permissions**: These include adding, viewing, editing, deleting, exporting, and importing actions. Permissions are set based on data scope:
   - **All records**: Grants the user the ability to perform actions on all records within the collection.
   - **Own records**: Restricts the user to perform actions only on records they have created.

2. **Field Permissions**: Field permissions enable you to set specific permissions for each field during different operations. For instance, certain fields can be configured to be view-only, without editing privileges.

## Menu Access Permissions

Menu access permissions control access based on menu items.


![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)


## Plugin Configuration Permissions

Plugin configuration permissions control the ability to configure specific plugin parameters. When enabled, the corresponding plugin management interface appears in the admin center.


![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)