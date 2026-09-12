---
pkg: "@nocobase/plugin-data-source-main"
title: "Tabela herdada"
description: "A tabela herdada deriva tabelas filhas com base em uma tabela pai. A tabela filha herda a estrutura de campos da tabela pai e pode definir seus próprios campos. Esse recurso só é compatível quando o banco de dados principal é PostgreSQL."
keywords: "tabela herdada,Inheritance Collection,herança de tabelas,extensão de tabelas de dados,PostgreSQL,NocoBase"
---

# Tabela herdada

## Introdução

A tabela herdada é uma extensão baseada em uma tabela comum, adequada para situações em que várias tabelas de dados compartilham um conjunto de campos comuns, enquanto cada tabela filha possui seus próprios campos específicos.

Por exemplo, primeiro crie a tabela pai «Ativos» para armazenar campos comuns, como número do ativo, nome do ativo, data de aquisição e responsável. Em seguida, derive tabelas filhas como «Ativos de informática», «Veículos» e «Móveis de escritório». A tabela filha herdará a estrutura de campos da tabela pai e poderá continuar definindo seus próprios campos.

:::warning Observação

As tabelas herdadas só podem ser criadas quando o banco de dados principal é PostgreSQL. Outros bancos de dados principais, bancos de dados externos, fontes de dados da API REST e fontes de dados externas do NocoBase não são compatíveis com tabelas herdadas.

:::

## Cenários de aplicação

As tabelas herdadas são adequadas para estes cenários de negócios:

- Derivar as tabelas de ativos de informática, veículos e móveis de escritório a partir da tabela pai de ativos
- Derivar as tabelas de funcionários, prestadores terceirizados e visitantes a partir da tabela pai de pessoas
- Derivar as tabelas de tarefas, defeitos e requisitos a partir da tabela pai de itens
- Derivar as tabelas de contratos de compra, contratos de venda e contratos de serviço a partir da tabela pai de contratos

O uso de tabelas herdadas é recomendado quando esses objetos possuem campos comuns estáveis e as diferenças entre as tabelas filhas se limitam principalmente a alguns campos específicos.

## Criar configuração

No banco de dados principal, ao clicar em «Create collection» e escolher uma tabela comum ou uma opção de criação compatível com herança, você pode selecionar a tabela pai por meio de `Inherits`.

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)

| Configuração | Descrição |
| --- | --- |
| Collection display name | Nome exibido da tabela de dados na interface, como «Ativos de informática», «Veículos» e «Móveis de escritório». |
| Collection name | Nome de identificação da tabela de dados, usado para referências internas em APIs, campos de relacionamento, permissões, fluxos de trabalho e outros recursos. |
| Inherits | Selecione a tabela pai a ser herdada. A tabela de dados atual herdará a estrutura de campos da tabela pai e poderá continuar definindo seus próprios campos. |
| Categories | Categoria da tabela de dados. A categoria afeta apenas a forma de organização na interface de gerenciamento das tabelas de dados, sem alterar sua estrutura. |
| Description | Descrição da tabela de dados. Você pode informar que tipo de dados a tabela filha armazena, de qual tabela pai foi derivada e quem é responsável por sua manutenção. |
| Preset fields | Campos predefinidos. As tabelas herdadas normalmente também mantêm os campos ID, data de criação, criador, data de atualização, atualizador e outros campos das tabelas comuns. |

As tabelas herdadas podem usar a mesma configuração de blocos e campos das [tabelas comuns](./general-collection.md). Para os blocos de página, elas continuam sendo tabelas de dados cujos registros podem ser criados, consultados, atualizados e excluídos.

:::warning Observação

As tabelas herdadas são adequadas para objetos de negócios com estruturas muito semelhantes. Se os processos de negócio, as permissões e as páginas forem muito diferentes entre os objetos, geralmente é mais claro dividi-los em tabelas comuns e conectá-los usando campos de relacionamento.

