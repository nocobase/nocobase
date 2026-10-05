# @nocobase/db-oceanbase

OceanBase CE dialect package for `@nocobase/db`.

```ts
import oceanbase from '@nocobase/db-oceanbase';
import { createDatabaseManager } from '@nocobase/db';

const database = createDatabaseManager({
  connections: {
    main: oceanbase({
      host: process.env.DB_HOST,
      port: 2881,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }),
  },
});
```

This package targets OceanBase CE's MySQL-compatible tenant. It uses the
`mysql2` protocol driver and Knex's MySQL client while keeping the database
dialect identity as `oceanbase`.

A text field's `defaultValue` is not stored in the table. OceanBase rejects a default on a TEXT column in every form, the literal one and MySQL's expression form `default ('…')`, so a Repository fills the default in when it creates a row, and a row inserted any other way has to give the column a value.
