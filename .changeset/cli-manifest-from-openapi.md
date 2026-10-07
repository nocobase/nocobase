---
'@nocobase/app-server': minor
---

Add an `x-cli` extension for `describeRoute()` (`cliRoute()`), `deriveCliCommands()` to build a command manifest from the API document, and `GET /api/cli/manifest`, which answers the caller's manifest once a plugin registers a caller resolver on `cliToken`. Every application's API document now lists the `Cli` operation `cliGetManifest`. A query parameter spelled `true` or `false` is a boolean flag on the command line, and a `POST` to a path that also answers `GET` is named `create`.
