---
title: Plugins
toc: menu
nav:
  title: Plugins
  order: 4
---

## 插件管理器

开发可以通过命令行下载、激活、禁用、移除插件，对应的命令行有：

```bash
# 下载插件，可以通过 --enable 参数快速激活
yarn nocobase pm:download <plugin-name> --enable
# 激活插件
yarn nocobase pm:enable <plugin-name>
# 禁用插件
yarn nocobase pm:disable <plugin-name>
# 移除插件
yarn nocobase pm:remove <plugin-name>
```

## 已有的插件列表

### @nocobase/plugin-collections 数据表配置

提供 HTTP API 的方式管理数据表和字段

### @nocobase/plugin-permissions

权限模块

### @nocobase/plugin-users

用户模块

### @nocobase/plugin-system-settings

站点信息配置

### @nocobase/plugin-china-region

字段扩展，中国行政区

### @nocobase/plugin-file-manager

字段扩展，附件字段

### @nocobase/plugin-action-logs

操作日志

### @nocobase/plugin-multi-apps

动态多应用，一个简易的 SaaS

### @nocobase/plugin-export

操作扩展，导出

### @nocobase/plugin-notifications

通知模块（半成品），暂时只支持邮件发送，没有可视化界面

### @nocobase/plugin-automations

自动化（暂不可用）

### @nocobase/plugin-client

客户端插件，为 nocobase 提供可视化配置的支持。依赖的插件有：

- @nocobase/plugin-collections（必须）
- @nocobase/plugin-permissions（必须）
- @nocobase/plugin-users（必须）
- @nocobase/plugin-system-settings（必须）
- @nocobase/plugin-file-manager（必须）
- @nocobase/plugin-china-region（可选）
- @nocobase/plugin-action-logs（可选）

包括几部分内容：

- 将客户端 ui-schema 存储在服务端，以实现按需动态输出
- 将客户端 ui-router 存储在服务端，以实现按需动态输出
- 提供 app dist 的 static server 支持，可以配置 app 的 dist 路径
- 为 nocobase 安装提供初始化 demo 数据导入的支持，可通过 importData 配置
- 提供 collections 可视化支持
