---
title: "Data"
description: "O campo de data é usado para armazenar datas sem um horário específico, como aniversários, datas de assinatura e datas de vencimento."
keywords: "data,date,campo de data,NocoBase"
---

# Data

## Introdução

No NocoBase, **data (Date)** é usada para armazenar datas sem um horário específico.

O campo de data é adequado para dados comerciais que consideram apenas ano, mês e dia, como aniversários, datas de assinatura, datas de vencimento e datas planejadas.

Se precisar armazenar horas, minutos e segundos específicos, escolha[Data e hora](./datetime.md). Se precisar apenas do horário de um dia, escolha[Hora](./time.md).

## Cenários aplicáveis

A data é adequada para estes cenários comerciais:

- Aniversário de clientes, data de admissão de funcionários
- Data de assinatura e vencimento de contratos
- Data planejada, data de entrega
- Datas comerciais que não exigem um horário específico

## Criar configuração

Na página「Configure fields」da tabela de dados, clique em「Add field」e selecione「Data」para criar um campo de data.

![20260709232951](https://static-docs.nocobase.com/20260709232951.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para datas, corresponde a `date` e determina como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como「Data de assinatura」「Data de vencimento」「Aniversário」. Recomenda-se usar um nome que os profissionais de negócio compreendam diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em API, campos de relacionamento, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo de data é `dateonly`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser inserido automaticamente. |
| Validation rules | Regras de validação. É possível configurar campos obrigatórios, intervalos de datas etc. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, requisitos de preenchimento, origem dos dados ou responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme o nome antes de criar o campo para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de data é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `date`. |
| Field type padrão | `dateonly`. |
| Field type opcional | `dateonly`. |
| Componente da página | O modo de edição usa um seletor de datas. |
| Filtro | Permite filtrar por data, intervalo, vazio e não vazio. |
| Ordenação | Permite ordenar por data. |
| Validação | Permite validações como campo obrigatório e intervalo de datas. |

## Editar configuração

Após a criação, clique em「Edit」à direita do campo para editar a configuração do campo de data. A edição do campo serve principalmente para ajustar como ele é exibido e utilizado no NocoBase, por exemplo, alterando o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser utilizados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afetará a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de utilização das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em「Delete」à direita do campo para excluir o campo de data. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de data criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado de um banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração comercial.

:::

## Uso na configuração de páginas

O campo de data é adequado para uso em formulários, tabelas, filtros, calendários e estatísticas.
![20260709232644](https://static-docs.nocobase.com/20260709232644.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Selecionar uma data. |
| Bloco de tabela | Exibir, ordenar e filtrar datas. |
| Bloco de calendário | Usar como campo de data do evento. |
| Fluxo de trabalho | Usar como campo de condição de data. |

## Links relacionados

- [Campos](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Data e hora (com fuso horário)](./datetime.md) — Armazene uma data e hora específicas
- [Hora](./time.md) — Armazene apenas o horário
