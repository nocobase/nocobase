---
pkg: "@nocobase/plugin-data-source-external-mssql"
title: "Fonte de dados externa - MSSQL"
description: "Saiba como conectar o MSSQL/SQL Server ao NocoBase como banco de dados externo, incluindo versões compatíveis, instalação do plugin, configuração da conexão, conexão criptografada, permissões e mapeamento de campos."
keywords: "fonte de dados externa,MSSQL,SQL Server,banco de dados externo,mapeamento de campos,NocoBase"
---

# MSSQL

## Introdução

O MSSQL (SQL Server) pode ser conectado ao NocoBase como banco de dados externo. Após a conexão, o NocoBase lê as tabelas, os campos e as visualizações do SQL Server e os utiliza como tabelas de dados na fonte de dados externa.

Diferentemente do [banco de dados principal](../main/index.md), a estrutura real das tabelas do MSSQL externo continua sendo mantida pelo sistema de negócios original, pelo cliente de banco de dados ou por scripts de migração. O NocoBase é responsável por ler a estrutura, salvar os metadados dos campos e configurar blocos de página, permissões, fluxos de trabalho e APIs.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | SQL Server 2014-2019. |
| Versões comerciais | Compatível com as edições Standard, Professional e Enterprise. |
| Plugin correspondente | `@nocobase/plugin-data-source-external-mssql`. |
| Recursos de conexão | Compatível com a configuração de «Encrypt connection» e «Trust server certificate». |

Cenários adequados para usar o MSSQL externo:

- Conectar bancos de dados SQL Server de sistemas de negócios existentes, como ERP, MES, WMS e CRM
- Criar interfaces de gerenciamento com o NocoBase sem migrar dados históricos
- Configurar permissões, processar fluxos, corrigir dados ou exibir relatórios de tabelas existentes
- Continuar mantendo a estrutura do banco de dados por DBAs, scripts de migração ou pelo sistema original

:::warning Atenção

O MSSQL externo não é o banco de dados do sistema NocoBase. O NocoBase não gerencia o backup, a restauração, a migração nem as alterações na estrutura das tabelas.

:::

## Instalação do plugin

