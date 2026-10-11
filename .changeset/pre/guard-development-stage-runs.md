---
"@nocobase/studio": patch
"@nocobase/app-plugin-agents": minor
"@nocobase/agent-protocol": minor
"@nocobase/agent-runner": patch
---

Check a subject’s admission policy in the claim transaction and cancel outdated issue runs without failing or retrying them. The same policy, with the subject's new optional `selectInputs`, also decides whether input may join a working run and whether pending input is delivered to it: input the subject rejects waits in a queued run for the claim to admit or cancel, and pending input it no longer admits or selects is marked handled instead of being delivered, or of holding the run's completion open. The runner completes again, rather than starting a turn with an empty prompt, when input it was told is pending never arrives. Studio permits its executor only in execution statuses and workflow agents only in their current stage; an agent mentioned by name, or answered under its own comment, runs in any stage, except the executor. Earlier stage instructions are left out of the turn rather than cancelling the run, which is cancelled only when nothing else remains. Approving a proposal now requires an eligible executor (`DESIGN_EXECUTOR_REQUIRED` otherwise). Requeue live workspace contention without consuming execution attempts, bounded by a six-hour wait, with a compatible failure fallback for older applications.

Filter obsolete stage instructions consistently from the assembled task, turn and delivered inputs. Record permission-rejected executor claims atomically and notify the owner once with the required pull request permission and reassignment options. Preserve restart after an acknowledged project move.
