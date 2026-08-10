---
title: "Visão geral da modelagem de dados"
description: "Modelagem de dados: projetar modelos de dados, conectar diversas fontes de dados, visualizar diagramas ER, criar tabelas de dados e oferecer suporte a bancos de dados principal e externos."
keywords: "Modelagem de dados,Collection,modelo de dados,diagrama ER,banco de dados principal,banco de dados externo,NocoBase"
---

# Visão geral

A modelagem de dados é uma etapa fundamental no projeto de bancos de dados. Ela envolve a análise e a abstração aprofundadas dos diversos tipos de dados do mundo real e de suas relações. Nesse processo, buscamos revelar as conexões internas entre os dados e descrevê-las formalmente como um modelo de dados, estabelecendo a base para a estrutura do banco de dados de um sistema de informação. O NocoBase é uma plataforma orientada por modelos de dados, com os seguintes recursos:

## Suporte à conexão com dados de diversas fontes

As fontes de dados do NocoBase podem ser diversos bancos de dados comuns, plataformas de API (SDK) e arquivos.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

O NocoBase oferece o [plugin de gerenciamento de fontes de dados](/data-sources/data-source-manager), usado para gerenciar diversas fontes de dados e suas tabelas. O plugin de gerenciamento de fontes de dados fornece apenas uma interface de gerenciamento para todas as fontes de dados; ele não oferece a capacidade de conexão com as fontes de dados e precisa ser usado em conjunto com vários plugins de fontes de dados. Atualmente, as fontes de dados compatíveis incluem:

- [Main Database](/data-sources/data-source-main): banco de dados principal do NocoBase, compatível com bancos de dados relacionais como MySQL, PostgreSQL e MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): usa o banco de dados KingbaseES como fonte de dados, podendo ser utilizado tanto como banco de dados principal quanto como banco de dados externo.
- [External MySQL](/data-sources/data-source-external-mysql): usa um banco de dados MySQL externo como fonte de dados.
- [External MariaDB](/data-sources/data-source-external-mariadb): usa um banco de dados MariaDB externo como fonte de dados.
- [External PostgreSQL](/data-sources/data-source-external-postgres): usa um banco de dados PostgreSQL externo como fonte de dados.
- [External MSSQL](/data-sources/data-source-external-mssql): usa um banco de dados MSSQL (SQL Server) externo como fonte de dados.
- [External Oracle](/data-sources/data-source-external-oracle): usa um banco de dados Oracle externo como fonte de dados.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Oferece diversas ferramentas de modelagem de dados

**Interface simples de gerenciamento de tabelas de dados**: usada para criar diversos modelos (tabelas de dados) ou conectar modelos (tabelas de dados) existentes.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interface de visualização semelhante a um diagrama ER**: usada para extrair entidades e suas relações a partir das necessidades dos usuários e dos negócios. Ela oferece uma maneira intuitiva e fácil de entender para descrever o modelo de dados. Por meio do diagrama ER, é possível compreender com mais clareza as principais entidades de dados do sistema e as relações entre elas.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Suporta a criação de vários tipos de tabelas de dados

| Tabela de dados | Descrição |
| - | - |
| [Tabela de dados comum](/data-sources/data-source-main/general-collection) | Inclui campos de sistema usados com frequência |
| [Tabela de dados de calendário](/data-sources/calendar/calendar-collection) | Usada para criar tabelas de eventos relacionados a calendários |
| Tabela de comentários | Usada para armazenar comentários ou feedback sobre os dados |
| [Tabela com estrutura em árvore](/data-sources/collection-tree) | Tabela com estrutura em árvore; atualmente, oferece suporte apenas ao modelo de lista de adjacência |
| [Tabela de dados de arquivos](/data-sources/file-manager/file-collection) | Usada para o gerenciamento do armazenamento de arquivos |
| [Tabela de dados SQL](/data-sources/collection-sql) | Não é uma tabela real do banco de dados, mas apresenta rapidamente as consultas SQL de forma estruturada |
| [Conectar a uma visualização do banco de dados](/data-sources/collection-view) | Conecta-se a uma visualização existente do banco de dados |
| Tabela de expressões | Usada em cenários de expressões dinâmicas de fluxos de trabalho |
| [Conectar a dados externos](/data-sources/collection-fdw) | Implementa a conexão com tabelas de dados remotas com base na tecnologia FDW do banco de dados |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Para mais informações, consulte a seção «[Tabelas de dados / Visão geral](/data-sources/data-modeling/collection)»

## Oferece uma ampla variedade de tipos de campos

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Para mais informações, consulte a seção «[Campos de tabela de dados / Visão geral](/data-sources/data-modeling/collection-fields)»
