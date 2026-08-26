---
title: "nb source download"
description: "nb source download 命令参考：从 npm、Docker 或 Git 获取 NocoBase 源码或镜像。"
keywords: "nb source download,NocoBase CLI,下载,npm,Docker,Git"
---

# nb source download

从 npm、Docker 或 Git 获取 NocoBase。`--version` 是三种 source 共用的版本参数：npm 使用包版本，Docker 使用镜像 tag，Git 使用 git ref。

## 用法

```bash
nb source download [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--yes`, `-y` | boolean | 使用默认值并跳过交互提示 |
| `--verbose` | boolean | 显示详细命令输出 |
| `--locale` | string | CLI 提示语言：`en-US` 或 `zh-CN` |
| `--source`, `-s` | string | 获取方式：`docker`、`npm` 或 `git` |
| `--version`, `-v` | string | npm 包版本、Docker 镜像 tag 或 Git ref |
| `--replace`, `-r` | boolean | 目标目录已存在时替换 |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | npm/Git 安装时是否安装 devDependencies |
| `--output-dir`, `-o` | string | 下载目标目录，或保存 Docker tarball 的目录 |
| `--git-url` | string | Git 仓库地址 |
| `--docker-registry` | string | Docker 镜像仓库名，不含 tag |
| `--docker-platform` | string | Docker 镜像平台：`auto`、`linux/amd64`、`linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | 拉取 Docker 镜像后是否保存为 tarball |
| `--npm-registry` | string | npm/Git 下载和依赖安装使用的 registry |
| `--build` / `--no-build` | boolean | npm/Git 依赖安装后是否构建 |
| `--build-dts` | boolean | npm/Git 构建时是否生成 TypeScript 声明文件 |

## 示例

```bash
nb source download
nb source download -y --source npm --version alpha
nb source download -y --source npm --version alpha --no-build
nb source download --source npm --version alpha --output-dir=./app
nb source download --source docker --version alpha --docker-registry=nocobase/nocobase --docker-platform=linux/arm64
nb source download -y --source docker --version alpha --docker-save -o ./docker-images
nb source download --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git
nb source download --source git --version fix/cli-v2
nb source download -y --source npm --version alpha --build-dts
nb source download -y --source npm --version alpha --npm-registry=https://registry.npmmirror.com
```

## 版本别名

Git source 下，常用 dist-tag 会解析为对应分支：`latest` → `main`，`beta` → `next`，`alpha` → `develop`。

## 相关命令

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
