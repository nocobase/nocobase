# Native Skills and application CLI

Native OnlineAgent realtime and background sessions enable the virtual Shell (`bash`) and Skill reader (`skill`) by default. This is not a Runner, a checkout or a host execution environment. Global scopes, named scopes and trusted options can replace the tool list, including `tool: []` to disable all tools. Existing sessions retain their saved tool selection; Runner sessions do not inherit these native defaults.

## Select capabilities on the server

Resolve the application's shared `agentsToken.onlineAgent` and register a trusted business scope once during provider boot. Read current Skill IDs through `agentsToken.skills`; do not put file paths, credentials or a manifest in browser configuration.

```ts
online.configurator.registerOnlineAgentScope('reports', {
  agentId: 'online',
  tool: ['bash', 'skill'],
  skill: [reportSkillId],
});
const chat = await online.realtime(actor, { scope: ['reports'] });
await chat.send([{ role: 'user', content: 'Follow the report Skill.' }]);
```

New native sessions can select Skills without repeating the default tools. If a scope or trusted options replace the tool list, include both `bash` and `skill` when selecting Skills. Either tool may be enabled without selected Skills; the Skill reader reports an unknown selected Skill when none matches. HTTP may select an allowed scope, not raw tools/Skill IDs. Scopes select configuration and grant no permission. Native background uses the same scope through `online.background(actor, { scope: ['reports'] })`, then the ordinary `run(messages, draft07Schema)`, `get()` and `try({ wait })`. An observation timeout returns `{ ok: false, reason: 'pending' }` and does not stop work. `get` returns only a validated, persisted, finalized result. Runner refuses explicitly selected native-only capabilities instead of silently switching execution modes.

## Current resources, not persisted environments

The service prepares the currently selected Skill bodies and complete support trees once per SDK execution segment. Initial model instructions list descriptions and paths, not all bodies. `skill({ name: '<slug>' })` returns the selected document and support-file list; bash reads `/skills/<slug>/SKILL.md` and readable support files. Missing resources, invalid paths or duplicate slugs fail preparation. SkillService has no enabled/per-user-read setting: trusted selection owns this boundary, with no invented management or access API.

Stored Skills come from `SkillService.get()` with content and support files from one current version. No Run association, additional version hash, persistent resource snapshot or restore protocol is introduced. Internal service composition can additionally supply `builtinSkills: OnlineAgentSandboxSkillCatalog`, a ReadonlyMap from selected ID to async current-content reader. The public `OnlineAgentSandboxSkill` shape has `slug`, `name`, `description`, `content` and readonly `files: { path, content: string | null }[]`. Each reader runs again in a new segment; null marks binary content. This optional reader catalog is an internal composition dependency, not an automatically registered built-in library or new management surface.

Sandbox construction is internal to the plugin. `composition.ts` creates the provider with its SkillService and injects it into OnlineAgentService; no Sandbox provider factory, provider contract or service token is exported from `@nocobase/app-plugin-agents/server/online-agent` or registered in the application container. The application provider supplies a CLI brand reader and a lazy CLI dependency callback for authentication, execution credentials and `commandsOf(identity, token)`. These dependencies are resolved only when a Sandbox is created, never during ordinary service assembly or Skill-only preparation. Standalone composition without CLI dependencies retains Shell/Skills support. Registered tools access only the execution-local capabilities through `options.context.execution`.

Preparation does not allocate Bash, VFS, a manifest or token. The first bash creates those resources; multiple tools share one initialization Promise and environment for the segment. Initialization failure is not automatically retried. `options.context.execution` is available to ordinary server tools and contains only `id`, `getSandbox()` and `readSkill(name)`; cancellation is only `context.signal`. Do not retain this capability or return it from a tool.

## Shell and CLI behavior

The Shell is just-bash 3.6.0 over InMemoryFs, with cwd/HOME `/tmp`, clean environment and `/tmp` as the only writable area. `/skills` is read-only, links are unavailable, and binary or over-budget support files have no readable empty placeholders. The historical text command set, pipelines, jq, redirection and Shell variables work inside this interpreter. No host filesystem/env, arbitrary network, host programs, Node/Python/JavaScript or SQLite worker is enabled. An executable Skill script does not authorize a host process.

