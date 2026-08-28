# Escreva Seu Primeiro Plugin

Este guia vai te mostrar como criar um plugin de bloco do zero que pode ser usado em páginas, te ajudando a entender a estrutura básica e o fluxo de trabalho de desenvolvimento de plugins NocoBase.

## Pré-requisitos

Antes de começar, certifique-se de que você já instalou o NocoBase com sucesso. Se ainda não instalou, você pode consultar os seguintes guias de instalação:

- [Instalar usando create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Instalar a partir do código-fonte Git](/get-started/installation/git)

Após a instalação ser concluída, você pode oficialmente iniciar sua jornada de desenvolvimento de plugins.

## Passo 1: Crie o Esqueleto do Plugin via CLI

Execute o seguinte comando no diretório raiz do repositório para gerar rapidamente um plugin vazio:

```bash
yarn pm create @my-project/plugin-hello
```

Após o comando ser executado com sucesso, ele irá gerar arquivos básicos no diretório `packages/plugins/@my-project/plugin-hello`. A estrutura padrão é a seguinte:

```bash
packages/plugins/@my-project/plugin-hello/
├─ package.json
├─ README.md
├─ .npmignore
├─ client-v2.d.ts            # Declaração de tipos da entrada do cliente v2
├─ client-v2.js              # Entrada do cliente v2
├─ client.d.ts               # Declaração de tipos da entrada do cliente v1
├─ client.js                 # Entrada do cliente v1
├─ server.d.ts               # Declaração de tipos da entrada do servidor
├─ server.js                 # Entrada do servidor
└─ src
   ├─ index.ts               # Exporta o plugin de servidor por padrão
   ├─ client-v2              # Localização do código do cliente v2
   │  ├─ index.tsx           # Classe do plugin do lado do cliente exportada por padrão
   │  ├─ plugin.tsx          # Entrada do plugin (estende @nocobase/client-v2 Plugin)
   │  └─ client.d.ts
   ├─ client                 # Localização do código do cliente v1
   │  ├─ index.tsx
   │  ├─ plugin.tsx
   │  ├─ locale.ts
   │  ├─ models
   │  │  └─ index.ts
   │  └─ client.d.ts
   ├─ server                 # Localização do código do lado do servidor
   │  ├─ index.ts            # Classe do plugin do lado do servidor exportada por padrão
   │  ├─ plugin.ts           # Entrada do plugin (estende @nocobase/server Plugin)
   │  └─ collections         # Coleções do lado do servidor (diretório vazio inicialmente)
   └─ locale                 # Recursos de idioma
      ├─ en-US.json
      └─ zh-CN.json
```

O scaffold gera um esqueleto mínimo — `src/client-v2/` contém apenas os arquivos de entrada. O diretório `models/` e o `locale.ts` usados nos passos seguintes são criados por você.

Em seguida, inicie o modo de desenvolvimento para que as alterações de código tenham hot reload:

- Se o projeto foi criado com a CLI do NocoBase (`nb init`), execute o comando abaixo no diretório raiz do projeto (`<app-path>`):

  ```bash
  nb source dev
  ```

- Se você mesmo clonou o repositório de código-fonte do NocoBase, execute o comando abaixo no diretório raiz do código-fonte:

  ```bash
  yarn dev
  ```

Com o modo de desenvolvimento em execução, acesse a página do gerenciador de plugins no seu navegador (URL padrão: http://localhost:13000/admin/settings/plugin-manager) para confirmar se o plugin aparece na lista.

## Passo 2: Implemente um Bloco Cliente Simples

Em seguida, vamos adicionar um modelo de bloco personalizado ao plugin para exibir uma mensagem de boas-vindas.

1. **Crie o arquivo utilitário de tradução** `src/client-v2/locale.ts`. `tExpr` declara uma expressão de tradução com namespace e `useT` fornece a função de tradução dentro dos componentes:

```ts
import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';
// @ts-ignore
import pkg from '../../package.json';

export function useT() {
  const engine = useFlowEngine();
  return (str: string) => engine.context.t(str, { ns: [pkg.name, 'client'] });
}

export function tExpr(key: string) {
  return _tExpr(key, { ns: [pkg.name, 'client'] });
}
```

2. **Crie um novo arquivo de modelo de bloco** `src/client-v2/models/HelloBlockModel.tsx`:

```tsx pure
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

3. **Registre o modelo de bloco**. Só criar o arquivo do modelo não basta — o runtime do frontend não escaneia o diretório `models/` automaticamente, então você precisa registrá-lo explicitamente na entrada do plugin. Edite `src/client-v2/plugin.tsx` e declare como o modelo é carregado usando `registerModelLoaders` dentro de `load()`:

```tsx pure
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClientV2 extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}

