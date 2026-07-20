---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "Fonte de dados externa - Oracle"
description: "Saiba como conectar o Oracle ao NocoBase como banco de dados externo, incluindo versões compatíveis, instalação do plugin, modos de conexão Thin/Thick, Client directory, permissões e mapeamento de campos."
keywords: "fonte de dados externa,Oracle,banco de dados externo,Thin,Thick,Client directory,mapeamento de campos,NocoBase"
---

# Oracle

## Introdução

O Oracle pode ser conectado ao NocoBase como banco de dados externo. Após a conexão, o NocoBase lê as tabelas, os campos e as views do Oracle e os utiliza como tabelas de dados na fonte de dados externa.

Diferentemente do [banco de dados principal](../main/index.md), a estrutura real das tabelas do Oracle externo continua sendo mantida pelo sistema de negócios original, pelo cliente de banco de dados ou por scripts de migração. O NocoBase é responsável por ler a estrutura, salvar os metadados dos campos e configurar blocos de página, permissões, workflows e APIs.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | Oracle >= 11g. |
| Versão comercial | Compatível com a edição Enterprise. |
| Plugin correspondente | `@nocobase/plugin-data-source-external-oracle`. |
| Modo de conexão | As versões Oracle Database 12.1 e posteriores normalmente usam o modo Thin; versões anteriores à 12.1 usam o modo Thick. |

Cenários adequados para usar o Oracle externo:

- Conectar bancos de dados Oracle de sistemas de negócios existentes, como ERP, MES, WMS e CRM
- Criar uma interface de gerenciamento com o NocoBase sem migrar dados históricos
- Aplicar controle de permissões, processamento de workflows, correção de dados ou exibição de relatórios em tabelas existentes
- Continuar mantendo a estrutura do banco de dados por DBAs, scripts de migração ou pelo sistema original

:::warning Atenção

O Oracle externo não é o banco de dados do sistema do NocoBase. O NocoBase não assume o controle do backup, da restauração, da migração nem das alterações na estrutura das tabelas.

:::

## Instalação do plugin

