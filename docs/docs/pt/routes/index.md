---
pkg: "@nocobase/plugin-client"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Gerenciador de Rotas

## Introdução

O gerenciador de rotas é uma ferramenta para gerenciar as rotas da página principal do sistema, com suporte para `desktop` e `mobile`. As rotas criadas usando o gerenciador de rotas serão sincronizadas com o menu (podem ser configuradas para não aparecer no menu). Por outro lado, os itens de menu adicionados na seção de menu da página também serão sincronizados com a lista do gerenciador de rotas.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Manual do Usuário

### Tipos de Rotas

O sistema oferece suporte a quatro tipos de rotas:

-   Grupo (`group`): Usado para organizar rotas, podendo incluir sub-rotas.
-   Página (`page`): Uma página interna do sistema.
-   Aba (`tab`): Usado para alternar entre abas dentro de uma página.
-   Link (`link`): Um link interno ou externo que redireciona diretamente para o endereço configurado.

### Adicionar Rota

Clique no botão "Add new" no canto superior direito para criar uma nova rota:

1.  Selecione o tipo de rota (`Type`)
2.  Preencha o título da rota (`Title`)
3.  Selecione o ícone da rota (`Icon`)
4.  Defina se a rota deve aparecer no menu (`Show in menu`)
5.  Defina se as abas da página devem ser ativadas (`Enable page tabs`)
6.  Para rotas do tipo página, o sistema gerará automaticamente um caminho de rota (`Path`) exclusivo.

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Ações da Rota

Cada item de rota oferece suporte às seguintes ações:

-   Adicionar filho (`Add child`): Adiciona uma sub-rota.
-   Editar (`Edit`): Edita a configuração da rota.
-   Visualizar (`View`): Visualiza a página da rota.
-   Excluir (`Delete`): Exclui a rota.

### Ações em Massa

A barra de ferramentas superior oferece as seguintes ações em massa:

-   Atualizar (`Refresh`): Atualiza a lista de rotas.
-   Excluir (`Delete`): Exclui as rotas selecionadas.
-   Ocultar no menu (`Hide in menu`): Oculta as rotas selecionadas no menu.
-   Mostrar no menu (`Show in menu`): Exibe as rotas selecionadas no menu.

### Filtro de Rotas

Use a função "Filter" na parte superior para filtrar a lista de rotas.

:::info{title=Dica}
A modificação das configurações de rota afetará diretamente a estrutura do menu de navegação do sistema. Prossiga com cautela e certifique-se da correção das configurações de rota.
:::