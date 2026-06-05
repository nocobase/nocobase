:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Variáveis de Ambiente Globais

## TZ

Usada para definir o fuso horário da aplicação. O padrão é o fuso horário do sistema operacional.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Operações relacionadas a tempo serão processadas de acordo com este fuso horário. Modificar `TZ` pode afetar os valores de data no banco de dados. Para mais detalhes, consulte '[Visão Geral de Data e Hora](#)'
:::

## APP_ENV

Ambiente da aplicação. O valor padrão é `development`. As opções incluem:

- `production` - Ambiente de produção
- `development` - Ambiente de desenvolvimento

```bash
APP_ENV=production
```

## APP_KEY

A chave secreta da aplicação, usada para gerar tokens de usuário, entre outras coisas. Altere para sua própria chave da aplicação e certifique-se de que ela não seja divulgada.

:::warning
Se a `APP_KEY` for alterada, os tokens antigos se tornarão inválidos.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Porta da aplicação. O valor padrão é `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Prefixo do endereço da API do NocoBase. O valor padrão é `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Modo de inicialização multi-core (cluster). Se esta variável for configurada, ela será passada para o comando `pm2 start` como o parâmetro `-i <instances>`. As opções são consistentes com o parâmetro `-i` do pm2 (veja [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), incluindo:

- `max`: usa o número máximo de núcleos da CPU
- `-1`: usa o número máximo de núcleos da CPU menos 1
- `<number>`: especifica o número de núcleos

O valor padrão é vazio, o que significa que não está habilitado.

:::warning{title="Atenção"}
Este modo precisa ser usado com **plugins** relacionados ao modo de cluster, caso contrário, a funcionalidade da aplicação pode apresentar anomalias.
:::

Para mais informações, consulte: [Modo de Cluster](#).

## PLUGIN_PACKAGE_PREFIX

Prefixo do nome do pacote do **plugin**. O padrão é: `@nocobase/plugin-,@nocobase/preset-`.

Por exemplo, para adicionar o **plugin** `hello` ao projeto `my-nocobase-app`, o nome completo do pacote do **plugin** seria `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` pode ser configurado como:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

A relação entre os nomes dos **plugins** e os nomes dos pacotes é a seguinte:

- O nome do pacote para o **plugin** `users` é `@nocobase/plugin-users`
- O nome do pacote para o **plugin** `nocobase` é `@nocobase/preset-nocobase`
- O nome do pacote para o **plugin** `hello` é `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Tipo de banco de dados. As opções incluem:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Host do banco de dados (obrigatório ao usar bancos de dados MySQL ou PostgreSQL).

O valor padrão é `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Porta do banco de dados (obrigatório ao usar bancos de dados MySQL ou PostgreSQL).

- Porta padrão do MySQL e MariaDB: `3306`
- Porta padrão do PostgreSQL: `5432`

```bash
DB_PORT=3306
```

## DB_DATABASE

Nome do banco de dados (obrigatório ao usar bancos de dados MySQL ou PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Usuário do banco de dados (obrigatório ao usar bancos de dados MySQL ou PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Senha do banco de dados (obrigatório ao usar bancos de dados MySQL ou PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Prefixo da tabela.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Define se os nomes das tabelas e campos do banco de dados devem ser convertidos para o estilo *snake case*. O padrão é `false`. Se você estiver usando um banco de dados MySQL (MariaDB) e `lower_case_table_names=1`, então `DB_UNDERSCORED` deve ser `true`.

:::warning
Quando `DB_UNDERSCORED=true`, os nomes reais das tabelas e campos no banco de dados não serão consistentes com o que é visto na interface. Por exemplo, `orderDetails` no banco de dados será `order_details`.
:::

## DB_LOGGING

Chave de log do banco de dados. O valor padrão é `off`. As opções incluem:

- `on` - Ativado
- `off` - Desativado

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Transporte de saída de log. Múltiplos valores são separados por `,`. O valor padrão no ambiente de desenvolvimento é `console`, e no ambiente de produção é `console,dailyRotateFile`. Opções:

- `console` - `console.log`
- `file` - `Arquivo`
- `dailyRotateFile` - `Arquivo rotativo diário`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Caminho de armazenamento de log baseado em arquivo. O padrão é `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Nível de saída do log. O valor padrão no ambiente de desenvolvimento é `debug`, e no ambiente de produção é `info`. Opções:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

O nível de saída de log do banco de dados é `debug`, e se ele é exibido ou não é controlado por `DB_LOGGING`, não sendo afetado por `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Número máximo de arquivos de log a serem mantidos.

- Quando `LOGGER_TRANSPORT` é `file`, o valor padrão é `10`.
- Quando `LOGGER_TRANSPORT` é `dailyRotateFile`, use `[n]d` para representar os dias. O valor padrão é `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotacionar logs por tamanho.

- Quando `LOGGER_TRANSPORT` é `file`, a unidade é `byte`, e o valor padrão é `20971520 (20 * 1024 * 1024)`.
- Quando `LOGGER_TRANSPORT` é `dailyRotateFile`, você pode usar `[n]k`, `[n]m`, `[n]g`. Não configurado por padrão.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Formato de impressão do log. O padrão no ambiente de desenvolvimento é `console`, e no ambiente de produção é `json`. Opções:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Consulte: [Formato do Log](#)

## CACHE_DEFAULT_STORE

Identificador único para o método de armazenamento em cache a ser usado, especificando o armazenamento em cache padrão do lado do servidor. O valor padrão é `memory`. Opções integradas:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Número máximo de itens no cache em memória. O valor padrão é `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Conexão Redis, opcional. Exemplo: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Habilita a coleta de dados de telemetria. O padrão é `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Leitores de métricas de monitoramento habilitados. O padrão é `console`. Outros valores devem se referir aos nomes registrados dos **plugins** de leitor correspondentes, como `prometheus`. Múltiplos valores são separados por `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Processadores de dados de rastreamento (trace) habilitados. O padrão é `console`. Outros valores devem se referir aos nomes registrados dos **plugins** de processador correspondentes. Múltiplos valores são separados por `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```