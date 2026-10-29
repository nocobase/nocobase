#!/usr/bin/env python3
"""Three independent AB/BA pairs; release the shared lock between pairs."""
import fcntl
import json
import os
from pathlib import Path
import subprocess
import sys
import time

runner = Path(__file__).with_name('run.py')
output = Path(sys.argv[1]).resolve()
base = sys.argv[2]
output.mkdir(parents=True, exist_ok=True)
for pair, order in enumerate((('base', 'changed'), ('changed', 'base'), ('base', 'changed')), 1):
    with open('/tmp/demo-reset-resource-benchmark.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        for variant in order:
            result_path = output / f'pair-{pair}-{variant}.json'
            command = [sys.executable, str(runner), str(result_path)] + ([base] if variant == 'base' else [])
            result = subprocess.run(command, env={**os.environ, 'DEMO_RESOURCE_LOCK_FD': str(lock.fileno())}, pass_fds=(lock.fileno(),))
            if result.returncode not in (0, 1):
                raise SystemExit(f'Abnormal benchmark exit: {result.returncode}: {result_path}')
            if not result_path.exists() or len(json.loads(result_path.read_text()).get('rounds', [])) != 5:
                raise SystemExit(f'Incomplete measurement: {result_path}')
            # A baseline budget violation is evidence, not a newly accepted budget. The changed run must pass.
            if result.returncode != 0 and variant == 'changed':
                raise SystemExit(f'Changed resource budget failed: {result_path}')
    time.sleep(0.1)
