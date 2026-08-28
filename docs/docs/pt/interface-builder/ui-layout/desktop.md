---
title: "Layout para desktop"
description: "Conheça a navegação, a construção de páginas, o gerenciamento de rotas e o comportamento responsivo em telas estreitas do layout para desktop do NocoBase."
keywords: "layout para desktop,layout da interface,tela estreita,layout responsivo,construção de páginas,gerenciamento de rotas,UI Editor,NocoBase"
---

# Layout para desktop

No NocoBase, o **layout para desktop** é a interface padrão da aplicação. Ele atende ao gerenciamento de dados, preenchimento de formulários, configuração de processos e tarefas diárias no computador, e também pode ser usado em dispositivos móveis.

O layout para desktop é acessado por padrão em `/admin`. Se a aplicação tiver um prefixo de acesso próprio, o endereço real receberá esse prefixo automaticamente.

![20260715224020](https://static-docs.nocobase.com/20260715224020.png)

![20260715224603](https://static-docs.nocobase.com/20260715224603.png)

## Construir uma página

### Primeiro passo: entrar no layout para desktop

Acesse `/admin` para abrir o layout para desktop. Normalmente, a aplicação também abre essa área logo após o login.

![20260715225049](https://static-docs.nocobase.com/20260715225049.png)

### Segundo passo: abrir o UI Editor

Clique em «UI Editor» no canto superior direito da página para entrar no modo de construção da interface. Depois de ativá-lo, os menus, as páginas, os blocos, os campos e as ações passam a exibir os respectivos acessos de configuração.

![20260715225155_rec_](https://static-docs.nocobase.com/20260715225155_rec_.gif)

### Terceiro passo: criar menus e páginas

Você pode adicionar grupos, páginas ou links na área de navegação e também ativar abas em uma página. Depois de criar a página, abra-a e adicione os blocos necessários.

A construção do conteúdo segue o mesmo fluxo das demais interfaces: primeiro adicione [blocos](../blocks/index.md) e depois configure [campos](../fields/index.md) e [ações](../actions/index.md) de acordo com o processo de negócio.

![20260715225316_rec_](https://static-docs.nocobase.com/20260715225316_rec_.gif)

### Quarto passo: configurar o conteúdo da página

Adicione à página blocos de tabela, formulário, detalhes, filtro ou outros tipos. Depois, ajuste a organização dos campos, das ações e dos blocos. Todas as alterações aparecem diretamente na página atual.

![20260715225424_rec_](https://static-docs.nocobase.com/20260715225424_rec_.gif)

## Gerenciar rotas e menus

Ao adicionar uma página ou um link na área de navegação, o item correspondente também aparece no [Gerenciador de Rotas](../../routes/index.md). Da mesma forma, alterações feitas no Gerenciador de Rotas atualizam o menu.

O desktop aceita os seguintes tipos de rota mais usados:

- **Grupo (Group)** — reúne várias páginas e vários links em um mesmo grupo de navegação.
- **Página (Page)** — abre uma página na qual você pode continuar adicionando blocos.
- **Link (Link)** — abre um endereço interno ou externo.
- **Aba (Tab)** — organiza vários conteúdos em abas dentro de uma página.

No Gerenciador de Rotas, você pode adicionar, editar, excluir, exibir ou ocultar rotas. Quando precisar reorganizar toda a estrutura do menu, esse é o lugar mais prático para fazer os ajustes.

![20260715225711_rec_](https://static-docs.nocobase.com/20260715225711_rec_.gif)

## Responsividade em telas estreitas

O layout para desktop pode ser usado diretamente em um celular ou em uma janela estreita do navegador. Quando entra no modo de exibição para telas estreitas, ele ainda usa as rotas e as páginas originais do desktop e não muda automaticamente para o layout móvel.

### Alterações no layout

O menu de navegação é recolhido, e as ações superiores passam para um acesso mais compacto. As margens da página e os espaços entre os blocos também diminuem, e a área de conteúdo se ajusta à altura visível do navegador móvel.

O UI Editor não fica disponível em telas estreitas. Para alterar menus ou páginas, é necessário voltar ao navegador do computador.

![20260715224603](https://static-docs.nocobase.com/20260715224603.png)

### Adaptação do conteúdo da página

Os componentes mais usados também ajustam a interação em telas estreitas para facilitar o uso no celular. Por exemplo, blocos em várias colunas passam para uma única coluna; tabelas permitem visualizar horizontalmente as colunas que ultrapassam a tela; paginação e ações ficam mais compactas. Seleções, data e hora, filtros e subpáginas também adotam interações mais adequadas ao celular.

:::tip Layout responsivo para desktop e layout móvel

Se você só acessa ocasionalmente pelo celular, a responsividade do layout para desktop é suficiente. Se precisar de navegação inferior, páginas móveis e fluxos de operação próprios, configure também o [layout para dispositivos móveis](./mobile.md).

:::

## Recomendações de uso

- Use o layout para desktop por padrão em processos realizados principalmente no computador.
- Conclua a construção da página em uma tela larga e depois reduza a janela para conferir o resultado em telas estreitas.
- Se a página tiver muitas colunas de tabela ou ações horizontais, mantenha apenas o conteúdo necessário para reduzir a carga de operação em telas pequenas.
- Se os fluxos de uso no computador e no celular forem muito diferentes, construir duas páginas separadas deixa a configuração mais clara.

## Links relacionados

- [Visão geral dos layouts da interface](./index.md) — conheça os casos de uso dos layouts para desktop e dispositivos móveis
- [Layout para dispositivos móveis](./mobile.md) — construa navegação e páginas independentes para dispositivos móveis
- [Blocos](../blocks/index.md) — adicione e configure blocos em uma página
- [Campos](../fields/index.md) — configure campos de tabelas, formulários e detalhes
- [Ações](../actions/index.md) — configure botões de ação em páginas e blocos
- [Gerenciador de Rotas](../../routes/index.md) — gerencie menus e rotas do desktop em um só lugar
- [Configuração de permissões](../../users-permissions/acl/permissions.md) — controle as rotas do desktop que cada função pode acessar
