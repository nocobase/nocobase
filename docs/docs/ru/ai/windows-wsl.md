---
title: Настройка локальной среды разработки в Windows с WSL
description: Подготовьте Ubuntu, Docker Desktop, Node.js, Yarn и Codex CLI через WSL 2 в Windows для локальной разработки NocoBase и сценариев AI Agent.
---

# Настройка локальной среды разработки в Windows с WSL

Для локальной разработки NocoBase в Windows рекомендуется сначала подготовить WSL 2. Так Node.js, Yarn, NocoBase CLI, команды Docker и AI Agent будут работать в одной Linux shell, с путями, правами и сборкой нативных зависимостей, более близкими к обычной Linux-среде.

Если вы еще не уверены, нужен ли WSL, сначала см. [Настройка локальной среды разработки](./local-development-setup.md).

## Подготовка

Перед началом проверьте версию Windows и состояние виртуализации.

### Проверьте версию Windows

Нажмите `Win + R`, введите `winver` и убедитесь, что система соответствует одному из условий:

- Windows 11
- Windows 10 version 2004 или новее, Build 19041 или новее

Если версия старше, сначала обновите Windows.

### Проверьте виртуализацию

Откройте Диспетчер задач, перейдите в Производительность / CPU и убедитесь, что виртуализация включена.

Если она выключена, включите ее в BIOS / UEFI. Название опции зависит от производителя: Intel VT-x, Intel Virtualization Technology, AMD-V или SVM Mode.

## Шаг 1: установите WSL 2

Откройте PowerShell от имени администратора и выполните:

```powershell
wsl --install
```

После установки перезагрузите компьютер. По умолчанию эта команда устанавливает Ubuntu. При первом запуске Ubuntu попросит создать Linux-имя пользователя и пароль. Они используются только внутри WSL.

Чтобы выбрать конкретный дистрибутив, сначала посмотрите список:

```powershell
wsl --list --online
```

Затем установите дистрибутив, например Ubuntu:

```powershell
wsl --install -d Ubuntu
```

## Шаг 2: подтвердите версию WSL

В PowerShell выполните:

```powershell
wsl --list --verbose
```

Убедитесь, что у нужного дистрибутива указано `VERSION 2`:

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

Если это WSL 1, преобразуйте его в WSL 2 и сделайте WSL 2 версией по умолчанию:

```powershell
wsl --set-version Ubuntu 2
wsl --set-default-version 2
wsl --update
```

## Шаг 3: установите Docker Desktop

Если вы планируете устанавливать или запускать NocoBase через Docker, установите Docker Desktop for Windows.

