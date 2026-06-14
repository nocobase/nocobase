---
title: Configuração de desenvolvimento local
description: Prepare o ambiente local do sistema operacional para o NocoBase CLI e aplicativos NocoBase, cobrindo Windows WSL, macOS, Linux, Node.js, Yarn e Docker.
---

# Configuração de desenvolvimento local

Esta página ajuda você a preparar um ambiente local para o NocoBase CLI e aplicativos NocoBase. Ela é indicada para desenvolvimento local, avaliação de funcionalidades e para AI Agents instalarem ou gerenciarem o NocoBase no seu computador.

Se você vai implantar para usuários reais, veja primeiro os [requisitos de sistema de produção](../get-started/system-requirements.md).

## Windows: use WSL

Para configuração local no Windows, recomendamos manter o ambiente principal de desenvolvimento dentro do WSL 2: instale Node.js, Yarn e NocoBase CLI na distribuição Linux do WSL e execute os comandos relacionados pelo terminal do WSL.

O WSL é mais próximo dos ambientes Linux onde o NocoBase costuma ser implantado. Isso traz alguns benefícios:

- Instalação de dependências, build, inicialização e análise de logs ficam mais próximos do fluxo real do servidor
- Depois de habilitar a WSL integration no Docker Desktop, você pode executar comandos `docker` diretamente dentro do WSL
- Você reduz problemas extras de formatos de caminho nativos do Windows, permissões de arquivo, links simbólicos e build de dependências nativas
- É melhor para fluxos com AI Agent. Quando um agent executa `nb`, `yarn` ou `docker`, ele usa os mesmos caminhos Linux, sintaxe de shell e ambiente de execução, o que torna a investigação mais direta

Se o ambiente local baseado em WSL ainda não estiver pronto, veja [Configurar um ambiente de desenvolvimento local no Windows com WSL](./windows-wsl.md).

Configuração recomendada:

- Windows 10 / 11
- WSL 2
- Ubuntu LTS
- Node.js >= 22
- Yarn 1.x
- Docker Desktop, se você pretende instalar o NocoBase com Docker

Normalmente, Node.js, Yarn e NocoBase CLI devem ser instalados dentro do WSL. Se você usa Docker Desktop, habilite a WSL integration no Docker Desktop para que o WSL possa acessar o Docker.

Verifique o ambiente:

```bash
node -v
yarn -v
docker version
```

:::tip Observação

O NocoBase também pode ser instalado no Windows Server. O WSL é recomendado aqui para desenvolvimento local e configuração de AI Agent em computadores pessoais. Isso não significa que o Windows Server não possa ser usado para implantação.

:::

## macOS

No macOS, você pode usar diretamente o terminal local.

Prepare:

- Node.js >= 22
- Yarn 1.x
- Docker Desktop, OrbStack ou Colima, se você pretende instalar o NocoBase com Docker

Verifique o ambiente:

```bash
node -v
yarn -v
docker version
```

Se não usar Docker, você pode ignorar `docker version`.

## Linux

Linux pode ser usado diretamente como ambiente de desenvolvimento local. Ubuntu, Debian ou outras distribuições comuns são recomendadas.

Prepare:

- Node.js >= 22
- Yarn 1.x
- Docker Engine, se você pretende instalar o NocoBase com Docker

Verifique o ambiente:

```bash
node -v
yarn -v
docker version
```

Se não usar Docker, você pode ignorar `docker version`.

## Próximos passos

- [Comparação de métodos de instalação e versões](../get-started/quickstart.md) — Compare primeiro os métodos de instalação e canais de versão
- [Instalar o aplicativo NocoBase](./install-nocobase-app.md) — Inicialize um app local com o NocoBase CLI
- [Guia de integração para AI Agent](./quick-start.mdx) — Permita que um AI Agent se conecte e opere o NocoBase
