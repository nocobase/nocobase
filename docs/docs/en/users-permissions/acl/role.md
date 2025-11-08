---
pkg: '@nocobase/plugin-acl'
---

# Roles

## Management Center

### Role Management


![](https://static-docs.nocobase.com/da7083c67d794e23dc6eb0f85b1de86c.png)


The application comes with two predefined roles: "Admin" and "Member," each with distinct default permission settings tailored to their functionalities.

### Adding, Deleting, and Modifying Roles

The role identifier, a unique system identifier, allows customization of default roles, but the system's predefined roles cannot be deleted.


![](https://static-docs.nocobase.com/35f323b346db4f9f12f9bee4dea63302.png)


### Setting the Default Role

The default role is the one automatically assigned to new users if no specific role is provided during their creation.


![](https://static-docs.nocobase.com/f41bba7ff55ca28715c486dc45bc1708.png)


## Personal Center

### Role Switching

Users can be assigned multiple roles and switch between them in the personal center.


![](https://static-docs.nocobase.com/e331d11ec1ca3b8b7e0472105b167819.png)


The default role when logging in is determined by the most recently switched role (this value updates with each switch) or, if not applicable, the first role (system default role).