:::

### Campos integrados

A tabela herdada herda os campos existentes da tabela pai e também pode continuar adicionando seus próprios campos.

| Origem do campo | Descrição |
| --- | --- |
| Campos da tabela pai | A tabela filha herdará os campos comuns da tabela pai, como número do ativo, nome do ativo e responsável. |
| Campos da tabela filha | A tabela filha pode continuar definindo seus próprios campos específicos, como «Modelo da CPU» para ativos de informática e «Placa do veículo» para veículos. |
| Campos do sistema | Se `Preset fields` for mantido durante a criação, serão incluídos campos como ID, data de criação, criador, data de atualização e atualizador. |

:::warning Observação

Os campos da tabela pai afetam todas as tabelas filhas que a herdam. Antes de modificar os campos da tabela pai, confirme se as páginas, permissões, fluxos de trabalho e APIs das tabelas filhas dependem desses campos.

:::

### Campo de chave primária

Assim como as tabelas comuns, as tabelas herdadas precisam de um campo de chave primária. Ao criar a tabela, recomenda-se manter o campo predefinido ID. O tipo de chave primária padrão é `Snowflake ID (53-bit)`.

Se a tabela herdada não tiver uma chave primária após a conexão ou sincronização, será necessário definir «Record unique key» ao editar a tabela de dados; caso contrário, os blocos de página poderão não conseguir visualizar ou editar os registros corretamente.

## Uso na configuração de páginas

As tabelas herdadas podem ser usadas na maioria dos blocos de página compatíveis com tabelas comuns. Um uso comum é configurar cada tabela filha separadamente como um bloco de tabela, formulário, detalhes ou quadro.

| Bloco | Uso |
| --- | --- |
| [Bloco de tabela](../../interface-builder/blocks/data-blocks/table.md) | Visualizar, filtrar, classificar e processar em lote os registros da tabela filha. |
| [Bloco de formulário](../../interface-builder/blocks/data-blocks/form.md) | Adicionar ou editar um único registro da tabela filha. |
| [Bloco de detalhes](../../interface-builder/blocks/data-blocks/details.md) | Visualizar os detalhes de um único registro da tabela filha. |
| [Bloco de quadro](../../interface-builder/blocks/data-blocks/kanban.md) | Exibir os registros da tabela filha agrupados por campos como status, etapa e responsável. |

## Editar configuração

Na lista de tabelas de dados, clique em «Edit» à direita da tabela herdada para modificar configurações como o nome exibido da tabela de dados, a categoria, a descrição, o modo de paginação simples e «Record unique key».

Não é recomendável ajustar frequentemente a relação de herança depois que ela já tiver sido amplamente utilizada nas configurações de negócio. Os blocos de página, campos de relacionamento, permissões e fluxos de trabalho podem depender da estrutura de campos atual.

## Excluir tabela de dados

Na lista de tabelas de dados, clique em «Delete» à direita da tabela herdada para excluí-la.

A exclusão da tabela herdada remove os metadados de Collection da tabela filha e a tabela de dados real no banco de dados principal. Antes de excluir, confirme se ainda existem blocos de página, campos de relacionamento, permissões, fluxos de trabalho ou APIs usando essa tabela filha.

:::danger Aviso

Excluir uma tabela herdada não equivale automaticamente a excluir a tabela pai. A exclusão dos objetos dependentes depende das opções selecionadas na confirmação da exclusão. Antes de realizar a operação, confirme se a tabela pai e as outras tabelas filhas ainda precisam ser mantidas.

:::

## Links relacionados

- [Tabela comum](./general-collection.md) — Consulte as configurações gerais das tabelas comuns
- [Banco de dados principal](./index.md) — Consulte os tipos de banco de dados compatíveis com o banco de dados principal
- [Campos da tabela de dados](../data-modeling/collection-fields/index.md) — Consulte como configurar os campos