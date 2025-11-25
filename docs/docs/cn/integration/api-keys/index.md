# API 密钥

## 介绍

## 安装

## 使用说明

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### 添加 API 密钥

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**注意事项**

- 添加的 API 密钥为当前用户的，角色为当前用户所属角色
- 请确保已经配置了 `APP_KEY` 环境变量，并保证不变泄漏，如果 APP_KEY 变更了，所有已添加的 API 密钥会失效。

### 如何配置 APP_KEY

docker 版本，修改 docker-compose.yml 文件

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

源码或 create-nocobase-app 安装，直接修改 .env 文件的 APP_KEY 即可

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```