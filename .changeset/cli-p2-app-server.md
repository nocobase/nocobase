---
'@nocobase/app-server': minor
---

An application keeps documented operations off its command line with `exclude({ tags, paths, operationIds })` on `cliToken`. `cliRoute()` takes `ticketUpload`, a file streamed to the upload ticket the route answers, and `changedFiles`, the changed files of a directory on the caller's machine sent as multipart parts; the manifest describes both as `in: 'file'` parameters (`ticket`, `changed`). The manifest route's `security` lists every identity scheme the document declares, such as an agent's run token. `ApiDocsService.addTransform()` changes each generated document after its fragments are merged.

The manifest (version 3) lists only the API document's operations: `CliService.addCommands()`, `CliCommandSource` and the commands' `kind` and `custom` members are removed, and `manifestFor()` answers synchronously. `declaredRouteActionOf(context)` reads the business action a route names in `x-cli`, and `declaredRouteOf()` now reads only the route that answers, so a fixed path beside a parameter that also matches it (`/agents/available` beside `/agents/{agentId}`) keeps its own declaration and security.
