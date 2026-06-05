:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Bloco de Tabela

## Introdução

O bloco de tabela é um dos blocos de dados principais integrados ao **NocoBase**, usado principalmente para exibir e gerenciar dados estruturados em formato de tabela. Ele oferece opções de configuração flexíveis, permitindo que você personalize as colunas da tabela, larguras de coluna, regras de ordenação e escopo de dados, garantindo que os dados exibidos atendam às suas necessidades de negócio específicas.

#### Principais Recursos:
- **Configuração Flexível de Colunas**: Você pode personalizar as colunas e as larguras das colunas da tabela para atender a diferentes requisitos de exibição de dados.
- **Regras de Ordenação**: Permite ordenar os dados da tabela. Você pode organizar os dados em ordem crescente ou decrescente com base em diferentes campos.
- **Definição do Escopo de Dados**: Ao definir o escopo de dados, você pode controlar o intervalo de dados exibidos, evitando a interferência de dados irrelevantes.
- **Configuração de Ações**: O bloco de tabela possui várias opções de ação integradas. Você pode configurar facilmente ações como Filtrar, Adicionar Novo, Editar e Excluir para um gerenciamento rápido de dados.
- **Edição Rápida**: Permite a edição direta de dados dentro da tabela, simplificando o processo operacional e melhorando a eficiência do trabalho.

## Configurações do Bloco

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Regras de Vinculação do Bloco

Controle o comportamento do bloco (por exemplo, se deve exibir ou executar JavaScript) através das regras de vinculação.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Para mais detalhes, consulte [Regras de Vinculação](/interface-builder/linkage-rule)

### Definir Escopo de Dados

Exemplo: Por padrão, filtre pedidos onde o "Status" é "Pago".

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Para mais detalhes, consulte [Definir Escopo de Dados](/interface-builder/blocks/block-settings/data-scope)

### Definir Regras de Ordenação

Exemplo: Exiba os pedidos em ordem decrescente por data.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Para mais detalhes, consulte [Definir Regras de Ordenação](/interface-builder/blocks/block-settings/sorting-rule)

### Habilitar Edição Rápida

Ative "Habilitar Edição Rápida" nas configurações do bloco e nas configurações de coluna da tabela para personalizar quais colunas podem ser editadas rapidamente.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Habilitar Tabela em Árvore

Quando a tabela de dados é uma tabela hierárquica (em árvore), o bloco de tabela pode optar por habilitar o recurso "**Habilitar Tabela em Árvore**". Por padrão, esta opção está desativada. Uma vez habilitado, o bloco exibirá os dados em uma estrutura de árvore e oferecerá suporte às opções de configuração e operações correspondentes.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Expandir Todas as Linhas por Padrão

Quando a tabela em árvore está habilitada, o bloco permite expandir todas as linhas filhas por padrão ao ser carregado.

## Configurar Campos

### Campos desta Coleção

> **Observação**: Os campos de coleções herdadas (ou seja, campos da coleção pai) são automaticamente mesclados e exibidos na lista de campos atual.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Campos de Coleções Relacionadas

> **Observação**: Permite exibir campos de coleções relacionadas (atualmente, suporta apenas relacionamentos de um para um).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Outras Colunas Personalizadas

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [Campo JS](/interface-builder/fields/specific/js-field)
- [Coluna JS](/interface-builder/fields/specific/js-column)

## Configurar Ações

### Ações Globais

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [Filtrar](/interface-builder/actions/types/filter)
- [Adicionar Novo](/interface-builder/actions/types/add-new)
- [Excluir](/interface-builder/actions/types/delete)
- [Atualizar](/interface-builder/actions/types/refresh)
- [Importar](/interface-builder/actions/types/import)
- [Exportar](/interface-builder/actions/types/export)
- [Imprimir Modelo](/template-print/index)
- [Atualização em Massa](/interface-builder/actions/types/bulk-update)
- [Exportar Anexos](/interface-builder/actions/types/export-attachments)
- [Acionar Fluxo de Trabalho](/interface-builder/actions/types/trigger-workflow)
- [Ação JS](/interface-builder/actions/types/js-action)
- [Funcionário IA](/interface-builder/actions/types/ai-employee)

### Ações de Linha

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Visualizar](/interface-builder/actions/types/view)
- [Editar](/interface-builder/actions/types/edit)
- [Excluir](/interface-builder/actions/types/delete)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Link](/interface-builder/actions/types/link)
- [Atualizar Registro](/interface-builder/actions/types/update-record)
- [Imprimir Modelo](/template-print/index)
- [Acionar Fluxo de Trabalho](/interface-builder/actions/types/trigger-workflow)
- [Ação JS](/interface-builder/actions/types/js-action)
- [Funcionário IA](/interface-builder/actions/types/ai-employee)