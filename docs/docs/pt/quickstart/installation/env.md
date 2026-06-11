# Configuração do aplicativo e `.env`

Esta página se aplica apenas a aplicativos criados ou hospedados por meio da CLI NocoBase.

Se você acabou de ler [Instalação usando CLI (recomendado)](./cli.md) e viu a seção "Diretório de instalação", os problemas mais comuns que você encontrará geralmente são os seguintes:

- Onde está colocado o arquivo `.env`?
- Quais configurações ainda são adequadas para serem gravadas em `.env`
- Quais configurações agora são mais adequadas para serem entregues a `nb env update`

Vamos falar sobre a conclusão primeiro:

- Para aplicativos CLI instalados, `.env` é colocado em `<app-path>/.env` por padrão
- Este arquivo é opcional, nem todo ambiente deve ser criado manualmente
- Configurações básicas como `APP_KEY`, `TZ`, `APP_PORT`, `APP_PUBLIC_PATH` e `DB_*` são gerenciadas por `nb env update` por padrão.
- `.env` é usado principalmente para complementar variáveis ​​de tempo de execução que a CLI não assumiu diretamente, como armazenamento, cache, logs, observações e algumas variáveis ​​de extensão de plug-in.

## Encontre `app-path` primeiro

Em [Instalar usando CLI (recomendado)](./cli.md#Installation directory), a estrutura de diretório padrão do CLI env é a seguinte:

```text
<app-path>/
├── source/
├── storage/
└── .env
```

Se você não tiver certeza de onde está o `app-path` atualmente aplicado, verifique diretamente:

```bash
nb env info app1 --field app.appPath
```

Basta substituir `app1` pelo nome do seu ambiente.

Ou seja, para uma aplicação criada ou hospedada via CLI, o local mais apropriado para o arquivo `.env` é:

```text
<app-path>/.env
```

De modo geral, não há necessidade de colocá-lo em `source/.env` e não há necessidade de encontrar `.env` no diretório raiz do projeto Docker Compose de acordo com o método de instalação antigo.

## Quando você precisa criar `.env` você mesmo?

`.env` é opcional.

Se você deseja apenas executar o aplicativo primeiro ou apenas modificar configurações básicas, como portas, fusos horários, conexões de banco de dados e caminhos de acesso público, em muitos casos não há necessidade de criar `.env` manualmente.

Adicione-os apenas a `<app-path>/.env` se precisar adicionar algumas variáveis ​​de tempo de execução que a CLI não assumiu diretamente.

## O padrão é usar `nb env update` primeiro

No novo método de instalação CLI, é recomendado que a configuração básica do aplicativo tenha prioridade para [`nb env update`](../../api/cli/env/update.md) por padrão.

Isso tem dois benefícios:

- A configuração e o próprio ambiente são salvos na mesma mente CLI, facilitando a verificação e modificação
- No futuro, vocês, scripts e agentes de IA poderão continuar usando o mesmo conjunto de comandos para manutenção, portanto não é fácil ter a situação de “um conjunto de alterações é feito no arquivo, mas outro conjunto é registrado na CLI”

### Essas configurações agora são mais adequadas para serem entregues a `nb env update`

Para os itens a seguir, você pode estar acostumado a escrevê-los diretamente em `.env` no passado. Entretanto, no modo de instalação CLI, é recomendado usar `nb env update` por padrão:

| Eu quero mudar... | Como alterar o padrão |
| --- | --- |
| `APP_KEY` | `nb env update <name> --app-key <value>` |
| `TZ` | `nb env update <name> --timezone <value>` |
| `APP_PORT` | `nb env update <name> --app-port <value>` |
| `APP_PUBLIC_PATH` | `nb env update <name> --app-public-path <value>` |
| `CDN_BASE_URL` | `nb env update <name> --cdn-base-url <value>` |
| Tipo de banco de dados e parâmetros de conexão, como `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` | `nb env update <name> --db-dialect ... --db-host ... --db-port ... --db-database ... --db-user ... --db-password ...` |
| Esquema PostgreSQL, prefixo de tabela, sublinhado nomeando itens suplementares do banco de dados, como `DB_SCHEMA`, `DB_TABLE_PREFIX`, `DB_UNDERSCORED` | `nb env update <name> --db-schema ... --db-table-prefix ... --db-underscored` |

Por exemplo, se quiser alterar a porta e o fuso horário do aplicativo, você pode escrever diretamente assim:

```bash
nb env update app1 --app-port 13080 --timezone Asia/Shanghai
```

Se quiser alterar os parâmetros de conexão do banco de dados, você pode escrever assim:

```bash
nb env update app1 \
  --db-dialect postgres \
  --db-host 127.0.0.1 \
  --db-port 5432 \
  --db-database nocobase \
  --db-user nocobase \
  --db-password nocobase
```

Depois de fazer as alterações, a CLI geralmente solicitará que você execute `nb app restart` mais tarde. Para uma descrição mais completa dos parâmetros, consulte [`nb env update`](../../api/cli/env/update.md).

## Quais situações são mais adequadas para serem escritas em `.env`

Se uma variável ainda não tiver um parâmetro CLI correspondente, ou for mais como uma configuração estendida "passada diretamente para o tempo de execução da aplicação", basta continuar a escrever `<app-path>/.env`.

Geralmente incluem estas categorias:

- Configurações de armazenamento de arquivos e armazenamento de objetos, como `LOCAL_STORAGE_*`, `AWS_S3_*`, `ALI_OSS_*`, `TX_COS_*`
- Configuração de cache e Redis, como `CACHE_*`, `REDIS_URL`
- Configurações de registro e observação, como `LOGGER_*`, `TELEMETRY_*`
- Determinadas variáveis específicas de plug-ins ou extensões, como exportação, tarefas assíncronas, fluxo de trabalho e variáveis relacionadas a extensões de IA

por exemplo:

```bash
LOCAL_STORAGE_DEST=storage/uploads
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
```

Esse tipo de variável é essencialmente uma configuração de tempo de execução do aplicativo e a CLI atualmente não assumirá o controle item por item. É mais natural colocá-lo em `.env`.

## Como dividir o trabalho entre `.env` e `nb env update`

Se você não tiver certeza de onde uma determinada configuração deve ir, basta seguir esta regra por padrão:

- Se `nb env update` já possui um parâmetro correspondente, ele será usado primeiro por padrão.
- Se não houver parâmetro correspondente ou se obviamente pertencer à configuração da extensão de tempo de execução, como plug-ins, armazenamento, cache e logs, coloque-o em `<app-path>/.env`

Na maioria dos cenários, esta divisão do trabalho é suficiente.

### Um mal-entendido comum

Não mantenha duas cópias da mesma configuração ao mesmo tempo.

Por exemplo, se você salvou itens básicos como `APP_PORT`, `TZ`, `APP_PUBLIC_PATH` e `DB_HOST` com `nb env update`, normalmente não será necessário escrevê-los novamente em `.env`. Caso contrário, ao solucionar problemas posteriormente, será fácil não saber qual camada é o valor que você realmente deseja que tenha efeito.

## Um exemplo mínimo de `.env`

Se sua configuração básica foi salva por meio da CLI, então `.env` provavelmente precisará reter apenas algumas variáveis ​​de extensão, como:

```bash
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
```

Esta é também a mentalidade que esta página mais deseja ajudar você a construir:

`.env` ainda é útil, mas no novo método de instalação CLI, trata-se mais de complementar a configuração da extensão de tempo de execução em vez de continuar a assumir todos os parâmetros básicos de instalação.

## Onde procurar em seguida

- Se você não confirmou a estrutura de diretórios do aplicativo, primeiro volte para [Instalar usando CLI (recomendado)](./cli.md#Installation directory)
- Se você deseja modificar configurações básicas como portas, fusos horários, conexões de banco de dados e caminhos de acesso público, continue em [`nb env update`](../../api/cli/env/update.md)
- Se você deseja iniciar, reiniciar ou visualizar os logs do aplicativo, continue em [Gerenciar aplicativo](../operations/manage-app.md)
