---
title: "Git 源码安装升级指南"
description: "Git 源码安装的 NocoBase 升级：git pull、yarn install、yarn nocobase upgrade，清缓存与依赖重装。"
keywords: "Git 源码,升级,git pull,yarn nocobase upgrade,yarn install,NocoBase"
---

# Git 源码安装的升级

:::warning 升级前的准备

- 请务必先备份数据库
- 停止运行中的 NocoBase（`Ctrl + C`）

:::

## 1. 切换到 NocoBase 项目目录

```bash
cd my-nocobase-app
```

## 2. 拉取最新代码

```bash
git pull
```

## 3. 删除缓存和旧依赖（非必须）

如果正常的升级流程失败，可以尝试清空缓存和依赖之后重新下载

```bash
# 删除 nocobase 缓存
yarn nocobase clean
# 删除依赖
yarn rimraf -rf node_modules # 等同于 rm -rf node_modules
```

## 4. 更新依赖

📢 由于网络环境、系统配置等因素影响，接下来这一步骤可能需要十几分钟时间。

```bash
yarn install
```

## 5. 执行升级命令

```bash
yarn nocobase upgrade
```

## 6. 启动 NocoBase

```bash
yarn dev
```

:::tip 生产环境提示

源码安装的 NocoBase 不建议直接在生产环境部署（生产环境请参考 [生产环境部署](../deployment/production.md)）。

:::

## 7. 第三方插件的升级

参考 [安装与升级插件](../install-upgrade-plugins.mdx)
