---
'@nocobase/app-installer': patch
---

The `--json` document is built by the new `@nocobase/cli-envelope` dependency rather than by a copy of the envelope kept here, and `bin/run.js` runs that package's Node.js guard. What is printed is unchanged, except that the guard's `command` is now the arguments before the first flag, as the application CLI's guard names it, where a leading flag used to be taken as the command.
