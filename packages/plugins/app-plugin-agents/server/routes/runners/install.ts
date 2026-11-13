/**
 * `GET /api/agents/dist/installScript`: the script behind the one-line installs of what the application serves: its
 * CLI (`agents.cli`, such as `acme`) and the runner (`nocobase-runner`, `RUNNER_PRODUCT`). It needs no credential and
 * carries none: the token travels as an argument to the script, never in the URL.
 *
 * - By default it installs the CLI alone, with a download token a signed-in person created (such as an application's "Use the application in
 *   your agent" prompt): `curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --token <download token>`,
 *   then tells the person to sign in with `<cli> login --server <server>`.
 * - With `--runner` ("Add runtime"'s command) it installs the CLI and the runner, and makes this host a runtime with a
 *   one-time registration token: `… | sh -s -- --runner --server <server> --token <registration token>`. A runtime
 *   gets the CLI too, which its runs use when the runner cannot take the CLI the application serves itself.
 *
 * A token of the other kind fails before anything is installed. On macOS or Linux, as the signed-in user (no sudo),
 * for each product it:
 *
 * 1. asks the application which version it serves for this platform (`DIST_ROUTES.resolve`), sending the token;
 * 2. downloads that tarball, checks its SHA-256, and unpacks it into `<prefix>/versions/<version>`, pointing `<prefix>/current` at it and `<bin-dir>/<command>`
 *    at `<prefix>/current/bin/<command>`, and records the installation in `<prefix>/install.json` (`mode`: `cli` for
 *    the CLI, `runner` for the runner), which `<cli> update` and the runner's self-update read. A tarball built for the
 *    platform bundles its Node. The universal one (`universal=true` in the answer) carries none: before downloading
 *    it the script checks that `node` on PATH is Node.js 24 or newer, failing with how to install it otherwise, and
 *    once it is unpacked links `<prefix>/node` to that `node`, which the package's launcher runs it with, so a user
 *    service started without the shell's PATH (launchd, systemd) still finds it.
 *
 * The script asks with `accept=npm`, so an application that serves no tarball of a product and names its npm package
 * instead (`DistNpmPackage`, `kind=npm` in the answer) is followed too: after the same Node.js 24 check, and a check
 * that `npm` is on PATH (or `NOCOBASE_NPM`), it runs `npm install --prefix <prefix>/versions/<version>.partial
 * --no-save --no-audit --no-fund --omit=optional <package>@<version>` with the npm configuration of the person running
 * it, writes `bin/<command>` beside `node_modules` (the launcher of `npmLauncherScript`, which starts
 * `node_modules/.bin/<command>` with the Node it finds as the universal launcher does), renames the directory to
 * `<prefix>/versions/<version>`, and links `<prefix>/node` as for a universal tarball. Everything after that, from
 * `current` to the service, is the same for both.
 *
 * With `--runner` it warns when `pnpm` is not on PATH, suggesting `corepack enable`, and carries on. It then registers
 * the runner with the token (`nocobase-runner register`), installs and starts the user service
 * (`nocobase-runner service install`: a launchd agent or a systemd user unit), and waits until it runs.
 * An application that serves no CLI still gets its runtime: the CLI is skipped with a note.
 *
 * The script is served with the server's address it was requested from as its default `--server`, so the CLI-only
 * line needs none; `--server` overrides it, as behind a proxy that rewrites paths. Running it again is safe: an
 * installed version is reused, an existing registration with the same application is kept when the token was already
 * used, and the service is reloaded. `--dry-run` prints what it would do. The prefixes, the bin directory and the
 * service label can be moved (`--prefix`, `--runner-prefix`, `--bin-dir`, `--label`, or `NOCOBASE_CLI_INSTALL_DIR`,
 * `NOCOBASE_RUNNER_INSTALL_DIR`, `NOCOBASE_CLI_BIN_DIR`, `NOCOBASE_RUNNER_SERVICE_LABEL`), and `NOCOBASE_RUNNER_HOME` moves the
 * runner's state as it does for the runner itself. `nocobase-runner uninstall` undoes the runner's part.
 */
