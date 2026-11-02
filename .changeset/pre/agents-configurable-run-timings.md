---
'@nocobase/app-plugin-agents': patch
---

Make the run retry back-off and the runners sweep interval configurable: `agents.runs.retryBaseDelayMs` sets the first back-off of a failed run attempt (30 seconds by default, still doubling up to ten minutes) and `agents.runners.sweepIntervalMs` how often the sweep runs (30 seconds by default). The defaults are unchanged; shorter values are meant for tests.
