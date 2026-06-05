---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Conectar Coleções de Dados Externos (FDW)

## Introdução

Este é um plugin que permite conectar a coleções de dados remotas, utilizando o recurso de foreign data wrapper (FDW) do banco de dados. Atualmente, ele oferece suporte a bancos de dados MySQL e PostgreSQL.

:::info{title="Conectando Fontes de Dados vs. Conectando Coleções de Dados Externos"}
- **Conectar fontes de dados** significa estabelecer uma conexão com um banco de dados ou serviço de API específico, permitindo que você utilize completamente os recursos do banco de dados ou os serviços oferecidos pela API;
- **Conectar coleções de dados externos** refere-se a obter dados de fontes externas e mapeá-los para uso local. Em bancos de dados, isso é conhecido como FDW (Foreign Data Wrapper), uma tecnologia que foca em tratar tabelas remotas como se fossem tabelas locais, mas que só permite a conexão de uma tabela por vez. Devido ao acesso remoto, existem diversas restrições e limitações durante o uso.

Ambos podem ser usados em conjunto: o primeiro para estabelecer a conexão com a fonte de dados, e o segundo para acesso entre diferentes fontes de dados. Por exemplo, você pode conectar-se a uma fonte de dados PostgreSQL onde uma de suas tabelas foi criada como uma coleção de dados externa baseada em FDW.
:::

### MySQL

O MySQL utiliza o motor `federated`, que precisa ser ativado. Ele suporta a conexão com bancos de dados MySQL remotos e outros bancos de dados compatíveis com o protocolo, como o MariaDB. Para mais detalhes, consulte a documentação do [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

No PostgreSQL, diferentes tipos de extensões `fdw` podem ser usadas para suportar diversos tipos de dados remotos. As extensões atualmente suportadas incluem:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Para conectar a um banco de dados PostgreSQL remoto a partir do PostgreSQL.
- [mysql_fdw (em desenvolvimento)](https://github.com/EnterpriseDB/mysql_fdw): Para conectar a um banco de dados MySQL remoto a partir do PostgreSQL.
- Para outros tipos de extensões fdw, consulte [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Para integrá-las ao NocoBase, você precisará implementar as interfaces de adaptação correspondentes no código.

## Instalação

Pré-requisitos

- Se o banco de dados principal do NocoBase for MySQL, você precisará ativar o motor `federated`. Consulte [Como ativar o motor federated no MySQL](./enable-federated.md).

Em seguida, instale e ative o plugin através do gerenciador de plugins.

![Instalar e ativar o plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Manual do Usuário

Em "Gerenciador de Coleções > Criar coleção", selecione "Conectar dados externos".

![Conectar Dados Externos](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

No menu suspenso "Serviço de Banco de Dados", selecione um serviço de banco de dados existente ou clique em "Criar Serviço de Banco de Dados".

![Serviço de Banco de Dados](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Criar um serviço de banco de dados

![Criar Serviço de Banco de Dados](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Após selecionar o serviço de banco de dados, no menu suspenso "Coleção Remota", escolha a coleção de dados que você deseja conectar.

![Selecionar a coleção de dados para conectar](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Configurar informações dos campos

![Configurar informações dos campos](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Se a coleção remota tiver alterações estruturais, você também pode "Sincronizar da coleção remota".

![Sincronizar da Coleção Remota](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sincronização da coleção remota

![Sincronização da coleção remota](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Por fim, visualize na interface.

![Visualizar na interface](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)