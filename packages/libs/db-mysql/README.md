# @nocobase/db-mysql

Mysql dialect package for `@nocobase/db`.

```ts
import mysql from '@nocobase/db-mysql';
import { createDatabaseManager } from '@nocobase/db';

const database = createDatabaseManager({
  connections: {
    main: mysql({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }),
  },
});
```

For declarative configurations, register `mysql` in `drivers`:

```ts
const database = createDatabaseManager({
  drivers: { mysql },
  connections: {
    main: { dialect: 'mysql', host: process.env.DB_HOST },
  },
});
```

## Text field defaults

A text field's `defaultValue` is written into the table in the expression form `default ('…')`, the only form MySQL accepts on a TEXT column. That form exists from MySQL 8.0.13: on an earlier server, creating or altering a Collection that gives a text field a default fails with a syntax error, where a column without a default is unaffected. MariaDB accepts the form from 10.2.1.

## MariaDB

This dialect also serves MariaDB, through the same `mysql` connection. MariaDB 10.11 is the oldest version it is tested against, and 10.9 the oldest it works with: the JSON field filters use `JSON_OVERLAPS`, which MariaDB added in 10.9 and MySQL in 8.0.17, so on MySQL too they need 8.0.17 or later. The schema inspector reads a column default the way the server reports it, which differs between the two — MySQL reports the bare value and MariaDB the literal as it was declared — and recognizes MariaDB from `version()`.

`pnpm --filter @nocobase/db-mysql test:integration` runs the integration suite against MySQL and then against MariaDB, one after the other, from the services in `docker-compose.yml`. It does not start MariaDB after an interrupted MySQL run, or while the MySQL database is kept by `KEEP_TEST_DB=1` or `--pause-on-failure`.
