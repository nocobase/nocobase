:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Variáveis de Ambiente

## Como configurar variáveis de ambiente?

### Método de instalação via código-fonte Git ou `create-nocobase-app`

Configure as variáveis de ambiente no arquivo `.env`, localizado na raiz do seu projeto. Após fazer qualquer alteração, você precisará encerrar o processo da aplicação e reiniciá-la.

### Método de instalação via Docker

Modifique a configuração do `docker-compose.yml` e defina as variáveis de ambiente no parâmetro `environment`. Exemplo:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Você também pode usar `env_file` para definir as variáveis de ambiente em um arquivo `.env`. Exemplo:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Após modificar as variáveis de ambiente, você precisará reconstruir o contêiner da aplicação:

```yml
docker compose up -d app
```

## Variáveis de Ambiente Globais

### TZ

Usada para definir o fuso horário da aplicação. Por padrão, ela utiliza o fuso horário do sistema operacional.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Operações relacionadas a tempo serão processadas de acordo com este fuso horário. Alterar a variável TZ pode afetar os valores de data no banco de dados. Para mais detalhes, consulte a [Visão Geral de Data e Hora](/data-sources/data-modeling/collection-fields/datetime).
:::

### APP_ENV

Ambiente da aplicação. O valor padrão é `development`, e as opções disponíveis incluem:

- `production` ambiente de produção
- `development` ambiente de desenvolvimento

```bash
APP_ENV=production
```

### APP_KEY

A chave secreta da aplicação, utilizada para gerar tokens de usuário e outras operações. Altere-a para sua própria chave e garanta que ela não seja vazada.

