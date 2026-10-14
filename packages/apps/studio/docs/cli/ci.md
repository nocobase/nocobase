# `nb-studio` in CI

CI never signs in through the browser. It acts with an API key from the environment:

```bash
export NB_STUDIO_SERVER=https://studio.example.com
export NB_STUDIO_API_KEY=${{ secrets.NB_STUDIO_API_KEY }}
nb-studio whoami --json
```

`NB_STUDIO_API_KEY` wins over any profile on the machine, and `NB_STUDIO_SERVER` names the server (or the profile's server is used). Nothing is written to disk but the cached command manifest in `~/.nb-studio/cache` (`NB_STUDIO_HOME` moves it).

## Which key

Use an organization key, which belongs to no person and stays when people leave: Settings › API keys › Create key, choosing only the permissions the job needs, or from a signed-in terminal:

```bash
nb-studio access org-key create --name "release pipeline" --expires-in-days 365 --file scope.json
```

Creating and managing organization keys takes a sign-in and the "API keys" settings item (`studio.apiKeys`); a key never creates keys. A personal key (`nb-studio api-key create --name ci --expires-in-days 90`) works too, but acts as its person.

## Writing steps that do not surprise you

- Pass `--json` and read `.ok`, `.result.data` and `.error.code`; the exit code says the same (0 ok, 2 network, 3 authentication or permission, 4 not found, 5 invalid input, 6 conflict).
- Pass `--yes` to a command that asks first (`nb-studio … --help` lists `-y, --yes` for those): without a terminal it refuses rather than hangs.
- A missing argument fails with `MISSING_ARGUMENT` instead of prompting.
- `--dry-run` is honoured only where the route offers one; elsewhere it fails with `DRY_RUN_UNSUPPORTED` and sends nothing.
- `nb-studio whoami --missing` in a failing job shows which actions the key lacks.

## Releases from CI

The build-and-deploy commands are written for pipelines (see [releases](releases.md)):

```bash
nb-studio build status --app my-app-staging --sha "$GITHUB_SHA" --state building --logs "$RUN_URL"
nb-studio app ensure my-app-staging --environment staging --json
nb-studio deploy --app my-app-staging --sha "$GITHUB_SHA" --file dist.tar.gz --json
```

`nb-studio build workflow <repo>` prints a ready workflow file for a repository with the steps above.
