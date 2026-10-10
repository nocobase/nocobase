/**
 * `GET /api/agents/dist/installScript`: the script behind the one-line installs of what the application serves: its
 * CLI (`agents.cli`, such as `acme`) and the runner (`nocobase-runner`, `RUNNER_PRODUCT`). It needs no credential and
 * carries none: the token travels as an argument to the script, never in the URL.
 *
 * - By default it installs the CLI alone, with a download token a signed-in person created (such as an application's "Use the application in
 *   your agent" prompt): `curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --token <download token>`,
 *   then tells the person to sign in with `<cli> login --server <server>`.
 * - With `--api-key-env <variable>` instead of a token it installs the CLI alone with the API key in that environment
 *   variable, for a machine with no browser and nobody signed in, such as CI that already holds a key among its
 *   secrets: `… | sh -s -- --api-key-env ACME_API_KEY`. The key never appears in an argument, the output or the
 *   installation: curl reads it from a 0600 file in the script's temporary directory, redirects are not followed so
 *   it reaches no other address, and nothing is saved, so the CLI is not signed in afterwards. A key that is not
 *   accepted fails the script even when the CLI is installed already.
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
  DIST_PRODUCT_PATTERN,
  DIST_ROUTES,
  HEADERS,
  RUNNER_PRODUCT,
} from '@nocobase/agent-protocol';
import { npmLauncherScript } from '@nocobase/app-cli-client/install';
import {
  apiErrorResponse,
  cliRoute,
  describeRoute,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';

import { tags } from '../openapi.js';

/** A server address safe to put in the script as it is: a URL of plain characters. */
const SAFE_SERVER = /^https?:\/\/[A-Za-z0-9.:[\]_-]+(?:\/[A-Za-z0-9._~/-]*)?$/u;

/** What the script installs, and where it was served from. */
export interface InstallScriptOptions {
  /** The application's CLI command (`agents.cli.name`), which is also the product it is served as. */
  readonly cli: string;
  /** A URL of plain characters, the default `--server`; nothing (then `--server` is required) otherwise. */
  readonly server?: string;
}

/** The script for the application's CLI `cli`, with `server` as its default `--server`. */
export function installScript(options: InstallScriptOptions): string {
  if (!DIST_PRODUCT_PATTERN.test(options.cli) || options.cli === RUNNER_PRODUCT)
    throw new Error(`Not a CLI command name: ${options.cli}`);
  const server = options.server ?? '';
  const fallback = SAFE_SERVER.test(server) ? server.replace(/\/+$/u, '') : '';
  return INSTALL_SCRIPT_TEMPLATE.replaceAll('@CLI@', options.cli).replace(
    '@DEFAULT_SERVER@',
    fallback,
  );
}

/** What the routes serve, and where the application is published when it knows. */
export interface InstallRoutesOptions {
  /** The application's CLI command, read per request (`agents.cli.name`). */
  readonly cli: () => string;
  /** `app.publicOrigin`, read per request; the request's own origin (or its forwarded one) otherwise. */
  readonly publicOrigin?: () => string | undefined;
  /** The base path the application is served under, such as `/main`; read from the request's path otherwise. */
  readonly publicBasePath?: string;
}

/** The address the script was requested at: what the person's `curl` reached, base path included. */
export function requestedServer(
  context: Context,
  options: Pick<InstallRoutesOptions, 'publicOrigin' | 'publicBasePath'> = {},
): string {
  const url = new URL(context.req.url);
  const configured = options.publicOrigin?.();
  let origin: string;
  if (configured) origin = configured.replace(/\/+$/u, '');
  else {
    const proto = context.req
      .header('x-forwarded-proto')
      ?.split(',')[0]
      ?.trim();
    const host =
      context.req.header('x-forwarded-host')?.split(',')[0]?.trim() ??
      context.req.header('host') ??
      url.host;
    const protocol =
      proto === 'https' || proto === 'http'
        ? proto
        : url.protocol.replace(/:$/u, '');
    origin = `${protocol}://${host}`;
  }
  const base =
    options.publicBasePath !== undefined
      ? options.publicBasePath.replace(/\/+$/u, '')
      : url.pathname.endsWith(DIST_ROUTES.installScript)
        ? url.pathname.slice(0, -DIST_ROUTES.installScript.length)
        : '';
  return `${origin}${base}`;
}

