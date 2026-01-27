:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Dropdown

## Introdução

O Dropdown permite associar dados selecionando a partir de dados existentes na **coleção** de destino, ou adicionando novos dados a ela para associação. As opções do dropdown suportam busca aproximada.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Configuração do Campo

### Definir Escopo de Dados

Controla o escopo de dados da lista suspensa.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

Para mais informações, consulte [Definir Escopo de Dados](/interface-builder/fields/field-settings/data-scope)

### Definir Regras de Ordenação

Controla a ordenação dos dados no dropdown.

Exemplo: Ordenar por data de serviço em ordem decrescente.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Permitir Adicionar/Associar Múltiplos Registros

Restringe um relacionamento de um para muitos para permitir a associação de apenas um registro.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Campo de Título

O campo de título é o rótulo que aparece nas opções.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Permite busca rápida usando o campo de título

Para mais informações, consulte [Campo de Título](/interface-builder/fields/field-settings/title-field)

### Criação Rápida: Adicionar Primeiro, Depois Selecionar

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Adicionar via Dropdown

Após criar um novo registro na tabela de destino, o sistema o seleciona automaticamente e o associa quando o formulário é enviado.

No exemplo abaixo, a tabela de Pedidos tem um campo de relacionamento de muitos para um **“Conta.”**

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Adicionar via Modal

A criação via modal é adequada para cenários de entrada de dados mais complexos e permite configurar um formulário personalizado para criar novos registros.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Componente de Campo](/interface-builder/fields/association-field)