#!/bin/sh
set -eu

app_dir="${1:-.}"
node_modules_dir="$app_dir/node_modules"

if [ ! -d "$node_modules_dir" ]; then
  echo "node_modules directory not found: $node_modules_dir" >&2
  exit 1
fi

rm -f "$app_dir/yarn.lock"

find "$node_modules_dir" -type f -name "yarn.lock" -delete
find "$node_modules_dir" -type f -name "bower.json" -delete
find "$node_modules_dir" -type f -name "composer.json" -delete
# find "$node_modules_dir" -type d \( -name test -o -name tests -o -name __tests__ -o -name example -o -name examples \) -prune -exec rm -rf '{}' +
find "$node_modules_dir" -type d -name docs ! -path "$node_modules_dir/@nocobase/*" -prune -exec rm -rf '{}' +
find "$node_modules_dir" -type f -name "*.map" -delete
# find "$node_modules_dir" -type f \( -name "README*" -o -name "readme*" -o -name "CHANGELOG*" -o -name "changelog*" -o -name "*.markdown" -o -name "*.d.ts" \) -delete
find "$node_modules_dir" -type f -name "*.md" ! -path "$node_modules_dir/@nocobase/*" -delete
