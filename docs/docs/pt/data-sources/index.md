---
title: "Visão geral das fontes de dados"
description: "Fontes de dados e modelagem de dados do NocoBase: banco de dados principal, bancos de dados externos, REST API, NocoBase externo, gerenciamento de fontes de dados, tabelas comuns, tabelas hierárquicas, tabelas SQL e tabelas de arquivos."
keywords: "fontes de dados,modelagem de dados,banco de dados principal,banco de dados externo,REST API,NocoBase externo,Collection,tabela hierárquica,tabela SQL,NocoBase"
---

# Visão geral

A modelagem de dados é uma etapa fundamental no projeto de bancos de dados. Ela envolve a análise e a abstração aprofundadas dos diversos tipos de dados do mundo real e de suas relações. Nesse processo, buscamos revelar as conexões internas entre os dados e descrevê-las formalmente como um modelo de dados, estabelecendo a base para a estrutura do banco de dados de um sistema de informação. O NocoBase é uma plataforma orientada por modelos de dados, com os seguintes recursos:

## Suporte à conexão com dados de diversas fontes

As fontes de dados do NocoBase podem ser vários bancos de dados comuns, plataformas de API (SDK) e arquivos.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

O NocoBase fornece o [plugin de gerenciamento de fontes de dados](./data-source-manager/index.md), usado para gerenciar as fontes de dados e suas tabelas. O plugin de gerenciamento de fontes de dados oferece apenas uma interface de gerenciamento para todas as fontes de dados; ele não fornece a capacidade de conectar-se a fontes de dados e precisa ser usado em conjunto com os plugins das diversas fontes de dados. Atualmente, as fontes de dados compatíveis incluem:

- [Fonte de dados principal](./data-source-main/index.md): banco de dados principal do NocoBase, compatível com PostgreSQL, MySQL, MariaDB, KingbaseES e OceanBase.
- [PostgreSQL externo](./data-source-external-postgres/index.md): conecta-se a um banco de dados PostgreSQL existente.
- [MySQL externo](./data-source-external-mysql/index.md): conecta-se a um banco de dados MySQL existente.
- [MariaDB externo](./data-source-external-mariadb/index.md): conecta-se a um banco de dados MariaDB existente.
- [MSSQL externo](./data-source-external-mssql/index.md): conecta-se a um banco de dados SQL Server existente.
- [KingbaseES externo](./data-source-kingbase/index.md): conecta-se a um banco de dados KingbaseES existente.
- [OceanBase externo](./external/oceanbase.md): conecta-se a um banco de dados OceanBase existente.
- [Oracle externo](./data-source-external-oracle/index.md): conecta-se a um banco de dados Oracle existente.
- [ClickHouse externo](./external/clickhouse.md): conecta-se a um banco de dados ClickHouse existente.
- [Doris externo](./external/doris.md): conecta-se a um banco de dados Doris existente.
- [Fonte de dados REST API](./data-source-rest-api/index.md): mapeia a REST API de um sistema de terceiros como uma fonte de dados.
- [Fonte de dados NocoBase externo](./data-source-external-nocobase/index.md): conecta-se às tabelas de dados de outro aplicativo NocoBase.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Fornece diversas ferramentas de modelagem de dados

**Interface simples de gerenciamento de tabelas de dados**: usada para criar vários modelos (tabelas de dados) ou conectar-se a modelos (tabelas de dados) existentes.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interface visual semelhante a um diagrama ER**: usada para extrair entidades e suas relações a partir das necessidades dos usuários e dos negócios. Ela oferece uma maneira intuitiva e fácil de entender para descrever o modelo de dados. Por meio do diagrama ER, é possível compreender com mais clareza as principais entidades de dados do sistema e suas relações.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Suporte à criação de vários tipos de tabelas de dados

| Tabela de dados | Descrição |
| - | - |
| [Tabela de dados comum](/data-sources/data-source-main/general-collection) | Inclui campos de sistema comuns integrados |
| [Tabela de dados de calendário](/data-sources/calendar/calendar-collection) | Usada para criar tabelas de eventos relacionados a calendários |
| [Tabela de comentários](/data-sources/collection-comment/) | Usada para armazenar comentários ou feedback sobre os dados |
| [Tabela de estrutura hierárquica](/data-sources/collection-tree/) | Tabela de estrutura hierárquica; atualmente, é compatível apenas com o modelo de tabela de adjacência |
| [Tabela de dados de arquivos](/data-sources/file-manager/file-collection) | Usada para o gerenciamento do armazenamento de arquivos |
| [Conexão com uma exibição do banco de dados](/data-sources/collection-view/) | Conecta-se a uma exibição existente do banco de dados |
| [Tabela de dados SQL](/data-sources/collection-sql/) | Não é uma tabela real do banco de dados, mas apresenta rapidamente consultas SQL de forma estruturada |
| [Conexão com dados externos](/data-sources/collection-fdw) | Implementa a conexão com tabelas de dados remotas com base na tecnologia FDW do banco de dados |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Para obter mais informações, consulte o capítulo "[Tabelas de dados / Visão geral](/data-sources/data-modeling/collection)"

## Fornece uma ampla variedade de tipos de campos

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Para obter mais informações, consulte o capítulo "[Campos de tabela de dados / Visão geral](/data-sources/data-modeling/collection-fields/)"