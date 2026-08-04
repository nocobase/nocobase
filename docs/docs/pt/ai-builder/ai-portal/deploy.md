---
title: "Deploy e gerenciamento de código-fonte"
description: "O fluxo completo de desenvolvimento, envio e deploy de um AI Portal, além dos dois modos de source storage e do deploy em múltiplos ambientes."
keywords: "AI Portal,deploy,source storage,Git,nb portal deploy,nb portal push,múltiplos ambientes"
---

# Deploy e gerenciamento de código-fonte

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você já colocou o seu primeiro Portal no ar seguindo o [Início rápido do AI Portal](./index.md).

:::

O código-fonte do Portal fica em três lugares: o workspace de desenvolvimento local, o source storage e os artefatos implantados. O `nb portal` mantém os três em sincronia.

## O ciclo de vida completo

O ciclo do dia a dia é assim:

```text
dev (desenvolvimento local) → push (envio do código-fonte) → deploy (build e deploy)
```

Onde:

1. `nb portal dev <portal>` — Inicia o servidor de desenvolvimento local, você altera o código e vê o resultado
2. `nb portal push <portal>` — Envia as alterações locais do código-fonte para o source storage
3. `nb portal deploy <portal>` — Compila e faz o deploy, tornando as alterações visíveis para os usuários

Se você está assumindo um Portal que um colega já criou, ou trocou de máquina, baixe-o localmente primeiro:

```bash
nb portal list                 # Ver quais Portals existem
nb portal pull customer        # Baixar o código-fonte localmente
nb portal dev customer         # Começar a desenvolver
```

O `pull` baixa e descompacta o código-fonte no workspace de desenvolvimento, `./<portal>` por padrão, ou em outro lugar com `--path`. As dependências são instaladas automaticamente; adicione `--no-install` para pular isso em CI ou quando você preferir instalá-las por conta própria.

Depois de um pull bem-sucedido, a localização do workspace de desenvolvimento fica registrada na configuração de env da CLI, então `dev`, `push` e `deploy` leem o código-fonte de lá sem que você precise indicar toda vez.

## Adicionar um Portal

Uma aplicação pode ter vários Portals com páginas e permissões separadas, mas dados compartilhados. Por exemplo, uma entrada para a equipe interna e outra para clientes externos:

```bash
nb portal create customer
```

A criação gera `./customer` no diretório atual como workspace de desenvolvimento a partir do template `@nocobase/portal-template-default`, escreve `.env` e `.env.local` e depois instala as dependências. Use `--path` para colocá-lo em outro lugar.

<!-- 需要一张 nb portal create 执行完成后的终端输出截图 -->

O nome de um Portal só pode conter letras minúsculas, dígitos, sublinhados e hífens, e precisa começar com uma letra minúscula ou um dígito.

## source storage

O código-fonte do Portal pode ser guardado em dois lugares:

| Modo | Descrição | Quando usar |
| --- | --- | --- |
| `nocobase` | O padrão, com o código-fonte gerenciado pelo source storage do NocoBase | Começar rápido, desenvolvimento solo, sem necessidade de code review |
| `git` | Código-fonte salvo em um repositório Git que você indica | Trabalho em equipe, code review, integração com CI |

O `nocobase` padrão é o mais rápido para começar, já que você não precisa de um repositório antes. Ele não tem histórico de versões, porém, então uma alteração ruim só pode ser revertida sobrescrevendo tudo. **Se esse Portal vai ser iterado a longo prazo, mova-o para o Git logo.**

### Mudar para o Git

O `create` só gera o workspace de desenvolvimento; a configuração de source storage passa pelo `config`. Você pode mudar a qualquer momento depois de criar:

```bash
nb portal config customer \
  --source-storage git \
  --git-repo git@github.com:nocobase/customer-portal.git

nb portal push customer --message "Move customer portal source to Git"
```

O `config` sincroniza a configuração de source storage com o registro remoto do Portal, e os `push` seguintes passam a ir pelo Git.