// Kept POSIX sh (it is piped to `sh`), without backquotes, so it can live in a template literal; `\${` is the shell's
// `${`. `@CLI@` is the application's CLI command and `@DEFAULT_SERVER@` the address the script was served from.
const INSTALL_SCRIPT_TEMPLATE = `#!/bin/sh
# Installs the @CLI@ CLI this application serves; with --runner, also installs ${RUNNER_PRODUCT}, registers this host
# with the application as a runtime and starts the runner as a user service. Usage:
#   curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --token <download token> [options]
#   curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --api-key-env <variable> [options]
#   curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --runner --server <url> --token <registration token> [options]
set -eu

usage() {
  cat <<'USAGE'
Usage: install.sh --token <token> [--server <url>] [--runner] [options]
       install.sh --api-key-env <variable> [--server <url>] [options]

  --token <token>         A short-lived download token (the CLI alone) or, with --runner, a registration token from "Add runtime"
  --api-key-env <name>    Install the CLI alone with the API key in the environment variable <name> (such as one from
                          your CI's secrets) instead of a token; not with --token or --runner. The key is not saved,
                          so @CLI@ is not signed in afterwards.
  --server <url>          The application (default: the one this script came from)
  --runner                Also install ${RUNNER_PRODUCT}, register this host as a runtime and start it as a user service
  --prefix <dir>          Where to install @CLI@ (default: ~/.local/share/@CLI@, or NOCOBASE_CLI_INSTALL_DIR)
  --bin-dir <dir>         Where to link the commands (default: ~/.local/bin, or NOCOBASE_CLI_BIN_DIR)
  --dry-run               Print what would be done, and change nothing

With --runner:
  --runner-prefix <dir>   Where to install ${RUNNER_PRODUCT} (default: ~/.local/share/${RUNNER_PRODUCT}, or NOCOBASE_RUNNER_INSTALL_DIR)
  --name <name>           The runner's name (default: the host name)
  --label <label>         The service label (default: com.nocobase.runner, or NOCOBASE_RUNNER_SERVICE_LABEL)
  --no-service            Register only; start the runner yourself with "${RUNNER_PRODUCT} start"
USAGE
}

cli=@CLI@
runner_cmd=${RUNNER_PRODUCT}
server="@DEFAULT_SERVER@"
token=""
api_key_env=""
key_mode=0
name=""
prefix="\${NOCOBASE_CLI_INSTALL_DIR:-}"
runner_prefix="\${NOCOBASE_RUNNER_INSTALL_DIR:-}"
bin_dir="\${NOCOBASE_CLI_BIN_DIR:-}"
label="\${NOCOBASE_RUNNER_SERVICE_LABEL:-}"
runner=0
runner_only=""
service=1
dry_run=0
while [ $# -gt 0 ]; do
  case "$1" in
    --server) server="\${2:-}"; shift 2 ;;
    --token) token="\${2:-}"; shift 2 ;;
    --api-key-env) api_key_env="\${2:-}"; key_mode=1; shift 2 ;;
    --runner) runner=1; shift ;;
    --name) name="\${2:-}"; runner_only="$1"; shift 2 ;;
    --prefix) prefix="\${2:-}"; shift 2 ;;
    --runner-prefix) runner_prefix="\${2:-}"; runner_only="$1"; shift 2 ;;
    --bin-dir) bin_dir="\${2:-}"; shift 2 ;;
    --label) label="\${2:-}"; runner_only="$1"; shift 2 ;;
    --no-service) service=0; runner_only="$1"; shift ;;
    --dry-run) dry_run=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done
if [ -z "$server" ] || { [ -z "$token" ] && [ "$key_mode" = 0 ]; }; then
  usage >&2
  exit 2
fi
server="\${server%/}"
prefix="\${prefix:-$HOME/.local/share/$cli}"
runner_prefix="\${runner_prefix:-$HOME/.local/share/$runner_cmd}"
bin_dir="\${bin_dir:-$HOME/.local/bin}"

say() { printf '%s\\n' "$*"; }
fail() { printf '%s install: %s\\n' "$cli" "$*" >&2; exit 1; }
run() {
  if [ "$dry_run" = 1 ]; then
    say "+ $*"
  else
    "$@"
  fi
}

api_key=""
header=""
if [ "$key_mode" = 1 ]; then
  # The key is read from the environment, never from an argument, so it stays out of the shell history and ps.
  [ -z "$token" ] || fail "--api-key-env and --token are alternatives: pass one of them."
  [ "$runner" = 0 ] || fail "--api-key-env installs the $cli CLI only. To make this host a runtime, use the command from Agent team > Runtimes > Add runtime, which has --runner and a registration token."
  case "$api_key_env" in
    ''|[0-9]*|*[!A-Za-z0-9_]*) fail "--api-key-env takes the name of an environment variable that holds the API key, such as ACME_API_KEY, not the key itself." ;;
  esac
  api_key="$(printenv "$api_key_env")" || fail "$api_key_env is not set: export it with the API key before running this script."
  [ -n "$api_key" ] || fail "$api_key_env is empty: export it with the API key before running this script."
  nl='
'
  cr="$(printf '\\r')"
  case "$api_key" in
    *"$nl"*|*"$cr"*) fail "$api_key_env holds more than one line; it must hold the API key alone." ;;
  esac
else
  # The token says what it is for; the other kind fails here, before anything is installed.
  case "$token" in
    ${CREDENTIAL_PREFIXES.download}*)
      [ "$runner" = 0 ] || fail "This is a download token: it installs the $cli CLI only. To make this host a runtime, use the command from Agent team > Runtimes > Add runtime, which has --runner and a registration token."
      header="${HEADERS.downloadToken}" ;;
    ${CREDENTIAL_PREFIXES.registration}*)
      [ "$runner" = 1 ] || fail "This is a runtime registration token: run the command with --runner, as Add runtime shows it. To install the CLI alone, use a download token."
      header="${HEADERS.registrationToken}" ;;
    *)
      if [ "$runner" = 1 ]; then header="${HEADERS.registrationToken}"; else header="${HEADERS.downloadToken}"; fi ;;
  esac
fi
if [ "$runner" = 0 ] && [ -n "$runner_only" ]; then
  fail "$runner_only applies only with --runner."
fi

case "$(uname -s)" in
  Darwin) os=darwin ;;
  Linux) os=linux ;;
  *) fail "$cli runs on macOS and Linux, not on $(uname -s). On Windows, use WSL." ;;
esac
case "$(uname -m)" in
  arm64|aarch64) arch=arm64 ;;
  x86_64|amd64) arch=x64 ;;
  *) fail "Unsupported processor: $(uname -m)." ;;
esac
target="\${NOCOBASE_CLI_TARGET:-$os-$arch}"

command -v curl >/dev/null 2>&1 || fail "curl is required."
command -v tar >/dev/null 2>&1 || fail "tar is required."
if command -v sha256sum >/dev/null 2>&1; then
  sha256() { sha256sum "$1" | cut -d ' ' -f 1; }
elif command -v shasum >/dev/null 2>&1; then
  sha256() { shasum -a 256 "$1" | cut -d ' ' -f 1; }
else
  fail "sha256sum or shasum is required to check the download."
fi

if [ "$runner" = 1 ] && ! command -v pnpm >/dev/null 2>&1; then
  printf '%s\\n' "Note: pnpm is not on PATH. Runs that install a project's dependencies use it; run \\"corepack enable\\" (it comes with Node.js) to get it. Continuing." >&2
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT INT TERM
runner_bin="$runner_prefix/current/bin/$runner_cmd"

if [ "$key_mode" = 1 ]; then
  # curl reads the key from a config file only this user can read, so it is in no command line; the file goes with
  # the temporary directory. Inside the quotes, a backslash and a double quote are escaped.
  escaped="$(printf '%s' "$api_key" | sed 's/[\\\\"]/\\\\&/g')"
  (umask 077 && printf 'header = "x-api-key: %s"\\n' "$escaped" >"$tmp/auth")
  unset escaped
fi

# A request with the credential: the API key from its file, or the token as a header.
fetch() {
  if [ "$key_mode" = 1 ]; then
    # -q must be first: default curl configs could enable redirects or log the key through verbose/trace.
    curl -q -K "$tmp/auth" "$@"
  else
    curl -H "$header: $token" "$@"
  fi
}

# Whether this host already runs an installed runner registered with this application.
registered() {
  [ -x "$runner_bin" ] && "$runner_bin" status --json 2>/dev/null | grep -F "\\"server\\": \\"$server\\"" >/dev/null
}

field() { sed -n "s/^$1=//p" "$tmp/resolve" | head -n 1; }

# A universal package carries no Node: sets node_bin to the node on PATH when it is Node.js 24 or newer, and fails
# saying how to install one otherwise. require_node <command>.
require_node() {
  node_hint="Install Node.js 24 or newer (https://nodejs.org/en/download, or with a version manager: nvm install 24), open a new shell so that node is on PATH, and run this command again."
  node_bin="$(command -v node 2>/dev/null || true)"
  [ -n "$node_bin" ] || fail "$1 needs Node.js 24 or newer, and node is not on PATH. $node_hint"
  node_version="$("$node_bin" -p 'process.versions.node' 2>/dev/null || true)"
  case "$node_version" in
    ''|*[!0-9.]*) fail "$1 needs Node.js 24 or newer, and $node_bin does not say its version. $node_hint" ;;
  esac
  [ "\${node_version%%.*}" -ge 24 ] || fail "$1 needs Node.js 24 or newer; $node_bin is $node_version. $node_hint"
}

# A package the application names on npm is installed with npm: sets npm_bin to NOCOBASE_NPM or the npm on PATH, and
# fails saying how to get one otherwise. require_npm <command>.
require_npm() {
  npm_bin="\${NOCOBASE_NPM:-$(command -v npm 2>/dev/null || true)}"
  [ -n "$npm_bin" ] && [ -x "$npm_bin" ] || fail "$1 is installed from npm, and npm is not on PATH. npm comes with Node.js: install Node.js 24 or newer from https://nodejs.org/en/download (a version manager such as nvm installs npm too), or set NOCOBASE_NPM to its path, and run this command again."
}

# The launcher of a version installed from npm: <version>/bin/<command> starts node_modules/.bin/<command> with the
# first Node.js 24 or newer it finds, as the universal tarball's launcher does.
write_npm_launcher() {
  cat <<'LAUNCHER'
${npmLauncherScript()}LAUNCHER
}

# Installs one product: install_product <command> <prefix> <mode>. Sets "installed" to what happened: "new", "kept"
# (the token was not accepted, but the CLI is installed), "used" (the token was used, by the runner registered here)
# or "missing" (the application serves no CLI; with --runner the runtime is installed without it).
install_product() {
  product="$1"
  dir="$2"
  mode="$3"
  installed=new
  status="$(fetch -sS -o "$tmp/resolve" -w '%{http_code}' \\
    "$server/api/agents/dist/products/$product/targets/$target?format=env&accept=npm")" ||
    fail "Could not reach $server."
  if [ "$key_mode" = 1 ] && { [ "$status" = 401 ] || [ "$status" = 403 ]; }; then
    # Unlike a used-up download token, a key that is refused is a mistake to report, whatever is installed already.
    message="$(sed -n 's/.*"message":"\\([^"]*\\)".*/\\1/p' "$tmp/resolve")"
    fail "$server did not accept the API key in $api_key_env ($status\${message:+: $message}). Check that the key is valid, not expired or revoked; nothing was changed."
  elif [ "$status" = 401 ] && [ "$runner" = 1 ] && registered; then
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
  fi
  kind="$(field kind)"
  version="$(field version)"
  case "$version" in
    ''|*[!0-9A-Za-z.+-]*) fail "The server named an unexpected version: $version" ;;
  esac
  universal=""
  if [ "$kind" = npm ]; then
    package="$(field package)"
    case "$package" in
      ''|*[!0-9a-z@/._~-]*) fail "The server named an unexpected npm package: $package" ;;
    esac
    require_node "$product"
    require_npm "$product"
    say "$product $version comes from npm ($package@$version) and runs on this machine's Node.js $node_version ($node_bin)."
  else
    url="$(field url)"
    checksum="$(field sha256)"
    case "$url" in
      /*) ;;
      *) fail "The server named an unexpected download: $url" ;;
    esac
    case "$checksum" in
      *[!0-9a-f]*|'') fail "The server named an unexpected checksum: $checksum" ;;
    esac
    universal="$(field universal)"
    if [ "$universal" = true ]; then
      require_node "$product"
      say "$product $version runs on this machine's Node.js $node_version ($node_bin)."
    fi
  fi

  dest="$dir/versions/$version"
  if [ -x "$dest/bin/$product" ]; then
    say "$product $version for $target is already installed in $dest."
  elif [ "$kind" = npm ]; then
    say "Installing $package@$version with npm ..."
    run rm -rf "$dest.partial"
    run mkdir -p "$dest.partial"
    # No optional dependencies: the coding tools' SDKs list one package per platform, each carrying a binary the
    # runner never starts.
    run "$npm_bin" install --prefix "$dest.partial" --no-save --no-audit --no-fund --omit=optional "$package@$version"
    if [ "$dry_run" = 0 ]; then
      [ -e "$dest.partial/node_modules/.bin/$product" ] || fail "$package@$version provides no $product command."
      mkdir -p "$dest.partial/bin"
      write_npm_launcher >"$dest.partial/bin/$product"
      chmod 755 "$dest.partial/bin/$product"
    fi
    run mv "$dest.partial" "$dest"
  else
    say "Downloading $product $version for $target from $server ..."
    if [ "$key_mode" = 0 ]; then
      run curl -fSL --progress-bar -H "$header: $token" -o "$tmp/$product.tar.gz" "$server$url"
    elif [ "$dry_run" = 1 ]; then
      say "+ curl -q -S --progress-bar -K <the API key in $api_key_env> -o $tmp/$product.tar.gz $server$url"
    else
      # Redirects are not followed: curl would send the key on to wherever they point.
      code="$(fetch -S --progress-bar -w '%{http_code}' -o "$tmp/$product.tar.gz" "$server$url")" ||
        fail "Could not download from $server."
      case "$code" in
        200) ;;
        3??) fail "$server answered the download with a redirect ($code), which is not followed with an API key. Pass --server as the address the application answers at itself." ;;
        *) fail "$server answered the download with $code." ;;
      esac
    fi
    if [ "$dry_run" = 0 ]; then
      actual="$(sha256 "$tmp/$product.tar.gz")"
      [ "$actual" = "$checksum" ] || fail "The download does not match its SHA-256 (expected $checksum, got $actual)."
      say "Checksum verified."
    fi
    run rm -rf "$dest.partial"
    run mkdir -p "$dest.partial"
    run tar -xzf "$tmp/$product.tar.gz" -C "$dest.partial" --strip-components=1
    run mv "$dest.partial" "$dest"
  fi
  run ln -sfn "versions/$version" "$dir/current"
  if [ "$universal" = true ] || [ "$kind" = npm ]; then
    # The launcher's first choice, so a service that does not have this shell's PATH runs the same Node.
    run ln -sfn "$node_bin" "$dir/node"
  fi
  run mkdir -p "$bin_dir"
  run ln -sfn "$dir/current/bin/$product" "$bin_dir/$product"
  if [ "$dry_run" = 0 ]; then
    printf '{\\n  "prefix": "%s",\\n  "binLink": "%s",\\n  "mode": "%s"\\n}\\n' "$dir" "$bin_dir/$product" "$mode" >"$dir/install.json"
  fi
}

# 1. The CLI.
install_product "$cli" "$prefix" cli
reuse=0
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
fi
case ":$PATH:" in
  *":$bin_dir:"*) ;;
  *) say "Add $bin_dir to your PATH to run $cli from a shell: export PATH=\\"$bin_dir:\\$PATH\\"" ;;
esac
if [ "$key_mode" = 1 ]; then
  say "The API key was used only to download $cli: it is not saved, and $cli is not signed in."
  say "Next: $cli reads its server and an API key from environment variables (\\"$cli login --help\\" names them). Set them to $server and the key, and check with: $cli whoami --json"
  say "To keep the key on this machine instead: $cli login --server $server --api-key-stdin < <file with the key>"
elif [ "$runner" = 0 ]; then
  say "Next: $cli login --server $server"
fi
`;

export function createInstallRoutes(options: InstallRoutesOptions): Hono {
  const router = new Hono();
  router.get(
    '/installScript',
    describeRoute({
      tags,
      summary: 'Get the install script',
      operationId: 'agentsGetRunnerInstallScript',
      // Plumbing: piped to a shell by "Add runtime".
      ...cliRoute(false),
      description:
        'The POSIX shell script behind the one-line installs of the application\'s CLI and the runner (`nocobase-runner`). `curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --token <download token>` installs the CLI alone for the platform and tells the person to sign in; `--api-key-env <variable>` instead of `--token` installs it with the API key in that environment variable, which is sent only to this application and not saved; with `--runner` and a registration token from "Add runtime" it also installs the runner, registers the host as a runtime and starts the runner as a user service. A token of the other kind fails before anything is installed. It needs no credential and carries none; the token is an argument to the script, the API key an environment variable. The script defaults `--server` to the address it was requested at.',
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
    }),
    (context) =>
      context.body(
        installScript({
          cli: options.cli(),
          server: requestedServer(context, options),
        }),
        200,
        {
          'content-type': 'text/x-shellscript; charset=utf-8',
          'cache-control': 'no-cache',
        },
      ),
  );
  return router;
}
