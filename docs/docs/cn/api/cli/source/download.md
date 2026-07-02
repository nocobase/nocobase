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
| `--hook-script` | string | 在 npm scaffold 或 Git clone 之后、依赖安装之前执行的 hook 模块；只对 npm/Git source 生效 |

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
nb source download -y --source git --version beta --hook-script ./hooks.mjs
```

## 安装前 hook

`--hook-script` 只影响本次 `nb source download`。如果你希望 hook 跟随 env 保存，并在 `nb app upgrade` 或本地 source 恢复时复用，通常来说应该通过 [`nb init --hook-script`](../init.md) 传入。

hook 文件需要默认导出对象，并实现 `beforeDependencyInstall(context)`：

```js
export default {
  beforeDependencyInstall: async ({ sourcePath, version, envConfig }) => {
    // 在 git clone / npm scaffold 之后、yarn install 之前执行。
  },
};
```
直接运行 `nb source download --hook-script` 时，`beforeDependencyInstall` 收到的 `context.phase` 是 `source-download`，`context.command` 是 `source:download`。这个命令不会执行 `beforeAppInstall` 或 `afterAppStart`；这两个 hook 只属于应用安装、启动、重启和升级流程。


## 版本别名

Git source 下，常用 dist-tag 会解析为对应分支：`latest` → `main`，`beta` → `next`，`alpha` → `develop`。

## 相关命令

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
