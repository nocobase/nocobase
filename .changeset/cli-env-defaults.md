---
'@nocobase/app-server': minor
'@nocobase/app-skills': patch
---

A route's command-line hints can default a flag from the caller's environment: `cliRoute({ flags: { repository: { env: ['GITHUB_REPOSITORY', 'CI_PROJECT_PATH'] } } })`, or a field of the JSON file a variable names, such as `{ file: 'GITHUB_EVENT_PATH', path: 'pull_request.head.sha' }`. The manifest carries it as `env` on the parameter; the CLI fills a flag the line leaves out from the first source the environment has, a flag given explicitly always wins, and its help names where the default comes from. An older CLI ignores `env` and still asks for the flag.
