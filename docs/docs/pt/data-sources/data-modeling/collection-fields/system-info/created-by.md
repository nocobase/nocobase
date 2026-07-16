---
title: "Criador"
description: "O campo Criador é usado para registrar automaticamente o usuário que criou um registro."
keywords: "Criador,createdBy,campo do sistema,usuário,NocoBase"
---

# Criador

## Introdução

No NocoBase, **Criador (Created by)** é usado para registrar automaticamente o usuário que criou o registro.

O criador geralmente é gerado por um campo predefinido. Ele é adequado para controle de permissões, rastreamento de responsabilidades, filtragem e auditoria.

Para representar o responsável pelo negócio, o encarregado ou o aprovador, recomenda-se criar separadamente um campo de relação com usuários, em vez de reutilizar o campo Criador.

## Cenários de uso

O campo Criador é adequado para estes cenários de negócio:

- Ver apenas os dados que criei
- Filtrar registros por criador
- Auditar a responsabilidade pela criação dos registros
- Identificar o criador do registro em um fluxo de trabalho

## Configuração da criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Criador» para criar um campo Criador.

![index-2025-11-01-00-50-59](https://static-docs.nocobase.com/index-2025-11-01-00-50-59.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O campo Criador corresponde a `createdBy` e determina como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Criador». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relação, permissões e fluxos de trabalho. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. O campo Criador normalmente é um campo de relação `belongsTo` que aponta para a tabela de usuários. |
| Default value | Valor padrão. Ao adicionar um registro, o valor padrão pode ser preenchido automaticamente caso o usuário não informe nenhum valor. |
| Validation rules | Mantido automaticamente pelo sistema; normalmente não requer validação manual. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo Criador é o seguinte:

| Característica | Descrição |
| --- | --- |
| Default Field interface | `createdBy`. |
| Default Field type | `belongsTo`. |
| Field type disponível | `belongsTo`. |
| Componente da página | Preenchido automaticamente pelo sistema; normalmente é apresentado na página por meio de um componente de seleção ou exibição de usuário. |
| Filtragem | Permite filtrar por usuário. |
| Ordenação | Normalmente não é usado para ordenar por criador. |
| Validação | Preenchida automaticamente pelo sistema. |

## Editar a configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo Criador. A edição do campo serve principalmente para ajustar sua exibição e utilização no NocoBase, como alterar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em um mapeamento de campo: mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface sem alterar seu nome identificador. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suportado condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suportado condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, confirme se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão usado ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de utilização das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir o campo

Clique em «Delete» à direita do campo para excluir o campo Criador. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo Criador criado no banco de dados principal, normalmente a coluna real correspondente e os dados existentes nessa coluna também serão excluídos do banco de dados. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo Criador é adequado para uso em permissões, filtros, auditorias e fluxos de trabalho.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Cenário | Uso |
| --- | --- |
| Bloco de tabela | Exibir o criador. |
| Bloco de filtragem | Filtrar registros por criador. |
| Permissões | Configurar regras como “ver apenas os dados que criei”. |
| Fluxo de trabalho | Obter o criador e enviar notificações ou definir condições. |

## Links relacionados

- [Campo](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Atualizador](./updated-by.md) — Registrar automaticamente o último usuário que atualizou o registro
- [Campo de relação](../associations/index.md) — Criar relações com usuários, como o responsável pelo negócio