import {
  CREDENTIAL_PREFIXES,
  HEADERS,
  RUNNER_PRODUCT,
} from '@nocobase/agent-protocol';
import {
  createInstallRoutes as createSharedInstallRoutes,
  installScript as sharedInstallScript,
  type InstallScriptExtensions,
  type InstallScriptOptions,
  type InstallRoutesOptions,
} from '@nocobase/app-cli-distribution';
import { apiErrorResponse, cliRoute } from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import { tags } from '../openapi.js';
export {
  requestedServer,
  type InstallScriptOptions,
  type InstallRoutesOptions,
} from '@nocobase/app-cli-distribution';
const RUNNER_EXTENSIONS: InstallScriptExtensions = {
  intro: `# Installs the @CLI@ CLI this application serves; with --runner, also installs ${RUNNER_PRODUCT}, registers this host
# with the application as a runtime and starts the runner as a user service. Usage:
#   curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --token <download token> [options]
#   curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --runner --server <url> --token <registration token> [options]
`,
  usage: `Usage: install.sh --token <token> [--server <url>] [--runner] [options]

  --token <token>         A download token (the CLI alone) or, with --runner, a registration token from "Add runtime"
  --server <url>          The application (required with --runner; otherwise defaults to the script's application)
  --runner                Also install ${RUNNER_PRODUCT}, register this host as a runtime and start it as a user service
  --prefix <dir>          Where to install @CLI@ (default: ~/.local/share/@CLI@, or NOCOBASE_CLI_INSTALL_DIR)
  --bin-dir <dir>         Where to link the commands (default: ~/.local/bin, or NOCOBASE_CLI_BIN_DIR)
  --dry-run               Print what would be done, and change nothing

With --runner:
  --runner-prefix <dir>   Where to install ${RUNNER_PRODUCT} (default: ~/.local/share/${RUNNER_PRODUCT}, or NOCOBASE_RUNNER_INSTALL_DIR)
  --name <name>           The runner's name (default: the host name)
  --label <label>         The service label (default: com.nocobase.runner, or NOCOBASE_RUNNER_SERVICE_LABEL)
  --no-service            Register only; start the runner yourself with "${RUNNER_PRODUCT} start"`,
  command: `runner_cmd=${RUNNER_PRODUCT}`,
  name: `name=""`,
  prefix: `runner_prefix="\${NOCOBASE_RUNNER_INSTALL_DIR:-}"`,
  variables: `label="\${NOCOBASE_RUNNER_SERVICE_LABEL:-}"
runner=0
runner_only=""
service=1`,
  parseServer: `    --server) server="\${2:-}"; server_explicit=1; shift 2 ;;`,
  parseRunner: `    --runner) runner=1; shift ;;
    --name) name="\${2:-}"; runner_only="$1"; shift 2 ;;`,
  parsePrefix: `    --runner-prefix) runner_prefix="\${2:-}"; runner_only="$1"; shift 2 ;;`,
  parseService: `    --label) label="\${2:-}"; runner_only="$1"; shift 2 ;;
    --no-service) service=0; runner_only="$1"; shift ;;`,
  validate: `if [ "$runner" = 1 ] && { [ "$server_explicit" = 0 ] || [ -z "$server" ]; }; then
  echo '--runner requires --server <url>. Run: curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --runner --server <server> --token <registration token>' >&2
  exit 2
fi`,
  defaultPrefix: `runner_prefix="\${runner_prefix:-$HOME/.local/share/$runner_cmd}"`,
  credentials: `# The token says what it is for; the other kind fails here, before anything is installed.
case "$token" in
  ${CREDENTIAL_PREFIXES.download}*)
    [ "$runner" = 0 ] || fail "This is a download token: it installs the $cli CLI only. To make this host a runtime, use the command from Agent management > Runtimes > Add runtime, which has --runner and a registration token."
    header="${HEADERS.downloadToken}" ;;
  ${CREDENTIAL_PREFIXES.registration}*)
    [ "$runner" = 1 ] || fail "This is a runtime registration token: run the command with --runner, as Add runtime shows it. To install the CLI alone, use a download token."
    header="${HEADERS.registrationToken}" ;;
  *)
    if [ "$runner" = 1 ]; then header="${HEADERS.registrationToken}"; else header="${HEADERS.downloadToken}"; fi ;;
esac
if [ "$runner" = 0 ] && [ -n "$runner_only" ]; then
  fail "$runner_only applies only with --runner."
fi
`,
  pnpm: `if [ "$runner" = 1 ] && ! command -v pnpm >/dev/null 2>&1; then
  printf '%s\\n' "Note: pnpm is not on PATH. Runs that install a project's dependencies use it; run \\"corepack enable\\" (it comes with Node.js) to get it. Continuing." >&2
fi
`,
  registered: `runner_bin="$runner_prefix/current/bin/$runner_cmd"

# Whether this host already runs an installed runner registered with this application.
registered() {
  [ -x "$runner_bin" ] && "$runner_bin" status --json 2>/dev/null | grep -F "\\"server\\": \\"$server\\"" >/dev/null
}
`,
  resolveFailure: `  if [ "$status" = 401 ] && [ "$runner" = 1 ] && registered; then
    installed=used
    return 0
  elif [ "$status" = 401 ] && [ "$runner" = 0 ] && [ -x "$dir/current/bin/$product" ]; then
    say "The token was not accepted (used up or expired), but $product is installed in $dir already; run \\"$product update\\" to update it."
    installed=kept
    return 0
  elif [ "$status" = 404 ] && [ "$runner" = 1 ] && [ "$product" = "$cli" ] && grep -F '"reason":"NOT_FOUND"' "$tmp/resolve" >/dev/null 2>&1; then
    say "$server serves no $cli CLI; installing the runtime without it."
    installed=missing
    return 0
  elif [ "$status" != 200 ]; then
    message="$(sed -n 's/.*"message":"\\([^"]*\\)".*/\\1/p' "$tmp/resolve")"
    fail "$server answered $status: \${message:-$(cat "$tmp/resolve")}"
  fi`,
  afterCli: `reuse=0
[ "$installed" != used ] || reuse=1

if [ "$runner" = 1 ]; then
  # 2. The runner, registered with the token.
  if [ "$reuse" = 0 ]; then
    install_product "$runner_cmd" "$runner_prefix" runner
    [ "$installed" != used ] || reuse=1
  fi
  if [ "$reuse" = 1 ]; then
    # Run again with a token that was used already: keep what is installed and registered, and restart the service.
    say "The token was used already; keeping the installed runner and its registration with $server."
  else
    if [ -n "$name" ]; then set -- --name "$name"; else set --; fi
    if run "$runner_bin" register --server "$server" --token "$token" --force "$@"; then
      :
    elif registered; then
      say "The token was not accepted, but the runner on this host is already registered with $server; keeping that registration."
    else
      fail "Registration failed. Create a new command with \\"Add runtime\\" and run it again."
    fi
  fi

  # 3. Start it as a user service.
  if [ "$service" = 1 ]; then
    if [ -n "$label" ]; then set -- --label "$label"; else set --; fi
    run "$runner_bin" service install "$@"
    # A systemd user service stops at logout unless the user lingers; allowed for oneself on most systems.
    if [ "$os" = linux ] && [ "$dry_run" = 0 ] && command -v loginctl >/dev/null 2>&1; then
      loginctl enable-linger "$(id -un)" 2>/dev/null ||
        say "Run \\"loginctl enable-linger $(id -un)\\" (with sudo if asked) to keep the runner running after you log out."
    fi
    if [ "$dry_run" = 0 ]; then
      tries=0
      until "$runner_bin" status --json 2>/dev/null | grep -F '"running": true' >/dev/null; do
        tries=$((tries + 1))
        [ "$tries" -lt 30 ] || fail "The service did not start; see $runner_bin logs."
        sleep 1
      done
      "$runner_bin" status
    fi
    say "The runner is installed and running; the Runtimes page shows it connected within a few seconds."
  else
    say "Registered. Start the runner with: $runner_bin start"
  fi
  say "Note: agents run with full access as $(id -un), with this user's home and credentials. The runner is not a security boundary: run it as a dedicated user, in a container or in a VM."
else
  say "$cli is installed: $bin_dir/$cli"
fi`,
  next: `if [ "$runner" = 0 ]; then
  say "Next: $cli login --server $server"
fi`,
  npmInstallComment: `    # No optional dependencies: the coding tools' SDKs list one package per platform, each carrying a binary the
    # runner never starts.`,
  productComment: `# Installs one product: install_product <command> <prefix> <mode>. Sets "installed" to what happened: "new", "kept"
# (the token was not accepted, but the CLI is installed), "used" (the token was used, by the runner registered here)
# or "missing" (the application serves no CLI; with --runner the runtime is installed without it).
`,
};
export function installScript(options: InstallScriptOptions): string {
  return sharedInstallScript({
    ...options,
    public: false,
    extensions: RUNNER_EXTENSIONS,
  });
}
export function createInstallRoutes(options: InstallRoutesOptions): Hono {
  return createSharedInstallRoutes({
    ...options,
    public: false,
    extensions: RUNNER_EXTENSIONS,
    openapi: {
      tags,
      summary: 'Get the install script',
      operationId: 'agentsGetRunnerInstallScript',
      // Plumbing: piped to a shell by "Add runtime".
      ...cliRoute(false),
      description:
        'The POSIX shell script behind the one-line installs of the application\'s CLI and the runner (`nocobase-runner`). `curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --token <download token>` installs the CLI alone for the platform and tells the person to sign in; with `--runner` and a registration token from "Add runtime" it also installs the runner, registers the host as a runtime and starts the runner as a user service. A token of the other kind fails before anything is installed. It needs no credential and carries none; the token is an argument to the script. The script defaults `--server` to the address it was requested at.',
      security: [],
      responses: {
        200: {
          description: 'The script.',
          content: {
            'text/x-shellscript': {
              schema: { type: 'string', description: 'A POSIX shell script.' },
            },
          },
        },
        500: apiErrorResponse(500),
      },
    },
  });
}
