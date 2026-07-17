---
title: "Data de atualização"
description: "O campo de data de atualização é usado para registrar automaticamente a última vez em que um registro foi atualizado."
keywords: "data de atualização,updatedAt,campo do sistema,NocoBase"
---

# Data de atualização

## Introdução

No NocoBase, **Data de atualização (Updated at)** é usada para registrar automaticamente a última vez em que um registro foi atualizado.

A data de atualização geralmente é gerada por um campo predefinido. Ela é adequada para auditoria, sincronização, ordenação, filtragem e condições de fluxo de trabalho.

Se for necessário salvar horários de conclusão ou aprovação relacionados ao negócio, use [data e hora](../datetime/datetime.md).

## Cenários aplicáveis

A data de atualização é adequada para os seguintes cenários de negócio:

- Consultar a última data de atualização
- Filtrar dados atualizados recentemente
- Verificar se os dados não são mantidos há muito tempo
- Comparar datas de atualização ao sincronizar sistemas externos

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Data de atualização» para criar um campo de data de atualização.

![20240512174826](https://static-docs.nocobase.com/20240512174826.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. A data de atualização corresponde a `updatedAt`, que determina como o campo será inserido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Data de atualização» ou «Última atualização». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relação, permissões e fluxos de trabalho. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. A data de atualização normalmente usa `date`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Mantido automaticamente pelo sistema; normalmente não requer validação manual. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, requisitos de preenchimento, origem dos dados ou responsável pela manutenção. |

:::warning Atenção

Depois de criado, o nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de data de atualização é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `updatedAt`. |
| Field type padrão | `date`. |
| Field type opcional | `date`. |
| Componente da página | Preenchido automaticamente pelo sistema; normalmente é exibido somente para leitura na página. |
| Filtragem | Permite filtrar por horário e intervalo. |
| Ordenação | Permite ordenar por horário. |
| Validação | Preenchido automaticamente pelo sistema. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de data de atualização. A edição do campo é usada principalmente para ajustar sua forma de exibição e utilização no NocoBase, como alterar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer o mapeamento do campo — mapeando o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface sem alterar seu nome identificador. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de utilização das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de data de atualização. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de data de atualização criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de data de atualização é adequado para uso em listas, detalhes, filtros e verificações de sincronização.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Cenário | Uso |
| --- | --- |
| Bloco de tabela | Exibir e ordenar pela última data de atualização. |
| Bloco de filtro | Filtrar registros atualizados recentemente ou não atualizados há muito tempo. |
| Bloco de detalhes | Consultar a última data de atualização. |
| Fluxo de trabalho | Participar da avaliação como condição de tempo. |

## Links relacionados

- [Campos](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabelas comuns](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em tabelas comuns
- [Data de criação](./created-at.md) — Registrar automaticamente o horário de criação
- [Data e hora (com fuso horário)](../datetime/datetime.md) — Salvar horários relacionados ao negócio
