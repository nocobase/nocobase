#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf '%s\n' "Usage: $0 [--server-url <url>] [--node-key <key>] [--package <npm-package>] [--config <path>] [--service-name <name>]"
  printf '%s\n' "Pass values through flags or AGENT_GATEWAY_SERVER_URL, AGENT_GATEWAY_NODE_KEY, and AGENT_GATEWAY_INVITE_TOKEN."
}

SERVER_URL="${AGENT_GATEWAY_SERVER_URL:-}"
NODE_KEY="${AGENT_GATEWAY_NODE_KEY:-}"
PACKAGE_NAME="${AGENT_GATEWAY_DAEMON_PACKAGE:-@nocobase/plugin-agent-gateway}"
DAEMON_PACKAGE_URL="${AGENT_GATEWAY_DAEMON_PACKAGE_URL:-}"
CONFIG_PATH="${AGENT_GATEWAY_CONFIG_PATH:-}"
WORKSPACE_ROOT="${AGENT_GATEWAY_WORKSPACE_ROOT:-$PWD}"
POLL_INTERVAL_MS="${AGENT_GATEWAY_POLL_INTERVAL_MS:-2000}"
RUN_HEARTBEAT_INTERVAL_MS="${AGENT_GATEWAY_RUN_HEARTBEAT_INTERVAL_MS:-3000}"
SESSION_NAME="${AGENT_GATEWAY_TMUX_SESSION:-agent-gateway-daemon}"
AGENT_GATEWAY_HOME_DIR="${AGENT_GATEWAY_HOME:-$HOME/.agent-gateway-daemon}"
SERVICE_NAME="${AGENT_GATEWAY_SYSTEMD_SERVICE_NAME:-agent-gateway-daemon}"
INSTALL_SYSTEMD="${AGENT_GATEWAY_INSTALL_SYSTEMD:-auto}"
RESTART_DELAY_SECONDS="${AGENT_GATEWAY_RESTART_DELAY_SECONDS:-5}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --server-url)
      SERVER_URL="${2:-}"
      shift 2
      ;;
    --node-key)
      NODE_KEY="${2:-}"
      shift 2
      ;;
    --package)
      PACKAGE_NAME="${2:-}"
      shift 2
      ;;
    --config)
      CONFIG_PATH="${2:-}"
      shift 2
      ;;
    --workspace-root)
      WORKSPACE_ROOT="${2:-}"
      shift 2
      ;;
    --service-name)
      SERVICE_NAME="${2:-}"
      shift 2
      ;;
    --no-systemd)
      INSTALL_SYSTEMD="false"
      shift 1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf '%s\n' "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ -z "$SERVER_URL" ]; then
  usage >&2
  exit 1
fi

if [ -z "$NODE_KEY" ]; then
  printf '%s\n' "Node key is required through --node-key or AGENT_GATEWAY_NODE_KEY." >&2
  exit 1
fi

if [ -z "${AGENT_GATEWAY_INVITE_TOKEN:-}" ]; then
  IFS= read -r AGENT_GATEWAY_INVITE_TOKEN || true
fi

if [ -z "${AGENT_GATEWAY_INVITE_TOKEN:-}" ]; then
  printf '%s\n' "Invitation token is required through AGENT_GATEWAY_INVITE_TOKEN or stdin." >&2
  exit 1
fi

daemon_command_supports_register() {
  "$@" --help 2>/dev/null | grep -q 'register'
}

download_file() {
  local url="$1"
  local output="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$output"
    return
  fi
  if command -v wget >/dev/null 2>&1; then
    wget -qO "$output" "$url"
    return
  fi
  printf '%s\n' "curl or wget is required to download the Agent Gateway daemon package." >&2
  exit 1
}

install_packaged_daemon() {
  if ! command -v tar >/dev/null 2>&1; then
    printf '%s\n' "tar is required to unpack the Agent Gateway daemon package." >&2
    exit 1
  fi

  mkdir -p "$AGENT_GATEWAY_HOME_DIR"
  local package_archive
  package_archive="$(mktemp)"
  local package_dir="$AGENT_GATEWAY_HOME_DIR/package"
  download_file "$DAEMON_PACKAGE_URL" "$package_archive"
  rm -rf "$package_dir"
  mkdir -p "$package_dir"
  tar -xzf "$package_archive" -C "$package_dir"
  rm -f "$package_archive"
  if [ ! -f "$package_dir/package/daemon.js" ]; then
    printf '%s\n' "Downloaded Agent Gateway daemon package does not contain daemon.js." >&2
    exit 1
  fi
  DAEMON_CMD=(node "$package_dir/package/daemon.js")
}

DAEMON_CMD=()
if [ -f "$PWD/packages/plugins/@nocobase/plugin-agent-gateway/daemon.js" ]; then
  DAEMON_CMD=(node "$PWD/packages/plugins/@nocobase/plugin-agent-gateway/daemon.js")
elif [ -f "$WORKSPACE_ROOT/packages/plugins/@nocobase/plugin-agent-gateway/daemon.js" ]; then
  DAEMON_CMD=(node "$WORKSPACE_ROOT/packages/plugins/@nocobase/plugin-agent-gateway/daemon.js")
else
  if [ -z "$DAEMON_PACKAGE_URL" ]; then
    DAEMON_PACKAGE_URL="${SERVER_URL%/}/api/agent-gateway/daemon-package.tgz"
  fi
  install_packaged_daemon
  if ! daemon_command_supports_register "${DAEMON_CMD[@]}" && command -v agent-gateway-daemon >/dev/null 2>&1 && daemon_command_supports_register agent-gateway-daemon; then
    DAEMON_CMD=(agent-gateway-daemon)
  fi
