---
title: "nb source build"
description: "nb source build 命令参考：构建本地 NocoBase 源码工程。"
keywords: "nb source build,NocoBase CLI,构建,源码"
---

# nb source build

构建本地 NocoBase 源码工程。该命令会在仓库根目录转发执行旧的 NocoBase build 流程。

## 用法

```bash
nb source build [packages...] [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[packages...]` | string[] | 要构建的包名，省略时构建全部 |
| `--cwd`, `-c` | string | 工作目录 |
| `--no-dts` | boolean | 不生成 `.d.ts` 声明文件 |
| `--sourcemap` | boolean | 生成 sourcemap |
| `--verbose` | boolean | 显示详细命令输出 |

## 示例

```bash
nb source build
nb source build --no-dts
nb source build --sourcemap
nb source build @nocobase/acl
nb source build @nocobase/acl @nocobase/actions
```

## 相关命令

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
