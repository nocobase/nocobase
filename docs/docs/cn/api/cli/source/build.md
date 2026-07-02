---
title: "nb source build"
description: "nb source build 命令参考：构建本地 NocoBase 源码工程。"
keywords: "nb source build,NocoBase CLI,构建,源码"
---

# nb source build

构建本地 NocoBase 源码工程。需要在源码目录（`<app-path>/source/`）下执行。对于 CLI 管理的 source app，构建前会自动同步 `plugins/` 目录下的插件到 `source/packages/plugins/`。

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
| `--tar` | boolean | 构建完成后自动打包为 `.tgz` 文件 |
| `--verbose` | boolean | 显示详细命令输出 |

## 示例

```bash
nb source build
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
nb source build --no-dts
nb source build --sourcemap
```

## 说明

使用 `--tar` 时，构建完成后会将指定的插件打包为 `.tgz` 文件，输出到 `source/storage/tar/` 目录下。命令结束时会打印 tarball 的完整路径。

## 相关命令

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
