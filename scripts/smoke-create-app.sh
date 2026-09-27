#!/usr/bin/env bash
#
# Generates an application with create-app, runs its tests, checks dev, builds it with --tar, starts it in production
# mode, deploys the resulting dist.tar.gz the way a server would and starts that copy, then retargets the native
# modules for another platform.
# Every package can build, typecheck and test in this repository and still produce an application that
# does not start, because what a generated application installs is decided by published manifests rather than by the
# workspace links everything resolves through here.
#
# The versions are given explicitly rather than resolved through a dist-tag. On a proxying registry a dist-tag is the
# higher of the local and the upstream value, so `latest` there is not the `latest` a user would get — and during a
# hotfix release, where the version being tested is deliberately older than the one upstream, it would resolve to a
# version this run never produced.
#
# Usage:
#   scripts/smoke-create-app.sh \
#     --registry http://localhost:4873 \
#     --create-app-version 0.1.0-beta.12 \
#     --template @nocobase/app-template-default@0.1.0-beta.12 \
#     [--workdir DIR] [--timeout SECONDS] [--dialect DIALECT] [--config FILE] [--json]

set -euo pipefail

REGISTRY=''
CREATE_APP_VERSION=''
TEMPLATE=''
WORKDIR=''
TIMEOUT=420
APP_NAME='crm'
DIALECT=''
CONFIG=''
JSON_OUTPUT=0
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

while [ $# -gt 0 ]; do
  case "$1" in
    --registry) REGISTRY="$2"; shift 2 ;;
    --create-app-version) CREATE_APP_VERSION="$2"; shift 2 ;;
    --template) TEMPLATE="$2"; shift 2 ;;
    --workdir) WORKDIR="$2"; shift 2 ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --dialect) DIALECT="$2"; shift 2 ;;
    --config) CONFIG="$2"; shift 2 ;;
    --json) JSON_OUTPUT=1; shift ;;
    --app-name) APP_NAME="$2"; shift 2 ;;
    -h|--help) sed -n '2,24p' "$0"; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$REGISTRY" ] || [ -z "$CREATE_APP_VERSION" ] || [ -z "$TEMPLATE" ]; then
  echo "::error::--registry, --create-app-version and --template are all required" >&2
  exit 2
fi

if [ -z "$WORKDIR" ]; then
  WORKDIR="$(mktemp -d)"
fi
mkdir -p "$WORKDIR"
WORKDIR="$(cd "$WORKDIR" && pwd)"
if [ -n "$(ls -A "$WORKDIR")" ]; then
  echo "Test workdir must be empty: $WORKDIR" >&2
  exit 2
fi
if ! [[ "$APP_NAME" =~ ^[a-z0-9][a-z0-9._-]*$ ]] || ! [[ "$TIMEOUT" =~ ^[1-9][0-9]*$ ]]; then
  echo "Invalid app name or timeout" >&2
  exit 2
fi
if [ -n "$CONFIG" ]; then
  CONFIG=$(node -e 'console.log(require("node:path").resolve(process.argv[1]))' "$CONFIG")
fi

APP_DIR="$WORKDIR/$APP_NAME"
DEV_LOG="$WORKDIR/dev.log"
TEST_LOG="$WORKDIR/test.log"
BUILD_LOG="$WORKDIR/build.log"
START_LOG="$WORKDIR/start.log"

# A freshly published version is minutes old, and pnpm refuses packages younger than the configured minimum release
# age. Both the create-app download and the generated application's own install have to see this.
export PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
# Both spellings, because the two tools disagree about which one exists. pnpm 11 reads PNPM_CONFIG_<SETTING> and
# ignores npm_config_* entirely, while npm reads npm_config_* and knows nothing about the pnpm form. `pnpm create`
# resolves through pnpm, and create-app shells out to both, so setting only one silently leaves half of this pointed
# at whatever registry the machine is configured for.
export PNPM_CONFIG_REGISTRY="$REGISTRY"
export npm_config_registry="$REGISTRY"
export NPM_CONFIG_REGISTRY="$REGISTRY"
# create-app reads this when --registry is not given; passing both keeps the generated application's install pointed
# at the same place even if the flag handling changes.
export NOCOBASE_REGISTRY="$REGISTRY"

# An override that silently did not apply would test packages from the wrong registry and report success, so it is
# confirmed rather than assumed.
for tool in pnpm npm; do
  resolved="$("$tool" config get registry 2>/dev/null | tr -d '\r' | tail -1)"
  case "$resolved" in
    "$REGISTRY"|"$REGISTRY/") ;;
    *)
      echo "::error::$tool resolves the registry to '$resolved', not '$REGISTRY'" >&2
      exit 1
      ;;
  esac
