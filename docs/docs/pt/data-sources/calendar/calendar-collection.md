---
pkg: "@nocobase/plugin-calendar"
title: "Tabela de calendário"
description: "A tabela de calendário é usada para armazenar dados com intervalos de tempo, como reuniões, cronogramas, cursos e escalas de plantão, em conjunto com o bloco de calendário para exibir e editar registros de eventos."
keywords: "Tabela de calendário,Calendar Collection,eventos de calendário,eventos recorrentes,bloco de calendário,NocoBase"
---

# Tabela de calendário

## Introdução

A tabela de calendário é adequada para armazenar dados com intervalos de tempo, como reservas de salas de reunião, cronogramas de projetos, programações de cursos, escalas de plantão e agendas de eventos. Em essência, ela continua sendo uma tabela de dados, mas já inclui campos relacionados a eventos de calendário, facilitando seu uso posterior com o bloco de calendário.

As tabelas de calendário só podem ser criadas na página do banco de dados principal. Bancos de dados externos, fontes de dados da API REST e fontes de dados externas do NocoBase não oferecem suporte à criação de tabelas de calendário.

## Cenários de uso

A tabela de calendário é adequada para os seguintes cenários:

- Reservas de salas de reunião, veículos e equipamentos
- Cronogramas de projetos, planos de tarefas e programação de marcos
- Quadros de horários, planos de treinamento e agendas de eventos
- Planos de plantão, registros de escalas e planos de inspeção
- Registros de eventos que precisam ser visualizados por dia, semana ou mês

## Criação e configuração

No banco de dados principal, clique em «Create collection» e selecione «Calendar collection» para criar uma tabela de calendário.

A configuração de criação de uma tabela de calendário é basicamente igual à de uma tabela comum. `Preset fields` serve para controlar os campos de sistema comuns, e a tabela de calendário também inclui campos predefinidos para armazenar eventos recorrentes.

| Configuração | Descrição |
| --- | --- |
| Collection display name | Nome exibido da tabela de dados na interface, como «Reservas de salas de reunião», «Programação de cursos» ou «Plano de plantão». |
| Collection name | Nome identificador da tabela de dados, usado para referências internas em APIs, campos de relacionamento, permissões, fluxos de trabalho etc. |
| Inherits | Selecione a tabela pai a ser herdada. Visível somente quando o banco de dados principal é PostgreSQL. |
| Categories | Categoria da tabela de dados. As categorias afetam apenas a forma de organização da interface de gerenciamento das tabelas de dados, sem alterar sua estrutura. |
| Description | Descrição da tabela de dados. Você pode informar quais eventos a tabela de calendário armazena, quem a mantém e a quais processos de negócio está relacionada. |
| Preset fields | Campos predefinidos. Ao criar uma tabela de calendário, recomenda-se manter os campos de sistema e os campos integrados da tabela de calendário. |

### Campos integrados

Após a criação, uma tabela de calendário normalmente contém os seguintes campos integrados. `cron` e `exclude` servem para armazenar regras de recorrência e datas excluídas.

| Campo | Nome do campo | Descrição |
| --- | --- | --- |
| ID | `id` | Campo de chave primária padrão, usado para identificar exclusivamente um registro de evento. |
| Hora de criação | `createdAt` | Registra automaticamente a hora de criação do registro de evento. |
| Criado por | `createdBy` | Registra automaticamente o usuário que criou o registro de evento. |
| Hora de atualização | `updatedAt` | Registra automaticamente a hora da última atualização do registro de evento. |
| Atualizado por | `updatedBy` | Registra automaticamente o usuário que atualizou o registro de evento pela última vez. |
| Ordenação | `sort` | Armazena o valor de ordenação do registro de evento, permitindo recursos como ordenação por arrastar e soltar. |
| Repeats | `cron` | Armazena regras de recorrência, como repetição diária, semanal, mensal ou anual. |
| Exclude | `exclude` | Armazena as datas excluídas dos eventos recorrentes, geralmente mantidas automaticamente pela interação com o calendário. |
| Espaço | `space` | Disponível após a ativação do [plugin de múltiplos espaços](../../multi-app/multi-space/index.md), usado para isolar dados por espaço. Não aparece quando o recurso de múltiplos espaços não está ativado. |

