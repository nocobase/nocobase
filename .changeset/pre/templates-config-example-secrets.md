---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Declare `auth.secret` and `session.secret` as live keys in `config.example.yml` rather than commented-out placeholders, and describe how a generated application's `config.yml` and database now come about.

`@nocobase/create-app` generates `config.yml` from this file and fills the two secrets in. Leaving them commented meant the generator had to uncomment them, which made the exact comment syntax of this file part of its contract; a live key with a placeholder value is a target it can simply replace.

The other way this file is used — copying it to `config.yml` by hand — is covered separately: the placeholder is a non-empty string that would otherwise pass for a configured secret, so the runtime now refuses it by name and says how to generate a replacement.

The generator no longer asks which database to use, so "Review your configuration" in each README no longer says `config.yml` carries the database you chose. An application starts on SQLite, and another database means registering its dialect in `server/config/database.ts` and adding the matching `@nocobase/db-*` package — drivers are code rather than settings, and a dialect the application does not register cannot be introduced from `config.yml`.

The Hub's upgrade skill no longer describes `app-dist/`, which the generator stopped creating and nothing reads.
