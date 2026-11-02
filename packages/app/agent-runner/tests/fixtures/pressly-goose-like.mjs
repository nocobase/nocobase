#!/usr/bin/env node
// Stands in for the unrelated `pressly/goose` database migration CLI, whose documented --help output this test
// checks the real goose catalog entry's identify.reject pattern against. Not vendor output, a synthetic sample of
// the subcommands and flags that project's own docs list.
console.log(`Usage: goose [OPTIONS] DRIVER DBSTRING COMMAND

Drivers:
    postgres
    sqlite3

Commands:
    up                   Migrate the DB to the most recent version available
    up-by-one            Migrate the DB up by 1
    down                 Roll back the version by 1
    status               Dump the migration status for the current DB
    create NAME [sql|go] Creates new migration file with the current timestamp
    version              Print the current version of the database

Options:
    -dir string
          directory with migration files
`);
