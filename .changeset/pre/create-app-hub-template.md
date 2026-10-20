---
'@nocobase/create-app': minor
'@nocobase/app-template-default': patch
---

Accept `--template hub` in `create-app`, and scaffold a hub as a hub rather than as an app.

A hub has no database, so the app flow was wrong for it in every step that touches one: it would have asked which dialect to use, added a driver dependency the hub never loads, and written a `config.yml` the hub never reads. A template now declares what it is through `nocobase.templateKind`, and `create-app` reads that to decide which flow applies — falling back to the package name so a local path to a checkout predating the field still works. The kind is settled after the template is downloaded, because a package specifier or a local path does not reveal it any earlier.

A generated hub gets the scaffolding `nb3 hub create` already produced: `.env` derived from the template's `.env.example` with `APP_NAME` set to the project name, `.nb3/hub.json` so the `nb3 hub` commands can find it, `app-dist/` for the apps it serves, the runtime directories it writes into, and the matching `.gitignore` entries. `--db-dialect` is reported as ignored rather than silently dropped when it is passed alongside a hub template.
