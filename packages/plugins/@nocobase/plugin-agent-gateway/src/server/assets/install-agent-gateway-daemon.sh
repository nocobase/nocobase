#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf '%s\n' "Usage: $0 [--server-url <url>] [--node-key <key>] [--package <npm-package>] [--config <path>] [--service-name <name>] [--service-scope auto|system|user|tmux|none]"
  printf '%s\n' "Pass values through flags or AGENT_GATEWAY_SERVER_URL, AGENT_GATEWAY_NODE_KEY, and AGENT_GATEWAY_INVITE_TOKEN."
}

SERVER_URL="${AGENT_GATEWAY_SERVER_URL:-}"
NODE_KEY="${AGENT_GATEWAY_NODE_KEY:-}"
PACKAGE_NAME="${AGENT_GATEWAY_DAEMON_PACKAGE:-@nocobase/plugin-agent-gateway}"
DAEMON_PACKAGE_URL="${AGENT_GATEWAY_DAEMON_PACKAGE_URL:-}"
CONFIG_PATH="${AGENT_GATEWAY_CONFIG_PATH:-}"
ENV_FILE="${AGENT_GATEWAY_ENV_FILE:-}"
WORKSPACE_ROOT="${AGENT_GATEWAY_WORKSPACE_ROOT:-$HOME}"
POLL_INTERVAL_MS="${AGENT_GATEWAY_POLL_INTERVAL_MS:-2000}"
RUN_HEARTBEAT_INTERVAL_MS="${AGENT_GATEWAY_RUN_HEARTBEAT_INTERVAL_MS:-3000}"
SESSION_NAME="${AGENT_GATEWAY_TMUX_SESSION:-agent-gateway-daemon}"
EXPLICIT_AGENT_GATEWAY_HOME="${AGENT_GATEWAY_HOME:-}"
AGENT_GATEWAY_HOME_DIR="$EXPLICIT_AGENT_GATEWAY_HOME"
SERVICE_NAME="${AGENT_GATEWAY_SYSTEMD_SERVICE_NAME:-agent-gateway-daemon}"
SERVICE_SCOPE="${AGENT_GATEWAY_SERVICE_SCOPE:-${AGENT_GATEWAY_INSTALL_SYSTEMD:-auto}}"
RESTART_DELAY_SECONDS="${AGENT_GATEWAY_RESTART_DELAY_SECONDS:-5}"
AGENT_GATEWAY_AGENT_PATH="${AGENT_GATEWAY_AGENT_PATH:-}"
HEALTH_CHECK="${AGENT_GATEWAY_HEALTH_CHECK:-true}"

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
    --env-file)
      ENV_FILE="${2:-}"
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
    --service-scope)
      SERVICE_SCOPE="${2:-}"
      shift 2
      ;;
    --agent-path)
      AGENT_GATEWAY_AGENT_PATH="${2:-}"
      shift 2
      ;;
    --no-health-check)
      HEALTH_CHECK="false"
      shift 1
      ;;
    --health-check)
      HEALTH_CHECK="true"
      shift 1
      ;;
    --no-systemd)
      SERVICE_SCOPE="tmux"
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

is_linux() {
  [ "$(uname -s 2>/dev/null || printf unknown)" = "Linux" ]
}

is_root_user() {
  [ "$(id -u 2>/dev/null || printf 1)" = "0" ]
}

can_use_systemctl() {
  command -v systemctl >/dev/null 2>&1
}

can_install_system_service() {
  is_linux && is_root_user && can_use_systemctl && systemctl list-unit-files >/dev/null 2>&1
}

can_install_user_service() {
  is_linux && can_use_systemctl && systemctl --user show-environment >/dev/null 2>&1
}

normalize_service_scope() {
  case "$SERVICE_SCOPE" in
    true|1|systemd)
      SERVICE_SCOPE="auto"
      ;;
    false|0)
      SERVICE_SCOPE="tmux"
      ;;
  esac
  case "$SERVICE_SCOPE" in
    auto|system|user|tmux|none)
      ;;
    *)
      printf '%s\n' "Unsupported Agent Gateway service scope: $SERVICE_SCOPE" >&2
      exit 1
      ;;
  esac
}

resolve_service_scope() {
  normalize_service_scope
  case "$SERVICE_SCOPE" in
    system)
      if ! can_install_system_service; then
        printf '%s\n' "System service installation requires Linux, root, and a working systemctl." >&2
        exit 1
      fi
      ;;
    user)
      if ! can_install_user_service; then
        printf '%s\n' "User service installation requires a working systemctl --user session." >&2
        exit 1
      fi
      ;;
    auto)
      if can_install_system_service; then
        SERVICE_SCOPE="system"
      elif can_install_user_service; then
        SERVICE_SCOPE="user"
      elif command -v tmux >/dev/null 2>&1; then
        SERVICE_SCOPE="tmux"
      else
        SERVICE_SCOPE="none"
      fi
      ;;
  esac
}