:::warning
Se a `APP_KEY` for alterada, os tokens antigos se tornarão inválidos.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Porta da aplicação. O valor padrão é `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Prefixo do endereço da API do NocoBase. O valor padrão é `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Modo de inicialização multi-core (cluster). Se esta variável for configurada, ela será passada para o comando `pm2 start` como o parâmetro `-i <instances>`. As opções são consistentes com o parâmetro `-i` do pm2 (consulte [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), incluindo:

- `max`: Usa o número máximo de núcleos da CPU.
- `-1`: Usa o número máximo de núcleos da CPU menos um.
- `<number>`: Especifica o número de núcleos.

O valor padrão é vazio, o que significa que o modo não está ativado.

:::warning{title="Atenção"}
Este modo requer o uso de plugins relacionados ao modo de cluster. Caso contrário, a funcionalidade da aplicação pode apresentar problemas inesperados.
:::

Para mais informações, consulte: [Modo de Cluster](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Prefixo do nome do pacote do **plugin**. O padrão é `@nocobase/plugin-,@nocobase/preset-`.

Por exemplo, para adicionar o **plugin** `hello` ao projeto `my-nocobase-app`, o nome completo do pacote do **plugin** seria `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` pode ser configurado como:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

A correspondência entre o nome do **plugin** e o nome do pacote é a seguinte:

- O nome do pacote do **plugin** `users` é `@nocobase/plugin-users`.
- O nome do pacote do **plugin** `nocobase` é `@nocobase/preset-nocobase`.
- O nome do pacote do **plugin** `hello` é `@my-nocobase-app/plugin-hello`.

### DB_DIALECT

Tipo de banco de dados. As opções disponíveis incluem:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Host do banco de dados (obrigatório ao usar bancos de dados MySQL ou PostgreSQL).

O valor padrão é `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Porta do banco de dados (obrigatória ao usar bancos de dados MySQL ou PostgreSQL).

- A porta padrão para MySQL e MariaDB é `3306`.
- A porta padrão para PostgreSQL é `5432`.

```bash
DB_PORT=3306
```

### DB_DATABASE

Nome do banco de dados (obrigatório ao usar bancos de dados MySQL ou PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Usuário do banco de dados (obrigatório ao usar bancos de dados MySQL ou PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Senha do banco de dados (obrigatória ao usar bancos de dados MySQL ou PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Prefixo das tabelas de dados.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Define se os nomes das tabelas e campos do banco de dados devem ser convertidos para o estilo *snake case*. O valor padrão é `false`. Se você estiver usando um banco de dados MySQL (MariaDB) e `lower_case_table_names=1`, então `DB_UNDERSCORED` deve ser `true`.

:::warning
Quando `DB_UNDERSCORED=true`, os nomes reais das tabelas e campos no banco de dados não corresponderão ao que é exibido na interface do usuário. Por exemplo, `orderDetails` será armazenado como `order_details` no banco de dados.
:::

### DB_LOGGING

Chave para ativar o log do banco de dados. O valor padrão é `off`, e as opções incluem:

- `on` (ligado)
- `off` (desligado)

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Número máximo de conexões no pool do banco de dados. O valor padrão é `5`.

### DB_POOL_MIN

Número mínimo de conexões no pool do banco de dados. O valor padrão é `0`.

### DB_POOL_IDLE

Tempo máximo, em milissegundos, que uma conexão pode ficar ociosa antes de ser liberada do pool. O valor padrão é `10000` (10 segundos).

### DB_POOL_ACQUIRE

Tempo máximo, em milissegundos, que o pool tentará obter uma conexão antes de gerar um erro. O valor padrão é `60000` (60 segundos).

### DB_POOL_EVICT

Intervalo de tempo, em milissegundos, após o qual o pool de conexões removerá as conexões ociosas. O valor padrão é `1000` (1 segundo).

### DB_POOL_MAX_USES

O número de vezes que uma conexão pode ser usada antes de ser descartada e substituída. O valor padrão é `0` (ilimitado).

### LOGGER_TRANSPORT

Método de saída de log. Múltiplos valores são separados por `,`. O padrão é `console` em ambiente de desenvolvimento e `console,dailyRotateFile` em produção. Opções:

- `console` - `console.log`
- `file` - Saída para um arquivo
- `dailyRotateFile` - Saída para arquivos rotativos diários

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Caminho de armazenamento dos logs baseados em arquivo. O valor padrão é `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Nível de saída do log. O padrão é `debug` em ambiente de desenvolvimento e `info` em produção. Opções:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

O nível de saída do log do banco de dados é `debug`, controlado por `DB_LOGGING`, e não é afetado por `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Número máximo de arquivos de log a serem mantidos.

- Quando `LOGGER_TRANSPORT` for `file`: O valor padrão é `10`.
- Quando `LOGGER_TRANSPORT` for `dailyRotateFile`: Use `[n]d` para representar o número de dias. O valor padrão é `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Rotação de log por tamanho.

- Quando `LOGGER_TRANSPORT` for `file`: A unidade é `byte`. O valor padrão é `20971520 (20 * 1024 * 1024)`.
- Quando `LOGGER_TRANSPORT` for `dailyRotateFile`: Você pode usar `[n]k`, `[n]m`, `[n]g`. Não há configuração padrão.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Formato de impressão do log. O padrão é `console` em ambiente de desenvolvimento e `json` em produção. Opções:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Referência: [Formato do Log](/log-and-monitor/logger/index.md#formato-do-log)

### CACHE_DEFAULT_STORE

Identificador único para o método de cache, especificando o cache padrão do servidor. O valor padrão é `memory`, e as opções integradas incluem:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Número máximo de itens no cache em memória. O valor padrão é `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

URL de conexão do Redis, opcional. Exemplo: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Ativa a coleta de dados de telemetria. O padrão é `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Coletores de métricas de monitoramento ativados. O padrão é `console`. Outros valores devem se referir aos nomes registrados pelos **plugins** coletores correspondentes, como `prometheus`. Múltiplos valores são separados por `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Processadores de dados de rastreamento ativados. O padrão é `console`. Outros valores devem se referir aos nomes registrados pelos **plugins** processadores correspondentes. Múltiplos valores são separados por `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Variáveis de Ambiente Experimentais

### APPEND_PRESET_LOCAL_PLUGINS

Usada para anexar **plugins** locais predefinidos e não ativados. O valor é o nome do pacote do **plugin** (o parâmetro `name` no `package.json`), com múltiplos **plugins** separados por vírgulas.

:::info
1. Certifique-se de que o **plugin** foi baixado localmente e pode ser encontrado no diretório `node_modules`. Para mais detalhes, consulte [Estrutura do Projeto de Plugins](/plugin-development/project-structure).
2. Após adicionar a variável de ambiente, o **plugin** só aparecerá na página do gerenciador de **plugins** após uma instalação inicial (`nocobase install`) ou uma atualização (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Usada para anexar **plugins** integrados que são instalados por padrão. O valor é o nome do pacote do **plugin** (o parâmetro `name` no `package.json`), com múltiplos **plugins** separados por vírgulas.

:::info
1. Certifique-se de que o **plugin** foi baixado localmente e pode ser encontrado no diretório `node_modules`. Para mais detalhes, consulte [Estrutura do Projeto de Plugins](/plugin-development/project-structure).
2. Após adicionar a variável de ambiente, o **plugin** será automaticamente instalado ou atualizado durante a instalação inicial (`nocobase install`) ou a atualização (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Variáveis de Ambiente Temporárias

Ao instalar o NocoBase, você pode usar variáveis de ambiente temporárias para auxiliar na instalação, por exemplo:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Equivalente a
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Equivalente a
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Idioma durante a instalação. O valor padrão é `en-US`, e as opções incluem:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

E-mail do usuário Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Senha do usuário Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Apelido do usuário Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```