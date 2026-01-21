---
pkg: "@nocobase/plugin-multi-space"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



pkg: "@nocobase/plugin-multi-space"
---

# Multi-espaço

## Introdução

O **plugin Multi-espaço** permite criar múltiplos espaços de dados independentes dentro de uma única instância de aplicação, usando isolamento lógico.

#### Casos de Uso
- **Múltiplas lojas ou fábricas**: Os processos de negócio e as configurações do sistema são altamente consistentes (por exemplo, gestão unificada de estoque, planejamento de produção, estratégias de vendas e modelos de relatórios), mas é preciso garantir que os dados de cada unidade de negócio não interfiram uns nos outros.
- **Gestão de múltiplas organizações ou subsidiárias**: Várias organizações ou subsidiárias de um grupo empresarial compartilham a mesma plataforma, mas cada marca tem dados independentes de clientes, produtos e pedidos.

## Instalação

No gerenciador de **plugins**, localize o **plugin Multi-espaço** e ative-o.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Manual do Usuário

### Gerenciamento de Multi-espaço

Após ativar o **plugin**, vá para a página de configurações **"Usuários e Permissões"** e mude para o painel **Espaços** para gerenciar os espaços.

> Inicialmente, existe um **Espaço Não Atribuído** integrado, usado principalmente para visualizar dados antigos que não estão associados a nenhum espaço.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Criar um Espaço

Clique no botão "Adicionar espaço" para criar um novo espaço:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Atribuir Usuários

Após selecionar um espaço criado, você pode definir os usuários que pertencem a esse espaço no lado direito:

> **Dica:** Depois de atribuir usuários a um espaço, você precisa **atualizar a página manualmente** para que a lista de alternância de espaços no canto superior direito seja atualizada e exiba o espaço mais recente.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Alternar e Visualizar Multi-espaço

Você pode alternar o espaço atual no canto superior direito.
Ao clicar no **ícone de olho** à direita (quando estiver em destaque), você pode visualizar dados de múltiplos espaços simultaneamente.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Gerenciamento de Dados Multi-espaço

Depois de ativar o **plugin**, o sistema adicionará automaticamente um **campo de Espaço** ao criar uma **coleção**.
**Apenas as coleções que contêm este campo serão incluídas na lógica de gerenciamento de espaço.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Para **coleções** existentes, você pode adicionar manualmente um **campo de Espaço** para ativar o gerenciamento de espaço:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Lógica Padrão

Em **coleções** que contêm o **campo de Espaço**, o sistema aplicará automaticamente a seguinte lógica:

1. Ao criar dados, eles são automaticamente associados ao espaço atualmente selecionado;
2. Ao filtrar dados, eles são automaticamente limitados aos dados do espaço atualmente selecionado.

### Classificando Dados Antigos em Multi-espaço

Para dados que existiam antes da ativação do **plugin Multi-espaço**, você pode classificá-los em espaços seguindo os passos abaixo:

#### 1. Adicionar o campo de Espaço

Adicione manualmente o **campo de Espaço** à **coleção** antiga:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Atribuir usuários ao Espaço Não Atribuído

Associe o usuário que gerencia os dados antigos a todos os espaços, incluindo o **Espaço Não Atribuído**, para visualizar dados que ainda não foram atribuídos a um espaço:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Alternar para visualizar dados de todos os espaços

Na parte superior, selecione para visualizar dados de todos os espaços:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Configurar uma página para atribuição de dados antigos

Crie uma nova página para a atribuição de dados antigos. Exiba o "campo de Espaço" na **página de lista** e na **página de edição** para ajustar manualmente a atribuição do espaço.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Torne o campo de Espaço editável

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Atribuir dados a espaços manualmente

Através da página criada acima, edite os dados manualmente para atribuir gradualmente o espaço correto aos dados antigos (você também pode configurar a edição em massa por conta própria).