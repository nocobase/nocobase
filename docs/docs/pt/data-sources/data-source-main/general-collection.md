---
pkg: "@nocobase/plugin-data-source-main"
title: "Tabela comum"
description: "As tabelas comuns são adequadas para armazenar dados empresariais convencionais, como clientes, pedidos, contratos, chamados, projetos e tarefas, e oferecem suporte a campos comuns do sistema, configuração de chaves primárias e criação de blocos de página."
keywords: "Tabela comum,General Collection,campos do sistema,tabela de dados,NocoBase"
---

# Tabela comum

## Introdução

As tabelas comuns são o tipo de tabela de dados mais usado e são adequadas para armazenar dados empresariais convencionais, como clientes, pedidos, contratos, chamados, solicitações de reembolso, projetos e tarefas. Quando a maioria dos objetos de negócio não exige uma estrutura especial, normalmente basta usar uma tabela comum.

As tabelas comuns podem vir destas fontes de dados:

- Novas tabelas criadas no banco de dados principal
- Tabelas reais existentes sincronizadas do banco de dados principal
- Tabelas reais existentes conectadas de bancos de dados externos
- Recursos mapeados por uma API REST
- Tabelas de dados em aplicativos NocoBase externos

No NocoBase, esses dados são todos usados como tabelas comuns. A diferença é que, no banco de dados principal, as tabelas comuns podem ter sua estrutura real criada e mantida pelo NocoBase; já as tabelas comuns em fontes de dados externas normalmente apenas leem a estrutura existente, que continua sendo mantida pelo sistema externo.

## Cenários aplicáveis

As tabelas comuns são adequadas para estes cenários de negócio:

- Dados de CRM, como clientes, contatos, oportunidades e contratos
- Dados de transações, como pedidos, notas de envio, devoluções e faturas
- Dados de colaboração, como chamados, tarefas, projetos e requisitos
- Dados de processos, como solicitações de reembolso, pedidos de compra e solicitações de pagamento
- Dados básicos, como equipamentos, ativos, produtos e lojas



## Criar e configurar

No banco de dados principal, clique em «Create collection» e selecione «General collection» para criar uma tabela comum.

