---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Gerenciamento de Fontes de Dados

## Introdução

O NocoBase oferece um plugin de gerenciamento de fontes de dados para gerenciar fontes de dados e suas coleções. O plugin de gerenciamento de fontes de dados apenas fornece uma interface para administrar todas as fontes de dados, mas não oferece a capacidade de acessá-las diretamente. Ele precisa ser usado em conjunto com diversos plugins de fontes de dados. As fontes de dados atualmente suportadas para acesso incluem:

- [Banco de Dados Principal](/data-sources/data-source-main): O banco de dados principal do NocoBase, que suporta bancos de dados relacionais como MySQL, PostgreSQL e MariaDB.
- [MySQL Externo](/data-sources/data-source-external-mysql): Use um banco de dados MySQL externo como uma fonte de dados.
- [MariaDB Externo](/data-sources/data-source-external-mariadb): Use um banco de dados MariaDB externo como uma fonte de dados.
- [PostgreSQL Externo](/data-sources/data-source-external-postgres): Use um banco de dados PostgreSQL externo como uma fonte de dados.
- [MSSQL Externo](/data-sources/data-source-external-mssql): Use um banco de dados MSSQL (SQL Server) externo como uma fonte de dados.
- [Oracle Externo](/data-sources/data-source-external-oracle): Use um banco de dados Oracle externo como uma fonte de dados.

Além disso, você pode estender para mais tipos através de plugins, que podem ser tipos comuns de bancos de dados ou plataformas que fornecem APIs (SDKs).

## Instalação

É um plugin integrado, então não é preciso instalá-lo separadamente.

## Instruções de Uso

Quando o aplicativo é inicializado e instalado, uma fonte de dados é fornecida por padrão para armazenar os dados do NocoBase, conhecida como banco de dados principal. Para mais informações, consulte a documentação do [Banco de Dados Principal](/data-sources/data-source-main/).

### Fontes de Dados Externas

Bancos de dados externos são suportados como fontes de dados. Para mais informações, consulte a documentação [Banco de Dados Externo / Introdução](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Suporte para Sincronização de Tabelas Criadas no Banco de Dados

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Você também pode acessar dados de fontes de API HTTP. Para mais informações, consulte a documentação [Fonte de Dados REST API](/data-sources/data-source-rest-api/).