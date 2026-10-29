"""External command high-water RSS, including descendants; never sum process peaks."""
from pathlib import Path
import re
import sys


def timed_command(command, output):
    if sys.platform not in ('darwin', 'linux'):
        raise RuntimeError('RSS measurement requires macOS time -l or GNU time -v.')
    return ['/usr/bin/time', '-l' if sys.platform == 'darwin' else '-v', '-o', str(output), *command]


def read_max_rss_bytes(output):
    raw = Path(output).read_text()
    pattern = r'(\d+)\s+maximum resident set size' if sys.platform == 'darwin' else r'Maximum resident set size \(kbytes\):\s*(\d+)'
    match = re.search(pattern, raw)
    if not match or int(match.group(1)) <= 0:
        raise RuntimeError(f'Missing or invalid OS RSS measurement: {output}')
    # macOS time -l reports bytes; GNU time -v reports KiB. Node maxRSS reports KiB on both.
    return int(match.group(1)) * (1 if sys.platform == 'darwin' else 1024)
