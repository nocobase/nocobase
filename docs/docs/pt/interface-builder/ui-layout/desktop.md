---
title: "Layout para desktop"
description: "Conheça a navegação, a construção de páginas, o gerenciamento de rotas e o comportamento responsivo em telas estreitas do layout para desktop do NocoBase."
keywords: "layout para desktop,layout da interface,tela estreita,layout responsivo,construção de páginas,gerenciamento de rotas,UI Editor,NocoBase"
---

# Layout para desktop

No NocoBase, o **layout para desktop** é a interface padrão da aplicação. Ele atende ao gerenciamento de dados, preenchimento de formulários, configuração de processos e tarefas diárias no computador, e também ajusta a navegação e o conteúdo das páginas em telas estreitas.

O layout para desktop é acessado por padrão em `/admin`. Se a aplicação tiver um prefixo de acesso próprio, o endereço real receberá esse prefixo automaticamente.

<!-- É necessária uma captura de tela de uma página completa no layout para desktop, mostrando a navegação superior, a navegação lateral e a área de conteúdo -->

## Características do layout

O layout para desktop é composto principalmente pelas seguintes áreas:

- **Navegação superior** — exibe a troca de aplicações e os acessos às ações globais.
- **Navegação lateral** — exibe as páginas e os links do grupo atual.
- **Área de conteúdo da página** — exibe abas de página, blocos, campos e ações.
- **UI Editor** — ativa o modo de construção da interface para ajustar menus e o conteúdo das páginas.

A navegação superior e a lateral mantêm o item da rota atual selecionado. Ao trocar de página, o conteúdo aparece na área à direita, e o estado das páginas já abertas geralmente é preservado.

## Construir uma página

### Primeiro passo: entrar no layout para desktop

Acesse `/admin` para abrir o layout para desktop. Normalmente, a aplicação também abre essa área logo após o login.

<!-- É necessária uma captura de tela da página exibida ao entrar no layout para desktop -->

### Segundo passo: abrir o UI Editor

Clique em «UI Editor» no canto superior direito da página para entrar no modo de construção da interface. Depois de ativá-lo, os menus, as páginas, os blocos, os campos e as ações passam a exibir os respectivos acessos de configuração.

<!-- É necessária uma captura de tela mostrando a posição do botão «UI Editor» e a página depois de ativá-lo -->

### Terceiro passo: criar menus e páginas

Você pode adicionar grupos, páginas ou links na área de navegação e também ativar abas em uma página. Depois de criar a página, abra-a e adicione os blocos necessários.

A construção do conteúdo segue o mesmo fluxo das demais interfaces: primeiro adicione [blocos](../blocks/index.md) e depois configure [campos](../fields/index.md) e [ações](../actions/index.md) de acordo com o processo de negócio.

<!-- É necessário um vídeo mostrando como adicionar um menu, criar uma página e entrar nela -->

### Quarto passo: configurar o conteúdo da página

Adicione à página blocos de tabela, formulário, detalhes, filtro ou outros tipos. Depois, ajuste a organização dos campos, das ações e dos blocos. Todas as alterações aparecem diretamente na página atual.

<!-- É necessária uma captura de tela de uma página para desktop no modo de construção, mostrando os acessos de configuração de blocos, campos e ações -->

## Gerenciar rotas e menus

O menu e as rotas do desktop usam a mesma configuração. Ao adicionar uma página ou um link na área de navegação, o item correspondente também aparece no [Gerenciador de Rotas](../../routes/index.md). Da mesma forma, alterações feitas no Gerenciador de Rotas atualizam o menu.

O desktop aceita os seguintes tipos de rota mais usados:

- **Grupo (Group)** — reúne várias páginas e vários links em um mesmo grupo de navegação.
- **Página (Page)** — abre uma página na qual você pode continuar adicionando blocos.
- **Link (Link)** — abre um endereço interno ou externo.
- **Aba (Tab)** — organiza vários conteúdos em abas dentro de uma página.

No Gerenciador de Rotas, você pode adicionar, editar, excluir, exibir ou ocultar rotas. Quando precisar reorganizar toda a estrutura do menu, esse é o lugar mais prático para fazer os ajustes.

<!-- É necessária uma captura de tela da página «Central de Configurações / Rotas / Rotas do desktop» -->

## Responsividade em telas estreitas

O layout para desktop pode ser usado diretamente em um celular ou em uma janela estreita do navegador. Quando entra no modo de exibição para telas estreitas, ele continua usando as rotas e as páginas originais do desktop e não muda automaticamente para o layout móvel.

### Alterações no layout

O menu de navegação é recolhido, e as ações superiores passam para um acesso mais compacto. As margens da página e os espaços entre os blocos também diminuem, e a área de conteúdo se ajusta à altura visível do navegador móvel.

O UI Editor não fica disponível em telas estreitas. Para alterar menus ou páginas, é melhor voltar ao navegador do computador.

<!-- É necessário um vídeo mostrando a mesma página do desktop mudando de uma tela larga para uma tela estreita -->

### Adaptação do conteúdo da página

Layouts e componentes comuns da página também se ajustam a telas estreitas. Por exemplo, blocos em várias colunas passam a favorecer a leitura vertical; tabelas permitem visualizar horizontalmente as colunas que ultrapassam a tela; paginação e ações ficam mais compactas. Seleções, data e hora, filtros e subpáginas também adotam interações mais adequadas a telas pequenas.

O comportamento adicional de outros blocos em telas estreitas depende do suporte de cada bloco. As tabelas continuam sendo exibidas como tabelas e não são convertidas automaticamente em cartões.

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