resolve_service_scope

if [ -z "$AGENT_GATEWAY_HOME_DIR" ]; then
  if [ "$SERVICE_SCOPE" = "system" ]; then
    AGENT_GATEWAY_HOME_DIR="/opt/nocobase-agent-gateway"
  else
    AGENT_GATEWAY_HOME_DIR="$HOME/.agent-gateway-daemon"
  fi
fi

if [ -z "$CONFIG_PATH" ]; then
  CONFIG_PATH="$AGENT_GATEWAY_HOME_DIR/config.json"
fi

if [ -z "$ENV_FILE" ]; then
  if [ "$SERVICE_SCOPE" = "system" ]; then
    ENV_FILE="/etc/nocobase-agent-gateway/$SERVICE_NAME.env"
  else
    ENV_FILE="$AGENT_GATEWAY_HOME_DIR/$SERVICE_NAME.env"
  fi
fi

INVITE_TOKEN="${AGENT_GATEWAY_INVITE_TOKEN:-}"

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
  local package_new_dir="$AGENT_GATEWAY_HOME_DIR/package.new"
  local package_previous_dir="$AGENT_GATEWAY_HOME_DIR/package.previous"
  download_file "$DAEMON_PACKAGE_URL" "$package_archive"
  rm -rf "$package_new_dir"
  mkdir -p "$package_new_dir"
  tar -xzf "$package_archive" -C "$package_new_dir"
  rm -f "$package_archive"
  if [ ! -f "$package_new_dir/package/daemon.js" ]; then
    printf '%s\n' "Downloaded Agent Gateway daemon package does not contain daemon.js." >&2
    exit 1
  fi
  rm -rf "$package_previous_dir"
  if [ -d "$package_dir" ]; then
    mv "$package_dir" "$package_previous_dir"
  fi
  mv "$package_new_dir" "$package_dir"
  DAEMON_CMD=(node "$package_dir/package/daemon.js")
}

stop_existing_service_quietly() {
  case "$SERVICE_SCOPE" in
    system)
      systemctl stop "$SERVICE_NAME.service" >/dev/null 2>&1 || true
      ;;
    user)
      systemctl --user stop "$SERVICE_NAME.service" >/dev/null 2>&1 || true
      ;;
  esac
}

stop_legacy_tmux_daemon_quietly() {
  if command -v tmux >/dev/null 2>&1 && tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux kill-session -t "$SESSION_NAME"
  fi
}

stop_existing_service_quietly
if [ "$SERVICE_SCOPE" = "system" ] || [ "$SERVICE_SCOPE" = "user" ]; then
  stop_legacy_tmux_daemon_quietly
fi

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

config_matches_node() {
  [ -f "$1" ] &&
    node -e 'const fs = require("fs"); const config = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); process.exit(config.serverUrl === process.argv[2] && config.nodeKey === process.argv[3] ? 0 : 1);' "$1" "$SERVER_URL" "$NODE_KEY"
}

LEGACY_CONFIG_PATH="$HOME/.agent-gateway-daemon/config.json"
if [ ! -f "$CONFIG_PATH" ] &&
  [ "$CONFIG_PATH" != "$LEGACY_CONFIG_PATH" ] &&
  config_matches_node "$LEGACY_CONFIG_PATH"; then
  mkdir -p "$(dirname "$CONFIG_PATH")"
  cp "$LEGACY_CONFIG_PATH" "$CONFIG_PATH"
  chmod 600 "$CONFIG_PATH"
  printf 'Migrated existing Agent Gateway daemon config from %s to %s\n' "$LEGACY_CONFIG_PATH" "$CONFIG_PATH"
fi

REGISTER_ARGS=(register --server-url "$SERVER_URL" --node-key "$NODE_KEY" --invite-token-stdin)
REGISTER_ARGS+=(--config "$CONFIG_PATH")

RUN_CONFIG_ARGS=()
RUN_CONFIG_ARGS+=(--config "$CONFIG_PATH")

if config_matches_node "$CONFIG_PATH" &&
  "${DAEMON_CMD[@]}" heartbeat "${RUN_CONFIG_ARGS[@]}" >/dev/null 2>&1; then
  printf 'Existing Agent Gateway daemon registration is still valid for node: %s\n' "$NODE_KEY"
else
  if [ -z "$INVITE_TOKEN" ] && [ ! -t 0 ]; then
    IFS= read -r INVITE_TOKEN || true
  fi
  if [ -z "$INVITE_TOKEN" ]; then
    printf '%s\n' "Invitation token is required through AGENT_GATEWAY_INVITE_TOKEN when no valid existing daemon config is available." >&2
    exit 1
  fi
  printf '%s' "$INVITE_TOKEN" | "${DAEMON_CMD[@]}" "${REGISTER_ARGS[@]}"
