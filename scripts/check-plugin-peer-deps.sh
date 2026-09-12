#!/bin/bash
#
# Check that all @nocobase/plugin-* imports used in non-test source files
# are declared as peerDependencies (or dependencies/devDependencies).
#
# Usage:
#   bash scripts/check-plugin-peer-deps.sh <plugins-dir> [--whitelist <file>]
#
# Exit codes:
#   0 - all plugins pass
#   1 - missing peerDependencies found
#   2 - invalid arguments
#
# stdout: JSON array of {plugin, missing: [deps]} for CI consumption
# stderr: human-readable table summary

set -euo pipefail

# --- argument parsing ---
PLUGINS_DIR=""
WHITELIST_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --whitelist)
      WHITELIST_FILE="$2"
      shift 2
      ;;
    -*)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
    *)
      if [[ -z "$PLUGINS_DIR" ]]; then
        PLUGINS_DIR="$1"
      else
        echo "Unexpected argument: $1" >&2
        exit 2
      fi
      shift
      ;;
  esac
done

if [[ -z "$PLUGINS_DIR" ]]; then
  echo "Usage: $0 <plugins-dir> [--whitelist <file>]" >&2
  exit 2
fi

if [[ ! -d "$PLUGINS_DIR" ]]; then
  echo "Directory not found: $PLUGINS_DIR" >&2
  exit 2
fi

# --- whitelist loading ---
is_whitelisted() {
  local plugin_name="$1"
  local dep="$2"
  if [[ -n "$WHITELIST_FILE" && -f "$WHITELIST_FILE" ]]; then
    node -e "
      const wl = require('$(realpath "$WHITELIST_FILE")');
      const list = wl['$plugin_name'] || [];
      process.exit(list.includes('$dep') ? 0 : 1);
    " 2>/dev/null
    return $?
  fi
  return 1
}

# --- test file detection ---
is_test_only() {
  local src_dir="$1"
  local dep="$2"

  # check non-test files
  local src_hits
  src_hits=$(grep -rl --include="*.ts" --include="*.tsx" \
    -E "from ['\"]${dep}(/[^'\"]*)?['\"]|require\(['\"]${dep}(/[^'\"]*)?['\"]\)" \
    "$src_dir/" 2>/dev/null \
    | grep -v '__tests__' | grep -v '__test__' | grep -v '\.test\.' | grep -v '\.spec\.' | grep -v '/test/' \
    | head -1) || true

  if [[ -n "$src_hits" ]]; then
    return 1  # found in src → not test-only
  fi

  # check test files
  local test_hits
  test_hits=$(grep -rl --include="*.ts" --include="*.tsx" \
    -E "from ['\"]${dep}(/[^'\"]*)?['\"]|require\(['\"]${dep}(/[^'\"]*)?['\"]\)" \
    "$src_dir/" 2>/dev/null \
    | grep -E '__tests__|__test__|\.test\.|\.spec\.|/test/' \
    | head -1) || true

  if [[ -n "$test_hits" ]]; then
    return 0  # only in test files
  fi

  return 1  # not found at all (shouldn't happen, but treat as non-test)
}

# --- main check ---
errors=()  # array of "plugin_name|dep1,dep2,..."
json_results="[]"
has_errors=false

for plugin_dir in "$PLUGINS_DIR"/*/; do
  [[ ! -d "$plugin_dir" ]] && continue

  plugin_name=$(basename "$plugin_dir")
  pkg_json="$plugin_dir/package.json"

  [[ ! -f "$pkg_json" ]] && continue
  [[ ! -d "$plugin_dir/src" ]] && continue

  # get package name for self-reference exclusion
  pkg_scope=$(node -e "console.log(require('$(realpath "$pkg_json")').name)" 2>/dev/null) || continue

  # get all declared @nocobase/plugin-* deps (peer + deps + devDeps)
  all_declared=$(node -e "
    const pkg = require('$(realpath "$pkg_json")');
    const deps = [
      ...Object.keys(pkg.peerDependencies || {}),
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {})
    ].filter(k => k.startsWith('@nocobase/plugin-'));
    deps.forEach(p => console.log(p));
  " 2>/dev/null | sort -u) || true

  # get actual @nocobase/plugin-* imports from src/
  imported=$(grep -rhoE "from ['\"]@nocobase/plugin-[^'\"]+['\"]|require\(['\"]@nocobase/plugin-[^'\"]+['\"]\)" \
    "$plugin_dir/src/" 2>/dev/null \
    | sed -E "s/from ['\"]//; s/require\(['\"]//; s/['\"].*//; s/\/client$//; s/\/server$//" \
    | sort -u \
    | grep -v "^${pkg_scope}$" \
    | grep -v "^${pkg_scope}/") || true

  # find missing deps
  missing_deps=()
  while IFS= read -r imp; do
    [[ -z "$imp" ]] && continue
    base_pkg=$(echo "$imp" | sed -E 's|^(@nocobase/plugin-[^/]+).*|\1|')

    # skip if already declared
    if echo "$all_declared" | grep -qx "$base_pkg"; then
      continue
    fi

    # skip if test-only
    if is_test_only "$plugin_dir/src" "$base_pkg"; then
      continue
    fi

    # skip if whitelisted
    if is_whitelisted "$plugin_name" "$base_pkg"; then
      continue
    fi

    # deduplicate
    local_dup=false
    for existing in "${missing_deps[@]+"${missing_deps[@]}"}"; do
      if [[ "$existing" == "$base_pkg" ]]; then
        local_dup=true
        break
      fi
    done
    if [[ "$local_dup" == "false" ]]; then
      missing_deps+=("$base_pkg")
    fi
  done <<< "$imported"

  if [[ ${#missing_deps[@]} -gt 0 ]]; then
    has_errors=true
    deps_joined=$(IFS=','; echo "${missing_deps[*]}")
    errors+=("${plugin_name}|${deps_joined}")

    # build JSON entry
    deps_json=$(printf '%s\n' "${missing_deps[@]}" | jq -R . | jq -s .)
    json_results=$(echo "$json_results" | jq --arg p "$plugin_name" --argjson d "$deps_json" '. + [{plugin: $p, missing: $d}]')
  fi
done

# --- output ---

# stdout: JSON for CI
echo "$json_results" | jq -c .

# stderr: human-readable summary
if [[ "$has_errors" == "true" ]]; then
  echo "" >&2
  echo "=============================================" >&2
  echo " Missing plugin-* peerDependencies detected!" >&2
  echo "=============================================" >&2
  echo "" >&2
  printf "%-50s %s\n" "Plugin" "Missing peerDependencies" >&2
  printf "%-50s %s\n" "------" "------------------------" >&2
  for entry in "${errors[@]}"; do
    plugin="${entry%%|*}"
    deps="${entry#*|}"
    printf "%-50s %s\n" "$plugin" "$deps" >&2
  done
  echo "" >&2
  echo "Please add the missing peerDependencies to the respective package.json files." >&2
  echo "" >&2
  exit 1
else
  echo "" >&2
  echo "All plugins in $PLUGINS_DIR have their plugin-* peerDependencies properly declared." >&2
  echo "" >&2
  exit 0
fi
