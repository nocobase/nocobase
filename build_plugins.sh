#!/bin/bash

# Ensure build results are clear.
mkdir -p build_logs

failed_plugins=()
ts2742_plugins=()

while IFS= read -r plugin; do
  echo "--------------------------------------------------"
  echo "Building $plugin..."
  # Use nocobase build. We capture both stdout and stderr.
  # We use pnpm nocobase build <plugin> which we verified works for at least one.
  if ! pnpm nocobase build "$plugin" > "build_logs/${plugin}.log" 2>&1; then
    echo "FAILED: $plugin"
    failed_plugins+=("$plugin")
    # Check for TS2742 in the log.
    if grep -q "TS2742" "build_logs/${plugin}.log"; then
      echo "  Error TS2742 detected!"
      ts2742_plugins+=("$plugin")
    fi
  else
    echo "SUCCESS: $plugin"
  fi
done < plugins.txt

echo "=================================================="
echo "Summary:"
echo "Total plugins: $(wc -l < plugins.txt)"
echo "Failed: ${#failed_plugins[@]}"
echo "TS2742 errors: ${#ts2742_plugins[@]}"

if [ ${#failed_plugins[@]} -gt 0 ]; then
  echo "Failed plugins: ${failed_plugins[*]}"
fi

if [ ${#ts2742_plugins[@]} -gt 0 ]; then
  echo "Plugins with TS2742: ${ts2742_plugins[*]}"
fi
