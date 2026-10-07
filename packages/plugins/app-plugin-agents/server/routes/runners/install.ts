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
 * 2. downloads that standalone tarball (it bundles Node, so nothing needs to be installed first), checks its SHA-256,
 *    and unpacks it into `<prefix>/versions/<version>`, pointing `<prefix>/current` at it and `<bin-dir>/<command>`
 *    at `<prefix>/current/bin/<command>`, and records the installation in `<prefix>/install.json` (`mode`: `cli` for
 *    the CLI, `runner` for the runner), which `<cli> update` and the runner's self-update read.
 *
 * With `--runner` it then registers the runner with the token (`nocobase-runner register`), installs and starts the
 * user service (`nocobase-runner service install`: a launchd agent or a systemd user unit), and waits until it runs.
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
#   curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --runner --server <url> --token <registration token> [options]
set -eu

usage() {
  cat <<'USAGE'
Usage: install.sh --token <token> [--server <url>] [--runner] [options]

  --token <token>         A download token (the CLI alone) or, with --runner, a registration token from "Add runtime"
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
if [ -z "$server" ] || [ -z "$token" ]; then
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

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT INT TERM
runner_bin="$runner_prefix/current/bin/$runner_cmd"

# Whether this host already runs an installed runner registered with this application.
registered() {
  [ -x "$runner_bin" ] && "$runner_bin" status --json 2>/dev/null | grep -F "\\"server\\": \\"$server\\"" >/dev/null
}

field() { sed -n "s/^$1=//p" "$tmp/resolve" | head -n 1; }

# Installs one product: install_product <command> <prefix> <mode>. Sets "installed" to what happened: "new", "kept"
# (the token was not accepted, but the CLI is installed), "used" (the token was used, by the runner registered here)
# or "missing" (the application serves no CLI; with --runner the runtime is installed without it).
install_product() {
  product="$1"
  dir="$2"
  mode="$3"
  installed=new
  status="$(curl -sS -o "$tmp/resolve" -w '%{http_code}' \\
    -H "$header: $token" \\
    "$server/api/agents/dist/products/$product/targets/$target?format=env")" ||
    fail "Could not reach $server."
  if [ "$status" = 401 ] && [ "$runner" = 1 ] && registered; then
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
  version="$(field version)"
  url="$(field url)"
  checksum="$(field sha256)"
  case "$version" in
    ''|*[!0-9A-Za-z.+-]*) fail "The server named an unexpected version: $version" ;;
  esac
  case "$url" in
    /*) ;;
    *) fail "The server named an unexpected download: $url" ;;
  esac
  case "$checksum" in
    *[!0-9a-f]*|'') fail "The server named an unexpected checksum: $checksum" ;;
  esac

  dest="$dir/versions/$version"
  if [ -x "$dest/bin/$product" ]; then
    say "$product $version for $target is already installed in $dest."
  else
    say "Downloading $product $version for $target from $server ..."
    run curl -fSL --progress-bar -H "$header: $token" -o "$tmp/$product.tar.gz" "$server$url"
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
else
  say "$cli is installed: $bin_dir/$cli"
fi
case ":$PATH:" in
  *":$bin_dir:"*) ;;
  *) say "Add $bin_dir to your PATH to run $cli from a shell: export PATH=\\"$bin_dir:\\$PATH\\"" ;;
esac
if [ "$runner" = 0 ]; then
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
