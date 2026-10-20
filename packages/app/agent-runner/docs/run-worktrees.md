# Fixed task workspaces

Every application/task pair has one stable directory on each runner, `<work root>/<app>/<subject>.task/`. Each repository is a linked worktree from the runner's local bare cache. Retries, different agents, concurrent read-only runs and upgrade resumptions share that directory. Repository targets and tool kinds are not part of its identity. In-place `directory` entries retain their configured paths. No runner directory lock restricts entry. Agents coordinate concurrent edits, commits, checkouts and installations themselves. Existing same-session serialization and agent/machine capacity checks still apply.

First creation checks out the requested branch from its remote branch or configured base. Existing directories only fetch remote refs: no fast-forward, branch change, reset or stash. Notes identify the current branch, requested target, ahead/behind state, dirty files and unfinished merge/rebase. A branch checked out by another task is an error, never forcibly taken over. Concurrent first creation may take the existing retry path after a Git conflict; it never deletes another creator's files or chooses a second directory.

All endings preserve code, Git state, dependencies and build output. The runner never commits WIP, creates continuation refs or aliases, or pushes for the agent. Agents explicitly commit and push their branch and open a PR with its explicit head. Delivery reports inspect current HEAD, dirty state and reachability from fetched remote refs. They describe shared state without establishing which run authored it. Unknown remote state is reported conservatively.

Host-side checkout and cache Git use the checked `task-git.ts` boundary. Repository-provided executable configuration and hooks cannot run during fetch, inspection or reporting. Shared cache configuration is checked too, because linked worktrees can change it with ordinary `git config`. Agent authorship and credentials are passed through each run's environment instead of rewriting shared Git configuration.

## Private files and sessions

CLI credentials and shims, placed skills, mounts and process tags remain private to a run/attempt outside shared code. A CLI shim names its attempt's credential file through the existing environment integration. Temporary-directory identity comes from the private attempt path. Cancellation stops only the run's tool, descendants and tagged processes, never processes selected merely by a shared cwd.

Each agent resumes its own session, scoped by application, task, agent, tool and thread. Claude, Pi and OpenCode retain the same cwd; Codex retains its external session home. Different agents do not share conversation IDs. The first run in the new namespace starts fresh rather than importing an old attempt's session; in-place directory sessions keep their existing cwd behavior. Confirmed task cleanup also removes session directories.

## Preparation and cleanup

Each prepared directory has a local digest of its initialization text and root package-manager lockfiles. Missing or changed digests cause initialization prompts. A captured digest is confirmed only after successful completion and only if it still matches. Failure, cancellation and upgrade never confirm preparation. Removing any dependency/build artifact invalidates preparation before deletion, including partial failures. Unchanged directories retain dependencies without repeated prompts.

Each worker independently registers its run ID and PID before preparation and unregisters after stopping its processes. In-place paths are canonicalized. Registrations never restrict entry. Every cleanup entry checks them; dead PIDs are stale, while live registrations protect code and dependencies. Collection pauses new claims and lets in-flight claims start workers before deletion. Upgrade interruption protects the directory through the five-minute restart window as well.

Unused dependencies and build output are cleaned after **24 hours** by default, including unfinished tasks. Explicit TTL configuration and disk-pressure cleanup retain their behavior. Cleanup preserves tracked files and does not follow symlinks. Task completion uses the application's cleanup confirmation; ordinary retention and pressure removal retain unpublished-work checks.

Legacy attempt directories, branch aliases, saved/resume refs and sessions are not migrated automatically. They remain available for manual integration and keep existing cleanup/recovery recognition until deployed machines have cleared them. New workers never create them or run legacy finalization at completion. Compatibility cleanup remains until fleet evidence permits removal.

## Dispatch and upgrades

Ordinary runs prefer the previous runner only when it can immediately accept them: online, with capacity, tools, permissions, policy and variables. Otherwise normal dispatch chooses another eligible machine with its own fixed task directory. Ordinary work never waits just for the previous machine.

Only a run actually interrupted by automatic upgrade is reserved for its original runner for five minutes from the recorded interruption. Heartbeats cannot extend the window. The runner reports draining before interruption and retains files through restart. On return a separate recovery scan precedes the ordinary candidate page. Expiry, revocation or deletion releases the reservation. Other runs of the same task and machines that have only announced an upgrade get no reservation. Existing execution/session/machine records supply this without new protocol or database fields.

## Run temporary directories

Linux and macOS runs allocate `/tmp/n-<8 hex namespace>/<16 hex attempt>` independently of inherited TMPDIR. The namespace hashes the UID and canonical runner home; the attempt hashes its private path. Both directories must be real, owned by the current UID and mode 0700. The literal path and realpath must fit within 40 UTF-8 bytes. TMPDIR, TMP and TEMP name that same directory; tools and children inherit them.

The temporary namespace's existing cleanup lock applies only to a private attempt. Worker cleanup removes it after writers stop. Supervisor recovery uses the recorded private path, with legacy lookup for older records. Failed stops retain temporary files and recovery evidence. GC rereads run records and observed process holders before deleting private temporary files. Other attempts remain untouched.
