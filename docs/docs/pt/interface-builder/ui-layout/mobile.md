---
title: "Layout para dispositivos móveis"
description: "Conheça a navegação, a construção e visualização de páginas, as subpáginas, as rotas e as permissões do layout para dispositivos móveis do NocoBase."
keywords: "layout para dispositivos móveis,página móvel,navegação inferior,visualização móvel,rota móvel,UI Editor,NocoBase"
---

# Layout para dispositivos móveis

No NocoBase, o **layout para dispositivos móveis** serve para construir uma navegação e páginas independentes para dispositivos móveis. Ele é acessado por padrão em `/mobile`, usa uma barra de abas inferior como navegação principal e é mais adequado ao registro e à consulta de dados, às aprovações e ao tratamento de tarefas no celular.

Os layouts para dispositivos móveis e desktop usam as mesmas fontes e os mesmos dados de negócio, mas menus, rotas e conteúdo das páginas são configurados separadamente. Assim, você pode reorganizar as páginas para a forma de uso no celular sem ficar limitado pela estrutura das páginas do desktop.

<!-- É necessária uma captura de tela de uma página completa no layout para dispositivos móveis em um aparelho real -->

## Entrar e visualizar o layout para dispositivos móveis

Por padrão, clique em «Dispositivos móveis» na Central de Configurações ou acesse `/mobile` diretamente.

É melhor construir as páginas no navegador do computador. Nesse modo, são exibidos uma área de visualização móvel e uma barra de ferramentas superior, em que:

- «UI Editor» ativa ou desativa o modo de construção da interface.
- «Visualização em tablet» confere a exibição em dispositivos móveis mais largos.
- «Visualização móvel» restaura a área de visualização para o tamanho de um celular.
- «Código QR» abre o endereço móvel atual em um celular.

