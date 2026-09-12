---
title: "Identificador de tabela de dados"
description: "O campo de identificador de tabela de dados é usado para identificar a tabela de dados à qual um registro pertence, sendo comum em cenários como tabelas herdadas que precisam distinguir a tabela de origem."
keywords: "identificador de tabela de dados,table oid,tableoid,campo do sistema,NocoBase"
---

# Identificador de tabela de dados

## Introdução

No NocoBase, o **identificador de tabela de dados (Table OID)** é usado para identificar a tabela de dados à qual um registro pertence.

O identificador de tabela de dados é comum em tabelas herdadas ou em cenários que precisam distinguir a Collection de origem de um registro. Ele é usado principalmente pelos recursos do sistema e de metadados.

Em geral, tabelas de negócio comuns não precisam criar manualmente um campo de identificador de tabela de dados.

## Cenários aplicáveis

O identificador de tabela de dados é adequado para estes cenários de negócio:

- Identificação da origem dos registros de tabelas herdadas
- Exibição agregada entre subtabelas
- Configuração de metadados
- Recursos do sistema que precisam distinguir a origem da Collection

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Identificador de tabela de dados» para criar um campo de identificador de tabela de dados.

![20240512174746](https://static-docs.nocobase.com/20240512174746.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O identificador de tabela de dados corresponde a `tableoid`, que determina como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Identificador de tabela de dados» ou «Tabela de origem». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. O identificador de tabela de dados normalmente é um campo `virtual`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Normalmente mantidas pelo sistema. |
| Description | Descrição do campo. É adequado informar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Observação

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de identificador de tabela de dados é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `tableoid`. |
| Field type padrão | `virtual`. |
| Field type disponível | `virtual`. |
| Componente da página | Normalmente apresentado na página como um seletor de tabela de dados ou em modo somente leitura. |
| Filtragem | Pode ser usado para filtrar por tabela de dados de origem, dependendo da configuração da página. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Mantida pelo sistema ou pelos recursos de metadados. |

## Edição da configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de identificador de tabela de dados. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, por exemplo, para alterar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome de exibição do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Sujeito a condições | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Sujeito a condições | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Observação

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma como ele é usado nas variáveis de fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo de identificador de tabela de dados. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de identificador de tabela de dados criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de identificador de tabela de dados é adequado para uso em cenários de tabelas herdadas e metadados.

| Cenário | Finalidade |
| --- | --- |
| Bloco de tabela | Exibir a tabela de dados de origem do registro. |
| Bloco de filtragem | Filtrar pela tabela de dados de origem. |
| Permissões e fluxos de trabalho | Usar como condição para determinar a tabela de origem. |
| Recursos de metadados | Identificar a Collection à qual o registro pertence. |

## Links relacionados

- [Campos](../index.md) — Entenda a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabelas comuns](../../../data-source-main/general-collection.md) — Crie e gerencie campos em tabelas comuns
- [Tabelas herdadas](../../../data-source-main/inheritance-collection.md) — Entenda como usar tabelas herdadas
- [Seletor de tabela de dados](../advanced/collection-select.md) — Selecione uma tabela de dados
