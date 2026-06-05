---
pkg: "@nocobase/plugin-action-export-pro"
title: "导出附件操作"
description: "导出附件操作：导出记录关联的文件附件，支持批量导出、压缩包下载。"
keywords: "导出附件,ExportAttachments,附件导出,文件下载,界面搭建,NocoBase"
---
# 导出附件

## 介绍

附件导出支持将附件相关的字段导出为压缩包格式。

#### 附件导出配置

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- 配置要导出的附件字段，支持多选。
- 可以选择是否为每条记录生成一个文件夹。

文件的命名规则：

- 如果选择为每条记录生成一个文件夹，则文件的命名规则为： `{记录的标题字段值}/{附件字段名}[-{文件序号}].{文件后缀名}`。
- 如果选择不生成文件夹，则文件的命名规则为： `{记录的标题字段值}-{附件字段名}[-{文件序号}].{文件后缀名}`。

文件序号在附件字段中存在多个附件时，会自动生成.


- [联动规则](/interface-builder/actions/action-settings/linkage-rule)：动态显示/隐藏按钮；
- [编辑按钮](/interface-builder/actions/action-settings/edit-button)：编辑按钮的标题、类型、图标；
