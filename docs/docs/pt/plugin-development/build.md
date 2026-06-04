# Construção

Após o desenvolvimento do plugin, são necessárias duas etapas — construção (compilar o código-fonte) e empacotamento (gerar o `.tar.gz`) — antes de distribuí-lo para outros aplicativos NocoBase.

## Construir o Plugin

A construção compila o código-fonte TypeScript em `src/` para JavaScript — o código do cliente é empacotado pelo Rsbuild e o código do servidor pelo tsup:

```bash
yarn build @my-project/plugin-hello
```

O resultado da construção é gerado no diretório `dist/` da raiz do plugin.

:::tip Dica

Se o plugin foi criado no repositório de código-fonte, a primeira construção irá acionar uma verificação de tipo de todo o repositório, o que pode levar algum tempo. Recomenda-se garantir que as dependências estejam instaladas e que o repositório esteja em um estado construível.

:::

## Empacotar o Plugin

O empacotamento comprime o resultado da construção em um arquivo `.tar.gz`, facilitando o upload para outros ambientes:

```bash
yarn nocobase tar @my-project/plugin-hello
```

O arquivo empacotado é gerado por padrão em `storage/tar/@my-project/plugin-hello.tar.gz`.

Você também pode usar o parâmetro `--tar` para combinar construção e empacotamento em uma única etapa:

```bash
yarn build @my-project/plugin-hello --tar
```

## Fazer Upload para Outros Aplicativos NocoBase

Faça o upload do arquivo `.tar.gz` e extraia-o para o diretório `./storage/plugins` do aplicativo de destino. Para mais detalhes, consulte [Instalar e Atualizar Plugins](../get-started/install-upgrade-plugins.mdx).

### Ativar Plugin por Padrão

Após o upload, o plugin não é ativado automaticamente — ele aparece no "Gerenciador de plugins" e precisa ser ativado manualmente. Se você estiver mantendo seu próprio aplicativo NocoBase e quiser que o plugin seja ativado por padrão junto com o aplicativo, você pode usar a variável de ambiente `APPEND_PRESET_BUILT_IN_PLUGINS` (adicionar plugins integrados padrão) para controlar isso; consulte [Definir Plugin como Padrão ou Ativado por Padrão](./write-your-first-plugin.md#definir-plugin-como-padrão-ou-ativado-por-padrão-opcional) para mais detalhes.

## Configuração de Construção Personalizada

Se você quiser personalizar a configuração de construção, você pode criar um arquivo `build.config.ts` na pasta raiz do **plugin** com o seguinte conteúdo:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // O Rsbuild é usado para empacotar o código do lado do cliente (`src/client`).

    // Para modificar a configuração do Rsbuild, consulte: https://rsbuild.rs/guide/configuration/rsbuild
    return config
  },
  modifyTsupConfig: (config) => {
    // O tsup é usado para empacotar o código do lado do servidor (`src/server`).

    // Para modificar a configuração do tsup, consulte: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Função de callback executada antes do início da construção, permitindo operações pré-construção.
  },
  afterBuild: (log: PkgLog) => {
    // Função de callback executada após a conclusão da construção, permitindo operações pós-construção.
  };
});
```

## Links Relacionados

- [Escreva Seu Primeiro Plugin](./write-your-first-plugin.md) — Criando um plugin do zero, incluindo o fluxo completo de construção e empacotamento
- [Estrutura do Projeto de Plugins](./project-structure.md) — Entendendo o papel dos diretórios `packages/plugins`, `storage/tar` e outros
- [Gerenciamento de Dependências](./dependency-management.md) — Declaração de dependências do plugin e dependências globais
- [Visão Geral do Desenvolvimento de Plugins](./index.md) — Introdução geral ao desenvolvimento de plugins
- [Instalar e Atualizar Plugins](../get-started/install-upgrade-plugins.mdx) — Fazendo upload do arquivo empacotado para o ambiente de destino
- [Variáveis de Ambiente](../get-started/installation/env.md) — Configuração de variáveis de ambiente para plugins predefinidos, integrados e outros
