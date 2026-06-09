#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_ROOT="$SCRIPT_DIR/docs"
LANG_ARG=""
FILES_ARG=""
RUN_I18N_COVERAGE="auto"

usage() {
  cat <<'EOF'
Usage:
  ./check.sh
  ./check.sh --lang=es
  ./check.sh --docs-root=/abs/path/to/docs/docs
  ./check.sh --files=changed-files.txt --with-i18n-coverage
  gh pr view <pr> --json files --jq '.files[].path' | ./check.sh --with-i18n-coverage

What it does:
  - Runs the same structural docs checks used by CI:
    tree, meta, nav, home, bloated-files
  - Runs i18n coverage only when explicitly enabled and changed files are provided

Options:
  --docs-root=PATH           Docs root passed to structural checks
  --lang=CODE               Restrict structural checks to one language
  --files=PATH              Changed-files list for i18n coverage
  --with-i18n-coverage      Force-run i18n coverage
  --skip-i18n-coverage      Skip i18n coverage
  -h, --help                Show this help
EOF
}

for arg in "$@"; do
  case "$arg" in
    --docs-root=*)
      DOCS_ROOT="${arg#*=}"
      ;;
    --lang=*)
      LANG_ARG="$arg"
      ;;
    --files=*)
      FILES_ARG="$arg"
      ;;
    --with-i18n-coverage)
      RUN_I18N_COVERAGE="true"
      ;;
    --skip-i18n-coverage)
      RUN_I18N_COVERAGE="false"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ ! -d "$SCRIPT_DIR/scripts" ]; then
  echo "docs/scripts not found: $SCRIPT_DIR/scripts" >&2
  exit 1
fi

if [ ! -d "$DOCS_ROOT" ]; then
  echo "Docs root not found: $DOCS_ROOT" >&2
  exit 1
fi

run_node_check() {
  local label="$1"
  local script_name="$2"
  shift 2

  if [ ! -f "$SCRIPT_DIR/scripts/$script_name" ]; then
    echo "[skip] $label: $script_name not found"
    return 0
  fi

  echo "$label:"
  (
    cd "$SCRIPT_DIR"
    node "scripts/$script_name" "$@"
  )
}

COMMON_ARGS=("$DOCS_ROOT")
if [ -n "$LANG_ARG" ]; then
  COMMON_ARGS+=("$LANG_ARG")
fi

run_node_check "Tree alignment check" "check-tree-alignment.mjs" "${COMMON_ARGS[@]}"
run_node_check "Meta alignment check" "check-meta-alignment.mjs" "${COMMON_ARGS[@]}"
run_node_check "Navigation alignment check" "check-nav-alignment.mjs" "${COMMON_ARGS[@]}"
run_node_check "Home alignment check" "check-home-alignment.mjs" "${COMMON_ARGS[@]}"
run_node_check "Bloated files check" "check-bloated-files.mjs" "${COMMON_ARGS[@]}"
run_node_check "Deprecated document reference check" "check-deprecated-doc-refs.mjs" "${COMMON_ARGS[@]}"

should_run_i18n_coverage() {
  case "$RUN_I18N_COVERAGE" in
    true)
      return 0
      ;;
    false)
      return 1
      ;;
  esac

  if [ -n "$FILES_ARG" ]; then
    return 0
  fi

  if [ ! -t 0 ]; then
    return 0
  fi

  return 1
}

run_i18n_coverage() {
  if [ ! -f "$SCRIPT_DIR/scripts/check-i18n-coverage.mjs" ]; then
    echo "[skip] i18n coverage check: check-i18n-coverage.mjs not found"
    return 0
  fi

  echo "i18n coverage check:"

  if [ -n "$FILES_ARG" ]; then
    (
      cd "$SCRIPT_DIR"
      node scripts/check-i18n-coverage.mjs "$FILES_ARG"
    )
    return 0
  fi

  if [ ! -t 0 ]; then
    (
      cd "$SCRIPT_DIR"
      node scripts/check-i18n-coverage.mjs
    )
    return 0
  fi

  echo "[skip] i18n coverage check: no --files input and no stdin"
}

if should_run_i18n_coverage; then
  run_i18n_coverage
else
  echo "[skip] i18n coverage check: enable with --with-i18n-coverage and provide --files or stdin"
fi
