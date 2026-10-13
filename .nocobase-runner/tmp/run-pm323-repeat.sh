#!/usr/bin/env bash
set -u
log=".nocobase-runner/tmp/pm323-repeat-revision.log"
: > "$log"
load_pid=""
cleanup() {
  if [[ -n "$load_pid" ]]; then kill "$load_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT
 taskset -c 0 yes >/dev/null &
load_pid=$!
for run in $(seq -w 1 30); do
  printf 'RUN %s START\n' "$run" | tee -a "$log"
  if taskset -c 0 pnpm --filter @nocobase/app-plugin-mail exec vitest run --project client --maxWorkers=2 tests/client/mail-workspace-page.test.tsx >.nocobase-runner/tmp/pm323-run.log 2>&1; then
    grep -E 'Test Files|Tests ' .nocobase-runner/tmp/pm323-run.log | tee -a "$log"
    printf 'RUN %s PASS\n' "$run" | tee -a "$log"
  else
    cat .nocobase-runner/tmp/pm323-run.log >> "$log"
    printf 'RUN %s FAIL\n' "$run" | tee -a "$log"
    exit 1
  fi
done
printf 'RESULT 30/30 PASS\n' | tee -a "$log"