fi
unset AGENT_GATEWAY_INVITE_TOKEN INVITE_TOKEN

mkdir -p "$AGENT_GATEWAY_HOME_DIR"
RUN_SCRIPT="$AGENT_GATEWAY_HOME_DIR/run.sh"
RUN_LOOP_SCRIPT="$AGENT_GATEWAY_HOME_DIR/run-loop.sh"
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
set -euo pipefail
cd $WORKSPACE_ROOT_QUOTED
exec $DAEMON_COMMAND run ${RUN_CONFIG_COMMAND}--workspace-root $WORKSPACE_ROOT_QUOTED --poll-interval-ms $POLL_INTERVAL_MS_QUOTED --run-heartbeat-interval-ms $RUN_HEARTBEAT_INTERVAL_MS_QUOTED --terminal-backend tmux
EOF
chmod 700 "$RUN_SCRIPT"

cat >"$RUN_LOOP_SCRIPT" <<EOF
#!/usr/bin/env bash
set -uo pipefail
while true; do
  $RUN_SCRIPT
  status="\$?"
  printf '%s Agent Gateway daemon exited with status %s; restarting in %s seconds\\n' "\$(date -Is)" "\$status" "$RESTART_DELAY_SECONDS" >&2
  sleep "$RESTART_DELAY_SECONDS"
done
EOF
chmod 700 "$RUN_LOOP_SCRIPT"

append_path_dir() {
  local dir="$1"
  if [ -z "$dir" ] || [ ! -d "$dir" ]; then
    return
  fi
  case ":$EFFECTIVE_PATH:" in
    *":$dir:"*) ;;
    *) EFFECTIVE_PATH="$dir:$EFFECTIVE_PATH" ;;
  esac
}

EFFECTIVE_PATH="${AGENT_GATEWAY_AGENT_PATH:-$PATH}"
for command_name in node npm npx codex opencode claude tmux nb; do
  command_path="$(command -v "$command_name" 2>/dev/null || true)"
  if [ -n "$command_path" ]; then
    append_path_dir "$(dirname "$command_path")"
  fi
