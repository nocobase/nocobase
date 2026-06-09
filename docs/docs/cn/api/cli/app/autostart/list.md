---
title: "nb app autostart list"
description: "nb app autostart list 命令参考：列出当前配置中所有 env 的自启动状态。"
keywords: "nb app autostart list,NocoBase CLI,自启动,env 列表"
---

# nb app autostart list

列出当前配置中所有 env 的自启动状态。

输出会用表格展示以下几列：

- `Current`：当前 env 会标成 `*`
- `Env`：env 名称
- `Kind`：env 类型
- `Source`：安装或来源类型
- `Autostart`：是否已开启自启动

## 用法

```bash
nb app autostart list
```

## 示例

```bash
nb app autostart list
```

## 说明

如果当前还没有任何已保存的 env，命令会直接输出 `No environments are configured.`。

这个命令只负责查看保存状态，不会检查应用当前是否已经启动，也不会检查系统级启动流程是否已经把 `nb app autostart run` 接进去。它的作用更像是“查看 CLI 配置里哪些 env 已经被标记为自启动”。

## 相关命令

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart disable`](./disable.md)
- [`nb env list`](../../env/list.md)
