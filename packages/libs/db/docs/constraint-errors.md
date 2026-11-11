# Constraint error recognition

Import `isUniqueConstraintViolation(error)` from `@nocobase/db` to recognize duplicate-key failures before recovering an idempotent insert or retrying a conflicting transaction. The helper follows `cause` and `originalError` wrappers, terminates on cycles, and recognizes PostgreSQL, MySQL, SQLite extended unique/primary-key codes, Oracle, SQL Server and Dameng driver codes. It does not match error messages. Generic SQLite constraint errors are insufficient evidence of a duplicate key and return false; foreign-key and not-null failures must propagate.

```ts
import { isUniqueConstraintViolation } from '@nocobase/db';

try {
  await insert();
} catch (error) {
  if (!isUniqueConstraintViolation(error)) throw error;
  await recoverExistingRecord();
}
```
