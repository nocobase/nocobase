#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf '%s\n' "Usage: $0 --server-url <url> [--package <npm-package>] [--config <path>]"
  printf '%s\n' "Pass the invitation token through AGENT_GATEWAY_INVITE_TOKEN or stdin."
}

SERVER_URL=""
PACKAGE_NAME="@nocobase/plugin-agent-gateway"
CONFIG_PATH=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --server-url)
      SERVER_URL="${2:-}"
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

if [ -z "${AGENT_GATEWAY_INVITE_TOKEN:-}" ]; then
  IFS= read -r AGENT_GATEWAY_INVITE_TOKEN || true
fi

if [ -z "${AGENT_GATEWAY_INVITE_TOKEN:-}" ]; then
  printf '%s\n' "Invitation token is required through AGENT_GATEWAY_INVITE_TOKEN or stdin." >&2
  exit 1
fi

npm install -g "$PACKAGE_NAME"

REGISTER_ARGS=(register --server-url "$SERVER_URL" --invite-token-stdin)
if [ -n "$CONFIG_PATH" ]; then
  REGISTER_ARGS+=(--config "$CONFIG_PATH")
fi

printf '%s' "$AGENT_GATEWAY_INVITE_TOKEN" | agent-gateway-daemon "${REGISTER_ARGS[@]}"
unset AGENT_GATEWAY_INVITE_TOKEN
