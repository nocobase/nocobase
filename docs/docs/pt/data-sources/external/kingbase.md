---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Fonte de dados externa - KingbaseES"
description: "Saiba como conectar o KingbaseES ao NocoBase como banco de dados externo, incluindo versões compatíveis, modo de compatibilidade com PostgreSQL, configuração da conexão, schema, permissões e mapeamento de campos."
keywords: "fonte de dados externa,KingbaseES,Kingbase da Inspur,banco de dados externo,modo de compatibilidade com PostgreSQL,mapeamento de campos,NocoBase"
---

# KingbaseES

## Introdução

O KingbaseES pode ser conectado ao NocoBase como banco de dados externo. Depois da conexão, o NocoBase lê as tabelas, os campos e as views do KingbaseES e os utiliza como tabelas de dados na fonte de dados externa.

Diferentemente do [banco de dados principal](../main/index.md), a estrutura real das tabelas do KingbaseES externo continua sendo mantida pelo sistema de negócios original, pelo cliente de banco de dados ou pelos scripts de migração. O NocoBase é responsável por ler a estrutura, salvar os metadados dos campos e configurar blocos de página, permissões, workflows e APIs.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | KingbaseES >= V9. |
| Versões comerciais | Compatível com as edições Professional e Enterprise. |
| Plugin correspondente | `@nocobase/plugin-data-source-kingbase`. |
| Modo do banco de dados | Compatível apenas com o modo de compatibilidade com PostgreSQL. |

Cenários adequados para usar o KingbaseES externo:

- Conectar um banco de negócios KingbaseES existente em ambientes governamentais e empresariais, redes internas ou ambientes de localização tecnológica
- Criar uma interface de gerenciamento com o NocoBase sem migrar os dados históricos
- Aplicar controle de permissões, processamento de fluxos, correção de dados ou exibição de relatórios sobre tabelas existentes
- Continuar mantendo a estrutura do banco de dados por DBAs, scripts de migração ou pelo sistema original

:::warning Atenção

Quando usado como banco de dados externo, o KingbaseES é compatível apenas com o modo de compatibilidade com PostgreSQL. Se o banco de dados não estiver nesse modo, o NocoBase não poderá ler a estrutura das tabelas e os tipos de campos usando o plugin atual.

:::

## Instalação do plugin

