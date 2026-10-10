---
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Answer to `db rollback`, `db redo`, `db unlock` and `db doctor`, and stop making every shared command re-export itself from its own file.

The four commands were added to the map `@nocobase/app-cli` hands an application, but `cli/commands/index.ts` is what the CLI actually loads, and it listed each shared command separately. A command present in the first and missing from the second answers to nothing: `pnpm db:doctor` reported `Command app:db:doctor not found`, and so did the other three. The test that was supposed to cover this asserted the wrong map — it checked what the CLI package exports rather than what this application loads, so it passed the whole way.

`cli/commands/index.ts` now spreads the shared map instead of naming its entries, which removes the place to forget: a shared command added later is reachable without touching the template. The per-command files that only re-exported one key each are gone, and the test compares both maps rather than listing names, so a future application that hand-picks commands and misses one fails instead of shipping a command nobody can run. `cli/commands/i18n-check.ts` stays, because it also re-exports `checkAppLocales`.

An application generated from an earlier template keeps working as it is. To reach the four commands it needs the same change: pass the shared map through in `cli/commands/index.ts`, or list the new entries alongside the existing ones.
