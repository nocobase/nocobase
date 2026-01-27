---
pkg: '@nocobase/plugin-acl'
---

# 角色

## 管理中心

### 角色的管理

![](https://static-docs.nocobase.com/da7083c67d794e23dc6eb0f85b1de86c.png)

初始化安装的应用内置了两个角色，分别是 "Admin" 和 "Member"，它们具有不同的默认权限设置。

### 角色的增删改

角色标识（系统唯一标识），可以自定义默认角色，不可将系统默认角色删除

![](https://static-docs.nocobase.com/35f323b346db4f9f12f9bee4dea63302.png)

### 设置默认角色

这里的默认角色是指当新建的用户没有配角色时，默认用哪个角色

![](https://static-docs.nocobase.com/f41bba7ff55ca28715c486dc45bc1708.png)

## 个人中心

### 角色切换

可以为一个用户分配多个角色，当用户拥有多个角色时，可在个人中心切换角色

![](https://static-docs.nocobase.com/e331d11ec1ca3b8b7e0472105b167819.png)

用户进入系统的的默认角色优先级为：上一次切换的角色（每次切换角色时会更新默认角色值）> 第一个角色（系统默认角色）