Este plugin é comercial. Para obter detalhes sobre a ativação, consulte: [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Adicionar uma fonte de dados

Em 「Gerenciamento de fontes de dados」, clique em 「Add new」, selecione KingbaseES e preencha as informações de conexão.

![20260709210325](https://static-docs.nocobase.com/20260709210325.png)

Configurações de conexão comuns:

| Configuração | Descrição |
| --- | --- |
| Data source name | Nome de identificação da fonte de dados, usado para referência em blocos de página, permissões, workflows e APIs. Não pode ser alterado após a criação. |
| Data source display name | Nome exibido da fonte de dados na interface. Recomenda-se usar um nome que os usuários de negócio compreendam, como 「KingbaseES governamental」 ou 「Banco de relatórios」. |
| Host / Port | Endereço do host e porta do KingbaseES. A porta depende da configuração real do banco de dados. |
| Database | Nome do banco de dados KingbaseES ao qual se conectar. |
| Username / Password | Nome de usuário e senha usados para conectar ao KingbaseES. O NocoBase só pode ler os objetos aos quais essa conta tem acesso; ele não concede permissões nem lê objetos privados de outras contas. |
| Schema | Schema que será lido. Se o banco de dados tiver vários schemas, recomenda-se preencher apenas o schema necessário para o negócio atual. |
| Table prefix | Prefixo dos nomes das tabelas. Depois de configurado, o NocoBase lê apenas as tabelas e views que correspondem a esse prefixo e gera no NocoBase nomes de tabelas sem o prefixo. |
| Collections / Add all collections | Controla o escopo da conexão. Quando 「Add all collections」 está ativado, o NocoBase conecta todas as tabelas e views dentro do escopo atual; quando desativado, conecta apenas os objetos selecionados em 「Collections」. |
| Enabled the data source | Define se a fonte de dados está habilitada. Quando desativada, a configuração da fonte de dados é mantida, mas blocos de página, permissões, workflows e APIs não podem continuar lendo seus dados. |

:::tip Dica

Se houver muitos objetos no KingbaseES, reduza primeiro o escopo por meio de `Schema`, `Table prefix` e 「Collections」. Conecte apenas as tabelas e views usadas pelo aplicativo atual; assim, a configuração posterior de permissões, a criação de páginas e a manutenção da sincronização ficam mais simples.

:::

## Selecionar tabelas de dados

Depois de preencher as informações de conexão, clique em 「Load Collections」 para ler as tabelas e views disponíveis no KingbaseES. Os resultados da leitura são afetados pela conta de conexão, por `Schema`, `Table prefix` e pela configuração de 「Collections」.

Por padrão, 「Add all collections」 fica ativado, indicando que todas as tabelas e views dentro do escopo atual serão conectadas. Se quiser conectar apenas alguns objetos, desative 「Add all collections」 e selecione na lista as tabelas ou views necessárias.

![20260709210603](https://static-docs.nocobase.com/20260709210603.png)

:::warning Atenção

Uma única fonte de dados externa pode conectar no máximo 500 tabelas ou views por vez. Se houver muitos objetos no KingbaseES, recomenda-se reduzir primeiro o escopo por meio de `Schema`, `Table prefix` ou 「Collections」.

:::

## Sincronizar e configurar campos

A estrutura das tabelas do KingbaseES externo é mantida no lado do banco de dados. O NocoBase não cria campos, altera tipos de campos nem exclui campos reais no KingbaseES externo.

Quando a estrutura das tabelas no KingbaseES mudar, execute 「Sync from database」 na fonte de dados para ler novamente os metadados das tabelas e dos campos. A sincronização atualiza as informações salvas no NocoBase sobre tabelas de dados, campos, chaves primárias, chaves exclusivas e mapeamentos de tipos de campos, mas não exclui as tabelas reais nem os dados no KingbaseES.

Após a sincronização dos campos, é possível configurar no NocoBase o título do campo, o tipo de campo (Field type) e o componente do campo (Field interface). Se for necessário criar campos de relacionamento do NocoBase, os metadados do relacionamento também serão salvos no NocoBase, sem adicionar automaticamente campos reais de chave estrangeira às tabelas do KingbaseES.

## Mapeamento de tipos de campos

O NocoBase identifica os tipos de campos do KingbaseES de acordo com a lógica de compatibilidade com PostgreSQL e os mapeia automaticamente para o Field type e o Field interface adequados. Você pode ajustar a forma de exibição na configuração do campo.

Mapeamentos comuns:

| Tipo de campo do KingbaseES | NocoBase Field type | Field interface disponível |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch. |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer、Sort、Select、Radio group. |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at. |
| `REAL`、`DOUBLE PRECISION` | `float` | Number、Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency. |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID. |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json`、`array` | JSON. |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date、Time、Created at、Updated at. |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date、Time、Created at、Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME WITHOUT TIME ZONE` | `time` | Time. |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON. |
| `ARRAY` | `array` | Multiple select、Checkbox group、JSON. |

:::warning Atenção

Os tipos de campos do KingbaseES não compatíveis são exibidos separadamente na configuração dos campos. Esses campos precisam ser adaptados antes de poderem ser usados como campos comuns no NocoBase.

:::

## Chave primária e identificador exclusivo do registro

Para tabelas de dados usadas na exibição e edição em blocos de página, recomenda-se ter uma chave primária ou um campo exclusivo. O NocoBase prioriza a chave primária como identificador exclusivo do registro.

Se a conexão for com uma view, uma tabela sem chave primária ou uma tabela com chave primária composta, será necessário definir manualmente 「Record unique key」 na configuração da tabela de dados. Sem um identificador exclusivo disponível, os blocos de página poderão não conseguir visualizar, editar ou excluir registros corretamente.

![20260709210636](https://static-docs.nocobase.com/20260709210636.png)
![20260709210651](https://static-docs.nocobase.com/20260709210651.png)

## Links relacionados

- [Banco de dados externo](./index.md) — Consulte as configurações gerais e as instruções de gerenciamento de bancos de dados externos
- [Gerenciamento de fontes de dados](../data-source-manager/index.md) — Consulte a entrada das fontes de dados e as formas de gerenciá-las
- [Campos das tabelas de dados](../data-modeling/collection-fields/index.md) — Consulte as instruções sobre tipos de campos e mapeamento de campos