Este plugin é comercial. Para obter detalhes sobre a ativação, consulte o [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Adicionar fonte de dados

Em «Gerenciamento de fontes de dados», clique em «Add new», selecione MSSQL e preencha as informações de conexão.

![20260709210022](https://static-docs.nocobase.com/20260709210022.png)

Configurações de conexão comuns:

| Configuração | Descrição |
| --- | --- |
| Data source name | Nome de identificação da fonte de dados, usado para referência em blocos de página, permissões, fluxos de trabalho e APIs. Não pode ser alterado após a criação. |
| Data source display name | Nome exibido da fonte de dados na interface. Recomenda-se usar um nome compreensível para os usuários de negócio, como «ERP SQL Server» ou «Banco financeiro». |
| Host / Port | Endereço do host e porta do SQL Server. A porta padrão geralmente é `1433`. |
| Database | Nome do banco de dados SQL Server ao qual se conectar. |
| Username / Password | Conta e senha usadas para conectar ao SQL Server. O NocoBase só pode ler os objetos aos quais essa conta tem acesso; ele não concede permissões nem lê objetos privados de outras contas. |
| Table prefix | Prefixo dos nomes das tabelas. Após configurado, o NocoBase lê apenas as tabelas e visualizações que correspondem a esse prefixo e gera no NocoBase nomes de tabelas sem o prefixo. |
| Encrypt connection | Indica se a conexão criptografada deve ser habilitada. Habilite quando o banco de dados exigir criptografia ou quando o canal de rede precisar ser criptografado. |
| Trust server certificate | Indica se o certificado do servidor deve ser confiável. Pode ser necessário habilitar em ambientes de teste ou com certificados autoassinados; em produção, recomenda-se usar um certificado confiável. |
| Collections / Add all collections | Controla o escopo da conexão. Quando «Add all collections» está habilitado, o NocoBase conecta todas as tabelas e visualizações dentro do escopo atual; quando desabilitado, conecta apenas os objetos selecionados em «Collections». |
| Enabled the data source | Indica se esta fonte de dados está habilitada. Quando desabilitada, a configuração da fonte de dados é mantida, mas os blocos de página, as permissões, os fluxos de trabalho e as APIs não podem mais ler seus dados. |

:::tip Dica

Se houver muitos objetos no SQL Server, restrinja primeiro o escopo usando `Database`, `Table prefix` e «Collections». Conecte apenas as tabelas e visualizações usadas pelo aplicativo atual; assim, a configuração posterior de permissões, a criação de páginas e a manutenção da sincronização serão mais simples.

:::

## Selecionar tabelas de dados

Após preencher as informações de conexão, clique em «Load Collections» para ler as tabelas e visualizações disponíveis no SQL Server. Os resultados da leitura serão afetados pela conta de conexão, por `Database`, `Table prefix` e pela configuração de «Collections».

Por padrão, «Add all collections» estará habilitado, indicando que todas as tabelas e visualizações dentro do escopo atual serão conectadas. Se quiser conectar apenas alguns objetos, desabilite «Add all collections» e selecione na lista as tabelas ou visualizações necessárias.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Atenção

Uma única fonte de dados externa pode conectar no máximo 500 tabelas ou visualizações por vez. Se houver muitos objetos no SQL Server, recomenda-se restringir primeiro o escopo usando `Database`, `Table prefix` ou «Collections».

:::

## Sincronizar e configurar campos

A estrutura das tabelas do MSSQL externo é mantida no banco de dados. O NocoBase não cria campos, altera tipos de campos nem exclui campos reais no SQL Server externo.

Quando a estrutura das tabelas no SQL Server for alterada, execute «Sync from database» na fonte de dados para ler novamente os metadados das tabelas e dos campos. A sincronização atualiza as informações de mapeamento das tabelas, dos campos, das chaves primárias, das chaves exclusivas e dos tipos de campos salvas no NocoBase, mas não exclui as tabelas nem os dados reais do SQL Server.

Após a sincronização dos campos, você pode configurar no NocoBase o título do campo, o tipo de campo (Field type) e a interface do campo (Field interface). Se precisar criar campos de relação do NocoBase, os metadados da relação também serão salvos no NocoBase, sem adicionar automaticamente campos de chave estrangeira reais às tabelas do SQL Server.

## Mapeamento de tipos de campos

O NocoBase mapeia automaticamente os tipos de campos do SQL Server para um Field type e uma Field interface adequados. Você pode ajustar a forma de exibição na interface de configuração do campo.

Mapeamentos comuns:

| Tipo de campo do SQL Server | NocoBase Field type | Field interface disponível |
| --- | --- | --- |
| `BIT` | `bit` | Checkbox, Switch. |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `INT` | `integer`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Select, Radio group. |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `DECIMAL`、`MONEY`、`SMALLMONEY` | `decimal` | Number, Percent, Currency. |
| `NUMERIC`、`FLOAT`、`REAL` | `float` | Number, Percent. |
| `CHAR`、`VARCHAR`、`NCHAR`、`NVARCHAR` | `string`、`uuid`、`nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT`、`NTEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `DATETIME`、`DATETIME2` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `DATETIMEOFFSET` | `datetimeTz` | Date, Time, Created at, Updated at. |
| `UNIQUEIDENTIFIER` | `uuid`、`string` | UUID, Input. |
| `JSON` | `json`、`array` | JSON. |

:::warning Atenção

Os tipos de campos do SQL Server que não são compatíveis serão exibidos separadamente na configuração dos campos. Esses campos só poderão ser usados no NocoBase como campos comuns após o desenvolvimento de um adaptador.

:::

## Chave primária e identificador exclusivo do registro

Para tabelas de dados usadas na exibição e edição de blocos de página, recomenda-se ter um campo de chave primária ou exclusivo. O NocoBase dará prioridade à chave primária como identificador exclusivo do registro.

Se a conexão for com uma visualização, uma tabela sem chave primária ou uma tabela com chave primária composta, será necessário definir manualmente «Record unique key» na configuração da tabela de dados. Sem um identificador exclusivo disponível, os blocos de página poderão não conseguir visualizar, editar ou excluir registros corretamente.

![20260709210154](https://static-docs.nocobase.com/20260709210154.png)
![20260709210214](https://static-docs.nocobase.com/20260709210214.png)

## Links relacionados

- [Banco de dados externo](./index.md) — Consulte as configurações gerais e as instruções de gerenciamento de bancos de dados externos
- [Gerenciamento de fontes de dados](../data-source-manager/index.md) — Consulte a entrada e as formas de gerenciamento das fontes de dados
- [Campos de tabelas de dados](../data-modeling/collection-fields/index.md) — Consulte as instruções sobre tipos de campos e mapeamento de campos