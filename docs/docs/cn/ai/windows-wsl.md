---
title: Windows 使用 WSL 搭建本地开发环境
description: 在 Windows 上使用 WSL 2 准备 Ubuntu、Docker Desktop、Node.js、Yarn 和 Codex CLI，为 NocoBase 本地开发和 AI Agent 使用准备环境。
---

# Windows 使用 WSL 搭建本地开发环境

在 Windows 上搭建 NocoBase 本地开发环境，推荐先准备 WSL 2。这样 Node.js、Yarn、NocoBase CLI、Docker 命令和 AI Agent 都可以在同一个 Linux shell 里运行，路径、权限和依赖编译也更接近常见的 Linux 部署环境。

如果你还没确定是否需要 WSL，可以先看 [本地开发搭建](./local-development-setup.md)。

## 准备工作

开始前，先确认 Windows 版本和虚拟化状态。

### 检查 Windows 版本

按 `Win + R`，输入 `winver`，确认系统版本满足下面任一条件：

- Windows 11
- Windows 10 version 2004 及以上，Build 19041 及以上

如果版本较旧，建议先升级 Windows，再继续安装 WSL。

### 检查虚拟化

打开「任务管理器」，进入「性能 / CPU」，确认「虚拟化」显示为「已启用」。

如果没有启用，需要进入 BIOS / UEFI 打开虚拟化。不同厂商的名称可能不同，比如 Intel VT-x、Intel Virtualization Technology、AMD-V、SVM Mode。

## 第一步：安装 WSL 2

用管理员身份打开 PowerShell：

1. 打开 Windows 开始菜单
2. 搜索 `PowerShell`
3. 右键选择「以管理员身份运行」

执行：

```powershell
wsl --install
```

安装完成后，重启电脑。

默认情况下，这个命令会安装 Ubuntu。首次启动 Ubuntu 时，会要求你创建 Linux 用户名和密码。这个用户名和密码只用于 WSL 内部，不需要和 Windows 账户一致。

如果你想安装指定发行版，可以先查看列表：

```powershell
wsl --list --online
```

再安装指定发行版，比如 Ubuntu：

```powershell
wsl --install -d Ubuntu
```

## 第二步：确认 WSL 版本

在 PowerShell 中执行：

```powershell
wsl --list --verbose
```

输出类似：

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

确认 `VERSION` 是 `2`。如果某个发行版还是 WSL 1，可以转换为 WSL 2：

```powershell
wsl --set-version Ubuntu 2
```

建议把后续新安装的发行版默认设置为 WSL 2：

```powershell
wsl --set-default-version 2
```

另外，可以更新一次 WSL：

```powershell
wsl --update
```

## 第三步：安装 Docker Desktop

如果你计划用 Docker 安装或运行 NocoBase，需要安装 Docker Desktop for Windows。

从 Docker 官方页面下载安装包：

