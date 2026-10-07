# Database examples

The files in `migrations/` and `seeds/` end in `.ts.example`, so NocoBase does
not load or execute them.

To enable an example, remove only the final `.example` suffix:

```text
202609300001_projects_create_records.ts.example
202609300001_projects_create_records.ts

202609300002_projects_create_welcome_record.ts.example
202609300002_projects_create_welcome_record.ts
```

The exported `name` must match the filename without the executable extension.
If you rename an enabled `.ts` file, update its `name` as well.

The generated `server/plugin.ts` already declares both directories. Empty
directories and files ending in `.ts.example` contribute nothing, so the
default configuration is safe to keep:

```ts
database: {
  migrations: './database/migrations',
  seeds: './database/seeds',
},
```

The server plugin resolver ignores a configured directory when it is absent
(for example, when a published plugin has no enabled migrations), so no extra
configuration change is required when a directory has no executable files.
