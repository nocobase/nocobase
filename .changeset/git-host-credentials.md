---
"@nocobase/agent-protocol": minor
"@nocobase/agent-runner": minor
"@nocobase/app-plugin-agents": minor
---

Make run git credentials independent of the code host. Protocol 12 adds `RunGit.tools` and the `gitTools` runner feature: the runner wraps the code host CLIs a run names (such as `gh` or `glab`) so every call runs with the current credential of one of the run's repositories, fetched through the run's credential broker, and fails with the reason instead of falling back to the machine's login. A credential's username is now the only one git uses (`oauth2` for GitLab, `x-access-token` for a GitHub App); the runner no longer defaults it for runs (a build job's token without a username keeps the old default).

Every run's agent now gets `git`, `gh` and `glab` wrappers that refuse `gh`/`glab` logins, `git config --global`/`--system` writes of `credential.*`, and git URLs that embed a password.

Repository access providers are told whether the runner wraps CLIs (`tools`) and who answers for the run's subject now (`responsibleUserId`), at the claim, in `prepare` and on every `issue`, so an application can issue credentials for a task's owner. `RunGit.tools` is dropped for runners without the feature and for repositories without a credential in the payload.

Update the application before its runners: a server speaking protocol 11 refuses a runner speaking 12.
