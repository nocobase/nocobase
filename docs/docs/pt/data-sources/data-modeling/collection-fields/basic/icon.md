---
title: "Ícone"
description: "O campo de ícone é usado para armazenar nomes de ícones ou configurações de ícones, sendo adequado para identificadores visuais de categorias, menus, status e outros."
keywords: "ícone,icon,campo,NocoBase"
---

# Ícone

## Introdução

No NocoBase, **ícone (Icon)** é usado para armazenar identificadores de ícones.

O campo de ícone é adequado para atribuir um identificador visual a categorias, menus, status e entradas. Ele armazena o valor do ícone, que é renderizado pelo componente de ícone quando exibido na página.

Se quiser fazer upload de uma imagem real, selecione[anexo](../media/field-attachment.md). Se quiser apenas salvar uma descrição do ícone, selecione[texto de linha única](./input.md).

## Cenários aplicáveis

O campo de ícone é adequado para estes cenários de negócio:

- Ícones de menu e de entradas de funcionalidades
- Ícones de categorias e etiquetas
- Ícones de status e níveis
- Identificadores visuais em painéis ou cartões

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Ícone» para criar um campo de ícone.

![20240512180027](https://static-docs.nocobase.com/20240512180027.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O ícone corresponde a `icon`, determinando como o campo será inserido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Ícone do menu», «Ícone da categoria» ou «Ícone do status». Recomenda-se usar um nome que os usuários de negócio compreendam diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relação, permissões e fluxos de trabalho. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo de ícone é `string`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. Normalmente, basta configurá-lo como obrigatório. |
| Description | Descrição do campo. É adequado incluir o significado do campo, requisitos de preenchimento, origem dos dados ou responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de ícone é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `icon`. |
| Field type padrão | `string`. |
| Field type disponível | `string`. |
| Componente da página | No modo de edição, utiliza o componente de seleção de ícones. |
| Filtros | Normalmente não é usado como condição principal de filtro. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Oferece suporte a validações básicas, como obrigatoriedade. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de ícone. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, por exemplo, alterando o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar seu nome identificador. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão dos novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de utilização das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de ícone. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de ícone criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado de um banco de dados ou mapeado de uma fonte de dados externa, o escopo do impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de ícone é adequado para fornecer indicações visuais em listas, cartões e detalhes.
![20260709225630](https://static-docs.nocobase.com/20260709225630.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Selecionar um ícone. |
| Bloco de detalhes | Exibir um ícone. |
| Lista ou cartão | Servir como identificador visual de uma categoria, status ou entrada. |
| Permissões e fluxos de trabalho | Normalmente não é usado como campo de condição principal. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Cor](./color.md) — Armazenar identificadores de cores
- [Anexo](../media/field-attachment.md) — Fazer upload de imagens ou arquivos
