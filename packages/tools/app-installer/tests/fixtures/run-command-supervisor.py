"""Keep test orphans as zombies until observation, then kill and reap only our children."""

import ctypes
import os
import signal
import subprocess
import sys
import time


def interrupted(signum, frame):
    raise RuntimeError("Probe supervisor interrupted")


if ctypes.CDLL(None, use_errno=True).prctl(36, 1, 0, 0, 0) != 0:
    raise OSError(ctypes.get_errno(), "Cannot enable child subreaper")
signal.signal(signal.SIGTERM, interrupted)
child = subprocess.Popen(sys.argv[1:])
reaped = 0
try:
    code = child.wait(timeout=20)
finally:
    # All adopted children belong to this isolated supervisor. Never select by name.
    deadline = time.monotonic() + 3
    while True:
        children = open(f"/proc/self/task/{os.getpid()}/children").read().split()
        for pid in children:
            try:
                os.kill(int(pid), signal.SIGKILL)
            except ProcessLookupError:
                pass
        try:
            pid, status = os.waitpid(-1, os.WNOHANG)
        except ChildProcessError:
            break
        if pid:
            reaped += 1
        elif time.monotonic() >= deadline:
            raise RuntimeError("Probe children could not be reaped")
        else:
            time.sleep(0.01)
print(f"Reaped {reaped} adopted probe children", file=sys.stderr)
sys.exit(code)
