---
title: Configurar um ambiente de desenvolvimento local no Windows com WSL
description: Prepare Ubuntu, Docker Desktop, Node.js, Yarn e Codex CLI com WSL 2 no Windows para desenvolvimento local do NocoBase e fluxos com AI Agent.
---

# Configurar um ambiente de desenvolvimento local no Windows com WSL

Para desenvolvimento local do NocoBase no Windows, recomendamos preparar primeiro o WSL 2. Assim Node.js, Yarn, NocoBase CLI, comandos Docker e AI Agents rodam no mesmo shell Linux, com caminhos, permissões e builds nativos mais próximos de ambientes Linux comuns.

Se ainda não tiver certeza se precisa de WSL, veja primeiro [Configuração de desenvolvimento local](./local-development-setup.md).

## Preparação

Antes de começar, verifique a versão do Windows e o status da virtualização.

### Verificar a versão do Windows

Pressione `Win + R`, digite `winver` e confirme que o sistema atende a uma destas condições:

- Windows 11
- Windows 10 version 2004 ou posterior, Build 19041 ou posterior

Se a versão for mais antiga, atualize o Windows antes de continuar.

### Verificar virtualização

Abra o Gerenciador de Tarefas, vá para Desempenho / CPU e confirme que Virtualização está habilitada.

Se não estiver habilitada, ative no BIOS / UEFI. O nome pode variar, como Intel VT-x, Intel Virtualization Technology, AMD-V ou SVM Mode.

## Etapa 1: instalar WSL 2

Abra o PowerShell como administrador e execute:

```powershell
wsl --install
```

Reinicie o computador após a instalação. Por padrão, esse comando instala o Ubuntu. Na primeira inicialização, o Ubuntu pedirá um usuário e senha Linux, usados apenas dentro do WSL.

Para escolher uma distribuição específica, liste as opções disponíveis:

```powershell
wsl --list --online
```

Depois instale a distribuição, por exemplo Ubuntu:

```powershell
wsl --install -d Ubuntu
```

## Etapa 2: confirmar a versão do WSL

No PowerShell, execute:

```powershell
wsl --list --verbose
```

Confirme que a distribuição usada está com `VERSION 2`:

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

Se ainda estiver em WSL 1, converta para WSL 2 e defina WSL 2 como padrão:

```powershell
wsl --set-version Ubuntu 2
wsl --set-default-version 2
wsl --update
```

## Etapa 3: instalar Docker Desktop

Se você pretende instalar ou executar o NocoBase com Docker, instale Docker Desktop for Windows.

