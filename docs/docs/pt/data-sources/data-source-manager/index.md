---
pkg: "@nocobase/plugin-data-source-manager"
title: "Gerenciamento de fontes de dados"
description: "Plugin de gerenciamento de fontes de dados: gerencie o banco de dados principal, bancos de dados externos, fontes de dados de API REST e fontes de dados externas do NocoBase, oferecendo uma interface unificada de gerenciamento de fontes de dados."
keywords: "gerenciamento de fontes de dados,banco de dados principal,banco de dados externo,sincronização de tabelas de dados,fonte de dados de API REST,NocoBase"
---
# Gerenciamento de fontes de dados

## Introdução

O NocoBase oferece um plugin de gerenciamento de fontes de dados para gerenciar fontes de dados e suas tabelas. O plugin de gerenciamento de fontes de dados fornece apenas uma interface de gerenciamento para todas as fontes de dados e não oferece a capacidade de conectar fontes de dados. Ele precisa ser usado em conjunto com vários plugins de fontes de dados. Atualmente, as fontes de dados compatíveis incluem:

- [Main Database](/data-sources/data-source-main/): banco de dados principal do NocoBase, compatível com MySQL, PostgreSQL, MariaDB, KingbaseES e OceanBase.
- [External PostgreSQL](/data-sources/data-source-external-postgres/): usa um banco de dados PostgreSQL externo como fonte de dados.
- [External MySQL](/data-sources/data-source-external-mysql/): usa um banco de dados MySQL externo como fonte de dados.
- [External MariaDB](/data-sources/data-source-external-mariadb/): usa um banco de dados MariaDB externo como fonte de dados.
- [External MSSQL](/data-sources/data-source-external-mssql/): usa um banco de dados MSSQL (SQL Server) externo como fonte de dados.
- [External KingbaseES](/data-sources/data-source-kingbase/): usa um banco de dados KingbaseES externo como fonte de dados.
- [External OceanBase](/data-sources/external/oceanbase): usa um banco de dados OceanBase externo como fonte de dados.
- [External Oracle](/data-sources/data-source-external-oracle/): usa um banco de dados Oracle externo como fonte de dados.
- [External ClickHouse](/data-sources/external/clickhouse): usa um banco de dados ClickHouse externo como fonte de dados, geralmente para consultas, estatísticas e exibição de relatórios.
- [External Doris](/data-sources/external/doris): usa um banco de dados Doris externo como fonte de dados, geralmente para consultas, estatísticas e exibição de relatórios.
- [REST API 数据源](/data-sources/data-source-rest-api/): integra ao NocoBase dados provenientes de APIs REST.
- [External NocoBase](/data-sources/data-source-external-nocobase/): usa outro aplicativo NocoBase como fonte de dados externa por meio da API remota do NocoBase.

Além disso, é possível estender mais tipos por meio de plugins, incluindo vários bancos de dados comuns e plataformas que fornecem APIs (SDKs).

## Instalação

Plugin integrado; não é necessária uma instalação separada.

## Instruções de uso

Durante a instalação inicial do aplicativo, uma fonte de dados destinada ao armazenamento dos dados do NocoBase é fornecida por padrão, denominada banco de dados principal. Para mais informações, consulte a documentação do [banco de dados principal](/data-sources/data-source-main/index.md).

### Fontes de dados externas

É possível usar bancos de dados externos como fontes de dados. Para mais informações, consulte a documentação [Bancos de dados externos / Introdução](/data-sources/data-source-manager/external-database.md).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Suporte à sincronização de tabelas criadas no banco de dados

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Também é possível integrar dados provenientes de APIs HTTP. Para mais informações, consulte a documentação [Fonte de dados de API REST](/data-sources/data-source-rest-api/index.md).

### Fonte de dados externa do NocoBase

É possível integrar outro aplicativo NocoBase como fonte de dados externa por meio da API remota do NocoBase. Para mais informações, consulte a documentação [NocoBase externo](/data-sources/data-source-external-nocobase/index.md).