done

echo "::group::Create the application"
echo "registry:    $REGISTRY"
echo "create-app:  $CREATE_APP_VERSION"
echo "template:    $TEMPLATE"
echo "workdir:     $WORKDIR"

cd "$WORKDIR"

CREATE_ARGS=("@nocobase/app@$CREATE_APP_VERSION" "$APP_NAME" "--registry=$REGISTRY" "--template=$TEMPLATE")
if [ "$JSON_OUTPUT" = 1 ]; then
  pnpm create "${CREATE_ARGS[@]}" --json > "$WORKDIR/create.json"
  node -e 'const r=JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")); if(r.status!=="success" || !r.dependenciesInstalled) process.exit(1)' "$WORKDIR/create.json"
else
  pnpm create "${CREATE_ARGS[@]}"
fi
echo "::endgroup::"

if [ ! -d "$APP_DIR/node_modules" ]; then
  echo "::error::create-app finished without installing dependencies into $APP_DIR"
  exit 1
fi

# Creation deliberately leaves the application unconfigured; `config init` is what writes this file.
if [ -e "$APP_DIR/config.yml" ]; then
  echo "::error::create-app wrote config.yml, which config init owns"
  exit 1
fi

cd "$APP_DIR"

echo "::group::Configure the application with pnpm nocobase config init"
# Which dialects an application can run on is decided by the driver it depends on, so a non-SQLite run installs one
# first — exactly the two commands the documentation gives a user switching databases.
if [ -n "$DIALECT" ] && [ "$DIALECT" != "sqlite" ]; then
  pnpm add "@nocobase/db-$DIALECT"
fi
CONFIG_INIT_ARGS=("--json")
if [ -n "$DIALECT" ]; then CONFIG_INIT_ARGS+=("--dialect=$DIALECT"); fi
pnpm nocobase config init "${CONFIG_INIT_ARGS[@]}" > "$WORKDIR/config-init.json"
node -e 'const r=JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")); if(!r.ok) process.exit(1)' "$WORKDIR/config-init.json"
if [ ! -f "$APP_DIR/config.yml" ]; then
  echo "::error::pnpm nocobase config init reported success without writing config.yml"
  exit 1
fi
if [ -n "$CONFIG" ]; then
  node "$SCRIPT_DIR/smoke-database-config.mjs" "$APP_DIR/config.yml" "$CONFIG" "$DIALECT"
fi
echo "::endgroup::"

echo "::group::Check the configuration with pnpm nocobase config check"
# Loads the configuration through the application and, for anything but SQLite, connects to the database — so a
# broken configuration fails here with a named cause rather than as a startup that never becomes ready.
if ! pnpm nocobase config check --json > "$WORKDIR/config-check.json"; then
  cat "$WORKDIR/config-check.json"
  echo "::error::pnpm nocobase config check reported a problem with the generated configuration"
  exit 1
fi
echo "::endgroup::"
echo "::group::Synchronize NocoBase package Skills"
# create-app reports a synchronization failure as a warning. Exercise the command
# explicitly so an invalid published Skill cannot pass this smoke test.
pnpm nocobase skills sync
echo "::endgroup::"

echo "::group::Test the application with pnpm test"
if ! pnpm test 2>&1 | tee "$TEST_LOG"; then
  echo "::endgroup::"
  echo "::error::pnpm test failed"
  exit 1
fi
echo "::endgroup::"

echo "::group::Boot the application with pnpm dev"

# `pnpm dev` does not exit on success — it holds the client and server processes open — so it runs in the background
# and is judged by what it prints. The template's dev entry only prints this line after both the Vite dev server and
# the application server's /api/healthz have answered, and it exits non-zero when either fails to come up or a child
# dies, so the two outcomes this loop watches for are the two the script actually has.
READY_MARKER='App dev server ready'

# Every request here goes to the loopback address the application was told to listen on, so a proxy configured in
# the shell must not see it: routed through one, a refused connection becomes a timeout and a healthy server an
# unreachable one. `--noproxy '*'` is on every curl for that reason.
# Job control, so the background job becomes its own process group and the whole tree can be signalled at the end.
# Killing the pnpm process alone would leave vite and tsx running, and the job would hang waiting on them. `setsid`
# would do the same thing but does not exist on macOS, where this script is also run by hand.
set -m
NOCOBASE_STRICT_STARTUP=true pnpm dev > "$DEV_LOG" 2>&1 &
APP_PID=$!
set +m