![20260715221712](https://static-docs.nocobase.com/20260715221712.png)

Depois de concluir a construção no computador, use o código QR para conferir o resultado em um aparelho real. Verifique principalmente a navegação, a rolagem, a entrada de dados em formulários, as páginas sobrepostas e a área segura da tela.

## Construir a navegação móvel

O layout para dispositivos móveis usa uma barra de abas inferior como navegação principal. Atualmente, essa navegação oferece principalmente páginas e links.

### Adicionar uma página

1. Abra o «UI Editor».
2. Clique no botão de adição à direita da barra de abas inferior.
3. Selecione «Página».
4. Preencha o título da página e escolha um ícone.
5. Depois de enviar, entre na nova página e continue adicionando o conteúdo.

![20260715221823_rec_](https://static-docs.nocobase.com/20260715221823_rec_.gif)

### Adicionar um link

Se precisar abrir um endereço interno ou externo, selecione «Link» e configure o título, o ícone e a URL.

O link pode ser aberto na janela atual ou em uma nova janela. O comportamento depende da configuração do link.

![20260715221950](https://static-docs.nocobase.com/20260715221950.png)

### Ajustar a navegação

No modo de construção da interface, arraste as abas inferiores para alterar a ordem. Em cada aba, você também pode editar o título e o ícone, configurar regras de vinculação, copiar o UID ou excluir o item.

Para visualizar, exibir, ocultar ou excluir rotas móveis em um só lugar, abra «Central de Configurações / Rotas / Rotas móveis».

![20260715222113_rec_](https://static-docs.nocobase.com/20260715222113_rec_.gif)

## Construir uma página móvel

Primeiro crie e abra uma página móvel e, em seguida, adicione blocos a ela. A ideia para construir o conteúdo é basicamente a mesma do desktop: use [blocos](../blocks/index.md), [campos](../fields/index.md) e [ações](../actions/index.md) para organizar o conteúdo do processo de negócio. A navegação móvel e a interação de alguns componentes, no entanto, são ajustadas para telas pequenas.

### Adicionar conteúdo à página

1. Entre na página móvel que você quer construir.
2. Confirme se o «UI Editor» está aberto.
3. Clique em «Adicionar bloco» na página.
4. Selecione uma tabela, um formulário, detalhes, filtro ou outro bloco.
5. Continue configurando campos, ações e definições do bloco.

![20260715222230_rec_](https://static-docs.nocobase.com/20260715222230_rec_.gif)

### Usar abas de página

Uma página móvel também pode ter abas. Conteúdos que pertencem à mesma entrada de navegação, mas são relativamente independentes, podem ser colocados em abas diferentes.

1. Abra as configurações da página e ative «Ativar abas». Você também pode editar a página em «Central de Configurações / Rotas / Rotas móveis» e marcar «Ativar abas da página».
2. Abra o «UI Editor».
3. Clique em «Adicionar aba» à direita da barra de abas da página.
4. Adicione a aba e continue configurando seu nome e conteúdo.

Se a página móvel tiver pouco conteúdo, use uma única página. Nesse caso, não é necessário ativar abas.

![20260715222354_rec_](https://static-docs.nocobase.com/20260715222354_rec_.gif)

### Interações móveis dos componentes mais usados

Os componentes mais usados ajustam a organização e a interação no layout para dispositivos móveis. Por exemplo, conteúdos em várias colunas passam automaticamente para uma única coluna, mais adequada à leitura vertical; campos de seleção, data e hora usam seletores móveis; filtros, registros associados e subpáginas adotam interfaces mais adequadas ao toque.

As tabelas continuam sendo exibidas como tabelas e permitem rolar horizontalmente para ver as colunas que ultrapassam a tela. O comportamento móvel adicional de outros blocos depende do suporte de cada bloco.

## Páginas e subpáginas

O conteúdo aberto por ações de visualização, edição ou seleção de registros associados aparece como uma subpágina móvel. A subpágina oferece um botão para voltar à página anterior.

Ao entrar em uma subpágina mais profunda, a barra de abas inferior é ocultada para liberar mais espaço para o conteúdo atual. Ao fechar a subpágina ou voltar ao nível anterior, a barra volta a aparecer.

Ao alternar entre as abas inferiores, o estado das páginas já abertas é preservado. Assim, você pode mudar entre várias tarefas móveis sem perder o contexto.

![20260715222828_rec_](https://static-docs.nocobase.com/20260715222828_rec_.gif)

## Gerenciar rotas e permissões

As rotas móveis podem ser mantidas em um só lugar no [Gerenciador de Rotas](../../routes/index.md). Abra «Central de Configurações / Rotas / Rotas móveis» para adicionar, editar, excluir, exibir ou ocultar páginas e links, e também para configurar abas de página.

As permissões de acesso às rotas móveis são configuradas separadamente das rotas do desktop. Nas permissões da função, abra «Rotas móveis» e selecione as páginas que a função pode acessar. Consulte a [Configuração de permissões](../../users-permissions/acl/permissions.md) para obter mais informações.

![20260715223016_rec_](https://static-docs.nocobase.com/20260715223016_rec_.gif)

![20260715223106_rec_](https://static-docs.nocobase.com/20260715223106_rec_.gif)

## Relação com o layout para desktop

Os layouts para desktop e dispositivos móveis podem ter páginas diferentes baseadas na mesma tabela de dados. Por exemplo, o desktop pode usar uma tabela com mais campos para tratar os dados, enquanto o celular usa uma lista ou um formulário mais simples para registros em campo.

As páginas dos dois layouts não são sincronizadas automaticamente. Alterar uma página, um menu ou uma rota do desktop não atualiza a configuração móvel, e alterações feitas no layout móvel também não afetam o desktop.

:::tip Recomendação de uso

Se você só precisa consultar ocasionalmente uma página do desktop pelo celular, comece usando a responsividade em telas estreitas do [layout para desktop](./desktop.md). Configure um layout móvel separado apenas quando precisar de navegação e fluxos de página independentes para dispositivos móveis.

:::

## Links relacionados

- [Visão geral dos layouts da interface](./index.md) — conheça os casos de uso dos layouts para desktop e dispositivos móveis
- [Layout para desktop](./desktop.md) — use o layout padrão para desktop e sua responsividade em telas estreitas
- [Blocos](../blocks/index.md) — adicione conteúdo de negócio às páginas móveis
- [Campos](../fields/index.md) — configure formulários móveis e campos de exibição de dados
- [Ações](../actions/index.md) — configure botões de ação em páginas móveis
- [Gerenciador de Rotas](../../routes/index.md) — gerencie páginas, links e abas móveis
- [Configuração de permissões](../../users-permissions/acl/permissions.md) — controle as rotas móveis que cada função pode acessar
