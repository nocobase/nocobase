---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/multi-space/multi-space).
:::

# Multi-espaço

## Introdução

O **plugin Multi-espaço (Multi-workspace)** permite múltiplos espaços de dados independentes em uma única instância de aplicação por meio de isolamento lógico.

#### Cenários de Uso
- **Múltiplas lojas ou fábricas**: Os processos de negócio e as configurações do sistema são altamente consistentes — como gestão de inventário unificada, planejamento de produção, estratégias de vendas e modelos de relatório — mas os dados de cada unidade de negócio devem permanecer independentes.
- **Gestão de múltiplas organizações ou subsidiárias**: Várias organizações ou subsidiárias de um grupo empresarial compartilham a mesma plataforma, mas cada marca possui dados independentes de clientes, produtos e pedidos.

## Instalação

Encontre o plugin **Multi-espaço (Multi-Space)** no Gerenciador de Plugins e ative-o.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Manual do Usuário

### Gerenciamento de Multi-espaço

Após ativar o plugin, acesse a página de configurações de **Usuários e Permissões** e alterne para o painel de **Espaços** para gerenciar os espaços.

> Por padrão, existe um **Espaço Não Atribuído (Unassigned Space)** integrado, usado principalmente para visualizar dados legados que ainda não foram associados a um espaço.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Criar Espaço

Clique no botão "Adicionar espaço" para criar um novo espaço:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Atribuir Usuários

Após selecionar um espaço criado, você pode definir os usuários pertencentes a esse espaço no lado direito:

> **Dica:** Após atribuir usuários a um espaço, você deve **atualizar a página manualmente** para que o seletor de espaços no canto superior direito seja atualizado e exiba os espaços mais recentes.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Alternar e Visualizar Espaços

Você pode alternar o espaço atual no canto superior direito.  
Ao clicar no **ícone de olho** à direita (estado destacado), você pode visualizar dados de múltiplos espaços simultaneamente.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Gerenciamento de Dados Multi-espaço

Uma vez que o plugin esteja ativado, o sistema configurará automaticamente um **campo de Espaço** ao criar uma coleção (Collection).  
**Apenas coleções que contenham este campo serão incluídas na lógica de gerenciamento de espaço.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Para coleções existentes, você pode adicionar manualmente um campo de espaço para habilitar o gerenciamento de espaço:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Lógica Padrão

Em coleções que incluem um campo de espaço, o sistema aplica automaticamente a seguinte lógica:

1. Ao criar dados, eles são automaticamente associados ao espaço selecionado no momento;
2. Ao filtrar dados, eles são automaticamente restritos aos dados do espaço selecionado no momento.

### Categorizando Dados Legados em Espaços

Para dados que existiam antes da ativação do plugin Multi-espaço, você pode categorizá-los em espaços seguindo estes passos:

#### 1. Adicionar Campo de Espaço

Adicione manualmente um campo de espaço à coleção legada:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Atribuir Usuários ao Espaço Não Atribuído

Associe os usuários que gerenciam dados legados a todos os espaços, incluindo o **Espaço Não Atribuído (Unassigned Space)**, para visualizar dados que ainda não foram atribuídos a um espaço:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Alternar para Visualizar Todos os Dados de Espaço

Selecione a opção no topo para visualizar dados de todos os espaços:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Configurar Página de Atribuição de Dados Legados

Crie uma nova página para a atribuição de dados legados. Exiba o "campo de Espaço" tanto no **bloco de Lista** quanto no **formulário de Edição** para ajustar manualmente a atribuição de espaço.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Defina o campo de espaço para o modo editável:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Atribuir Espaços de Dados Manualmente

Usando a página mencionada acima, edite manualmente os dados para atribuir gradualmente o espaço correto aos dados legados (você também pode configurar a edição em massa por conta própria).