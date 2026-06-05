---
pkg: '@nocobase/plugin-acl'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Configurando Permissões

## Configurações de Permissões Gerais

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Permissões de Configuração

1.  **Permite configurar a interface**: Esta permissão controla se um usuário pode configurar a interface. Ao ativá-la, um botão de configuração da interface do usuário (UI) é exibido. O papel "admin" tem esta permissão ativada por padrão.
2.  **Permite instalar, ativar, desativar plugins**: Esta permissão define se um usuário pode ativar ou desativar **plugins**. Quando ativa, o usuário tem acesso à interface do gerenciador de **plugins**. O papel "admin" tem esta permissão ativada por padrão.
3.  **Permite configurar plugins**: Esta permissão permite que o usuário configure parâmetros de **plugins** ou gerencie dados de backend de **plugins**. O papel "admin" tem esta permissão ativada por padrão.
4.  **Permite limpar cache, reiniciar aplicação**: Esta permissão está ligada a tarefas de manutenção do sistema, como limpar o cache e reiniciar a aplicação. Uma vez ativada, os botões de operação relacionados aparecem no centro pessoal. Esta permissão é desativada por padrão.
5.  **Novos itens de menu são acessíveis por padrão**: Os menus recém-criados são acessíveis por padrão, e esta configuração é ativada por padrão.

### Permissões de Ação Globais

As permissões de ação globais se aplicam universalmente a todas as **coleções** e são categorizadas por tipo de operação. Essas permissões podem ser configuradas com base no escopo dos dados: todos os dados ou os dados do próprio usuário. A primeira permite operações em toda a **coleção**, enquanto a segunda restringe as operações aos dados relevantes para o usuário.

## Permissões de Ação da Coleção

![](https://static-docs.nocobase.com/6a6e0281391cecdea5b5218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

As permissões de ação da **coleção** permitem um ajuste fino das permissões de ação globais, configurando o acesso aos recursos dentro de cada **coleção**. Essas permissões são divididas em dois aspectos:

1.  **Permissões de ação**: Elas incluem ações de adicionar, visualizar, editar, excluir, exportar e importar. As permissões são definidas com base no escopo dos dados:
    -   **Todos os registros**: Concede ao usuário a capacidade de realizar ações em todos os registros dentro da **coleção**.
    -   **Registros próprios**: Restringe o usuário a realizar ações apenas nos registros que ele criou.

2.  **Permissões de campo**: As permissões de campo permitem que você defina permissões específicas para cada campo durante diferentes operações. Por exemplo, certos campos podem ser configurados para serem somente leitura, sem privilégios de edição.

## Permissões de Acesso ao Menu

As permissões de acesso ao menu controlam o acesso com base nos itens do menu.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Permissões de Configuração de Plugin

As permissões de configuração de **plugin** controlam a capacidade de configurar parâmetros específicos de **plugins**. Quando ativada, a interface de gerenciamento de **plugins** correspondente aparece no centro de administração.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)