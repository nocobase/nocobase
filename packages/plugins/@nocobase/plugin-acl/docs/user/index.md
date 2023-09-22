---
sort: 1
---

# 使用手册

## 介绍

plugin-acl 是 Nocobase 的权限管理插件，基于角色、资源和操作的权限控制。

## 管理中心

### 角色的增删改

角色标识（系统唯一标识），可以自定义默认角色，不可将系统默认角色删除

![](static/VyxBbfoiroInxqxENg6cLtHhnNh.png)

### 设置默认角色

这里的默认角色是指当新建的用户没有配角色时，默认用哪个角色

![](static/JSuhbNTpGoisp4xyqVxcoyzmnWb.png)

### 权限配置

#### 通用权限配置

![](static/IaFXbgy99ocqQZxNuVkcaUMonQc.png)

1. Allows to install, activate, disable plugins：该权限控制是否允许用户启用或禁用插件。激活此权限后，用户可以访问插件管理器界面。"admin" 角色默认启用此权限。
2. Allows to configure interface：该权限控制是否允许用户配置界面。激活此权限后，出现 UI 配置按钮。"admin" 角色默认启用此权限。
3. Allows to configure plugins：该权限控制是否允许用户配置插件参数或管理插件后台数据。"admin" 角色默认启用此权限。
4. Allows to clear cache, reboot application：该权限控制的是用户的系统运维权限： Clear cache 和 Restart application。激活后，相关操作按钮将出现在个人中心,默认不启用。
5. Menu permissions：默认新建的菜单允许访问

#### 全局操作权限

全局操作权限对全局生效（所有数据表）按照操作类型划分，这些权限支持根据数据范围维度配置：所有数据和自己的数据。前者允许对整个数据表执行操作，而后者限制仅能处理自己相关的数据。

#### 数据表操作权限

![](static/KXvxbJTs5oi2yTxiDdycemCnnUd.png)

![](static/Q50XbolCgoWqbax7lm5cY8fGnEe.png)

数据表操作权限进一步细化了全局操作权限，可以针对每个数据表的资源访问进行个别的权限配置。这些权限分为两个方面：

1. Action permission：操作权限包括添加、查看、编辑、删除、导出和导入操作。这些权限根据数据范围的维度进行配置：

   - All records：允许用户对数据表中的所有记录执行操作。
   - Own records：限制用户仅对自己创建的数据记录执行操作。
2. Field permission：字段权限允许对每个字段在不同操作中进行权限配置。例如，某些字段可以配置为只允许查看而不允许编辑。

#### 菜单访问权限

菜单访问权限以菜单为维度控制访问权限

![](static/JkZhbEw8Moukujx1RvYcSEfpnAc.png)

#### 插件配置权限

插件配置权限用于控制对特定插件参数的配置权限，当插件配置权限勾选后管理中心将出现对应的插件管理界面

![](static/TZcLbWfB7ojQmhxGXskcMhWAn3c.png)

## 个人中心

### 角色切换

![](static/XkAabMQWoo4PbGxA01CcMGGmnoe.png)

可以为一个用户分配多个角色，当用户拥有多个角色时，可在个人中心切换角色

![](static/UyqHb5Ky4ohClpxl2j9ciCK7nbg.png)

用户进入系统的的默认角色优先级为:上一次切换的角色（每次切换角色时会更新默认角色值）>  第一个角色（系统默认角色）

## 在 UI 中的应用
