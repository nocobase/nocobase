# @nocobase/app-cli-client

A command line for a NocoBase application, branded by the application: it signs in to a server and runs the business commands the server's command manifest (`GET /api/cli/manifest`) publishes for the caller, each a request to one API route. An application declares its brand under `nocobase.cli` in its `package.json` (`AppCliBrand`), and `nocobase cli build` and `nocobase cli link` of `@nocobase/app-cli` package it with an entry that calls `runAppCliPackage`, which reads the brand back from the packaged CLI's own `package.json` and runs it with `selfUpdate` on; an application's `acme` is made this way. A CLI may instead call `runAppCli` with an `AppCliConfig` of its own and add static commands.

```ts
import { runAppCli } from '@nocobase/app-cli-client';

await runAppCli(
  {
    bin: 'acme',
    displayName: 'Acme',
    stateDir: '.acme',
    homeEnv: 'ACME_HOME',
    envPrefix: 'ACME',
    runCredentialsFile: '.acme/run.json',
  },
  process.argv.slice(2),
);
```

An application whose install script (`/api/agents/dist/installScript` of `@nocobase/app-plugin-agents`) installs its CLI names `selfUpdate` in the configuration, with the root of the CLI's package as it runs (`packageRoot`). The CLI then has `<bin> update`, which asks the signed-in server for the newest version it serves for this platform (`selfUpdate.product`, the command name by default), checks its SHA-256 and switches `<prefix>/current` to it, keeping the previous version; business commands and `login` say on stderr when a newer version is served, asking at most every 12 hours (`<state dir>/cache/update.json`). An installation the script made for the runner (`install.json` `mode: runner`) is the runner's, which updates itself, so `update` refuses it. `@nocobase/app-cli-client/install` is that installation layout (`<prefix>/versions/<version>`, `current`, `install.json`) and the update itself, without reading any CLI configuration, so a runner shares it.

`@nocobase/app-cli-client/request` exports `fillRequest`, which turns a manifest command and the values of its parameters into the request it makes. It imports nothing else, so a server that calls its own routes the way the CLI does, such as an online agent's tools in `@nocobase/app-plugin-agents`, builds the same request.

`@nocobase/app-cli-client/parse` is how the CLI reads a business command's line, with no file, environment or terminal of its own: `parseCommandLine(command, argv, { bin, io })` takes a manifest command and the words after its name, and answers the values of its parameters, the body read from `--file` and the files to send, or throws a `CliParseError` carrying the cli-envelope's `code`, message, suggestions and exit code. The `io` (`CliParseIo`) reads text files and environment variables, and optionally finds files to send (`file`, `changed`) and asks for a missing value (`ask`); a flag that sends a file is refused with `FILES_UNAVAILABLE` where `file` is absent. It also renders a command's help and an area's command list from the manifest (`renderCommandHelp`, `renderTopicHelp`) and maps a failed request to the CLI's exit code (`apiExitCode`). The CLI uses it over this machine, and the `acme` command of an online run's shell in `@nocobase/app-plugin-agents` over that shell, so both read a line the same way.
