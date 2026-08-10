---
title: "Data e hora (com fuso horário)"
description: "O campo de data e hora (com fuso horário) é usado para armazenar datas e horas com semântica de fuso horário."
keywords: "data e hora,datetime,fuso horário,NocoBase"
---

# Data e hora (com fuso horário)

## Introdução

No NocoBase, **data e hora (com fuso horário) (Date time with timezone)** é usado para armazenar datas e horas e processá-las de acordo com a semântica do fuso horário.

Data e hora (com fuso horário) é adequado para colaboração entre diferentes fusos horários, operações internacionais ou cenários que exigem um ponto específico no tempo, como criação de reservas, prazos e horários de execução.

Se a operação só precisa do texto de data e hora local e não requer conversão de fuso horário, você pode escolher [data e hora (sem fuso horário)](./datetime-without-tz.md). Se precisar apenas da data, escolha [data](./date.md).

## Cenários aplicáveis

O campo de data e hora (com fuso horário) é adequado para estes cenários:

- Horário de início de reuniões e horário de reservas
- Prazos e horários de execução de tarefas
- Pontos no tempo em operações entre diferentes fusos horários
- Horários relacionados a condições agendadas de fluxos de trabalho

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «data e hora (com fuso horário)» para criar um campo de data e hora (com fuso horário).

![20240512181142](https://static-docs.nocobase.com/20240512181142.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Data e hora (com fuso horário) corresponde a `datetime` e determina como o campo será inserido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «horário de início», «prazo» ou «horário de execução». Recomenda-se usar um nome que os usuários da operação consigam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em API, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Data e hora (com fuso horário) normalmente usa `date`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser inserido automaticamente. |
| Validation rules | Regras de validação. É possível configurar obrigatoriedade, intervalo de tempo e outras regras. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, requisitos de preenchimento, origem dos dados ou responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de data e hora (com fuso horário) é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `datetime`. |
| Field type padrão | `date`. |
| Field type opcional | `date`. |
| Componente da página | No modo de edição, utiliza um seletor de data e hora. |
| Filtros | Permite filtrar por ponto no tempo, intervalo, vazio e não vazio. |
| Ordenação | Permite ordenar por horário. |
| Validação | Permite validações como obrigatoriedade e intervalo de tempo. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de data e hora (com fuso horário). A edição do campo é usada principalmente para ajustar como ele será exibido e utilizado no NocoBase, por exemplo, alterando o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente envolve o mapeamento do campo — associando o campo do banco de dados ao Field type e ao Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface sem alterar seu nome identificador. |
| Field name | Não | O nome identificador do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Isso afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser utilizados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de data e hora (com fuso horário). No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de data e hora (com fuso horário) criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o escopo do impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração operacional.

:::

## Uso na configuração de páginas

O campo de data e hora (com fuso horário) é adequado para uso em calendários, tabelas, filtros e fluxos de trabalho.
![20260709232355](https://static-docs.nocobase.com/20260709232355.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Selecionar data e hora. |
| Bloco de tabela | Exibir, ordenar e filtrar horários. |
| Bloco de calendário | Usar como campo de horário de início ou de término. |
| Fluxo de trabalho | Usar como condição de tempo ou campo relacionado a agendamento. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a função, a classificação e a lógica de mapeamento dos campos
- [Tabelas comuns](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em tabelas comuns
- [Data e hora (sem fuso horário)](./datetime-without-tz.md) — Armazenar datas e horas sem conversão de fuso horário
- [Data](./date.md) — Armazenar apenas a data
- [Hora](./time.md) — Armazenar apenas a hora