Este plugin é comercial. Para conhecer o método detalhado de ativação, consulte: [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

Se o modo de conexão selecionado for Thick, será necessário instalar as bibliotecas do Oracle Client no ambiente de execução do NocoBase e preencher o «Client directory» na configuração da fonte de dados.

## Instalação do cliente Oracle

As versões Oracle Database 12.1 e posteriores normalmente usam o modo Thin e não exigem a instalação adicional do Oracle Client. Só é necessário instalar as bibliotecas do Oracle Client no ambiente de execução do NocoBase quando você se conecta a uma versão anterior ao Oracle Database 12.1 ou quando é obrigatório usar o modo Thick.

Depois de selecionar o modo «Thick» na configuração da fonte de dados, confirme que a máquina onde o serviço do NocoBase está em execução consegue carregar o Oracle Client.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Em ambientes Linux, você pode consultar o método abaixo para instalar o Oracle Instant Client:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Se o Oracle Client não estiver instalado em um local que possa ser carregado por padrão pelo sistema, preencha o diretório das bibliotecas do cliente em «Client directory». Por exemplo, para o método de instalação acima, o diretório correspondente é `/opt/instantclient_19_25`.

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

:::tip Dica

`Client directory` só precisa ser configurado no modo Thick. O modo Thin não utiliza essa configuração. Para obter mais informações sobre as regras de inicialização, consulte a [documentação de inicialização do node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html).

:::

## Adicionar fonte de dados

Em «Gerenciamento de fontes de dados», clique em «Add new», selecione Oracle e preencha as informações de conexão.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Configurações de conexão comuns:

| Configuração | Descrição |
| --- | --- |
| Data source name | Nome de identificação da fonte de dados, usado para referência em blocos de página, permissões, workflows e APIs. Não pode ser alterado após a criação. |
| Data source display name | Nome exibido da fonte de dados na interface. Recomenda-se usar um nome que os usuários de negócio possam entender, como «ERP Oracle» ou «Banco financeiro». |
| Host / Port | Endereço e porta do host Oracle. A porta padrão normalmente é `1521`. |
| ServerName | Nome do serviço Oracle. Preencha o service name configurado no listener do banco de dados. |
| Username / Password | Nome de usuário e senha usados para conectar ao Oracle. O NocoBase lê as tabelas e views pertencentes ao Owner dessa conta e não concede acesso nem lê objetos pertencentes a outros Owners. |
| Connection mode | Modo de conexão do Oracle. As versões Oracle Database 12.1 e posteriores normalmente usam o modo Thin; versões anteriores à 12.1 usam o modo Thick. |
| Client directory | Diretório das bibliotecas do Oracle Client no modo Oracle Thick. Só precisa ser configurado quando o modo Thick é selecionado. |
| Table prefix | Prefixo do nome das tabelas. Após configurado, o NocoBase lê apenas as tabelas e views que correspondem a esse prefixo e gera no NocoBase nomes de tabelas sem o prefixo. |
| Collections / Add all collections | Controla o escopo da conexão. Quando «Add all collections» está ativado, o NocoBase conecta todas as tabelas e views dentro do Owner e do escopo do prefixo atuais; quando desativado, conecta apenas os objetos selecionados em «Collections». |
| Enabled the data source | Define se a fonte de dados está ativada. Quando desativada, a configuração da fonte de dados é mantida, mas os blocos de página, as permissões, os workflows e as APIs não podem continuar lendo seus dados. |

:::tip Dica

O escopo de conexão no Oracle é determinado principalmente pelo Owner da conta de conexão, por `Table prefix` e por «Collections». Se houver muitos objetos na mesma instância, recomenda-se usar uma conta dedicada para conectar o schema necessário ao negócio, reduzindo a entrada de objetos irrelevantes no NocoBase.

:::

## Selecionar tabelas de dados

Depois de preencher as informações de conexão, você pode clicar em «Load Collections» para ler as tabelas de dados e views disponíveis no Oracle. Os resultados da leitura são afetados pelo Owner da conta de conexão, por `Table prefix` e pela configuração de «Collections».

Por padrão, «Add all collections» fica ativado, indicando que todas as tabelas e views dentro do escopo atual serão conectadas. Se quiser conectar apenas parte dos objetos, desative «Add all collections» e marque na lista as tabelas de dados ou views necessárias.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Atenção

Uma única fonte de dados externa pode conectar no máximo 500 tabelas de dados ou views por vez. Se houver muitos objetos no Oracle, recomenda-se restringir primeiro o escopo por meio do Owner da conta de conexão, de `Table prefix` ou de «Collections».

:::

## Sincronizar e configurar campos

A estrutura das tabelas do Oracle externo é mantida no lado do banco de dados. O NocoBase não cria campos, altera tipos de campos nem exclui campos reais no Oracle externo.

Quando a estrutura das tabelas no Oracle for alterada, você pode executar «Sync from database» na fonte de dados para reler os metadados das tabelas e dos campos. A sincronização atualiza as informações salvas no NocoBase sobre tabelas de dados, campos, chaves primárias, chaves únicas e mapeamentos de tipos de campos, mas não exclui as tabelas ou os dados reais no Oracle.

Após a sincronização dos campos, você pode configurar no NocoBase o título do campo, o tipo de campo (Field type) e o componente do campo (Field interface). Se precisar criar campos de relacionamento do NocoBase, os metadados do relacionamento também serão salvos no NocoBase; nenhum campo de chave estrangeira real será adicionado automaticamente às tabelas do Oracle.

## Mapeamento de tipos de campos

O NocoBase mapeia automaticamente os tipos de campos do Oracle para o Field type e o Field interface adequados. Você pode ajustar a forma de exibição na interface na configuração do campo.

Mapeamentos comuns:

| Tipo de campo Oracle | NocoBase Field type | Field interface disponível |
| --- | --- | --- |
| `NUMBER` | `integer`、`float`、`boolean`、`bigInt`、`unixTimestamp`、`sort` | Integer、Number、Sort、Checkbox、Switch、Select、Radio group。 |
| `BINARY_FLOAT`、`BINARY_DOUBLE`、`FLOAT` | `float` | Number、Percent。 |
| `INTEGER`、`SMALLINT`、`PLSQL_INTEGER` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `CHAR`、`NCHAR`、`VARCHAR2`、`NVARCHAR2` | `string`、`uuid`、`nanoid`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `LONG`、`NCLOB` | `string`、`text` | Input、Textarea、Markdown、Vditor、Rich text。 |
| `CLOB` | `string` | Input、Textarea、Rich text。 |
| `DATE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE`、`TIMESTAMP WITH LOCAL TIME ZONE` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `ROWID`、`UROWID` | `string`、`text`、`integer` | Input、Textarea、Integer。 |
| `JSON` | `json` | JSON。 |

:::warning Atenção

`BLOB`、`BFILE` e outros tipos de objetos binários não são usados automaticamente como campos de arquivo comuns. Se for necessário gerenciar anexos nas páginas, geralmente recomenda-se usar uma tabela de arquivos ou um campo de anexo no NocoBase para salvar os metadados dos arquivos.

:::

## Chave primária e identificador exclusivo do registro

Recomenda-se que as tabelas de dados usadas para exibição e edição em blocos de página tenham uma chave primária ou um campo exclusivo. O NocoBase prioriza o uso da chave primária como identificador exclusivo do registro.

Se a conexão for com uma view, uma tabela sem chave primária ou uma tabela com chave primária composta, será necessário definir manualmente «Record unique key» na configuração da tabela de dados. Sem um identificador exclusivo disponível, os blocos de página poderão não conseguir visualizar, editar ou excluir registros corretamente.

![20260709210948](https://static-docs.nocobase.com/20260709210948.png)
![20260709211004](https://static-docs.nocobase.com/20260709211004.png)

## Links relacionados

- [Banco de dados externo](./index.md) — Consulte as instruções gerais de configuração e gerenciamento de bancos de dados externos
- [Gerenciamento de fontes de dados](../data-source-manager/index.md) — Consulte a entrada das fontes de dados e os métodos de gerenciamento
- [Campos de tabelas de dados](../data-modeling/collection-fields/index.md) — Consulte as instruções sobre tipos e mapeamentos de campos
- [Documentação de inicialização do node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) — Consulte como carregar as bibliotecas do Oracle Client