- [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

Для локальной разработки обычно достаточно режима `Per-user`. На странице настройки выберите `Use WSL 2 instead of Hyper-V`, затем запустите Docker Desktop из меню Пуск.

## Шаг 4: включите интеграцию Docker с WSL

В Docker Desktop включите backend WSL 2:

1. Docker Desktop / Settings / General
2. Use the WSL 2 based engine
3. Apply

![Docker Desktop WSL 2 engine](https://static-docs.nocobase.com/2026-06-12-19-10-41.png)

Затем включите интеграцию с WSL-дистрибутивом:

1. Docker Desktop / Settings / Resources / WSL Integration
2. Enable integration with my default WSL distro
3. Включите нужный дистрибутив, например `Ubuntu`
4. Apply & restart или Apply

![Docker Desktop WSL integration](https://static-docs.nocobase.com/2026-06-12-19-11-09.png)

Если WSL Integration не отображается, Docker Desktop, скорее всего, находится в режиме Windows containers. Переключитесь на Linux containers через значок Docker в системном трее Windows и проверьте снова.

## Шаг 5: проверьте Docker

Сначала проверьте из PowerShell:

```powershell
wsl --list --verbose
docker version
docker compose version
docker run hello-world
```

Зайдите в WSL:

```powershell
wsl
```

Затем выполните внутри WSL:

```bash
docker version
docker compose version
docker run hello-world
```

Если контейнер `hello-world` скачивается и запускается успешно, интеграция Docker Desktop и WSL 2 работает.

## Шаг 6: установите Node.js и Yarn в WSL

WSL не является средой Node.js по умолчанию. Ubuntu, установленная через `wsl --install`, обычно не содержит Node.js и npm.

В WSL сначала проверьте:

```bash
node -v
npm -v
```

Если команда не найдена, установите Node.js 22 через NodeSource:

```bash
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt install -y nodejs
node -v
npm -v
npx -v
```

Если нужно переключать версии Node.js между проектами, используйте nvm:

```bash
sudo apt update
sudo apt install -y curl ca-certificates
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v
npm -v
npx -v
```

:::warning Примечание

Выберите NodeSource или nvm. Не рекомендуется смешивать оба способа управления Node.js в одном пользователе WSL.

:::

Установите Yarn 1.x:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn -v
```

Если Corepack недоступен:

```bash
npm install -g yarn@1.22.22
yarn -v
```

## Шаг 7: установите Codex CLI

Codex CLI также можно использовать в нативной командной строке Windows. В этом руководстве он устанавливается в WSL, чтобы Codex и локальная toolchain NocoBase находились в одной Linux-среде.

Убедитесь, что вы находитесь в WSL:

```bash
echo $WSL_DISTRO_NAME
```

Установите Codex CLI в WSL:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Для неинтерактивной установки:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh
```

Запустите и проверьте Codex:

```bash
codex
codex --version
```

Рекомендуется запускать Codex из каталога проекта внутри WSL:

```bash
mkdir -p ~/projects
cd ~/projects/my-app
codex
```

:::tip Примечание

Поскольку Codex установлен в WSL, затем запускайте `codex` из терминала WSL. PowerShell использует нативную среду Windows, а не WSL-среду, подготовленную в этом руководстве.

:::

## Где хранить файлы проекта

Рекомендуется хранить проекты в файловой системе WSL:

```bash
~/projects/my-app
```

Не используйте путь Windows mount как место по умолчанию:

```bash
/mnt/c/Users/<your-name>/projects/my-app
```

Обычно это дает лучшую производительность файловой системы и снижает проблемы с правами и символическими ссылками.

Чтобы открыть файлы WSL из Проводника Windows:

```text
\\wsl$\Ubuntu\home\<your-name>
```

## FAQ

### WSL не находит команду docker

Убедитесь, что дистрибутив использует WSL 2, затем включите интеграцию в Docker Desktop / Settings / Resources / WSL Integration.

```powershell
wsl --list --verbose
wsl --set-version Ubuntu 2
```

### WSL Integration не отображается

Docker Desktop, вероятно, находится в режиме Windows containers. Через значок Docker переключитесь на Linux containers и снова откройте настройки WSL Integration.

### Docker Desktop не запускается или WSL выглядит некорректно

Сначала попробуйте:

```powershell
wsl --shutdown
wsl --update
```

Затем перезапустите Docker Desktop.

### Docker Engine уже установлен вручную в WSL

Docker рекомендует удалить Docker Engine или Docker CLI, установленные напрямую в WSL-дистрибутиве, перед использованием Docker Desktop, чтобы избежать конфликтов с WSL-интеграцией.

### WSL не находит команду codex

Убедитесь, что вы в WSL, затем проверьте `PATH`:

```bash
echo $WSL_DISTRO_NAME
which codex
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

## Официальные материалы

- [Microsoft Learn: How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft Learn: Install Node.js on Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl)
- [Docker Docs: Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Docs: Docker Desktop WSL 2 backend on Windows](https://docs.docker.com/desktop/features/wsl/)
- [Docker Docs: Change your Docker Desktop settings](https://docs.docker.com/desktop/settings-and-maintenance/settings/)
- [OpenAI Developers: Codex CLI](https://developers.openai.com/codex/cli)
- [OpenAI Developers: Codex on Windows](https://developers.openai.com/codex/windows)
- [nvm: Node Version Manager](https://github.com/nvm-sh/nvm)
- [npm Docs: Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)
