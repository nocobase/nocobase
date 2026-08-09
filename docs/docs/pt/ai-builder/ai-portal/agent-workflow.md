---
title: "Construção com AI Agent"
description: "Conduza um AI Agent em linguagem natural para escrever as páginas de frontend do AI Portal, incluindo como escrever prompts, dicas de colaboração e como tratar problemas comuns."
keywords: "AI Portal,AI Agent,construção colaborativa,prompts,nocobase-portal-manage,Skills"
---

# Construção com AI Agent

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você já colocou o seu primeiro Portal no ar seguindo o [Início rápido do AI Portal](./index.md).

:::

O desenvolvimento diário do AI Portal é uma conversa com um AI Agent — você descreve a página que quer, ele escreve o código, você confere o resultado no navegador.

## Trabalhe dentro do diretório do Portal

Antes de começar, entre no diretório de código-fonte do Portal e abra ali o seu AI Agent. Assim o Agent já parte do contexto certo, com acesso ao `AGENTS.md` e ao código existente.

Descubra primeiro onde fica o diretório:

```bash
nb portal info main
```

O caminho de desenvolvimento que aparece na saída é onde está o código-fonte do Portal. Faça `cd` até lá e abra o seu AI Agent:

```bash
cd <diretório do workspace de desenvolvimento>
```

Depois disso, basta descrever o que você precisa:

```
Adicione uma página de listagem de pedidos no main portal do meu app nocobase
```

## Faça a IA ler antes de escrever

Existe um `AGENTS.md` na raiz do template descrevendo as convenções deste projeto: prefira reutilizar o que já existe em `src/extensions`, customize os componentes de UI por composição em vez de editar os componentes base e não traga o Ant Design. AI Agents que leem esse arquivo seguem essas convenções automaticamente.

Você também pode adicionar as convenções do seu próprio projeto ao `AGENTS.md` — hábitos de nomenclatura, termos do negócio, diretórios que não devem ser tocados. Uma vez lá dentro, elas valem para todas as conversas, então você não precisa repetir a mesma coisa.

`src/extensions` contém algumas extensões nativas. Entre elas, `nocobase-users-example` é uma página CRUD completa, com listagem, criação, edição e detalhe. Apontar a IA para ela funciona melhor do que descrever uma página nova do zero:

```
Monte uma página de gerenciamento de produtos seguindo o padrão de nocobase-users-example
```

## Exemplos de prompt

### Cenário A: Criar uma página de negócio nova

Três coisas já bastam — o que tem na página, de onde vêm os dados e como ela se comporta:

```
Adicione uma página de gerenciamento de clientes:
a tabela mostra nome, telefone, e-mail e data de criação, com busca por nome,
clicar em uma linha abre uma gaveta de detalhes onde o registro pode ser editado e salvo
```

<!-- 需要一张 AI 生成的客户管理页面效果截图，展示表格、搜索框和详情抽屉 -->

### Cenário B: Alterar uma página existente

Em um pedido de alteração, seja específico sobre o que muda. Não é preciso descrever a página inteira de novo:

```
Adicione um filtro de status à lista de clientes,
com as opções "Em acompanhamento", "Ganho" e "Perdido", sem filtro por padrão
```

<!-- 需要一张添加状态筛选后的页面截图 -->

### Cenário C: Conectar uma tabela nova

Depois que a tabela existe, peça à IA para gerar as páginas correspondentes. Ela lê as definições dos campos e escolhe os controles de formulário e as colunas da listagem de acordo:

```
Acabei de criar uma tabela contracts, monte um conjunto de páginas CRUD correspondente
```

Se a tabela ainda não existe, use [Modelagem de Dados](../data-modeling.md) para a IA desenhar primeiro a estrutura de dados e depois volte para as páginas.

<!-- 需要一张根据数据表自动生成的增删改查页面截图 -->

### Cenário D: Reproduzir um protótipo

Quando você tem um arquivo de design ou um protótipo HTML pronto, entregue-o à IA:

```
Monte a página inicial a partir deste protótipo,
mantenha as mesmas cores e o mesmo layout e conecte os dados à tabela orders
```

<!-- 需要一个视频，展示给出原型图后 AI 复刻出页面的过程 -->

### Cenário E: Adicionar um método de autenticação

Depois que um método de autenticação é habilitado no servidor, a página de login precisa do suporte correspondente no frontend:

```
O login por DingTalk está habilitado no NocoBase, adicione um botão de login com DingTalk na página de login
```

<!-- 需要一张登录页出现第三方登录按钮的截图 -->

## Dicas de colaboração

**Itere em passos pequenos.** Peça à IA para fazer uma página ou uma alteração por vez e confira o resultado antes de seguir. Se você descreve cinco páginas de uma vez, fica difícil saber qual passo saiu dos trilhos quando algo quebra.

**Deixe o servidor de desenvolvimento rodando.** O `nb portal dev main` faz hot reload, então você vê o resultado logo após cada alteração da IA. É o ciclo de feedback mais curto possível.

**Passe o erro exato.** Página em branco, build que falha, um 403 de uma API — cole a mensagem de erro completa e um print para a IA em vez de deixá-la adivinhar. Normalmente algumas rodadas resolvem. Você não precisa descobrir antes em qual camada está o problema.

![error](https://static-docs.nocobase.com/20260803204308.png)

## Perguntas frequentes

**Como reverter quando a IA erra?**

Se o código-fonte do Portal está sob Git, um `git checkout` basta. Com o source storage `nocobase` padrão, você pode baixar uma cópia nova do source storage por cima da local:

```bash
nb portal pull main --force
```

O `--force` apaga o workspace de desenvolvimento e baixa tudo de novo, então confirme que não há nada que você queira preservar antes de executar. Para evitar esse dilema, mova o código-fonte para o Git logo no começo — veja [Deploy e gerenciamento de código-fonte](./deploy.md).

**Como investigar uma falha de build?**

Rode um build localmente primeiro para ver o erro completo:

```bash
nb portal deploy main
```

Erros de tipo do TypeScript e dependências faltando são as duas causas mais comuns. Cole o erro para a IA e deixe que ela corrija.

**Minhas alterações manuais conflitam com as da IA?**

Não. O código-fonte do Portal é um projeto de frontend comum — você pode editá-lo quando quiser e deixar a IA continuar dali. Enquanto vocês dois não estiverem editando o mesmo arquivo ao mesmo tempo, não há problema.

## Links relacionados

- [Início rápido do AI Portal](./index.md) — Coloque no ar a sua primeira entrada de frontend escrita pela IA
- [Deploy e gerenciamento de código-fonte](./deploy.md) — Colocar o código-fonte do Portal sob Git e o fluxo de deploy
- [Estrutura do projeto e stack técnica](./project-structure.md) — As convenções de diretórios do template, para você saber se a IA acertou
- [Componentes padrão e extensões](./components.md) — A base de componentes shadcn/ui e o mecanismo de extensão
- [Modelagem de Dados](../data-modeling.md) — Faça a IA desenhar as tabelas antes de montar as páginas
- [`nb portal info`](../../api/cli/portal/info.md) — Veja onde fica o workspace de desenvolvimento de um Portal
- [`nb portal pull`](../../api/cli/portal/pull.md) — Baixe o código-fonte novamente do source storage
