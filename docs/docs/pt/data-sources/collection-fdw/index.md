---
pkg: "@nocobase/plugin-collection-fdw"
title: "Conectar tabelas de dados externas (FDW)"
description: "Conecte-se a tabelas de dados remotas com base no Foreign Data Wrapper, usando os mecanismos MySQL federated e PostgreSQL postgres_fdw, e mapeie tabelas remotas para uso como tabelas locais."
keywords: "FDW,Foreign Data Wrapper,federated,postgres_fdw,tabela externa,tabela remota,NocoBase"
---
# Conectar tabelas de dados externas (FDW)

## Introdução

Plugin de conexão a tabelas de dados remotas baseado na implementação de foreign data wrapper do banco de dados. Atualmente, oferece suporte aos bancos de dados MySQL e PostgreSQL.

:::info{title="Conectar uma fonte de dados vs. conectar uma tabela de dados externa"}
- **Conectar uma fonte de dados** significa estabelecer uma conexão com um banco de dados específico ou serviço de API, podendo utilizar integralmente os recursos do banco de dados ou os serviços fornecidos pela API;
- **Conectar uma tabela de dados externa** significa obter dados de uma fonte externa e mapeá-los para uso local. Nos bancos de dados, isso é chamado de FDW (Foreign Data Wrapper), uma tecnologia de banco de dados que permite usar tabelas remotas como tabelas locais, conectando apenas uma tabela por vez. Como o acesso é remoto, há várias restrições e limitações durante o uso.

As duas abordagens também podem ser usadas em conjunto: a primeira é usada para estabelecer a conexão com a fonte de dados, e a segunda, para acessar dados entre diferentes fontes. Por exemplo, depois de conectar uma determinada fonte de dados PostgreSQL, uma das tabelas dessa fonte pode ser uma tabela de dados externa criada com base em FDW.
:::

### MySQL

O MySQL usa o mecanismo `federated`, que precisa ser ativado, e oferece suporte à conexão com MySQL remoto e bancos de dados compatíveis com seu protocolo, como o MariaDB. Para mais informações, consulte a documentação [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

No PostgreSQL, diferentes tipos de extensões `fdw` podem ser usados para oferecer suporte a diferentes tipos de dados remotos. Atualmente, há suporte para as seguintes extensões:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): conecta-se a bancos de dados PostgreSQL remotos no PostgreSQL.
- [mysql_fdw (em desenvolvimento)](https://github.com/EnterpriseDB/mysql_fdw): conecta-se a bancos de dados MySQL remotos no PostgreSQL.
- Para outros tipos de extensões fdw, consulte [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Para integrá-las ao NocoBase, é necessário implementar a interface de adaptação correspondente no código.

## Instalação

Pré-requisitos

- Se o banco de dados principal do NocoBase for MySQL, será necessário ativar `federated`. Consulte [Como ativar o mecanismo federated no MySQL](./enable-federated.md)

Em seguida, instale e ative o plugin por meio do gerenciador de plugins

![Instalar e ativar o plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Manual do usuário

No menu suspenso「Gerenciamento de tabelas de dados > Criar tabela de dados」, selecione「Conectar dados externos」

![Conectar dados externos](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

No menu suspenso「Serviço de banco de dados」, selecione um serviço de banco de dados existente ou「Criar serviço de banco de dados」

![Serviço de banco de dados](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Criar serviço de banco de dados

![Criar serviço de banco de dados](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Depois de selecionar o serviço de banco de dados, no menu suspenso「Tabela remota」, selecione a tabela de dados à qual deseja se conectar.

![Selecionar a tabela de dados à qual deseja se conectar](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Configurar informações dos campos

![Configurar informações dos campos](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Se a tabela remota tiver alterações em sua estrutura, você também poderá「Sincronizar a partir da tabela remota」

![Sincronizar a partir da tabela remota](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sincronização da tabela remota

![Sincronização da tabela remota](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Por fim, ela será exibida na interface

![Exibir na interface](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)