---
title: Guia de atualização do NocoBase 2.0 para 2.1
description: Atualize um aplicativo NocoBase 2.0 para 2.1, incluindo métodos antigos de instalação, opções do nb CLI e caminho de migração recomendado.
---

# Como atualizar o NocoBase de 2.0 para 2.1

A atualização do NocoBase 2.0 para o NocoBase 2.1 é tranquila para o aplicativo em si. A mudança maior está no NocoBase CLI.

Onde:

- No 2.0 e versões anteriores, os comandos da CLI normalmente começam com `yarn nocobase`
- No 2.1 e versões posteriores, a CLI usa o `nb` instalado globalmente

Aplicativos antigos não precisam migrar para `nb` imediatamente. Se você só quer atualizar para 2.1 um aplicativo NocoBase 2.0 que já está rodando de forma estável, continue usando por padrão o método original de instalação e atualização. Para aplicativos novos, recomendamos usar a nova CLI `nb`.

## Continuar usando o método original de instalação e atualização

Se você já está acostumado com o método de instalação anterior, pode continuar usando. A instalação e a atualização continuam seguindo a documentação original.

### Instalar o NocoBase

- [Instalação com Docker](/get-started/installation/docker)
- [Instalação com create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Instalação a partir do código-fonte com Git](/get-started/installation/git)

### Atualizar o NocoBase

- [Atualizar uma instalação com Docker](/get-started/upgrading/docker)
- [Atualizar uma instalação com create-nocobase-app](/get-started/upgrading/create-nocobase-app)
- [Atualizar uma instalação a partir do código-fonte com Git](/get-started/upgrading/git)

## Usar `nb` CLI para aplicativos novos

Para aplicativos novos, recomendamos o fluxo mais prático de instalação e atualização com `nb`.

### Instalar o NocoBase

- [Instalar o aplicativo NocoBase](./install-nocobase-app.md)

### Atualizar o NocoBase

- [Atualizar o aplicativo NocoBase](./upgrade-nocobase-app.md)

## Como migrar para `nb` CLI

Se você quer gerenciar aplicativos com `nb` de forma unificada no futuro, a abordagem mais confiável por enquanto é criar um novo aplicativo e migrar os dados do aplicativo antigo para ele.

Etapas de migração:

1. Primeiro crie um novo aplicativo CLI com `nb init`
2. Migre o banco de dados, `storage` e as variáveis de ambiente necessárias do aplicativo antigo
3. Depois de confirmar que o novo aplicativo funciona corretamente, alterne o ambiente de produção

Você também pode esperar um pouco. A capacidade de o `nb` assumir aplicativos locais existentes ainda está em desenvolvimento.

![2026-06-13-21-29-24](https://static-docs.nocobase.com/2026-06-13-21-29-24.png)