- [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

Para desenvolvimento local, `Per-user` normalmente é suficiente. Na tela de configuração, escolha `Use WSL 2 instead of Hyper-V` e inicie o Docker Desktop pelo menu Iniciar.

## Etapa 4: habilitar a integração WSL do Docker

No Docker Desktop, habilite o backend WSL 2:

1. Docker Desktop / Settings / General
2. Use the WSL 2 based engine
3. Apply

![Docker Desktop WSL 2 engine](https://static-docs.nocobase.com/2026-06-12-19-10-41.png)

Depois habilite a integração com a distribuição WSL:

1. Docker Desktop / Settings / Resources / WSL Integration
2. Enable integration with my default WSL distro
3. Habilite a distribuição, por exemplo `Ubuntu`
4. Apply & restart ou Apply

![Docker Desktop WSL integration](https://static-docs.nocobase.com/2026-06-12-19-11-09.png)

Se WSL Integration não aparecer, o Docker Desktop provavelmente está em modo Windows containers. Altere para Linux containers pelo ícone do Docker na área de notificação e verifique novamente.

## Etapa 5: verificar Docker

Verifique primeiro no PowerShell:

```powershell
wsl --list --verbose
docker version
docker compose version
docker run hello-world
```

Entre no WSL:

```powershell
wsl
```

Depois execute dentro do WSL:

```bash
docker version
docker compose version
docker run hello-world
```

Se o container `hello-world` for baixado e executado com sucesso, a integração entre Docker Desktop e WSL 2 está funcionando.

## Etapa 6: instalar Node.js e Yarn no WSL

WSL não é um runtime Node.js por padrão. O Ubuntu instalado com `wsl --install` geralmente não inclui Node.js nem npm.

No WSL, verifique primeiro:

```bash
node -v
npm -v
```

Se o comando não for encontrado, instale Node.js 22 com NodeSource:

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

Se precisar trocar versões de Node.js entre projetos, use nvm:

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

:::warning Observação

Escolha NodeSource ou nvm. Não é recomendado misturar os dois métodos de gerenciamento de Node.js no mesmo usuário WSL.

:::

Instale Yarn 1.x:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn -v
```

Se Corepack não estiver disponível:

```bash
npm install -g yarn@1.22.22
yarn -v
```

## Etapa 7: instalar Codex CLI

Codex CLI também pode ser usado na linha de comando nativa do Windows. Neste guia, ele é instalado no WSL para que Codex e a toolchain local do NocoBase fiquem no mesmo ambiente Linux.

Confirme que está no WSL:

```bash
echo $WSL_DISTRO_NAME
```

Instale Codex CLI no WSL:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Instalação não interativa:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh
```

Execute e verifique Codex:

```bash
codex
codex --version
```

Recomendamos iniciar Codex a partir de um diretório de projeto no WSL:

```bash
mkdir -p ~/projects
cd ~/projects/my-app
codex
```

:::tip Observação

Como Codex está instalado no WSL, execute `codex` pelo terminal WSL. PowerShell usa o ambiente nativo do Windows, diferente do ambiente WSL preparado neste guia.

:::

## Onde colocar os arquivos do projeto

Coloque os projetos no sistema de arquivos do WSL:

```bash
~/projects/my-app
```

Evite usar o caminho montado do Windows como local padrão:

```bash
/mnt/c/Users/<your-name>/projects/my-app
```

Isso normalmente melhora o desempenho de arquivos e reduz problemas de permissões e links simbólicos.

Para acessar arquivos WSL pelo Explorador do Windows:

```text
\\wsl$\Ubuntu\home\<your-name>
```

## Perguntas frequentes

### WSL não encontra o comando docker

Confirme que a distribuição usa WSL 2 e habilite a integração correspondente em Docker Desktop / Settings / Resources / WSL Integration.

```powershell
wsl --list --verbose
wsl --set-version Ubuntu 2
```

### WSL Integration não aparece

Docker Desktop provavelmente está em modo Windows containers. Pelo ícone do Docker, altere para Linux containers e abra novamente as configurações de WSL Integration.

### Docker Desktop não inicia ou WSL parece anormal

Tente primeiro:

```powershell
wsl --shutdown
wsl --update
```

Depois reinicie o Docker Desktop.

### Docker Engine já foi instalado manualmente no WSL

A Docker recomenda remover Docker Engine ou Docker CLI instalados diretamente na distribuição WSL antes de usar Docker Desktop, para evitar conflitos com a integração WSL.

### WSL não encontra o comando codex

Confirme que está no WSL e verifique o `PATH`:

```bash
echo $WSL_DISTRO_NAME
which codex
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

## Referências oficiais

- [Microsoft Learn: How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft Learn: Install Node.js on Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl)
- [Docker Docs: Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Docs: Docker Desktop WSL 2 backend on Windows](https://docs.docker.com/desktop/features/wsl/)
- [Docker Docs: Change your Docker Desktop settings](https://docs.docker.com/desktop/settings-and-maintenance/settings/)
- [OpenAI Developers: Codex CLI](https://developers.openai.com/codex/cli)
- [OpenAI Developers: Codex on Windows](https://developers.openai.com/codex/windows)
- [nvm: Node Version Manager](https://github.com/nvm-sh/nvm)
- [npm Docs: Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)
