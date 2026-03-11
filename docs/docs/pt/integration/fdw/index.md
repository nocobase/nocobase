:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/integration/fdw/index).
:::

# Conectar tabelas de dados externas (FDW)

## Introdução

Este recurso conecta tabelas de dados remotas com base no Foreign Data Wrapper (FDW) do banco de dados. Atualmente, ele suporta os bancos de dados MySQL e PostgreSQL.

:::info{title="Conectar fontes de dados vs. Conectar tabelas de dados externas"}
- **Conectar fontes de dados** refere-se a estabelecer uma conexão com um banco de dados específico ou serviço de API, permitindo que você use plenamente os recursos do banco de dados ou os serviços fornecidos pela API;
- **Conectar tabelas de dados externas** refere-se a obter dados externamente e mapeá-los para uso local. No banco de dados, isso é chamado de FDW (Foreign Data Wrapper), uma tecnologia de banco de dados focada em usar tabelas remotas como se fossem tabelas locais, permitindo conectar apenas uma tabela por vez. Por ser um acesso remoto, haverá várias restrições e limitações ao utilizá-lo.

Ambos também podem ser usados em conjunto. O primeiro é usado para estabelecer uma conexão com a fonte de dados, e o segundo é usado para acesso entre diferentes fontes de dados. Por exemplo, uma determinada fonte de dados PostgreSQL está conectada, e uma tabela específica nessa fonte de dados é uma tabela externa criada com base em FDW.
:::

### MySQL

O MySQL utiliza o mecanismo `federated`, que precisa ser ativado, e suporta a conexão com MySQL remoto e bancos de dados compatíveis com o protocolo, como o MariaDB. Para mais detalhes, consulte a documentação do [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

No PostgreSQL, diferentes tipos de extensões `fdw` podem ser usados para suportar diferentes tipos de dados remotos. As extensões suportadas atualmente incluem:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Conectar a um banco de dados PostgreSQL remoto no PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): Conectar a um banco de dados MySQL remoto no PostgreSQL.
- Para outros tipos de extensões fdw, consulte [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Você precisará implementar a interface de adaptação correspondente no código.

## Pré-requisitos

- Se o banco de dados principal do NocoBase for MySQL, você precisará ativar o `federated`. Consulte [Como ativar o mecanismo federated no MySQL](./enable-federated)

Em seguida, instale e ative o plugin através do gerenciador de plugins.

![Instalar e ativar o plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Manual do Usuário

Em "Gerenciador de coleções > Criar coleção", selecione "Conectar a dados externos" no menu suspenso.

![Conectar dados externos](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

No menu suspenso "Servidor de banco de dados", selecione um serviço de banco de dados existente ou "Criar servidor de banco de dados".

![Serviço de banco de dados](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Criar um servidor de banco de dados

![Criar serviço de banco de dados](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Após selecionar o servidor de banco de dados, no menu suspenso "Tabela remota", selecione a tabela de dados que você deseja conectar.

![Selecionar a tabela de dados que você deseja conectar](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Configurar informações dos campos

![Configurar informações dos campos](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Se a tabela remota tiver alterações estruturais, você também pode "Sincronizar da tabela remota".

![Sincronizar da tabela remota](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sincronização de tabela remota

![Sincronização de tabela remota](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Por fim, exibir na interface

![Exibir na interface](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)