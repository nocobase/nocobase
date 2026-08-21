---
title: "Construção e Empacotamento"
description: "Construção e empacotamento de plugins NocoBase: nb source build, build.config.ts personalizado, Rsbuild para cliente, tsup para servidor."
keywords: "construção de plugin,empacotamento de plugin,nb source build,tar,build.config.ts,Rsbuild,tsup,@nocobase/build,NocoBase"
---

# Construção e Empacotamento

Após o desenvolvimento do plugin, são necessárias duas etapas — construção (compilar o código-fonte) e empacotamento (gerar o `.tar.gz`) — antes de distribuí-lo para outros aplicativos NocoBase.

## Construir o Plugin

Execute o comando de construção no diretório de código-fonte (`<app-path>/source/`). A construção compila o código-fonte TypeScript em `src/` para JavaScript — o código do cliente é empacotado pelo Rsbuild e o código do servidor pelo tsup:

```bash
cd <app-path>/source
nb source build @my-project/plugin-hello
```

O resultado da construção é gerado no diretório `dist/` da raiz do plugin.

:::tip Dica

Se o plugin foi criado no repositório de código-fonte, a primeira construção irá acionar uma verificação de tipo de todo o repositório, o que pode levar algum tempo. Recomenda-se garantir que as dependências estejam instaladas e que o repositório esteja em um estado construível.

:::

## Empacotar o Plugin

Execute também no diretório de código-fonte (`<app-path>/source/`). Use o parâmetro `--tar` para combinar construção e empacotamento em uma única etapa, gerando um arquivo `.tgz`:

```bash
cd <app-path>/source
nb source build @my-project/plugin-hello --tar
```

O arquivo empacotado é gerado por padrão no diretório `source/storage/tar/`. Ao concluir, o comando imprimirá o caminho completo do tarball.

## Fazer Upload para Outros Aplicativos NocoBase

Faça o upload do arquivo `.tar.gz` e extraia-o para o diretório `./storage/plugins` do aplicativo de destino. Para mais detalhes, consulte [Instalar e Atualizar Plugins](../get-started/install-upgrade-plugins.mdx).

### Ativar Plugin por Padrão

Após o upload, o plugin não é ativado automaticamente — ele aparece no "Gerenciador de plugins" e precisa ser ativado manualmente. Se você estiver mantendo seu próprio aplicativo NocoBase e quiser que o plugin seja ativado por padrão junto com o aplicativo, você pode usar a variável de ambiente `APPEND_PRESET_BUILT_IN_PLUGINS` (adicionar plugins integrados padrão) para controlar isso; consulte [Definir Plugin como Padrão ou Ativado por Padrão](./write-your-first-plugin.md#definir-plugin-como-padrão-ou-ativado-por-padrão-opcional) para mais detalhes.

## Configuração de Construção Personalizada

Geralmente, a configuração de construção padrão é suficiente. Se precisar personalizar — como modificar a entrada de empacotamento, adicionar aliases, ajustar opções de compressão, etc. — você pode criar um arquivo `build.config.ts` na raiz do plugin:

```ts
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // Modifica a configuração de empacotamento do cliente (src/client-v2)
    // Referência: https://rsbuild.rs/guide/configuration/rsbuild
    return config;
  },
  modifyTsupConfig: (config) => {
    // Modifica a configuração de empacotamento do servidor (src/server)
    // Referência: https://tsup.egoist.dev/#using-custom-configuration
    return config;
  },
  beforeBuild: (log) => {
    // Callback antes do início da construção, como limpar arquivos temporários, gerar código, etc.
  },
  afterBuild: (log) => {
    // Callback após a conclusão da construção, como copiar recursos extras, exibir estatísticas, etc.
  },
});
```

Alguns pontos-chave:

- `modifyRsbuildConfig` — Para ajustar o empacotamento do cliente, como adicionar plugins Rsbuild, modificar aliases de resolve, ajustar estratégias de code splitting, etc. Referência de configuração: [Documentação Rsbuild](https://rsbuild.rs/guide/configuration/rsbuild)
- `modifyTsupConfig` — Para ajustar o empacotamento do servidor, como modificar target, externals, entry, etc. Referência de configuração: [Documentação tsup](https://tsup.egoist.dev/#using-custom-configuration)
- `beforeBuild` / `afterBuild` — Hooks antes e depois da construção, recebem uma função `log` para saída de logs. Por exemplo, gerar arquivos de código no `beforeBuild` ou copiar recursos estáticos para o diretório de saída no `afterBuild`

## Links relacionados

- [Escreva Seu Primeiro Plugin](./write-your-first-plugin.md) — Criando um plugin do zero, incluindo o fluxo completo de construção e empacotamento
- [Estrutura do Projeto](./project-structure.md) — Entendendo o papel dos diretórios `plugins/`, `storage/tar` e outros
- [Gerenciamento de Dependências](./dependency-management.md) — Declaração de dependências do plugin e dependências globais
- [Visão Geral do Desenvolvimento de Plugins](./index.md) — Introdução geral ao desenvolvimento de plugins
- [Instalar e Atualizar Plugins](../get-started/install-upgrade-plugins.mdx) — Fazendo upload do arquivo empacotado para o ambiente de destino
- [Variáveis de Ambiente](../get-started/installation/env.md) — Configuração de variáveis de ambiente para plugins predefinidos, integrados e outros
