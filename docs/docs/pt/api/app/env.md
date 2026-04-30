---
title: "Variáveis de ambiente globais"
description: "Variáveis de ambiente do NocoBase: descrição das opções de configuração TZ, APP_KEY, DB e outras."
keywords: "variáveis de ambiente,APP_KEY,TZ,configuração,NocoBase"
---

# Variáveis de ambiente globais

## TZ

Usada para definir o fuso horário da aplicação. O padrão é o fuso horário do sistema operacional.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Operações relacionadas a tempo serão processadas de acordo com este fuso horário. Alterar TZ pode afetar valores de data no banco de dados. Para mais detalhes, consulte "[Visão geral de Data e Hora](#)".
:::

## APP_ENV

Ambiente da aplicação. Valor padrão `development`. Opções disponíveis:

- `production` ambiente de produção
- `development` ambiente de desenvolvimento

```bash
APP_ENV=production
```

## APP_KEY

Chave secreta da aplicação, usada para gerar tokens de usuário, entre outros. Altere-a para sua própria chave e garanta que ela não seja exposta.

:::warning
Se a APP_KEY for alterada, os tokens antigos também perderão validade.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Porta da aplicação. Valor padrão `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Prefixo do endereço da API do NocoBase. Valor padrão `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Modo de inicialização multi-core (cluster). Quando esta variável for configurada, será repassada ao comando `pm2 start` como o argumento `-i <instances>`. As opções são as mesmas do parâmetro `-i` do pm2 (consulte [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), incluindo:

- `max`: usa o número máximo de núcleos da CPU
- `-1`: usa o número máximo de núcleos da CPU menos 1
- `<number>`: especifica o número de núcleos

O valor padrão é vazio, o que significa que está desativado.

:::warning{title="Atenção"}
Este modo precisa ser usado em conjunto com Plugins relacionados ao modo cluster. Caso contrário, as funcionalidades da aplicação podem apresentar comportamento inesperado.
:::

Para mais informações, consulte: [Modo Cluster](#).

## PLUGIN_PACKAGE_PREFIX

Prefixo dos nomes de pacotes de Plugin. O padrão é `@nocobase/plugin-,@nocobase/preset-`.

Por exemplo, ao adicionar o Plugin `hello` ao projeto `my-nocobase-app`, o nome completo do pacote do Plugin será `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX pode ser configurado como:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

A correspondência entre o nome do Plugin e o nome do pacote ficará assim:

- O Plugin `users` tem como pacote `@nocobase/plugin-users`
- O Plugin `nocobase` tem como pacote `@nocobase/preset-nocobase`
- O Plugin `hello` tem como pacote `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Tipo de banco de dados. Opções disponíveis:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Host do banco de dados (obrigatório ao usar MySQL ou PostgreSQL).

Valor padrão `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Porta do banco de dados (obrigatória ao usar MySQL ou PostgreSQL).

- Porta padrão de MySQL e MariaDB: 3306
- Porta padrão de PostgreSQL: 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Nome do banco de dados (obrigatório ao usar MySQL ou PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Usuário do banco de dados (obrigatório ao usar MySQL ou PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Senha do banco de dados (obrigatória ao usar MySQL ou PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Prefixo das tabelas do banco de dados.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Define se nomes de tabelas e colunas do banco serão convertidos para o estilo snake_case. O padrão é `false`. Se você usa MySQL (MariaDB) com `lower_case_table_names=1`, então DB_UNDERSCORED deve ser `true`.

:::warning
Quando `DB_UNDERSCORED=true`, os nomes reais de tabelas e colunas no banco diferem dos exibidos na UI. Por exemplo, `orderDetails` aparece no banco como `order_details`.
:::

## DB_LOGGING

Liga/desliga o log do banco de dados. Valor padrão `off`. Opções disponíveis:

- `on` ligado
- `off` desligado

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Forma de saída do log. Vários valores podem ser separados por `,`. No ambiente de desenvolvimento o padrão é `console`; em produção o padrão é `console,dailyRotateFile`.
Opções disponíveis:

- `console` - `console.log`
- `file` - arquivo
- `dailyRotateFile` - arquivo rotacionado diariamente

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Caminho de armazenamento dos logs em arquivo. O padrão é `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Nível de log de saída. No ambiente de desenvolvimento o padrão é `debug`; em produção, `info`. Opções disponíveis:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

O nível dos logs do banco de dados é `debug`. A saída é controlada por `DB_LOGGING` e não é afetada por `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Número máximo de arquivos de log a manter.

- Quando `LOGGER_TRANSPORT` é `file`, o padrão é `10`.
- Quando `LOGGER_TRANSPORT` é `dailyRotateFile`, use `[n]d` para representar dias. O padrão é `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotaciona o log por tamanho.

- Quando `LOGGER_TRANSPORT` é `file`, a unidade é `byte`. O padrão é `20971520 (20 * 1024 * 1024)`.
- Quando `LOGGER_TRANSPORT` é `dailyRotateFile`, é possível usar `[n]k`, `[n]m`, `[n]g`. Sem padrão definido.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Formato de impressão do log. No ambiente de desenvolvimento o padrão é `console`; em produção, `json`. Opções disponíveis:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Referência: [Formato de log](#)

## CACHE_DEFAULT_STORE

Identificador único da estratégia de cache, usado para definir o cache padrão do servidor. Valor padrão `memory`. Opções nativas:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Número máximo de itens no cache em memória. Valor padrão `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Conexão Redis (opcional). Exemplo: `redis://localhost:6379`.

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Liga a coleta de dados de telemetria. O padrão é `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Coletores de métricas habilitados. O padrão é `console`. Outros valores devem corresponder ao nome registrado pelo Plugin de coletor correspondente, por exemplo `prometheus`. Vários valores são separados por `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Processadores de dados de tracing habilitados. O padrão é `console`. Outros valores devem corresponder ao nome registrado pelo Plugin processador. Vários valores são separados por `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```