Com um Portal por repositório, a raiz padrão do repositório já serve para `--git-path`. Você só precisa de um subdiretório quando quiser vários Portals no mesmo repositório:

```bash
nb portal config customer --git-path portals/customer
```

### Baixar de outro repositório temporariamente

Para experimentar o código-fonte de outro repositório sem alterar a configuração do Portal, o `pull` aceita uma sobrescrita pontual:

```bash
nb portal pull customer --git-repo git@github.com:nocobase/another-portal.git
```

Isso não modifica o registro remoto do Portal, e `--git-branch` e `--git-path` só podem ser usados junto com `--git-repo`. Para mudar permanentemente para o armazenamento em Git, use o `config` como acima.

O `config` também pode alterar onde fica o workspace de desenvolvimento — depois de mover o código-fonte para outro diretório, informe à CLI a nova localização com `--path`:

```bash
nb portal config customer --path ./workspaces/customer
```

## Diferenças entre os tipos de env

O `nb portal` sincroniza de formas diferentes dependendo do tipo de env:

| Tipo de env | Descrição |
| --- | --- |
| `local` | A aplicação está nesta máquina. O `pull` traz o código-fonte para o workspace de desenvolvimento e o `deploy` compila a partir dele e sincroniza os artefatos |
| `docker` | A aplicação roda no Docker, compartilhada por um volume. O comportamento é o mesmo do anterior |
| `http` | Sincronizado pela API. `pull` / `push` baixam ou enviam um arquivo compactado do código-fonte |

Envs do tipo `ssh` ainda não suportam gerenciamento de Portal.

## Deploy em múltiplos ambientes

O mesmo Portal pode ser implantado em ambientes diferentes, com `--env` indicando o destino:

```bash
nb portal deploy customer --env prod --yes
```

O `--yes` pula a confirmação interativa. Quando o `--env` que você passa explicitamente difere do env atual, a CLI para e pergunta por padrão. Lembre-se de incluir `--yes` em scripts ou em CI, senão o comando trava na confirmação.

Para a publicação entre ambientes da estrutura das tabelas e das configurações, consulte [Gerenciamento de Publicação](../publish.md).

## Caminho de acesso

Depois do deploy, o caminho de acesso de um Portal é:

```text
<appPublicPath>/x/<portal>/
```

Para um Portal dentro de uma subaplicação:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

O prefixo `/x/` pertence aos AI Portals; os Portals no-code usam `/v/`.

## Excluir um Portal

```bash
nb portal destroy customer
```

Isso exclui o registro do Portal e os arquivos implantados, mantendo por padrão o workspace de desenvolvimento local. Adicione `--delete-dev-path` quando você também quiser eliminar o workspace de desenvolvimento.

## Links relacionados

- [Início rápido do AI Portal](./index.md) — Coloque no ar a sua primeira entrada de frontend escrita pela IA
- [Construção com AI Agent](./agent-workflow.md) — Conduza a IA em linguagem natural para escrever páginas
- [Estrutura do projeto e stack técnica](./project-structure.md) — Comandos de build e variáveis de ambiente
- [Gerenciamento de Publicação](../publish.md) — Publique estruturas de tabelas e configurações entre ambientes
- [Referência do comando `nb portal`](../../api/cli/portal/index.md) — Descrição completa dos parâmetros de todos os comandos de Portal
- [`nb portal create`](../../api/cli/portal/create.md) — Todos os parâmetros para criar um Portal
- [`nb portal config`](../../api/cli/portal/config.md) — Ajuste o source storage e o caminho do workspace de desenvolvimento
- [`nb portal push`](../../api/cli/portal/push.md) — Envie o código-fonte para o source storage
- [`nb portal deploy`](../../api/cli/portal/deploy.md) — Compile e faça o deploy de um Portal
- [`nb portal pull`](../../api/cli/portal/pull.md) — Baixe o código-fonte do source storage
- [`nb portal destroy`](../../api/cli/portal/destroy.md) — Exclua o registro do Portal e os arquivos implantados
