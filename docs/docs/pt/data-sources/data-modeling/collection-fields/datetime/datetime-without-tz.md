---
title: "Data e hora (sem fuso horário)"
description: "O campo de data e hora (sem fuso horário) é usado para armazenar datas e horas sem conversão de fuso horário."
keywords: "data e hora,datetime without timezone,sem fuso horário,NocoBase"
---

# Data e hora (sem fuso horário)

## Introdução

No NocoBase, **data e hora (sem fuso horário) (Date time without timezone)** é usada para armazenar datas e horas sem conversão de fuso horário.

Data e hora (sem fuso horário) é adequada para cenários como escalas, horários de funcionamento e horários de aulas, nos quais o valor exibido localmente é mais importante.

Se for necessário expressar um ponto específico no tempo real que seja consistente globalmente, é mais adequado escolher [data e hora (com fuso horário)](./datetime.md).

## Cenários aplicáveis

Data e hora (sem fuso horário) é adequada para estes cenários de negócio:

- Horários de escalas locais
- Horários de início de aulas e de exames
- Horários de funcionamento das lojas
- Horários de negócio que não devem sofrer conversão entre fusos horários

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «data e hora (sem fuso horário)» para criar um campo de data e hora (sem fuso horário).

![20260709232834](https://static-docs.nocobase.com/20260709232834.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Data e hora (sem fuso horário) corresponde a `datetimeNoTz`, que determina como o campo será preenchido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Horário da escala», «Horário da aula» ou «Horário de funcionamento». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Data e hora (sem fuso horário) normalmente usa `datetimeNoTz`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, um valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. É possível configurar campos obrigatórios, intervalos de tempo etc. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, requisitos de preenchimento, origem dos dados ou responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme o nome antes de criar o campo para evitar custos de ajustes de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de data e hora (sem fuso horário) é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `datetimeNoTz`. |
| Field type padrão | `datetimeNoTz`. |
| Field type opcional | `datetimeNoTz`. |
| Componente da página | No modo de edição, usa um seletor de data e hora. |
| Filtro | Permite filtrar por ponto no tempo, intervalo, vazio e não vazio. |
| Ordenação | Permite ordenar por horário. |
| Validação | Permite validações como campo obrigatório e intervalo de tempo. |

## Edição da configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de data e hora (sem fuso horário). A edição do campo é usada principalmente para ajustar como ele será exibido e utilizado no NocoBase, por exemplo, alterando o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer o mapeamento do campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface sem alterar seu nome identificador. |
| Field name | Não | O nome identificador do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suportado condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suportado condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo de data e hora (sem fuso horário). No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de data e hora (sem fuso horário) criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado de um banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de data e hora (sem fuso horário) é adequado para negócios baseados em horário local.
![20260709232511](https://static-docs.nocobase.com/20260709232511.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Selecionar data e hora. |
| Bloco de tabela | Exibir, ordenar e filtrar horários. |
| Bloco de calendário | Usar como campo de horário de eventos locais. |
| Fluxo de trabalho | Usar como campo de condição de horário. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Data e hora (com fuso horário)](./datetime.md) — Armazenar pontos no tempo com semântica de fuso horário
- [Data](./date.md) — Armazenar apenas a data