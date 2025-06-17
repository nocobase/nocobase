#!/bin/bash
set -e

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

if [ -f "$ROOT_DIR/sources.list" ]; then
  sudo cp "$ROOT_DIR/sources.list" /etc/apt/sources.list
fi

if [ -n "$VERDACCIO_URL" ]; then
  export NPM_CONFIG_REGISTRY="$VERDACCIO_URL"
  yarn config set npmRegistryServer "$VERDACCIO_URL"
elif [ -n "$NPM_REGISTRY_URL" ]; then
  export NPM_CONFIG_REGISTRY="$NPM_REGISTRY_URL"
  yarn config set npmRegistryServer "$NPM_REGISTRY_URL"
fi


