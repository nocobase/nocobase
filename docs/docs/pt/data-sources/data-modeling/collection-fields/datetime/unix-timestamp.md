---
title: "Timestamp Unix"
description: "O campo Timestamp Unix é usado para armazenar valores de timestamp de sistemas externos."
keywords: "Timestamp Unix,unix timestamp,timestamp,NocoBase"
---

# Timestamp Unix

## Introdução

No NocoBase, o **Timestamp Unix (Unix timestamp)** é usado para armazenar timestamps Unix.

Os timestamps Unix são frequentemente usados na integração com sistemas externos, dados de logs ou migração de dados históricos. O que é armazenado é um valor numérico, mas seu significado de negócio é uma data e hora.

Se não houver exigência de timestamp por parte de um sistema externo, usar diretamente [data e hora](./datetime.md) é mais fácil de entender e manter.

## Cenários de uso

O timestamp Unix é adequado para os seguintes cenários de negócio:

- S sincronização de timestamps de sistemas externos
- horário de ocorrência de logs
- Unix timestamp retornado por APIs
- campos de data e hora na migração de dados históricos

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Timestamp Unix» para criar um campo de timestamp Unix.

![20240512180432](https://static-docs.nocobase.com/20240512180432.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O timestamp Unix corresponde a `unixTimestamp`, que determina como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido para o campo na interface, como «Timestamp de sincronização», «Horário do log» ou «Hora da última atualização externa». Recomenda-se usar um nome que as pessoas de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relação, permissões e fluxos de trabalho. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. O timestamp Unix normalmente é armazenado como um inteiro ou um inteiro grande. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, um valor padrão pode ser preenchido automaticamente. |
| Validation rules | Regras de validação. É possível configurar o preenchimento obrigatório e o intervalo numérico. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou a pessoa responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de timestamp Unix é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `unixTimestamp`. |
| Field type padrão | `bigInt`. |
| Field type opcional | `integer` e `bigInt`. |
| Componente da página | No modo de edição, é tratado pelo componente de campo de timestamp. |
| Filtro | Permite filtrar por valor numérico do timestamp ou pelo intervalo de tempo correspondente. |
| Ordenação | Permite ordenação. |
| Validação | Permite validar o preenchimento obrigatório e o intervalo numérico. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de timestamp Unix. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como alterar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para um Field type e uma Field interface do NocoBase.

| Configuração | Pode editar | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido para o campo na interface, sem alterar seu nome identificador. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou a pessoa responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou a Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de timestamp Unix. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de timestamp Unix criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado de um banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por configurações de negócio.

:::

## Uso na configuração de páginas

O campo de timestamp Unix é adequado para integrações com sistemas externos e cenários relacionados a logs.
![20260709232558](https://static-docs.nocobase.com/20260709232558.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir ou mapear timestamps. |
| Bloco de tabela | Exibir, ordenar e filtrar timestamps. |
| Fluxo de trabalho | Usar como condição de tempo de um sistema externo. |
| API | Integrar com APIs que exigem Unix timestamp. |

## Links relacionados

- [Campo](../index.md) — Saiba mais sobre a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Data e hora (com fuso horário)](./datetime.md) — Armazenar datas e horas comuns
- [Inteiro](../basic/integer.md) — Armazenar inteiros comuns
