:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Seleção em Cascata

## Introdução

O seletor em cascata é ideal para campos de relacionamento onde a **coleção** de destino é uma tabela em árvore. Ele permite que você selecione dados seguindo a estrutura hierárquica da tabela em árvore e oferece suporte a pesquisa difusa para filtragem rápida.

## Instruções de Uso

- Para relacionamentos **um-para-um**, o seletor em cascata é de **seleção única**.

![20251125214656](https://static-docs.nocobase.com/20251125214656.png)

- Para relacionamentos **um-para-muitos**, o seletor em cascata é de **seleção múltipla**.

![20251125215318](https://static-docs.nocobase.com/20251125215318.png)

## Opções de Configuração do Campo

### Campo de Título

O campo de título define o rótulo exibido para cada opção.

![20251125214923](https://static-docs.nocobase.com/20251125214923.gif)

> Suporta pesquisa rápida com base no campo de título.

![20251125215026](https://static-docs.nocobase.com/20251125215026.gif)

Para mais detalhes, consulte:
[Campo de Título](/interface-builder/fields/field-settings/title-field)

### Escopo de Dados

Controla o escopo de dados da lista em árvore (se um registro filho corresponder às condições, seu registro pai também será incluído).

![20251125215111](https://static-docs.nocobase.com/20251125215111.png)

Para mais detalhes, consulte:
[Escopo de Dados](/interface-builder/fields/field-settings/data-scope)

Mais componentes de campo:
[Componentes de Campo](/interface-builder/fields/association-field)