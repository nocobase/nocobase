---
'@nocobase/app-server': minor
'@nocobase/app-skills': patch
---

`cliRoute()` flags take `fromEnv: '<field>'`: the command then accepts `--from-env`, which fills that input from the caller's environment variable named by the value given for `<field>`, so a secret never sits on the command line or in shell history. A JSON input read through `--<name>-file` is now parsed as JSON rather than sent as text.