stop_app() {
  # Check the group even if pnpm has already exited: its children may still own the port.
  if kill -0 -"$APP_PID" 2>/dev/null; then
    kill -TERM -"$APP_PID" 2>/dev/null || true
    for _ in $(seq 1 20); do
      kill -0 -"$APP_PID" 2>/dev/null || break
      sleep 0.5
    done
    kill -KILL -"$APP_PID" 2>/dev/null || true
  fi
  wait "$APP_PID" 2>/dev/null || true
}
trap stop_app EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Asks the OS for an available loopback port rather than assuming the development or default port is free.
free_port() {
  node --input-type=module -e '
    import net from "node:net";
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      console.log(server.address().port);
      server.close();
    });
  '
}

# Waits for a production process started in the background as $APP_PID to answer /api/healthz, then checks that it
# serves its homepage, is still alive, and discovered its jobs. Shared by `pnpm start` and the deployed archive so
# the two are judged by the same evidence. Arguments: label for messages, base URL, log file.
wait_for_production() {
  local label="$1" url="$2" log="$3"
  local ready=0 exited=0 deadline next_progress http_status=''
  echo "Waiting up to ${TIMEOUT}s for $url/api/healthz"
  deadline=$((SECONDS + TIMEOUT))
  next_progress=$SECONDS
  while [ "$SECONDS" -lt "$deadline" ]; do
    if ! kill -0 "$APP_PID" 2>/dev/null; then
      exited=1
      break
    fi
    if http_status=$(curl -sS --noproxy '*' --max-time 2 --write-out '%{http_code}' "$url/api/healthz" -o "$WORKDIR/health.json" 2>/dev/null) \
      && [ "$http_status" = '200' ] \
      && node -e 'const fs = require("node:fs"); try { process.exit(JSON.parse(fs.readFileSync(process.argv[1], "utf8")).ok === true ? 0 : 1); } catch { process.exit(1); }' "$WORKDIR/health.json"; then
      ready=1
      break
    fi
    if [ "$SECONDS" -ge "$next_progress" ]; then
      echo "Still waiting for production health: HTTP ${http_status:-000}; $((deadline - SECONDS))s remaining"
      # Progress diagnostics must not abort the readiness check when the log is temporarily unavailable.
      tail -n 10 "$log" || true
      next_progress=$((SECONDS + 15))
    fi
    sleep 1
  done

  if [ "$ready" != "1" ]; then
    echo "::endgroup::"
    if [ "$exited" = "1" ]; then
      echo "::error::$label exited before the application became ready"
    else
      echo "::error::$label did not become ready within ${TIMEOUT}s"
    fi
    cat "$log"
    exit 1
  fi

  if ! curl -fsS --noproxy '*' --max-time 30 "$url/" -o /dev/null || ! kill -0 "$APP_PID" 2>/dev/null; then
    echo "::endgroup::"
    echo "::error::The production application started by $label did not serve its homepage or exited after becoming ready"
    cat "$log"
    exit 1
  fi

  if grep -qF 'Failed to load job from ' "$log"; then
    echo "::error::Job discovery failed during production startup ($label)"
    cat "$log"
    exit 1
  fi

  cat "$log"
  echo "Production application started by $label is serving at $url/"
}

READY=0
EXITED=0
for _ in $(seq 1 "$TIMEOUT"); do
  if grep -qF "$READY_MARKER" "$DEV_LOG" 2>/dev/null; then
    READY=1
    break
  fi
  if ! kill -0 "$APP_PID" 2>/dev/null; then
    EXITED=1
    break
  fi
  sleep 1
done

if [ "$READY" != "1" ]; then
  echo "::endgroup::"
  if [ "$EXITED" = "1" ]; then
    echo "::error::pnpm dev exited before the application became ready"
  else
    echo "::error::pnpm dev did not become ready within ${TIMEOUT}s"
  fi
  echo "----- dev.log -----"
  cat "$DEV_LOG"
  exit 1
fi

# The readiness line is followed by the URL the application is served on, and the port is not fixed: the dev entry
# falls back to another one when its preferred port is taken. Reading it back is both how the URL is discovered and a
# check that the line means what it says.
APP_URL="$(grep -F 'Local:' "$DEV_LOG" | tail -1 | awk '{print $2}')"

