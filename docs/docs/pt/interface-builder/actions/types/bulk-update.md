---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Atualização em Massa

## Introdução

A ação de atualização em massa é usada quando você precisa aplicar a mesma atualização a um grupo de registros. Antes de realizar uma atualização em massa, você precisa pré-definir a lógica de atribuição de campos para a atualização. Essa lógica será aplicada a todos os registros selecionados quando você clicar no botão de atualização.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Configuração da Ação

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Dados a Atualizar

Selecionados/Todos, o padrão é Selecionados.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Atribuição de Campos

Defina os campos para a atualização em massa. Apenas os campos definidos serão atualizados.

Como mostrado na imagem, configure a ação de atualização em massa na tabela de pedidos para atualizar em massa os dados selecionados para "Aguardando Aprovação".

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Editar botão](/interface-builder/actions/action-settings/edit-button): Edite o título, tipo e ícone do botão;
- [Regra de vinculação](/interface-builder/actions/action-settings/linkage-rule): Exiba/oculte o botão dinamicamente;
- [Confirmação dupla](/interface-builder/actions/action-settings/double-check)