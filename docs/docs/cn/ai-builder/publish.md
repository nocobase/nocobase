---
title: "发布管理"
description: "发布管理 Skill 用于在多环境之间执行可审计的发布操作。"
keywords: "AI 搭建,发布管理,跨环境发布,备份恢复,迁移"
---

# 发布管理

:::tip 前置条件

- 阅读本页前，请确保你已按照 [AI 搭建快速开始](./index.md) 安装了 NocoBase CLI 并完成了初始化。
- 必须获得专业版版及以上授权 [NocoBase 商业版](https://www.nocobase.com/cn/commercial)。
- 确保激活了备份管理和迁移管理两个插件并升级到最新版。

:::

:::warning 注意
发布管理相关 CLI 还在持续开发中，暂时不支持使用。
:::
## 简介

发布管理 Skill 用于在多环境之间执行发布操作——支持备份恢复和迁移两种发布方式。


## 能力范围

- 单环境备份还原：使用备份包全量还原本机数据。
- 跨环境备份还原：使用备份包全量还原目标环境数据。
- 跨环境迁移：使用新建迁移包差异化更新目标环境数据。

## 提示词示例

### 场景 A：单环境备份还原
:::tip 前置条件

当前环境需要有一个备份包或者先备份再还原

:::

提示词模式
```
使用 <file-name> 备份还原
```
命令行模式
```
// 查看有哪些备份包可用，如果没有备份包，执行 nb backup <file-name> 
nb backup list 
nb restore <file-name> 
```
![备份还原](https://static-docs.nocobase.com/20260417150854.png)

### 场景 B：跨环境备份还原

:::tip 前置条件

需要准备两个环境，比如一个是本机 dev 环境和一个远程 test 环境，或者在本地安装两个环境。

:::

提示词模式
```
将 dev 还原到 test 
```
命令行模式
```
// 查看有哪些备份包可用，如果没有备份包，执行 nb backup <file-name> --env dev
nb backup list --env dev
// 使用备份包进行还原
nb restore <file-name> --env test
```
![备份还原](https://static-docs.nocobase.com/20260417150854.png)

### 场景 C：跨环境迁移

:::tip 前置条件

和场景B类似，需要准备两个环境，比如一个是本机 dev 环境和一个远程 test 环境，或者在本地安装两个环境。

:::

提示词模式
```
将 dev 迁移到 test 
```
命令行模式
```
// 新建迁移规则，会产生一个新的 ruleId 或 nb migration rule list --env dev 获得历史 ruleId 
nb migration rule add --env dev 
// 使用 ruleId 生成迁移包
nb migration generate <ruleId> --env dev 
// 使用迁移包进行迁移
nb migration run <file-name> --env test
```
![迁移发布](https://static-docs.nocobase.com/20260417151022.png)

## 常见问题

**备份恢复和迁移该选哪个？**

如果你已经有可用的备份包，选备份还原。如果需要按策略控制哪些数据同步过去（比如只同步结构不同步数据），选择迁移。

**没有迁移插件是什么问题？**

迁移管理插件需要专业版及以上，详见 [NocoBase 商业版](https://www.nocobase.com/cn/commercial)。

## 相关链接

- [AI 搭建概述](./index.md) — 所有 AI 搭建 Skill 的总览和安装方式
- [环境管理](./env-bootstrap) — 环境检查、安装部署和故障诊断
