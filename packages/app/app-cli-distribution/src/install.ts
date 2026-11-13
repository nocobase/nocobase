import {
  DIST_PRODUCT_PATTERN,
  DIST_ROUTES,
  HEADERS,
} from '@nocobase/agent-protocol';
import { npmLauncherScript } from '@nocobase/app-cli-client/install';
import {
  apiErrorResponse,
  cliRoute,
  describeRoute,
  type DescribeRouteOptions,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';
const SAFE_SERVER = /^https?:\/\/[A-Za-z0-9.:[\]_-]+(?:\/[A-Za-z0-9._~/-]*)?$/u;
/** Trusted host-authored shell fragments; never derive these from requests or configuration. */
export interface InstallScriptExtensions {
  readonly intro?: string;
  readonly usage?: string;
  readonly command?: string;
  readonly name?: string;
  readonly prefix?: string;
  readonly variables?: string;
  readonly parseServer?: string;
  readonly parseRunner?: string;
  readonly parsePrefix?: string;
  readonly parseService?: string;
  readonly validate?: string;
  readonly defaultPrefix?: string;
  readonly credentials?: string;
  readonly pnpm?: string;
  readonly registered?: string;
  readonly resolveFailure?: string;
  readonly afterCli?: string;
  readonly next?: string;
  readonly productComment?: string;
  readonly npmInstallComment?: string;
}
export interface InstallScriptOptions {
  readonly cli: string;
  readonly server?: string;
  /** Generate a credential-free installer only for a product the host deliberately serves publicly. */
  readonly public?: boolean;
  readonly extensions?: InstallScriptExtensions;
}
export function installScript(options: InstallScriptOptions): string {
  if (
    !DIST_PRODUCT_PATTERN.test(options.cli) ||
    options.cli === 'nocobase-runner'
  )
    throw new Error(`Not a CLI command name: ${options.cli}`);
  const server = options.server ?? '';
  const fallback = SAFE_SERVER.test(server) ? server.replace(/\/+$/u, '') : '';
  const publicInstall = options.public === true;
  const extensions = {
    ...DEFAULT_EXTENSIONS,
    ...(publicInstall ? PUBLIC_EXTENSIONS : {}),
    ...options.extensions,
    tokenVariable: publicInstall ? '' : 'token=""\n',
    parseToken: publicInstall
      ? ''
      : '    --token) token="${2:-}"; shift 2 ;;\n',
    requireToken: publicInstall ? '' : ' || [ -z "$token" ]',
    resolveCredentials: publicInstall
      ? ''
      : `    -H "$header: $token" \\
`,
    downloadCredentials: publicInstall ? '' : ' -H "$header: $token"',
  };
  return INSTALL_SCRIPT_TEMPLATE.replace(
    /@([A-Za-z]+)@/gu,
    (marker, key: string) =>
      key in extensions
        ? (extensions[key as keyof typeof extensions] ?? '')
        : marker,
  )
    .replaceAll('@CLI@', options.cli)
    .replace('@DEFAULT_SERVER@', fallback);
}
export interface InstallRoutesOptions {
  readonly cli: () => string;
  /** Generate a public installer. Artifact admission must separately authorize anonymous requests. */
  readonly public?: boolean;
  readonly publicOrigin?: () => string | undefined;
  readonly publicBasePath?: string;
  readonly extensions?: InstallScriptExtensions;
  readonly openapi?: DescribeRouteOptions;
}
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

const DEFAULT_EXTENSIONS: Required<InstallScriptExtensions> = {
  intro: `# Installs the @CLI@ CLI this application serves.
#   curl -fsSL <server>/api/agents/dist/installScript | sh -s -- --token <download token> [options]
`,
  usage: `Usage: install.sh --token <token> [--server <url>] [options]

  --token <token>         A download token for the CLI
  --server <url>          The application (defaults to the script's application)
  --prefix <dir>          Where to install @CLI@ (default: ~/.local/share/@CLI@, or NOCOBASE_CLI_INSTALL_DIR)
  --bin-dir <dir>         Where to link the command (default: ~/.local/bin, or NOCOBASE_CLI_BIN_DIR)
  --dry-run               Print what would be done, and change nothing`,
  command: ``,
  name: ``,
  prefix: ``,
  variables: ``,
  parseServer: `    --server) server="\${2:-}"; shift 2 ;;`,
  parseRunner: ``,
  parsePrefix: ``,
  parseService: ``,
  validate: ``,
  defaultPrefix: ``,
  credentials: `header="${HEADERS.downloadToken}"
`,
  pnpm: ``,
  registered: ``,
  resolveFailure: `  if [ "$status" = 401 ] && [ -x "$dir/current/bin/$product" ]; then
    say "The token was not accepted (used up or expired), but $product is installed in $dir already; run \\"$product update\\" to update it."
    installed=kept
    return 0
  elif [ "$status" != 200 ]; then
    message="$(sed -n 's/.*"message":"\\([^"]*\\)".*/\\1/p' "$tmp/resolve")"
    fail "$server answered $status: \${message:-$(cat "$tmp/resolve")}"
  fi`,
  afterCli: `say "$cli is installed: $bin_dir/$cli"
`,
  next: `say "Next: $cli login --server $server"`,
  npmInstallComment: `    # Optional platform binaries are not needed by this installation.`,
  productComment: `# Installs one product and records its installation.
`,
};
const PUBLIC_EXTENSIONS: InstallScriptExtensions = {
  intro: `# Installs the publicly downloadable @CLI@ CLI. Business commands require a separate login.
#   curl -fsSL <server>/api/agents/dist/installScript | sh -s -- [options]
`,
  usage: `Usage: install.sh [--server <url>] [options]

  --server <url>          The application (defaults to the script's application)
  --prefix <dir>          Where to install @CLI@ (default: ~/.local/share/@CLI@, or NOCOBASE_CLI_INSTALL_DIR)
  --bin-dir <dir>         Where to link the command (default: ~/.local/bin, or NOCOBASE_CLI_BIN_DIR)
  --dry-run               Print what would be done, and change nothing

No download credential is required. Business commands require a separate login.`,
  credentials: '',
  resolveFailure: `  if [ "$status" != 200 ]; then
    message="$(sed -n 's/.*"message":"\\([^"]*\\)".*/\\1/p' "$tmp/resolve")"
    fail "$server answered $status: \${message:-$(cat "$tmp/resolve")}"
  fi`,
};
const INSTALL_SCRIPT_TEMPLATE = `#!/bin/sh
@intro@set -eu

usage() {
  cat <<'USAGE'
@usage@
USAGE
}

cli=@CLI@
@command@
server="@DEFAULT_SERVER@"
server_explicit=0
@tokenVariable@@name@
prefix="\${NOCOBASE_CLI_INSTALL_DIR:-}"
@prefix@
bin_dir="\${NOCOBASE_CLI_BIN_DIR:-}"
@variables@
dry_run=0
while [ $# -gt 0 ]; do
  case "$1" in
@parseServer@
@parseToken@@parseRunner@
    --prefix) prefix="\${2:-}"; shift 2 ;;
@parsePrefix@
    --bin-dir) bin_dir="\${2:-}"; shift 2 ;;
@parseService@
    --dry-run) dry_run=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done
@validate@
if [ -z "$server" ]@requireToken@; then
  usage >&2
  exit 2
fi
server="\${server%/}"
prefix="\${prefix:-$HOME/.local/share/$cli}"
@defaultPrefix@
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

@credentials@
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

@pnpm@
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT INT TERM
@registered@
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
  if [ -z "$npm_bin" ] || [ ! -x "$npm_bin" ]; then
    fail "$1 is installed from npm, and npm is not on PATH. npm comes with Node.js: install Node.js 24 or newer from https://nodejs.org/en/download (a version manager such as nvm installs npm too), or set NOCOBASE_NPM to its path, and run this command again."
  fi
}

# The launcher of a version installed from npm: <version>/bin/<command> starts node_modules/.bin/<command> with the
# first Node.js 24 or newer it finds, as the universal tarball's launcher does.
write_npm_launcher() {
  cat <<'LAUNCHER'
${npmLauncherScript()}LAUNCHER
}

@productComment@install_product() {
  product="$1"
  dir="$2"
  mode="$3"
  installed=new
  status="$(curl -sS -o "$tmp/resolve" -w '%{http_code}' \\
@resolveCredentials@    "$server/api/agents/dist/products/$product/targets/$target?format=env&accept=npm")" ||
    fail "Could not reach $server."
@resolveFailure@
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
@npmInstallComment@
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
    run curl -fSL --progress-bar@downloadCredentials@ -o "$tmp/$product.tar.gz" "$server$url"
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
previous_cli="$(readlink "$prefix/current" 2>/dev/null || true)"
install_product "$cli" "$prefix" cli
# Reuse the saved ACP service definitions after switching current, including every profile.
if [ "$installed" = new ] && [ "$previous_cli" != "$(readlink "$prefix/current" 2>/dev/null || true)" ]; then
  run "$prefix/current/bin/$cli" acp service restart || say "Could not restart background connections. Run $cli acp service restart to retry."
fi
@afterCli@
case ":$PATH:" in
  *":$bin_dir:"*) ;;
  *) say "Add $bin_dir to your PATH to run $cli from a shell: export PATH=\\"$bin_dir:\\$PATH\\"" ;;
esac
@next@
`;
export function createInstallRoutes(options: InstallRoutesOptions): Hono {
  const router = new Hono();
  router.get(
    '/installScript',
    describeRoute(
      options.openapi ?? {
        tags: ['CliDistribution'],
        summary: 'Get the CLI install script',
        operationId: 'cliDistributionInstallScript',
        ...cliRoute(false),
        security: [],
        responses: {
          200: {
            description: 'A POSIX shell script.',
            content: { 'text/x-shellscript': { schema: { type: 'string' } } },
          },
          500: apiErrorResponse(500),
        },
      },
    ),
    (context) =>
      context.body(
        installScript({
          cli: options.cli(),
          ...(options.public === true ? { public: true } : {}),
          server: requestedServer(context, options),
          ...(options.extensions ? { extensions: options.extensions } : {}),
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
