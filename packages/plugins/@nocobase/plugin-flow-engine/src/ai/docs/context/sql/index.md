# ctx.sql

`ctx.sql` is the Flow SQL repository helper. It lets you save reusable SQL statements, run them inline, execute by ID, and delete snippets.

## API Highlights

- `ctx.sql.run(sql: string, bind?: Record<string, any>)`: execute ad-hoc SQL immediately.
- `ctx.sql.save({ uid, title?, sql })`: upsert a SQL snippet by ID (debug/development time).
- `ctx.sql.runById(uid, bind?)`: run a stored SQL statement by its uid.
- `ctx.sql.destroy(uid)`: remove a stored statement.