![20240324085739](https://static-docs.nocobase.com/20240324085739.png)

| Configuração | Descrição |
| --- | --- |
| Collection display name | Nome da tabela de dados exibido na interface, como «Clientes», «Pedidos» e «Anexos de contrato». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Collection name | Nome identificador da tabela de dados, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho e outros recursos. Ele é gerado automaticamente, mas também pode ser alterado manualmente; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Categories | Categoria da tabela de dados. As categorias afetam apenas a organização da interface de gerenciamento das tabelas de dados, sem alterar sua estrutura. Quando houver muitas tabelas de dados, recomenda-se classificá-las por módulo de negócio, como «Gestão de clientes», «Gestão de projetos» e «Finanças». |
| Description | Descrição da tabela de dados. Você pode informar quais dados ela armazena, quem é responsável por sua manutenção e com quais processos de negócio está relacionada, facilitando a manutenção posterior. |
| Use simple pagination mode | Modo de paginação simples. Quando ativado, a paginação dos blocos de tabela ignora a contagem do número total de registros. É adequado para tabelas com grande volume de dados e pode reduzir a carga das consultas. |
| Preset fields | Campos predefinidos. Ao criar a tabela, você pode escolher se deseja adicionar automaticamente campos comuns, como ID, data de criação, criador, data de atualização e atualizador. Recomenda-se manter esses campos em tabelas de negócio comuns. |

### Campos integrados

Ao criar uma tabela comum, você pode usar `Preset fields` para adicionar automaticamente campos comuns do sistema.

| Campo | Nome do campo | Descrição |
| --- | --- | --- |
| ID | `id` | Campo de chave primária padrão, usado para identificar exclusivamente um registro. O tipo de chave primária padrão é `Snowflake ID (53-bit)`. |
| Data de criação | `createdAt` | Registra automaticamente a data e hora de criação do registro. É usado com frequência para ordenação, filtragem, auditoria e condições de fluxos de trabalho. |
| Criador | `createdBy` | Registra automaticamente o usuário que criou o registro. É usado com frequência para «ver apenas os dados que criei», controle de permissões e rastreamento de responsabilidades. |
| Data de atualização | `updatedAt` | Registra automaticamente a data e hora da última atualização do registro. É usado com frequência para verificar se os dados foram modificados. |
| Atualizador | `updatedBy` | Registra automaticamente o usuário que fez a última atualização do registro. É usado com frequência em cenários de auditoria e colaboração. |
| [Espaço](../../multi-app/multi-space/index.md) | `space` | Disponível após a ativação do [plugin de múltiplos espaços](../../multi-app/multi-space/index.md), usado para isolar dados por espaço. Quando o recurso de múltiplos espaços não está ativado, esse campo não aparece nos campos predefinidos das tabelas comuns. |

### Campo de chave primária

**Primary key** identifica o campo de chave primária. Ele é usado para identificar exclusivamente um registro no nível do banco de dados. Ao criar uma tabela, recomenda-se manter o campo predefinido ID; o tipo de chave primária padrão é `Snowflake ID (53-bit)`.

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

Passe o mouse sobre Interface do campo ID para selecionar outro tipo de chave primária.

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

Os tipos de chave primária disponíveis são:

- [Texto](../data-modeling/collection-fields/basic/input.md)
- [Inteiro](../data-modeling/collection-fields/basic/integer.md)
- [Snowflake ID (53-bit)](../data-modeling/collection-fields/advanced/snowflake-id.md)
- [UUID](../data-modeling/collection-fields/advanced/uuid.md)
- [Nano ID](../data-modeling/collection-fields/advanced/nano-id.md)

:::warning Atenção

As tabelas de dados sem chave primária precisam definir «Record unique key» ao editar a tabela de dados; caso contrário, não será possível criar blocos na página nem visualizar ou editar registros corretamente.

:::


## Uso na configuração de páginas

As tabelas comuns podem ser usadas na maioria dos blocos de dados e blocos de filtragem.

| Bloco | Uso |
| --- | --- |
| [Bloco de tabela](../../interface-builder/blocks/data-blocks/table.md) | Visualizar, filtrar, ordenar e processar registros em lote. |
| [Bloco de formulário](../../interface-builder/blocks/data-blocks/form.md) | Adicionar ou editar um único registro. |
| [Bloco de detalhes](../../interface-builder/blocks/data-blocks/details.md) | Visualizar os detalhes de um único registro. |
| [Bloco de lista](../../interface-builder/blocks/data-blocks/list.md) | Exibir registros em formato de lista. |
| [Bloco de cartões em grade](../../interface-builder/blocks/data-blocks/grid-card.md) | Exibir registros de imagens, arquivos, produtos, ativos e outros em uma grade de cartões. |
| [Bloco de quadro](../../interface-builder/blocks/data-blocks/kanban.md) | Exibir registros agrupados por campos como status, etapa e responsável. |
| [Bloco de calendário](../../interface-builder/blocks/data-blocks/calendar.md) | Exibir registros por data ou intervalo de tempo. |
| [Bloco de gráfico](../../interface-builder/blocks/data-blocks/chart.md) | Gerar gráficos estatísticos com base nos registros. |
| [Bloco de mapa](../../interface-builder/blocks/data-blocks/map.md) | Exibir registros por localização geográfica. |
| [Bloco de gráfico de Gantt](../../plugins/@nocobase/plugin-gantt/index.md) | Exibir planos de projeto e cronogramas de tarefas por data de início e término. |
| [Bloco de filtragem por formulário](../../interface-builder/blocks/filter-blocks/form.md) | Usar condições de formulário para filtrar os blocos de dados da página. |
| [Bloco de filtragem por árvore](../../interface-builder/blocks/filter-blocks/tree.md) | Usar uma estrutura em árvore para filtrar os blocos de dados da página, geralmente em filtros hierárquicos de categorias, organizações, regiões e outros. |

## Editar configuração

Na lista de tabelas de dados, clique em «Edit» à direita da tabela comum para modificar sua configuração básica. A edição da tabela de dados serve principalmente para ajustar os metadados e algumas configurações de execução da tabela, não para modificar em lote a estrutura dos campos.

Para adicionar campos, modificar tipos de campos, ajustar tipos de interface dos campos ou excluir campos, acesse «Configure fields».

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Collection display name | Sim | Nome da tabela de dados exibido na interface, como «Clientes», «Pedidos» e «Anexos de contrato». Após a alteração, somente a exibição na interface será afetada; o nome identificador da tabela de dados não será modificado. |
| Collection name | Não | Nome identificador da tabela de dados, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho e outros recursos. Após a criação, não pode ser modificado no formulário de edição. |
| Inherits | Condicional | Selecione a tabela pai a ser herdada. Disponível somente quando o banco de dados principal é PostgreSQL e essa configuração é exibida na interface. Antes de ajustar a relação de herança de uma tabela existente, confirme se a estrutura dos campos, os blocos de página, as permissões e os fluxos de trabalho dependem da estrutura original. |
| Categories | Sim | Categoria da tabela de dados. As categorias afetam apenas a organização da interface de gerenciamento das tabelas de dados, sem alterar sua estrutura. |
| Description | Sim | Descrição da tabela de dados. É adequada para complementar informações sobre a finalidade da tabela, o responsável pela manutenção, a origem dos dados e os processos de negócio relacionados. |
| Use simple pagination mode | Sim | Modo de paginação simples. Quando ativado, a paginação dos blocos de tabela ignora a contagem do número total de registros. É adequado para tabelas com grande volume de dados. |
| Record unique key | Sim | Identificador exclusivo do registro. Usado para localizar um registro em um bloco; normalmente, seleciona-se a chave primária ou um campo exclusivo. As tabelas de dados sem chave primária precisam dessa configuração para criar blocos, visualizar ou editar registros corretamente. |

:::warning Atenção

A edição da tabela de dados não ajusta automaticamente os campos existentes. `Preset fields` só tem efeito no momento da criação da tabela; se, após a criação, ainda for necessário adicionar campos como data de criação, criador, data de atualização e atualizador, eles deverão ser adicionados separadamente em «Configure fields».

:::

## Excluir tabela de dados

Na lista de tabelas de dados, clique em «Delete» à direita da tabela comum para excluí-la. As tabelas comuns do banco de dados principal também permitem selecionar várias tabelas e excluí-las em conjunto.

![delete_collection](https://static-docs.nocobase.com/delete_collection.png)

Uma segunda confirmação será exibida durante a exclusão. Após a confirmação, o NocoBase excluirá os metadados de Collection dessa tabela comum, além da tabela de dados real e dos dados nela contidos no banco de dados principal.

![delete_collection_second_confirmation](https://static-docs.nocobase.com/delete_collection_second_confirmation.png)

A caixa de confirmação de exclusão contém uma opção: excluir automaticamente os objetos que dependem dessa tabela de dados. Quando ativada, o NocoBase tentará excluir também os objetos de banco de dados que dependem dessa tabela, como as visualizações de banco de dados criadas com base nela e outros objetos que continuam dependendo desses objetos.

:::danger Aviso

Excluir uma tabela comum é uma operação de alto risco. Após a exclusão, a estrutura da tabela, os dados, os metadados dos campos e os blocos de página, campos de relação, permissões, fluxos de trabalho e chamadas de API que dependem dessa tabela poderão deixar de funcionar. Antes de marcar a opção de exclusão automática dos objetos dependentes, confirme que esses objetos também podem ser excluídos.

:::