Ao usar uma tabela de calendário com o bloco de calendário, também é necessário especificar os campos de negócio usados para exibir os eventos:

| Configuração | Descrição |
| --- | --- |
| Campo de título | Define o título do evento no calendário, como «Tema da reunião» ou «Nome do curso». |
| Campo de data de início | Define o horário de início do evento. Normalmente, usa-se um campo de data e hora. |
| Campo de data de término | Define o horário de término do evento. Normalmente, usa-se um campo de data e hora. |

:::warning Atenção

`cron` e `exclude` normalmente são mantidos pelo recurso de calendário e não é recomendável editá-los diretamente como campos comuns de negócio. Os campos de título, data de início e data de término precisam ser criados e configurados de acordo com o negócio; caso contrário, o bloco de calendário não poderá exibir os eventos corretamente.

:::

### Campo de chave primária

Assim como as tabelas comuns, as tabelas de calendário precisam de um campo de chave primária. Ao criar a tabela, recomenda-se manter o campo predefinido ID; o tipo padrão de chave primária é `Snowflake ID (53-bit)`.

Se a tabela de calendário não tiver uma chave primária, será necessário definir «Record unique key» ao editar a tabela de dados; caso contrário, o bloco de calendário poderá não conseguir abrir, editar ou localizar corretamente os registros de eventos.

## Editar configuração

Na lista de tabelas de dados, clique em «Edit» à direita da tabela de calendário para modificar o nome exibido, a categoria, a descrição, o modo de paginação simples e configurações como «Record unique key».

Os campos integrados `cron`, `exclude` etc. da tabela de calendário normalmente são usados pelo recurso de calendário, portanto não é recomendável atribuir-lhes outros significados de negócio. Se precisar ampliar as informações dos eventos, você pode adicionar campos comuns de negócio, como local, participantes, sala de reunião, status etc.

## Excluir tabela de dados

Na lista de tabelas de dados, clique em «Delete» à direita da tabela de calendário para excluí-la.

A exclusão de uma tabela de calendário remove os registros de eventos, os dados dos campos integrados do calendário e os metadados de Collection relacionados. Antes de excluir, confirme se o bloco de calendário, o bloco de tabela, as permissões, os fluxos de trabalho e as APIs ainda dependem dessa tabela.

:::danger Aviso

As tabelas de calendário normalmente armazenam dados de cronogramas, reservas e escalas de plantão. Após a exclusão, os eventos históricos e as regras de recorrência serão perdidos. Antes de realizar a operação, confirme se os dados foram copiados ou se não são mais necessários.

:::

## Uso na configuração de páginas

A tabela de calendário pode usar a maioria dos blocos de dados da [tabela comum](../data-source-main/general-collection.md) para criar, consultar, atualizar e excluir dados. Além disso, normalmente é usada em conjunto com o bloco de calendário:

| Bloco | Uso |
| --- | --- |
| [Bloco de calendário](../../interface-builder/blocks/data-blocks/calendar.md) | Exibe registros de eventos em visualizações diárias, semanais, mensais etc. e permite criar, visualizar e editar eventos no calendário. |
| [Bloco de tabela](../../interface-builder/blocks/data-blocks/table.md) | Permite visualizar, filtrar e manter em lote os registros de eventos em formato de lista. |
| [Bloco de formulário](../../interface-builder/blocks/data-blocks/form.md) | Adiciona ou edita um único registro de evento. |
| [Bloco de detalhes](../../interface-builder/blocks/data-blocks/details.md) | Exibe as informações detalhadas de um único evento. |

## Links relacionados

- [Tabela comum](../data-source-main/general-collection.md) — Consulte as configurações gerais e as formas de usar os blocos
- [Campos de data e hora](../data-modeling/collection-fields/datetime/datetime.md) — Crie os campos de horário de início e término dos eventos
- [Bloco de calendário](../../interface-builder/blocks/data-blocks/calendar.md) — Exiba dados em formato de calendário na página
- [Múltiplos espaços](../../multi-app/multi-space/index.md) — Saiba mais sobre o campo de espaço e o recurso de isolamento por espaço