export default PluginHelloClientV2;
```

O `registerModelLoaders` recebe funções de carregamento preguiçoso, ou seja, o modelo só é carregado quando realmente é usado. A chave (`HelloBlockModel`) precisa ser igual ao nome da classe do modelo — é por esse nome que o runtime obtém a classe entre as exportações nomeadas do módulo.

Após salvar o código, se você estiver executando o modo de desenvolvimento, deverá ver os logs de hot-reload na saída do terminal.

## Passo 3: Ative e Teste o Plugin

Você pode habilitar o plugin via linha de comando ou interface:

- **Linha de Comando**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Interface de Gerenciamento**: Acesse o gerenciador de plugins, encontre `@my-project/plugin-hello` e clique em "Ativar".

Após a ativação, crie uma nova página "Modern page (v2)". Ao adicionar blocos, você verá o "Hello block". Insira-o na página para ver o conteúdo de boas-vindas que você acabou de escrever.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

### Definir Plugin como Padrão ou Ativado por Padrão (Opcional)

O que foi descrito acima é como ativar um único plugin manualmente. Se você estiver mantendo seu próprio aplicativo NocoBase e quiser que determinados plugins estejam automaticamente prontos após executar `nocobase install` (instalação inicial) ou `nocobase upgrade` (atualização), você pode usar duas variáveis de ambiente para controlar o estado padrão dos plugins:

- **`APPEND_PRESET_LOCAL_PLUGINS` (adicionar plugins locais predefinidos padrão)** — adiciona o plugin à lista de plugins locais predefinidos; após a instalação, ele aparece no "Gerenciador de plugins", mas não é ativado por padrão — você precisa ativá-lo manualmente
- **`APPEND_PRESET_BUILT_IN_PLUGINS` (adicionar plugins integrados padrão)** — adiciona o plugin à lista de plugins integrados; ele é ativado automaticamente durante a instalação e, como plugin integrado, **não pode ser desativado ou removido no "Gerenciador de plugins"**

O valor de ambas as variáveis é o nome do pacote do plugin (o campo `name` no `package.json`), com múltiplos plugins separados por vírgulas. Configure assim no `.env`:

```bash
# Predefinido por padrão: aparece na lista do gerenciador de plugins, mas não é ativado automaticamente
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world

# Ativado por padrão: instalado e ativado automaticamente, e não pode ser desativado na interface
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world
```

Em geral, o `yarn pm enable` descrito anteriormente é suficiente para desenvolvimento e depuração local. Essas duas variáveis são mais adequadas para cenários de distribuição "pronto para uso" — por exemplo, quando você empacota um aplicativo NocoBase com plugins fixos e quer que eles estejam disponíveis imediatamente após a inicialização.

:::tip Dica

- O plugin precisa ter sido baixado localmente e ser resolvido no `node_modules`; consulte [Estrutura do Projeto de Plugins](./project-structure.md)
- Após a configuração, é necessário executar `nocobase install` ou `nocobase upgrade` novamente para que as alterações tenham efeito
- A descrição completa das variáveis de ambiente está em [Variáveis de Ambiente](../get-started/installation/env.md#append_preset_local_plugins)

:::

## Passo 4: Construa e Empacote

Quando você estiver pronto para distribuir o plugin para outros ambientes, precisará primeiro construí-lo e depois empacotá-lo:

```bash
yarn build @my-project/plugin-hello --tar
# Ou execute em duas etapas
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> Dica: Se o plugin for criado no repositório de código-fonte, a primeira construção irá acionar uma verificação de tipo de todo o repositório, o que pode levar algum tempo. Recomenda-se garantir que as dependências estejam instaladas e que o repositório esteja em um estado construível.

Após a construção ser concluída, o arquivo empacotado estará localizado por padrão no diretório `storage/tar/`, com o nome `<nome-do-pacote>-<versão>.tgz` — por exemplo, `storage/tar/@my-project/plugin-hello-0.1.0.tgz`.

## Passo 5: Faça o Upload para Outro Aplicativo NocoBase

Faça o upload e extraia para o diretório `./storage/plugins` do aplicativo de destino. Para mais detalhes, consulte [Instalar e Atualizar Plugins](../get-started/install-upgrade-plugins.mdx).

Se o aplicativo de destino foi criado com a CLI do NocoBase (`nb init`), você também pode importá-lo diretamente com `nb plugin import`, sem precisar extrair manualmente:

```bash
nb plugin import /your/path/plugin-hello-0.1.0.tgz
```

## Links Relacionados

- [Visão Geral do Desenvolvimento de Plugins](./index.md) — Conheça a arquitetura de micronúcleo do NocoBase e o ciclo de vida dos plugins
- [Estrutura do Projeto de Plugins](./project-structure.md) — Convenções de diretório do projeto, caminhos de carregamento e prioridade dos plugins
- [Visão Geral do Desenvolvimento no Servidor](./server/index.md) — Introdução geral e conceitos centrais dos plugins do lado do servidor
- [Visão Geral do Desenvolvimento no Cliente](./client/index.md) — Introdução geral e conceitos centrais dos plugins do lado do cliente
- [Construção e Empacotamento](./build.md) — Fluxo de construção, empacotamento e distribuição dos plugins
- [Testes](./server/test.md) — Escrevendo casos de teste para plugins do servidor
- [Instalar usando create-nocobase-app](../get-started/installation/create-nocobase-app) — Uma das formas de instalar o NocoBase
- [Instalar a partir do código-fonte Git](../get-started/installation/git) — Instalar o NocoBase a partir do código-fonte
- [Instalar e Atualizar Plugins](../get-started/install-upgrade-plugins.mdx) — Fazer upload do plugin empacotado para outros ambientes
- [Variáveis de Ambiente](../get-started/installation/env.md) — Configuração de variáveis de ambiente para plugins predefinidos, integrados e outros