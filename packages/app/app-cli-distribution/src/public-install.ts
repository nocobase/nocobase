import { DIST_PRODUCT_PATTERN } from '@nocobase/agent-protocol';
import { npmLauncherScript } from '@nocobase/app-cli-client/install';
import {
  apiErrorResponse,
  cliRoute,
  describeRoute,
  type DescribeRouteOptions,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { requestedServer } from './install.js';

const SAFE_SERVER = /^https?:\/\/[A-Za-z0-9.:[\]_-]+(?:\/[A-Za-z0-9._~/-]*)?$/u;

export interface PublicInstallScriptOptions {
  readonly cli: string;
  readonly server?: string;
}

/** A separate CLI-only installer. It neither changes nor extends the protected installation protocol. */
export function publicInstallScript(
  options: PublicInstallScriptOptions,
): string {
  if (
    !DIST_PRODUCT_PATTERN.test(options.cli) ||
    options.cli === 'nocobase-runner'
  )
    throw new Error(`Not a CLI command name: ${options.cli}`);
  const server = options.server ?? '';
  return PUBLIC_INSTALL_SCRIPT.replaceAll('@CLI@', options.cli).replace(
    '@DEFAULT_SERVER@',
    SAFE_SERVER.test(server) ? server.replace(/\/+$/u, '') : '',
  );
}

export interface PublicInstallRoutesOptions {
  readonly cli: () => string;
  readonly publicOrigin?: () => string | undefined;
  readonly publicBasePath?: string;
  readonly openapi?: DescribeRouteOptions;
}

/** Mount explicitly alongside a host's independently configured public artifact admission. */
export function createPublicInstallRoutes(
  options: PublicInstallRoutesOptions,
): Hono {
  return new Hono().get(
    '/installScript',
    describeRoute(
      options.openapi ?? {
        tags: ['CliDistribution'],
        summary: 'Get the public CLI install script',
        operationId: 'cliDistributionPublicInstallScript',
        ...cliRoute(false),
        security: [],
        responses: {
          200: {
            description: 'A public CLI-only POSIX shell script.',
            content: { 'text/x-shellscript': { schema: { type: 'string' } } },
          },
          500: apiErrorResponse(500),
        },
      },
    ),
    (context) =>
      context.body(
        publicInstallScript({
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
}

// Kept independent of the protected script and its extension points, intentionally allowing some duplication.
const PUBLIC_INSTALL_SCRIPT = `#!/bin/sh
# Installs the publicly downloadable @CLI@ CLI. Business access requires a separate login.
set -eu
usage() {
  cat <<'USAGE'
Usage: install.sh [--server <url>] [--prefix <dir>] [--bin-dir <dir>] [--dry-run]

Requires Node.js 24+, curl, tar and a SHA-256 tool. Supports macOS/Linux and Windows through WSL.
USAGE
}
cli=@CLI@
server="@DEFAULT_SERVER@"
prefix="\${NOCOBASE_CLI_INSTALL_DIR:-}"
bin_dir="\${NOCOBASE_CLI_BIN_DIR:-}"
dry_run=0
while [ $# -gt 0 ]; do
  case "$1" in
    --server|--prefix|--bin-dir)
      [ $# -ge 2 ] && [ -n "$2" ] || { usage >&2; exit 2; }
      case "$1" in
        --server) server="$2" ;;
        --prefix) prefix="$2" ;;
        --bin-dir) bin_dir="$2" ;;
      esac
      shift 2 ;;
    --dry-run) dry_run=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo 'Unknown installation option.' >&2; usage >&2; exit 2 ;;
  esac
done
[ -n "$server" ] || { usage >&2; exit 2; }
say() { printf '%s\\n' "$*"; }
fail() { printf '%s install: %s\\n' "$cli" "$*" >&2; exit 1; }
run() { if [ "$dry_run" = 1 ]; then say "+ $*"; else "$@"; fi; }
case "$(uname -s)" in
  Darwin) os=darwin ;;
  Linux) os=linux ;;
  *) fail 'Use macOS, Linux or WSL.' ;;
esac
case "$(uname -m)" in
  arm64|aarch64) arch=arm64 ;;
  x86_64|amd64) arch=x64 ;;
  *) fail 'Unsupported processor.' ;;
esac
target="\${NOCOBASE_CLI_TARGET:-$os-$arch}"
node_bin="$(command -v node 2>/dev/null || true)"
[ -n "$node_bin" ] || fail 'Node.js 24 or newer is required.'
node_version="$("$node_bin" -p 'process.versions.node' 2>/dev/null || true)"
case "$node_version" in ''|*[!0-9.]*) fail 'Node.js 24 or newer is required.' ;; esac
[ "\${node_version%%.*}" -ge 24 ] || fail 'Node.js 24 or newer is required.'
# Validate without printing an invalid address, which could accidentally contain a credential.
server="$("$node_bin" -e 'try { const u = new URL(process.argv[1]); if (!["http:", "https:"].includes(u.protocol) || u.username || u.password || u.search || u.hash) throw Error(); console.log(u.href.replace(/\\/+$/, "")); } catch { process.exit(2); }' "$server")" || { echo 'Use an HTTP(S) application URL without credentials, query or fragment.' >&2; exit 2; }
prefix="\${prefix:-$HOME/.local/share/$cli}"
bin_dir="\${bin_dir:-$HOME/.local/bin}"
prefix="$("$node_bin" -e 'console.log(require("node:path").resolve(process.argv[1]))' "$prefix")"
bin_dir="$("$node_bin" -e 'console.log(require("node:path").resolve(process.argv[1]))' "$bin_dir")"
command -v curl >/dev/null 2>&1 || fail 'curl is required.'
command -v tar >/dev/null 2>&1 || fail 'tar is required.'
if command -v sha256sum >/dev/null 2>&1; then
  sha256() { sha256sum "$1" | cut -d ' ' -f 1; }
elif command -v shasum >/dev/null 2>&1; then
  sha256() { shasum -a 256 "$1" | cut -d ' ' -f 1; }
else
  fail 'sha256sum or shasum is required.'
fi
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT INT TERM
field() { sed -n "s/^$1=//p" "$tmp/resolve" | head -n 1; }
status="$(curl -sS -o "$tmp/resolve" -w '%{http_code}' "$server/api/agents/dist/products/$cli/targets/$target?format=env&accept=npm")" || fail 'Could not reach the application.'
[ "$status" = 200 ] || fail "The application answered $status while resolving the CLI."
version="$(field version)"
case "$version" in ''|.|..|*[!0-9A-Za-z.+-]*) fail 'The application named an unexpected version.' ;; esac
kind="$(field kind)"
dest="$prefix/versions/$version"
if [ "$kind" = npm ]; then
  package="$(field package)"
  case "$package" in ''|*[!0-9a-z@/._~-]*) fail 'The application named an unexpected npm package.' ;; esac
  npm_bin="\${NOCOBASE_NPM:-$(command -v npm 2>/dev/null || true)}"
  [ -n "$npm_bin" ] && [ -x "$npm_bin" ] || fail 'npm is required for this package.'
else
  url="$(field url)"
  checksum="$(field sha256)"
  case "$url" in /*) ;; *) fail 'The application named an unexpected download.' ;; esac
  case "$checksum" in *[!0-9a-f]*|'') fail 'The application named an unexpected checksum.' ;; esac
fi
if [ ! -x "$dest/bin/$cli" ]; then
  if [ "$kind" = npm ]; then
    run rm -rf "$dest.partial"
    run mkdir -p "$dest.partial"
    run "$npm_bin" install --prefix "$dest.partial" --no-save --no-audit --no-fund --omit=optional "$package@$version"
    if [ "$dry_run" = 0 ]; then
      [ -e "$dest.partial/node_modules/.bin/$cli" ] || fail 'The package provides no CLI command.'
      mkdir -p "$dest.partial/bin"
      cat <<'LAUNCHER' >"$dest.partial/bin/$cli"
${npmLauncherScript()}LAUNCHER
      chmod 755 "$dest.partial/bin/$cli"
    fi
    run mv "$dest.partial" "$dest"
  else
    run curl -fSL --progress-bar -o "$tmp/cli.tar.gz" "$server$url" || fail 'CLI download failed.'
    if [ "$dry_run" = 0 ]; then
      actual="$(sha256 "$tmp/cli.tar.gz")"
      [ "$actual" = "$checksum" ] || fail 'The download does not match its SHA-256.'
      say 'Checksum verified.'
    fi
    run rm -rf "$dest.partial"
    run mkdir -p "$dest.partial"
    run tar -xzf "$tmp/cli.tar.gz" -C "$dest.partial" --strip-components=1 || fail 'Could not unpack the CLI archive.'
    if [ "$dry_run" = 0 ]; then
      [ -x "$dest.partial/bin/$cli" ] || fail 'The archive provides no CLI command.'
    fi
    run mv "$dest.partial" "$dest"
  fi
fi
run ln -sfn "versions/$version" "$prefix/current"
run ln -sfn "$node_bin" "$prefix/node"
run mkdir -p "$bin_dir"
run ln -sfn "$prefix/current/bin/$cli" "$bin_dir/$cli"
if [ "$dry_run" = 0 ]; then
  "$node_bin" -e 'console.log(JSON.stringify({prefix: process.argv[1], binLink: process.argv[2], mode: "cli"}, null, 2))' "$prefix" "$bin_dir/$cli" >"$prefix/install.json"
fi
if [ "$dry_run" = 1 ]; then say 'Dry run: no installation was changed.'; else say "$cli is installed: $bin_dir/$cli"; fi
case ":$PATH:" in *":$bin_dir:"*) ;; *) say "Add $bin_dir to your PATH." ;; esac
say "Next: $cli login --server $server"
`;