- [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

安装时建议注意这几项：

1. 安装模式通常选择 `Per-user` 即可，适合大多数个人开发场景
2. 配置页选择 `Use WSL 2 instead of Hyper-V`
3. 安装完成后，从 Windows 开始菜单启动 Docker Desktop
4. 首次启动时阅读并接受 Docker Desktop Subscription Service Agreement

## 第四步：启用 Docker 的 WSL 集成

启动 Docker Desktop 后，先确认 WSL 2 后端已启用：

1. 进入「Docker Desktop / Settings / General」
2. 确认「Use the WSL 2 based engine」已打开
3. 点击「Apply」

![Docker Desktop WSL 2 engine](https://static-docs.nocobase.com/2026-06-12-19-10-41.png)

然后开启发行版集成：

1. 进入「Docker Desktop / Settings / Resources / WSL Integration」
2. 打开「Enable integration with my default WSL distro」
3. 在列表中找到你要使用的发行版，比如 `Ubuntu`
4. 打开对应发行版右侧的开关
5. 点击「Apply & restart」或「Apply」

![Docker Desktop WSL integration](https://static-docs.nocobase.com/2026-06-12-19-11-09.png)

如果「Resources」下没有「WSL Integration」，通常是 Docker Desktop 当前处于 Windows containers 模式。可以在 Windows 系统托盘中点击 Docker 图标，切换到 Linux containers 后再检查。

## 第五步：验证 Docker

先在 PowerShell 中验证：

```powershell
wsl --list --verbose
docker version
docker compose version
docker run hello-world
```

然后进入 WSL：

```powershell
wsl
```

在 WSL 中执行：

```bash
docker version
docker compose version
docker run hello-world
```

如果 `hello-world` 容器能正常拉取并运行，说明 Docker Desktop 与 WSL 2 集成成功。

## 第六步：在 WSL 中安装 Node.js 和 Yarn

WSL 本身不等于 Node.js 运行环境。默认通过 `wsl --install` 安装的 Ubuntu 通常不会预装 Node.js 和 npm，需要在 WSL 发行版里单独安装。

先从 PowerShell 进入 WSL：

```powershell
wsl
```

下面的命令都在 WSL 终端中执行。

先检查是否已经安装：

```bash
node -v
npm -v
```

如果提示 `command not found`，按下面方式安装。

### 方式 A：使用 NodeSource 安装 Node.js 22

如果这台 WSL 环境只需要一个统一的 Node.js 版本，推荐使用 NodeSource。

```bash
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt install -y nodejs
```

安装完成后验证：

```bash
node -v
npm -v
npx -v
```

### 方式 B：使用 nvm 安装 Node.js 22

如果你需要在多个项目之间切换 Node.js 版本，或者项目使用 `.nvmrc` 固定版本，可以使用 nvm。

```bash
sudo apt update
sudo apt install -y curl ca-certificates
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

验证安装结果：

```bash
node -v
npm -v
npx -v
```

如果项目根目录需要固定 Node.js 22，可以创建 `.nvmrc`：

```bash
echo "22" > .nvmrc
nvm install
nvm use
```

以后进入项目目录后执行：

```bash
nvm use
```

即可切换到项目指定版本。

:::warning 注意

NodeSource 和 nvm 二选一即可。不建议在同一个 WSL 用户环境里混用两套 Node.js 管理方式。

:::

### 安装 Yarn 1.x

NocoBase 本地开发需要 Yarn 1.x。Node.js 安装完成后，可以通过 Corepack 启用 Yarn：

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn -v
```

如果你的环境里没有 Corepack，也可以用 npm 安装：

```bash
npm install -g yarn@1.22.22
yarn -v
```

## 第七步：安装 Codex CLI

Codex CLI 也可以在 Windows 原生命令行中使用。这里按 WSL 方案安装，是为了让 Codex 和 NocoBase 本地工具链处在同一套 Linux 环境里。这样 Codex 执行 `nb`、`yarn`、`docker` 等命令时，使用的是同一套文件路径、shell 语法和运行环境。

先确认当前在 WSL 中：

```bash
echo $WSL_DISTRO_NAME
```

如果能输出发行版名称，比如 `Ubuntu`，说明当前在 WSL 中。

在 WSL 中执行 Codex CLI 安装命令：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

如果需要无人值守安装，可以使用：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh
```

安装完成后运行：

```bash
codex
```

首次运行会提示登录。按提示使用 ChatGPT 账户或 OpenAI API key 完成认证。

验证 Codex 命令是否可用：

```bash
codex --version
```

建议从 WSL 的项目目录里启动 Codex，比如：

```bash
mkdir -p ~/projects
cd ~/projects/my-app
codex
```

:::tip 提示

因为 Codex 安装在 WSL 内，后续也应在 WSL 终端里运行 `codex`。如果在 Windows PowerShell 里运行 `codex`，使用的是 Windows 原生命令行环境，和这篇指南准备的 WSL 环境不是同一套环境。

:::

## 项目文件放在哪里

推荐把项目放在 WSL 文件系统中，比如：

```bash
~/projects/my-app
```

不建议优先放在 Windows 挂载路径下，比如：

```bash
/mnt/c/Users/<your-name>/projects/my-app
```

这样通常能获得更好的文件系统性能，也能减少软链接和权限问题。对 Node.js、Python、Java、Go 这类依赖文件较多的项目尤其明显。

如果需要从 Windows 访问 WSL 文件，可以在 Windows 文件资源管理器中打开：

```text
\\wsl$\Ubuntu\home\<your-name>
```

## 常见问题

### WSL 中提示找不到 docker 命令

先确认发行版是 WSL 2：

```powershell
wsl --list --verbose
```

如果是 WSL 1，转换为 WSL 2：

```powershell
wsl --set-version Ubuntu 2
```

然后回到 Docker Desktop，进入「Settings / Resources / WSL Integration」，打开对应发行版的集成开关并应用。

### WSL Integration 选项不存在

通常是 Docker Desktop 当前处于 Windows containers 模式。

可以这样处理：

1. 点击 Windows 系统托盘里的 Docker 图标
2. 选择「Switch to Linux containers」
3. 等待 Docker Desktop 重启
4. 再进入「Settings / Resources / WSL Integration」

### Docker Desktop 启动失败或 WSL 状态异常

可以先尝试：

```powershell
wsl --shutdown
wsl --update
```

然后重新启动 Docker Desktop。

### WSL 里已经手动安装过 Docker Engine

Docker 官方建议，在安装 Docker Desktop 前，卸载直接安装在 WSL Linux 发行版里的 Docker Engine 或 Docker CLI。否则可能和 Docker Desktop 的 WSL 集成产生冲突。

通常做法是在 WSL 发行版中卸载 `docker-ce`、`docker-ce-cli`、`containerd.io` 等包，然后使用 Docker Desktop 提供的 Docker CLI 集成。

### WSL 中提示找不到 codex 命令

先确认是在 WSL 里执行，而不是在 PowerShell 里执行：

```bash
echo $WSL_DISTRO_NAME
```

然后检查 Codex 是否在 `PATH` 中：

```bash
which codex
```

如果找不到，可以重新打开 WSL 终端，或重新执行安装命令：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

## 官方参考资料

- [Microsoft Learn：How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft Learn：Install Node.js on Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl)
- [Docker Docs：Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Docs：Docker Desktop WSL 2 backend on Windows](https://docs.docker.com/desktop/features/wsl/)
- [Docker Docs：Change your Docker Desktop settings](https://docs.docker.com/desktop/settings-and-maintenance/settings/)
- [OpenAI Developers：Codex CLI](https://developers.openai.com/codex/cli)
- [OpenAI Developers：Codex on Windows](https://developers.openai.com/codex/windows)
- [nvm：Node Version Manager](https://github.com/nvm-sh/nvm)
- [npm Docs：Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)
