"""Sub-minute validation of Vitest normal/exception paths and OS RSS units, without demo generation."""
import json
import os
from pathlib import Path
import subprocess
import sys
from os_metrics import timed_command, read_max_rss_bytes

package = Path(__file__).resolve().parents[2]
output = Path(sys.argv[1]).resolve()
output.mkdir(parents=True, exist_ok=True)
for failure in (False, True):
    path = output / ('exception.json' if failure else 'normal.json')
    command = ['node', str(package / 'node_modules/vitest/vitest.mjs'), 'run', 'tests/resources/measurement-probe.test.ts', '--project', 'resources', '--maxWorkers', '1']
    env = {**os.environ, 'DEMO_RESOURCE_PROBE_OUTPUT': str(path), 'NOCOBASE_TEST_DB_DIALECT': 'sqlite'}
    if failure:
        env['DEMO_RESOURCE_PROBE_FAIL'] = '1'
    with open(str(path) + '.log', 'w') as log:
        completed = subprocess.run(timed_command(command, str(path) + '.time.txt'), cwd=package, env=env, stdout=log, stderr=subprocess.STDOUT, timeout=30)
    result = json.loads(path.read_text())
    rss = read_max_rss_bytes(str(path) + '.time.txt')
    assert completed.returncode == int(failure), completed.returncode
    assert result['appCloseState'] == 'completed', result
    assert rss >= result['maxRssThroughAppCloseKiB'] * 1024, (rss, result)
    print(json.dumps({'commandMaxRssBytes': rss, 'exitCode': completed.returncode, **result}))
try:
    read_max_rss_bytes(output / 'missing.time.txt')
except FileNotFoundError:
    pass
else:
    raise AssertionError('Missing OS metrics must fail.')