if [ -z "$APP_URL" ]; then
  echo "::endgroup::"
  echo "::error::The application reported ready but printed no URL"
  cat "$DEV_LOG"
  exit 1
fi

if grep -qF 'Failed to load job from ' "$DEV_LOG"; then
  echo "::error::Job discovery failed during development startup"
  cat "$DEV_LOG"
  exit 1
fi

echo "Application is serving at $APP_URL"

if ! curl -fsS --noproxy '*' --max-time 30 "$APP_URL" -o /dev/null; then
  echo "::endgroup::"
  echo "::error::$APP_URL did not answer after the application reported ready"
  cat "$DEV_LOG"
  exit 1
fi

echo "::endgroup::"

# Dev must be gone before building or probing production, otherwise it can answer requests on behalf of a broken start.
stop_app
trap - EXIT

echo "::group::Build the application with pnpm build --tar"
# --tar is what a deployment build runs: the archive it produces is deployed below the way a server would deploy it.
if ! pnpm build --tar 2>&1 | tee "$BUILD_LOG"; then
  echo "::endgroup::"
  echo "::error::pnpm build failed"
  exit 1
fi
echo "::endgroup::"

echo "::group::Boot the application with pnpm start"
START_PORT=$(free_port)
# Reuse the generated application's public path from dev; the default template mounts at /main, not at /.
APP_PATH=$(node -e 'console.log(new URL(process.argv[1]).pathname.replace(/\/+$/, ""))' "$APP_URL")
START_URL="http://127.0.0.1:$START_PORT$APP_PATH"
# Create the log before forking so the progress loop cannot race the child's output redirection.
: > "$START_LOG"
set -m
NOCOBASE_STRICT_STARTUP=true APP_SERVER_HOST=127.0.0.1 APP_SERVER_PORT="$START_PORT" pnpm start > "$START_LOG" 2>&1 &
APP_PID=$!
set +m
trap stop_app EXIT
wait_for_production 'pnpm start' "$START_URL" "$START_LOG"
echo "::endgroup::"

# The production process must be gone before the deployed copy starts, so a request cannot be answered by the wrong one.
stop_app
trap - EXIT

echo "::group::Deploy the dist.tar.gz archive"
# What `pnpm build --tar` packed is what a server receives. Deploying it into an empty directory the way the deployment
# guide describes — extract, add config.yml, add storage, start `node ./dist/server/standalone.js` — is the only check
# that the archive is complete: a file that `pnpm start` finds in the application checkout and the archive omits fails
# only here.
ARCHIVE="$APP_DIR/storage/exports/dist.tar.gz"
ARCHIVE_LIST="$WORKDIR/archive.txt"
DEPLOY_DIR="$WORKDIR/deploy"
DEPLOY_LOG="$WORKDIR/deploy.log"
if [ ! -f "$ARCHIVE" ]; then
  echo "::endgroup::"
  echo "::error::pnpm build --tar did not produce storage/exports/dist.tar.gz"
  exit 1
fi
if ! tar -tzf "$ARCHIVE" > "$ARCHIVE_LIST"; then
  echo "::endgroup::"
  echo "::error::storage/exports/dist.tar.gz cannot be read to the end"
  exit 1
fi
for entry in 'config\.example\.yml' 'dist/package\.json' 'dist/server/standalone\.js'; do
  if ! grep -qE "^(\./)?${entry}$" "$ARCHIVE_LIST"; then
    echo "::endgroup::"
    echo "::error::dist.tar.gz does not contain ${entry//\\/}"
    head -n 30 "$ARCHIVE_LIST"
    exit 1
  fi
done
# The archive carries code and an example configuration, never the real configuration or data of the machine that
# built it: a config.yml holds secrets, and storage holds the database of the checkout.
if grep -qE '^(\./)?(config\.yml|\.env|storage(/|$))' "$ARCHIVE_LIST"; then
  echo "::endgroup::"
  echo "::error::dist.tar.gz contains runtime configuration or data that must stay out of a deployment package"
  grep -E '^(\./)?(config\.yml|\.env|storage(/|$))' "$ARCHIVE_LIST"
  exit 1
fi
echo "Archive holds $(wc -l < "$ARCHIVE_LIST" | tr -d ' ') entries"