fi

if ! daemon_command_supports_register "${DAEMON_CMD[@]}"; then
  printf '%s\n' "agent-gateway-daemon is unavailable or does not support the register command." >&2
  exit 1
fi

REGISTER_ARGS=(register --server-url "$SERVER_URL" --node-key "$NODE_KEY" --invite-token-stdin)
if [ -n "$CONFIG_PATH" ]; then
  REGISTER_ARGS+=(--config "$CONFIG_PATH")
fi

RUN_CONFIG_ARGS=()
CONFIG_MATCH_PATH="${CONFIG_PATH:-$AGENT_GATEWAY_HOME_DIR/config.json}"
if [ -n "$CONFIG_PATH" ]; then
  RUN_CONFIG_ARGS+=(--config "$CONFIG_PATH")
fi

if [ -f "$CONFIG_MATCH_PATH" ] &&
  node -e 'const fs = require("fs"); const config = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); process.exit(config.serverUrl === process.argv[2] && config.nodeKey === process.argv[3] ? 0 : 1);' "$CONFIG_MATCH_PATH" "$SERVER_URL" "$NODE_KEY" &&
  "${DAEMON_CMD[@]}" heartbeat "${RUN_CONFIG_ARGS[@]}" >/dev/null 2>&1; then
  printf 'Existing Agent Gateway daemon registration is still valid for node: %s\n' "$NODE_KEY"
else
  printf '%s' "$AGENT_GATEWAY_INVITE_TOKEN" | "${DAEMON_CMD[@]}" "${REGISTER_ARGS[@]}"
fi
unset AGENT_GATEWAY_INVITE_TOKEN

mkdir -p "$AGENT_GATEWAY_HOME_DIR"
RUN_SCRIPT="$AGENT_GATEWAY_HOME_DIR/run.sh"
LOG_FILE="$AGENT_GATEWAY_HOME_DIR/daemon.log"
DAEMON_COMMAND="$(printf '%q ' "${DAEMON_CMD[@]}")"
WORKSPACE_ROOT_QUOTED="$(printf '%q' "$WORKSPACE_ROOT")"
POLL_INTERVAL_MS_QUOTED="$(printf '%q' "$POLL_INTERVAL_MS")"
RUN_HEARTBEAT_INTERVAL_MS_QUOTED="$(printf '%q' "$RUN_HEARTBEAT_INTERVAL_MS")"
RUN_CONFIG_COMMAND=""
if [ "${#RUN_CONFIG_ARGS[@]}" -gt 0 ]; then
  RUN_CONFIG_COMMAND="$(printf '%q ' "${RUN_CONFIG_ARGS[@]}")"
fi
cat >"$RUN_SCRIPT" <<EOF
#!/usr/bin/env bash
set -uo pipefail
cd $WORKSPACE_ROOT_QUOTED
while true; do
  $DAEMON_COMMAND run ${RUN_CONFIG_COMMAND}--workspace-root $WORKSPACE_ROOT_QUOTED --poll-interval-ms $POLL_INTERVAL_MS_QUOTED --run-heartbeat-interval-ms $RUN_HEARTBEAT_INTERVAL_MS_QUOTED
  status="\$?"
  printf '%s Agent Gateway daemon exited with status %s; restarting in %s seconds\\n' "\$(date -Is)" "\$status" "$RESTART_DELAY_SECONDS" >&2
  sleep "$RESTART_DELAY_SECONDS"
done
EOF
chmod 700 "$RUN_SCRIPT"

install_systemd_user_service() {
  if [ "$(uname -s 2>/dev/null || printf unknown)" != "Linux" ]; then
    return 1
  fi
  if [ "$INSTALL_SYSTEMD" = "false" ] || [ "$INSTALL_SYSTEMD" = "0" ]; then
    return 1
  fi
  if ! command -v systemctl >/dev/null 2>&1; then
    return 1
  fi
  if ! systemctl --user show-environment >/dev/null 2>&1; then
    return 1
  fi

  local service_dir="$HOME/.config/systemd/user"
  local service_file="$service_dir/$SERVICE_NAME.service"
  mkdir -p "$service_dir"
  cat >"$service_file" <<SERVICE_EOF
[Unit]
Description=NocoBase Agent Gateway daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$WORKSPACE_ROOT
ExecStart=$RUN_SCRIPT
Restart=always
RestartSec=$RESTART_DELAY_SECONDS
Environment=AGENT_GATEWAY_HOME=$AGENT_GATEWAY_HOME_DIR

[Install]
WantedBy=default.target
SERVICE_EOF

  if command -v loginctl >/dev/null 2>&1 && [ -n "${USER:-}" ]; then
    loginctl enable-linger "$USER" >/dev/null 2>&1 || true
  fi
  systemctl --user daemon-reload
  systemctl --user enable --now "$SERVICE_NAME.service"
  printf 'Agent Gateway daemon installed as systemd user service: %s.service\n' "$SERVICE_NAME"
}

if install_systemd_user_service; then
  :
elif command -v tmux >/dev/null 2>&1; then
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux kill-session -t "$SESSION_NAME"
  fi
  tmux new-session -d -s "$SESSION_NAME" -c "$WORKSPACE_ROOT" "$RUN_SCRIPT"
  printf 'Agent Gateway daemon started in tmux session: %s\n' "$SESSION_NAME"
else
  nohup "$RUN_SCRIPT" >>"$LOG_FILE" 2>&1 &
  printf 'Agent Gateway daemon started in background. Log: %s\n' "$LOG_FILE"
fi
