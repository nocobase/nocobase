---
'@nocobase/app-skills': patch
'@nocobase/create-app': patch
---

Describe `secrets.keys` in place of `auth.secret` and `session.secret`: the deployment Skill's production checklist covers the keys, their backup and rotation with `secrets rotate`, and the sign-out a change of the current key causes; the application Skill describes what `config init` and `config check` now do, and how application code seals a value it reads back with `secretsServiceToken` and registers its table for rotation. The `.gitignore` `create-app` writes when a template has none names the generated secrets key.