The plugin builds a lightweight just-bash runtime with `scripts/bundle-just-bash.mjs` into `dist/server/vendor/just-bash.js`. The full package and esbuild are development dependencies only; published server code and declarations use the local vendor entry. The bundle includes its declaration and `THIRD_PARTY_LICENSES.txt`, but excludes Python/QuickJS, SQLite, network, HTML conversion and optional xz/zstd codecs. Unsupported commands/codecs report that they are unavailable instead of asking to install missing packages. Vitest builds and aliases the same runtime so Sandbox tests exercise the published implementation.

The retained limits are 5 MiB Skill text mounting, 7 MiB aggregate filesystem content, 10 seconds per bash including queue/CLI waits, 1 MiB Shell output, and 24,000 model-result characters plus a truncation notice. Hardened built-in defaults remain. There is no additional CLI response size/request-count, Skill-count, input-length or independent `/tmp` quota.

Discover the current application's brand and commands using `<brand> --help`, `<brand> <area> --help` and `<brand> docs <command>`. Commands use the public app-cli-client parse/request contracts, method/path/body and JSON envelopes. Parameter JSON `--file` and declared string `--content-file` flags read only VFS, including immutable Skill text; exported Shell variables use the command's existing env definitions. No-file multipart fields and read-binding (one current GET before a write) retain the CLI's declared semantics. The owner-only `conversation update` command supports a whole JSON `--file` body as well as field flags.

Real upload/download/ticket/stream/file transfer remains unavailable. Commands requiring interactive confirmation report CONFIRMATION_REQUIRED, never synthesize --yes. Business 403/409/PLAN_REQUIRED reasons remain errors, not SDK approvals. An application without a plan command gains no plan workflow or old Run plan scanner.

## Identity, cancellation and approval

The standard provider creates an application-local fgo_ credential only on first bash; the existing x-nocobase-run-token/runToken transport also carries independent real fgr_ Run credentials. Each resolver only recognizes its own prefix. The token service takes trusted user/execution IDs, retains hashes in memory with a 30-minute fallback expiry and releases after actual work exits. It adds no API key, token table, fake Run, new Header/scheme or framework-wide authentication semantics. Credentials never enter model input, argv, VFS/env or private/public messages.

The application manifest is caller-filtered and every dispatched request still checks actual authentication, user state, authorization and business Policies. Only the explicitly declared owner-checked conversation list/get/update accept this new identity; their CLI identities are person-only, not Run. Other routes must explicitly support the existing scoped-credential boundary before an agent can use them. Run, Runner and attachment routes are unchanged. The CLI is not a general network proxy or a second permission system.

Stop propagates to interpreter, request and response reader and waits for actual accepted work to exit. Stop is not rollback; an already committed write can remain committed. Neither tools nor entire scripts are automatically retried, and toolCallId is not a business idempotency key. For a lost/failed response, query the record first; if still uncertain, report an unknown outcome rather than claiming success or rollback. Dispose or persistence failure keeps execution busy; `retryFinalization()` retries only closed-resource cleanup/persistence.

SDK structured approval retains owner/message/execution/approval ID validation. Waiting releases the old environment; partial decisions persist without starting another SDK segment. Genuine approve/deny continuation reads current Skills/CLI with current authorization and creates a fresh environment only if bash is actually called. Old `/tmp`, token and interpreter position are never restored. Shell operations are not automatically approved. Raw bash/skill input/results stay private in canonical UIMessage originals; public history/SSE retains the normal safe projection. History and reconnect restore evidence/subscriptions, never tool execution.

## Validation

The owning tests distinguish real SDK/CLI/authentication/Policy/database chains driven by a scripted model from parser-only contract tests. Compilation, a deployment build, an installed-host run and a real provider smoke are different evidence and must be reported separately. Do not infer installed operation from a successful workspace build or a matching package version. Verify published exports, archives and resolved executable bytes before claiming an isolated installation passed.
