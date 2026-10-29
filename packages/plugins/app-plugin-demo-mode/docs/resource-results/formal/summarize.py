import json
import statistics
import sys
from pathlib import Path

artifacts = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parent
fields = {
    'resetHeapMiB': 'Maximum sampled reset heap (MiB)',
    'resetRssMiB': 'Maximum sampled reset RSS (MiB)',
    'appSampledHeapMiB': 'Sampled heap after startup through workload (MiB)',
    'appCloseRssMiB': 'OS RSS through application close (MiB)',
    'commandRssMiB': 'External whole-command OS RSS (MiB)',
    'retainedMedianMiB': 'Median retained heap after quiescent GC (MiB)',
    'resetMedianSeconds': 'Median reset duration (seconds)',
}
processes = []
environments = []
for pair in (1, 2, 3):
    for variant in ('base', 'changed'):
        path = artifacts / f'pair-{pair}-{variant}.json'
        d = json.loads(path.read_text())
        e = json.loads(Path(str(path) + '.environment.json').read_text())
        assert d['schemaVersion'] == 2 and d['node'] == 'v24.22.1' and d['rows'] == 20000
        assert len(d['rounds']) == 5 and d['workloadCompleted'] and d['appCloseState'] == 'completed'
        assert e['exitCode'] == (1 if variant == 'base' else 0)
        assert e['commandMaxRssBytes'] >= d['maxRssThroughAppCloseKiB'] * 1024
        r = d['rounds']
        processes.append({
            'pair': pair, 'order': 'BA' if pair == 2 else 'AB', 'variant': variant,
            'appPid': d['appPid'], 'headRevision': e['revision'],
            'resetHeapMiB': max(x['peakHeap'] for x in r) / 2**20,
            'resetRssMiB': max(x['peakRss'] for x in r) / 2**20,
            'appSampledHeapMiB': d['sampledHeapAfterStartupThroughWorkload'] / 2**20,
            'appCloseRssMiB': d['maxRssThroughAppCloseKiB'] / 1024,
            'commandRssMiB': e['commandMaxRssBytes'] / 2**20,
            'retainedMedianMiB': statistics.median(x['retainedHeap'] for x in r) / 2**20,
            'retainedGrowthMaxMiB': max(x['retainedHeap'] - d['warmHeap'] for x in r) / 2**20,
            'resetMedianSeconds': statistics.median(x['elapsedMs'] for x in r) / 1000,
        })
        environments.append((variant, e))
for key in ('fixtureSha256', 'harnessSha256', 'lockfileSha256', 'platform', 'hardware', 'cpuCount', 'nodeHeapLimitMiB'):
    assert len({e[key] for _, e in environments}) == 1, key
for variant in ('base', 'changed'):
    assert len({e['productionSha256'] for v, e in environments if v == variant}) == 1
stats = {}
for key, label in fields.items():
    b = [p[key] for p in processes if p['variant'] == 'base']
    c = [p[key] for p in processes if p['variant'] == 'changed']
    stats[key] = {'label': label, 'baseMedian': statistics.median(b), 'baseRange': [min(b), max(b)], 'changedMedian': statistics.median(c), 'changedRange': [min(c), max(c)], 'pairedDeltaPercent': [100 * (y / x - 1) for x, y in zip(b, c)], 'rangesSeparatedLowerChanged': max(c) < min(b)}
summary = {'processes': processes, 'statistics': stats, 'fingerprints': {key: environments[0][1][key] for key in ('fixtureSha256', 'harnessSha256', 'lockfileSha256')}, 'productionFingerprints': {v: next(e['productionSha256'] for vv,e in environments if vv == v) for v in ('base','changed')}}
(artifacts / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
lines = ['## Three independent formal pairs', '', 'All six processes completed the same initial import, one warm-up, five measured resets, integrity checks, final clear and application close. The order was **AB, BA, AB**, with one shared-lock window per pair and explicit coordinator release before the next pair. No profiler was enabled. Base exited nonzero only for the fixed RSS budget; all changed runs passed the unchanged budgets. No pair or round was discarded.', '', 'Each reset peak below is the maximum of five rounds in one independent process. The summary reports the median and range of the three process values, not 15 resets treated as independent trials. Retained heap and duration first use the median of five rounds per process. The raw JSON contains every round; values here are rounded to three decimals.', '', '| Metric | Base median [range] | Changed median [range] |', '| --- | ---: | ---: |']
for key, s in stats.items():
    lines.append(f"| {s['label']} | {s['baseMedian']:.3f} [{s['baseRange'][0]:.3f}, {s['baseRange'][1]:.3f}] | {s['changedMedian']:.3f} [{s['changedRange'][0]:.3f}, {s['changedRange'][1]:.3f}] |")
lines += ['', '| Pair / order | Variant | Reset heap (MiB) | Reset RSS (MiB) | All-workload sampled heap (MiB) | App-close OS RSS (MiB) | Command OS RSS (MiB) |', '| --- | --- | ---: | ---: | ---: | ---: | ---: |']
for p in processes:
    lines.append(f"| {p['pair']} / {p['order']} | {p['variant']} | {p['resetHeapMiB']:.3f} | {p['resetRssMiB']:.3f} | {p['appSampledHeapMiB']:.3f} | {p['appCloseRssMiB']:.3f} | {p['commandRssMiB']:.3f} |")
ret = stats['retainedMedianMiB']
lines += ['', f"Retained heap increased by {ret['changedMedian']-ret['baseMedian']:.3f} MiB when comparing the medians of process medians. No retained-memory improvement is claimed. Maximum changed retained growth above its own post-warm-up GC reading was {max(p['retainedGrowthMaxMiB'] for p in processes if p['variant']=='changed'):.3f} MiB, within the fixed 32 MiB growth budget. The sampled heap values can miss synchronous short peaks; OS command high-water covers startup and teardown but is not a reset-window measurement. Three pairs describe this host and workload, not a population-level statistical guarantee.", '', 'The complete fixture contains one project, two demo accounts and 20,002 tasks (the example’s two tasks plus 20,000 fixed historical tasks). Historical endpoints remain 90 days inclusive, and the original account/session identities survive every reset. These results cannot be assigned to CRM, ITAM, Studio, the separate Mail drain or the narrow DB clone operation individually.', '', 'Measured implementation: `7cc61197c940070fedbebeb53e83d7ba92215b9d`; base: `8f3e54db4f50146fd8b0376c603d09b486058249`. Pair 1’s changed HEAD is the implementation commit; later changed HEADs include only documentation/evidence commits. Production bytes, fixture, harness and lockfile hashes match across all repetitions of their respective variant. Node v24.22.1, SQLite and a fixed 1,536 MiB old-space ceiling; hardware/platform/CPU fields are required to match across all six environment reports.', '', '| Fingerprint | SHA-256 |', '| --- | --- |']
for key, value in {**summary['fingerprints'], **{f'{v} production': h for v,h in summary['productionFingerprints'].items()}}.items():
    lines.append(f'| {key} | `{value}` |')
lines += ['', 'Raw reports, actual application PIDs, exact commands, start times, environment, OS output and baseline failure logs are in [this artifact directory](./). Earlier pilots and the two preliminary reset-window pairs remain separate and are not counted in this three-pair series.', '']
(artifacts / 'summary.md').write_text('\n'.join(lines))
print(json.dumps(summary, indent=2))
