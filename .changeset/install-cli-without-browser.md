---
'@nocobase/app-plugin-agents': minor
'@nocobase/app-cli-client': patch
---

Install and use the application's CLI on a machine without a browser. The install script takes `--api-key-env <variable>` instead of a token and downloads the CLI with the API key in that environment variable: the key is sent only to the application, from a 0600 curl config file, never in an argument, the output or the installation, redirects are not followed, nothing is saved, and a key the application refuses fails the script even where the CLI is installed already. A signed-in person can also create a short-lived download token for another machine from the CLI with `install-token create` (`POST /api/agents/dist/downloadTokens`, answered with `Cache-Control: no-store`); it still downloads only the CLI for one platform, at most three times within 30 minutes, and signs nobody in. `login --help` now says that `--no-browser` still needs someone to approve the sign-in on another device, and points unattended machines at an API key.
