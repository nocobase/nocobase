# Duplicator

[English](./README.md) | 中文

NocoBase 应用的备份与还原插件，可用于应用的复制、迁移、升级等场景。

## 安装激活

内置插件无需手动安装激活。

## 使用方法

Duplicator 插件提供了 `dump` 和 `restore` 命令，分别用于备份和还原应用数据，可用于单应用的备份和还原，也可以跨应用。如果跨应用还原数据，请保证目标应用 NocoBase 版本与源应用一致，相对应插件也已下载本地。

**⚠️ 如果使用了继承（PostgreSQL）、视图、触发器等不兼容的特性，跨数据库还原备份数据可能失败。**

### 备份数据

```bash
yarn nocobase dump
```

选择需要备份的插件表结构及其数据

```bash
? Select the plugin collections to be dumped (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
 == Required ==
 - migration (core) (Disabled)
 - collections (collection-manager) (Disabled)
 - uiSchemas (ui-schema-storage) (Disabled)
 - uiRoutes (ui-routes-storage) (Disabled)
 - acl (acl) (Disabled)
 - workflowConfig (workflow) (Disabled)
 - snapshot-field (snapshot-field) (Disabled)
 - sequences (sequence-field) (Disabled)
 == Optional ==
❯◉ executionLogs (workflow)
 ◉ users (users)
 ◉ storageSetting (file-manager)
 ◉ attachmentRecords (file-manager)
 ◉ systemSettings (system-settings)
 ◉ verificationProviders (verification)
 ◉ verificationData (verification)
 ◉ oidcProviders (oidc)
 ◉ samlProviders (saml)
 ◉ mapConfiguration (map)
(Move up and down to reveal more choices)
```

选择需要备份的其他数据表的记录

```bash
? Select the collection records to be dumped (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
❯◉ Test1
❯◉ Test2
❯◉ Test3
```

数据备份成功之后，备份文件位于 `storage/duplicator` 目录下：

```bash
dumped to /your/apps/a/storage/duplicator/dump-20230210T223910.nbdump
dumped file size: 20.8 kB
```

### 还原数据

```bash
yarn nocobase restore /your/apps/a/storage/duplicator/dump-20230210T223910.nbdump
```

导入前请先备份数据

```bash
? Danger !!! This action will overwrite your current data, please make sure you have a backup❗️❗️ (y/N)
```

选择需要还原的插件表结构及其数据

```bash
? Select the plugin collections to be restored (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
 == Required ==
 - migration (core) (Disabled)
 - collections (collection-manager) (Disabled)
 - uiSchemas (ui-schema-storage) (Disabled)
 - uiRoutes (ui-routes-storage) (Disabled)
 - acl (acl) (Disabled)
 - workflowConfig (workflow) (Disabled)
 - sequences (sequence-field) (Disabled)
 == Optional ==
❯◯ executionLogs (workflow)
 ◯ users (users)
 ◯ storageSetting (file-manager)
 ◯ attachmentRecords (file-manager)
 ◯ systemSettings (system-settings)
 ◯ verificationProviders (verification)
 ◯ verificationData (verification)
 ◯ auditLogs (audit-logs)
 ◯ iframe html storage (iframe-block)
```

选择需要还原的其他数据表的记录

```bash
? Select the collection records to be restored (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
❯◉ Test1
❯◉ Test2
❯◉ Test3
```

成功之后，重启应用

```bash
# for development
yarn dev
# for production
yarn start
```
