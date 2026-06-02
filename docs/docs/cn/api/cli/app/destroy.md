---
title: 'nb app destroy'
description: 'nb app destroy 命令参考：移除指定 env 的托管运行资源、storage 数据和已保存的 env 配置。'
keywords: 'nb app destroy,NocoBase CLI,销毁环境,清理资源,删除 storage'
---

# nb app destroy

销毁指定 env，并移除托管运行资源、storage 数据以及已保存的 CLI env 配置。

对于 local 和 Docker env，该命令会先清理当前机器上的托管应用运行资源，在存在内置数据库时一并清理内置数据库运行资源，然后删除 storage 数据，最后移除已保存的 CLI env 配置。对于 HTTP 和 SSH env，它只会移除已保存的 CLI env 配置，不会触碰外部服务。

对于下载型本地 npm/Git env，该命令还会删除 CLI 托管的本地应用文件。对于自定义本地 app 路径，它会保留本地源码文件，只清理托管运行资源、storage 数据和已保存的 env 配置。

默认情况下，命令会要求确认。在非交互模式下，必须显式传入 `--env` 和 `--force`。

## 用法

```bash
nb app destroy [flags]
```

## 参数

| 参数            | 类型    | 说明                                                      |
| --------------- | ------- | --------------------------------------------------------- |
| `--env`, `-e`   | string  | 要销毁的 CLI env 名称；在交互模式下省略时默认使用当前 env |
| `--force`, `-f` | boolean | 跳过确认并立即销毁指定 env；在非交互模式下必填            |
| `--verbose`     | boolean | 显示销毁命令的原始输出                                    |

## 示例

```bash
nb app destroy --env app1
nb app destroy --env app1 --force
```

## 相关命令

- [`nb app stop`](./stop.md)
- [`nb app down`](./down.md)
- [`nb env remove`](../env/remove.md)
