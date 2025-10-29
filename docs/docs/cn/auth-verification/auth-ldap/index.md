# 认证：LDAP

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## 介绍

认证：LDAP 插件遵循 LDAP (Lightweight Directory Access Protocol) 协议标准，实现用户使用 LDAP 服务器的账号密码登录 NocoBase。

## 激活插件

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## 添加 LDAP 认证

进入用户认证插件管理页面。

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

添加 - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## 配置

### 基础配置

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Sign up automatically when the user does not exist - 当找不到可匹配绑定的已有用户时，是否自动创建新用户。
- LDAP URL - LDAP 服务器地址
- Bind DN - 用于测试服务器连通性和搜索用户的 DN
- Bind password - Bind DN 的密码
- Test connection - 点击按钮测试服务器连通性和 Bind DN 有效性。

### 搜索配置

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - 用于搜索用户的 DN
- Search filter - 搜索用户的过滤条件，用 `{{account}}` 表示登录时使用的用户账号
- Scope - `Base`, `One level`, `Subtree`, 默认 `Subtree`
- Size limit - 搜索分页大小

### 属性映射

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Use this field to bind the user - 用于绑定已有用户的字段。如果登录账号是用户名，选择用户名，如果是邮箱则选择邮箱。默认用户名。
- Attribute map - 用户属性和 NocoBase 用户表的字段映射。

## 登录

访问登录页面，在登录表单中输入 LDAP 用户名密码登录。

<img src="https://static-docs.nocobase.com/202405101614300.png"/>
