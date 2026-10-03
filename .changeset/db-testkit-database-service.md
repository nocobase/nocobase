---
'@nocobase/db-testkit': minor
---

`@nocobase/db-testkit/integration-runner` exports `runWithDatabaseService()`, which starts a dialect's database in a disposable Compose project with a random name and published port, runs any command against it with the service address in its environment, and removes the project afterwards, as `runDatabaseIntegration()` does for the shared suite — now built on it. `DatabaseServiceOptions` describes the service and `DatabaseServiceCommandOptions` the command. The runner's messages say "tests" rather than "integration tests", since it also runs other packages' tests.