done
append_path_dir "$HOME/.local/bin"
append_path_dir "$HOME/.npm-global/bin"
append_path_dir "$HOME/.fnm/current/bin"
append_path_dir "$HOME/.bun/bin"
append_path_dir "/usr/local/bin"
append_path_dir "/usr/bin"
append_path_dir "/bin"
for node_bin_dir in "$HOME"/.nvm/versions/node/*/bin "$HOME"/.fnm/node-versions/*/installation/bin "$HOME"/.local/share/fnm/node-versions/*/installation/bin; do
  append_path_dir "$node_bin_dir"
done

write_env_assignment() {
  local key="$1"
  local value="$2"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '%s="%s"\n' "$key" "$value"
}

write_env_file() {
  mkdir -p "$(dirname "$ENV_FILE")"
  {
    write_env_assignment PATH "$EFFECTIVE_PATH"
    write_env_assignment HOME "$HOME"
    write_env_assignment AGENT_GATEWAY_HOME "$AGENT_GATEWAY_HOME_DIR"
    write_env_assignment AGENT_GATEWAY_CONFIG_PATH "$CONFIG_PATH"
    write_env_assignment AGENT_GATEWAY_WORKSPACE_ROOT "$WORKSPACE_ROOT"
    write_env_assignment AGENT_GATEWAY_POLL_INTERVAL_MS "$POLL_INTERVAL_MS"
    write_env_assignment AGENT_GATEWAY_RUN_HEARTBEAT_INTERVAL_MS "$RUN_HEARTBEAT_INTERVAL_MS"
    if [ -n "${NO_PROXY:-}" ]; then
      write_env_assignment NO_PROXY "$NO_PROXY"
    fi
    if [ -n "${no_proxy:-}" ]; then
      write_env_assignment no_proxy "$no_proxy"
    fi
    if [ -n "${HTTP_PROXY:-}" ]; then
      write_env_assignment HTTP_PROXY "$HTTP_PROXY"
    fi
    if [ -n "${HTTPS_PROXY:-}" ]; then
      write_env_assignment HTTPS_PROXY "$HTTPS_PROXY"
    fi
  } >"$ENV_FILE"
  chmod 600 "$ENV_FILE"
}

write_env_file

write_service_file() {
  local service_file="$1"
  local wanted_by="$2"
  mkdir -p "$(dirname "$service_file")"
  cat >"$service_file" <<SERVICE_EOF
[Unit]
Description=NocoBase Agent Gateway daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$WORKSPACE_ROOT
EnvironmentFile=$ENV_FILE
ExecStart=$RUN_SCRIPT
Restart=always
RestartSec=$RESTART_DELAY_SECONDS
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=$wanted_by
SERVICE_EOF
}

install_systemd_system_service() {
  local service_file="/etc/systemd/system/$SERVICE_NAME.service"
  write_service_file "$service_file" "multi-user.target"
  systemctl daemon-reload
  systemctl enable --now "$SERVICE_NAME.service"
  printf 'Agent Gateway daemon installed as systemd system service: %s.service\n' "$SERVICE_NAME"
}

install_systemd_user_service() {
  local service_dir="$HOME/.config/systemd/user"
  local service_file="$service_dir/$SERVICE_NAME.service"
  write_service_file "$service_file" "default.target"

  if command -v loginctl >/dev/null 2>&1 && [ -n "${USER:-}" ]; then
    loginctl enable-linger "$USER" >/dev/null 2>&1 || true
  fi
  systemctl --user daemon-reload
  systemctl --user enable --now "$SERVICE_NAME.service"
  printf 'Agent Gateway daemon installed as systemd user service: %s.service\n' "$SERVICE_NAME"
}

start_tmux_daemon() {
  stop_legacy_tmux_daemon_quietly
  tmux new-session -d -s "$SESSION_NAME" -c "$WORKSPACE_ROOT" "$RUN_LOOP_SCRIPT"
  printf 'Agent Gateway daemon started in tmux session: %s\n' "$SESSION_NAME"
}

start_nohup_daemon() {
  nohup "$RUN_LOOP_SCRIPT" >>"$LOG_FILE" 2>&1 &
  printf 'Agent Gateway daemon started in background. Log: %s\n' "$LOG_FILE"
}

check_daemon_health() {
  if [ "$HEALTH_CHECK" = "false" ] || [ "$HEALTH_CHECK" = "0" ]; then
    return
  fi

  local attempt
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    local supervisor_ready="true"
    case "$SERVICE_SCOPE" in
      system)
        systemctl is-active --quiet "$SERVICE_NAME.service" || supervisor_ready="false"
        ;;
      user)
        systemctl --user is-active --quiet "$SERVICE_NAME.service" || supervisor_ready="false"
        ;;
      tmux)
        tmux has-session -t "$SESSION_NAME" >/dev/null 2>&1 || supervisor_ready="false"
        ;;
    esac

    if [ "$supervisor_ready" = "true" ] && "${DAEMON_CMD[@]}" heartbeat "${RUN_CONFIG_ARGS[@]}" >/dev/null 2>&1; then
      printf 'Agent Gateway daemon heartbeat verified for node: %s\n' "$NODE_KEY"
      return
    fi
    sleep 2
  done

  printf '%s\n' "Agent Gateway daemon health check failed. Inspect the service logs and rerun this bootstrap command." >&2
  case "$SERVICE_SCOPE" in
    system)
      systemctl status "$SERVICE_NAME.service" --no-pager >&2 || true
      ;;
    user)
      systemctl --user status "$SERVICE_NAME.service" --no-pager >&2 || true
      ;;
    tmux)
      tmux capture-pane -pt "$SESSION_NAME" -S -80 >&2 || true
      ;;
    none)
      tail -80 "$LOG_FILE" >&2 || true
      ;;
  esac
  exit 1
}

case "$SERVICE_SCOPE" in
  system)
    install_systemd_system_service
    ;;
  user)
    install_systemd_user_service
    ;;
  tmux)
    if command -v tmux >/dev/null 2>&1; then
      start_tmux_daemon
    else
      SERVICE_SCOPE="none"
      start_nohup_daemon
    fi
    ;;
  none)
    start_nohup_daemon
    ;;
esac

check_daemon_health

printf 'Agent Gateway daemon setup complete. Scope: %s. Home: %s. Config: %s. Env: %s\n' "$SERVICE_SCOPE" "$AGENT_GATEWAY_HOME_DIR" "$CONFIG_PATH" "$ENV_FILE"
case "$SERVICE_SCOPE" in
  system)
    printf 'Inspect with: systemctl status %s.service && journalctl -u %s.service -f\n' "$SERVICE_NAME" "$SERVICE_NAME"
    ;;
  user)
    printf 'Inspect with: systemctl --user status %s.service && journalctl --user -u %s.service -f\n' "$SERVICE_NAME" "$SERVICE_NAME"
    ;;
  tmux)
    printf 'Inspect with: tmux attach -t %s\n' "$SESSION_NAME"
    ;;
  none)
    printf 'Inspect with: tail -f %s\n' "$LOG_FILE"
    ;;
esac