mkdir "$DEPLOY_DIR"
tar -xzf "$ARCHIVE" -C "$DEPLOY_DIR"
# The generated application's config.yml is reused as the deployment's configuration: the same settings and secrets
# `pnpm start` ran with, placed beside dist where the deployment guide puts it and named through APP_CONFIG_FILE.
# The sqlite path in it is relative, so it resolves against this deployment root: the extracted copy initialises its
# own storage rather than opening the database `pnpm start` used.
cp "$APP_DIR/config.yml" "$DEPLOY_DIR/config.yml"
mkdir -p "$DEPLOY_DIR/storage"
# The deployment guide checks the configuration from inside dist before starting, with the build's own CLI. This is the
# only place dist/cli is run at all, so a CLI that builds but does not run in a deployment fails here.
if ! (cd "$DEPLOY_DIR/dist" && APP_CONFIG_FILE="$DEPLOY_DIR/config.yml" pnpm nocobase config check --json > "$WORKDIR/deploy-config-check.json"); then
  cat "$WORKDIR/deploy-config-check.json"
  echo "::error::pnpm nocobase config check failed in the deployed archive"
  exit 1
fi

DEPLOY_PORT=$(free_port)
DEPLOY_URL="http://127.0.0.1:$DEPLOY_PORT$APP_PATH"
: > "$DEPLOY_LOG"
cd "$DEPLOY_DIR"
set -m
# The archive is not tied to a mount path and carries none, so the server is given one the way a deployment gives it:
# the same path the checkout served, which for the Hub is /hub rather than the server's /main default.
NODE_ENV=production NOCOBASE_STRICT_STARTUP=true APP_CONFIG_FILE="$DEPLOY_DIR/config.yml" \
  APP_BASE_PATH="$APP_PATH" APP_SERVER_HOST=127.0.0.1 APP_SERVER_PORT="$DEPLOY_PORT" \
  node ./dist/server/standalone.js > "$DEPLOY_LOG" 2>&1 &
APP_PID=$!
set +m
cd "$APP_DIR"
trap stop_app EXIT
wait_for_production 'the deployed archive' "$DEPLOY_URL" "$DEPLOY_LOG"
echo "::endgroup::"

stop_app
trap - EXIT

echo "::group::Retarget native modules for another platform"
# A deployment build targets the server it is shipped to, which is rarely the machine that builds it. Retargeting the
# installed tree for a platform this machine is not exercises the cross-platform path — fetching the target's binaries
# and dropping the others — and records what was targeted. Last, because the tree no longer runs here afterwards.
OTHER_TARGET=$(node -e 'console.log(process.platform === "linux" && process.arch === "x64" ? "linux-arm64" : "linux-x64")')
RETARGET_LOG="$WORKDIR/retarget.log"
echo "Retargeting for $OTHER_TARGET"
if ! pnpm nocobase dist retarget --target "$OTHER_TARGET" --node-version 24 2>&1 | tee "$RETARGET_LOG"; then
  echo "::endgroup::"
  echo "::error::Retargeting native modules for $OTHER_TARGET failed"
  exit 1
fi
if ! node --input-type=module -e '
  import fs from "node:fs";
  import path from "node:path";
  const [distDir, target] = process.argv.slice(1);
  const [platform, arch] = target.split("-");
  const recorded = JSON.parse(fs.readFileSync(path.join(distDir, "package.json"), "utf8")).nocobase?.buildTarget;
  if (recorded?.platform !== platform || recorded?.arch !== arch || recorded?.nodeMajor !== 24) {
    console.error(`dist/package.json records build target ${JSON.stringify(recorded)}, expected ${target} for Node 24`);
    process.exit(1);
  }
  // A binary whose name identifies another platform is dead weight the retarget promised to remove.
  const wanted = `${platform}-${arch}`;
  const foreign = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith(".node") && /(darwin|linux|linuxmusl|win32|android)-/u.test(entry.name) && !entry.name.includes(wanted)) foreign.push(path.relative(distDir, file));
    }
  };
  walk(path.join(distDir, "node_modules"));
  if (foreign.length > 0) {
    console.error(`Binaries for other platforms remain after retargeting for ${target}:\n  ${foreign.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`dist/package.json records ${target} (Node ABI ${recorded.nodeAbi}) and no binary names another platform.`);
' "$APP_DIR/dist" "$OTHER_TARGET"; then
  echo "::endgroup::"
  echo "::error::The retargeted build is not consistent with $OTHER_TARGET"
  exit 1
fi
echo "::endgroup::"
echo "create-app smoke test passed: $TEMPLATE passed test, dev, build, start, archive deployment, and retarget for $OTHER_TARGET."
