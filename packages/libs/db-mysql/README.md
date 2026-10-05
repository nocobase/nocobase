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
