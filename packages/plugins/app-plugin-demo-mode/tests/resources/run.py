#!/usr/bin/env python3
"""Run an isolated application benchmark, optionally overlaying base production sources in this worktree."""
import fcntl
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import platform
import signal
import subprocess
import sys
import tempfile
import time
from os_metrics import timed_command, read_max_rss_bytes

package = Path(__file__).resolve().parents[2]
root = package.parents[2]
output = Path(sys.argv[1]).resolve()
base = sys.argv[2] if len(sys.argv) > 2 else None
output.parent.mkdir(parents=True, exist_ok=True)
if output.exists() or Path(str(output) + '.environment.json').exists():
    raise SystemExit('Choose a new output path; existing measurement evidence is never overwritten.')
inherited_lock = os.environ.get('DEMO_RESOURCE_LOCK_FD')
with (os.fdopen(os.dup(int(inherited_lock)), 'a') if inherited_lock else open('/tmp/demo-reset-resource-benchmark.lock', 'a')) as lock:
    fcntl.flock(lock, fcntl.LOCK_EX)
    saved = {}
    backup = None
    production_files = sorted((package / 'server').rglob('*.ts')) + sorted((package / 'database').rglob('*.ts')) + [root / name for name in (
        'packages/libs/db/src/collection/registry/registry.ts',
        'packages/plugins/app-plugin-mail/server/runtime.ts',
        'packages/plugins/app-plugin-mail/server/runtime/account-removals.ts',
    )]
    try:
        if base:
            base = subprocess.check_output(['git', 'rev-parse', base], cwd=root, text=True).strip()
            backup = Path(tempfile.mkdtemp(prefix='demo-reset-source-backup-'))
            # Overlay only production sources changed by this framework patch; never dependencies or fixture code.
            for file in production_files:
                saved[file] = file.read_bytes()
                destination = backup / file.relative_to(root)
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(saved[file])
                original = subprocess.run(['git', 'show', f'{base}:{file.relative_to(root)}'], cwd=root, capture_output=True)
                if original.returncode == 0:
                    file.write_bytes(original.stdout)
                else:
                    file.unlink()
        env = {**os.environ, 'DEMO_RESOURCE_OUTPUT': str(output), 'NOCOBASE_TEST_DB_DIALECT': 'sqlite'}
        command = ['node', '--expose-gc', str(package / 'node_modules/vitest/vitest.mjs'), 'run', 'tests/resources/reset-resource.test.ts', '--project', 'resources', '--no-file-parallelism', '--maxWorkers', '1']
        os_output = Path(str(output) + '.time.txt')
        measured_command = timed_command(command, os_output)
        revision = base or subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
        sources = hashlib.sha256()
        for file in production_files:
            if not file.exists():
                continue
            sources.update(str(file.relative_to(root)).encode())
            sources.update(file.read_bytes())
        metadata = {'revision': revision, 'lockfileSha256': hashlib.sha256((root / 'pnpm-lock.yaml').read_bytes()).hexdigest(), 'baseOverlay': bool(base), 'productionSha256': sources.hexdigest(), 'fixtureSha256': hashlib.sha256((package / 'tests/resources/reset-resource.test.ts').read_bytes()).hexdigest(), 'command': command, 'platform': platform.platform(), 'hardware': subprocess.check_output(['sysctl', '-n', 'machdep.cpu.brand_string', 'hw.memsize'], text=True).strip() if sys.platform == 'darwin' else platform.machine(), 'cpuCount': os.cpu_count(), 'sharedLock': '/tmp/demo-reset-resource-benchmark.lock', 'nodeHeapLimitMiB': 1536, 'backup': str(backup) if backup else None}
        started = time.time()
        metadata['startedAt'] = datetime.now(timezone.utc).isoformat()
        metadata['measuredCommand'] = measured_command
        metadata['osRssScope'] = 'complete command and descendants; maximum, not simultaneous sum'
        harness = hashlib.sha256()
        for file in (package / 'vitest.config.ts', Path(__file__), Path(__file__).with_name('compare.py'), Path(__file__).with_name('os_metrics.py')):
            harness.update(str(file.relative_to(root)).encode())
            harness.update(file.read_bytes())
        metadata['harnessSha256'] = harness.hexdigest()
        with open(str(output) + '.log', 'w') as log:
            child = subprocess.Popen(measured_command, cwd=package, env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
            try:
                result = child.wait(timeout=660)
            except BaseException:
                os.killpg(child.pid, signal.SIGKILL)
                child.wait()
                metadata['timeoutOrInterruption'] = True
                raise
            finally:
                metadata.update({'elapsedSeconds': time.time() - started, 'exitCode': child.returncode})
                if os_output.exists():
                    metadata['commandMaxRssBytes'] = read_max_rss_bytes(os_output)
                Path(str(output) + '.environment.json').write_text(json.dumps(metadata, indent=2))
        if not output.exists() or 'commandMaxRssBytes' not in metadata:
            print('Missing application or OS metrics (abnormal termination or incomplete measurement).')
            sys.exit(2)
        worker = json.loads(output.read_text())
        if worker.get('appCloseState') != 'completed' or not worker.get('workloadCompleted'):
            print('Application workload or close did not complete.')
            sys.exit(2)
        if metadata['commandMaxRssBytes'] < worker['maxRssThroughAppCloseKiB'] * 1024:
            print('Command RSS does not cover the observed application RSS; investigate the platform instrument.')
            sys.exit(2)
        if metadata['commandMaxRssBytes'] >= 640 * 1024 ** 2:
            print(f'Whole-command RSS budget exceeded: {metadata["commandMaxRssBytes"]} bytes >= 640 MiB')
            result = result or 1
        if result != 0 or not output.exists():
            print(Path(str(output) + '.log').read_text())
            sys.exit(result or 1)
        print(output.read_text())
    finally:
        for file, content in saved.items():
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_bytes(content)
        # Keep the tiny source backup as recovery evidence; never remove another task's files.
