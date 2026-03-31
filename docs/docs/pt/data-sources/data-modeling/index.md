:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral

A modelagem de dados é uma etapa fundamental no projeto de bancos de dados, que envolve um processo de análise aprofundada e abstração de diversos tipos de dados do mundo real e suas inter-relações. Nesse processo, buscamos revelar as conexões intrínsecas entre os dados e formalizá-las em modelos de dados, lançando as bases para a estrutura do banco de dados do sistema de informação. O NocoBase é uma plataforma orientada por modelos de dados, com as seguintes características:

## Suporta Acesso a Dados de Várias Fontes

As **fontes de dados** do NocoBase podem ser diversos tipos comuns de bancos de dados, plataformas de API (SDK) e arquivos.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

O NocoBase oferece um [**plugin** de gerenciamento de **fonte de dados**](/data-sources/data-source-manager) para gerenciar diversas **fontes de dados** e suas **coleções**. O **plugin** de gerenciamento de **fonte de dados** apenas oferece uma interface para administrar todas as **fontes de dados**, mas não fornece a capacidade de acessá-las diretamente. Ele precisa ser usado em conjunto com outros **plugins** de **fonte de dados**. As **fontes de dados** atualmente suportadas incluem:

- [Banco de Dados Principal](/data-sources/data-source-main): O banco de dados principal do NocoBase, que suporta bancos de dados relacionais como MySQL, PostgreSQL e MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Utiliza o banco de dados KingbaseES como **fonte de dados**, podendo ser usado tanto como banco de dados principal quanto como banco de dados externo.
- [MySQL Externo](/data-sources/data-source-external-mysql): Utiliza um banco de dados MySQL externo como **fonte de dados**.
- [MariaDB Externo](/data-sources/data-source-external-mariadb): Utiliza um banco de dados MariaDB externo como **fonte de dados**.
- [PostgreSQL Externo](/data-sources/data-source-external-postgres): Utiliza um banco de dados PostgreSQL externo como **fonte de dados**.
- [MSSQL Externo](/data-sources/data-source-external-mssql): Utiliza um banco de dados MSSQL (SQL Server) externo como **fonte de dados**.
- [Oracle Externo](/data-sources/data-source-external-oracle): Utiliza um banco de dados Oracle externo como **fonte de dados**.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Oferece uma Variedade de Ferramentas de Modelagem de Dados

**Interface simples de gerenciamento de coleções**: Usada para criar diversas **coleções** (modelos de dados) ou conectar-se a **coleções** existentes.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interface visual tipo Diagrama ER**: Usada para extrair entidades e seus relacionamentos a partir dos requisitos de usuários e de negócios. Ela oferece uma maneira intuitiva e fácil de entender para descrever modelos de dados. Através dos diagramas ER, você pode compreender mais claramente as principais entidades de dados no sistema e suas relações.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Suporta Vários Tipos de **Coleções**

| **Coleção** | Descrição |
| - | - |
| [**Coleção** Geral](/data-sources/data-source-main/general-collection) | Inclui campos de sistema comuns. |
| [**Coleção** de Calendário](/data-sources/calendar/calendar-collection) | Usada para criar **coleções** de eventos relacionadas a calendários. |
| **Coleção** de Comentários | Usada para armazenar comentários ou feedback sobre os dados. |
| [**Coleção** em Estrutura de Árvore](/data-sources/collection-tree) | **Coleção** com estrutura de árvore, atualmente suporta apenas o modelo de lista de adjacência. |
| [**Coleção** de Arquivos](/data-sources/file-manager/file-collection) | Usada para o gerenciamento de armazenamento de arquivos. |
| [**Coleção** SQL](/data-sources/collection-sql) | Não é uma **coleção** de banco de dados real, mas visualiza rapidamente consultas SQL de forma estruturada. |
| [Conectar a View de Banco de Dados](/data-sources/collection-view) | Conecta-se a views de banco de dados existentes. |
| **Coleção** de Expressões | Usada para cenários de expressões dinâmicas em **fluxos de trabalho**. |
| [Conectar Dados Externos](/data-sources/collection-fdw) | Permite que o sistema de banco de dados acesse e consulte dados diretamente em **fontes de dados** externas, com base na tecnologia FDW. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Para mais conteúdo, consulte a seção "[**Coleção** / Visão Geral](/data-sources/data-modeling/collection)".

## Oferece uma Rica Variedade de Tipos de Campo

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Para mais conteúdo, consulte a seção "[Campos da **Coleção** / Visão Geral](/data-sources/data-modeling/collection-fields)".