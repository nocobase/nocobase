# Claude settings verification

The adapter delegates settings loading to Claude Code. Discovery loads `['user']`; conversations load `['user', 'project', 'local']`. No settings parser, credential reader, model-name catalog or environment passthrough is added.

## Reproduce

Run the normal adapter regression and the opt-in native test from the repository root. The native test requires an absolute path to an installed Claude Code executable at or above `DEFAULT_MIN_CLAUDE_VERSION`, a non-root user and local loopback sockets. It does not require an account or spend provider credits.

```sh
pnpm --filter @nocobase/agent-runner exec vitest run tests/adapters/claude.test.ts
NOCOBASE_RUNNER_CLAUDE_SETTINGS_TEST=/absolute/path/to/claude \
  pnpm --filter @nocobase/agent-runner exec vitest run tests/adapters/claude.settings.test.ts
```

The native suite creates a separate temporary HOME, configuration directory, repository, generated authentication values and loopback Anthropic-compatible HTTP service for each test. It supplies a complete subprocess environment without inheriting the invoking process's provider variables. The only SDK wrapper writes conflicting project/local model settings into the freshly created discovery directory, then calls the real SDK unchanged. All assertions on authentication compare booleans; headers and authentication values are never recorded. Temporary state is removed after each case.

## Verified behavior

Verified with Agent SDK 0.3.285 and Claude Code 2.1.322 on Linux, Node.js 24.22.2:

| Configuration                                                       | Observable result                                                                                                                                                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| User settings only, no `ANTHROPIC_*` process variables              | Native auth status reports authenticated; discovery resolves the configured Sonnet, Opus and Haiku IDs; conversation sends the configured authentication to the configured loopback address and model. |
| Explicit `CLAUDE_CONFIG_DIR`, conflicting default HOME settings     | Discovery and conversation use the custom directory.                                                                                                                                                   |
| Project and local settings                                          | Project overrides user; adding local settings overrides project for the next conversation.                                                                                                             |
| Conflicting project/local settings in the probe's actual cwd        | Discovery still resolves the user model mapping. It sends no inference request.                                                                                                                        |
| Explicit provider process variables conflicting with `settings.env` | Native `settings.env` wins. The adapter does not introduce a different merge order.                                                                                                                    |
| Explicit provider process variables absent from settings            | The configured process variables work; `ANTHROPIC_MODEL` overrides the file's `model` default.                                                                                                         |
| Explicit session `model`                                            | The chosen model reaches the provider unchanged, overriding the file's model default.                                                                                                                  |
| Strict resume under default HOME and custom configuration directory | The second conversation resumes the same native session ID without recovery.                                                                                                                           |
| User and local `SessionStart` hooks                                 | Both generated command hooks execute.                                                                                                                                                                  |
| Native user and project MCP configuration                           | Both generated stdio servers complete `tools/list`; project MCP is enabled by native settings. Tool search may defer their tools from the first inference request.                                     |
| Adapter events and result                                           | Generated authentication values do not occur in emitted evidence.                                                                                                                                      |

The default regression also checks the exact settings sources, unchanged environment passing, resolved-model/effort mapping, error sanitization and resume options. The native suite is opt-in because developer and CI machines need not have a Claude Code installation.

## Native extensions and limits

[Settings precedence](https://code.claude.com/docs/en/settings#settings-precedence) and [SDK filesystem features](https://code.claude.com/docs/en/agent-sdk/claude-code-features) remain Claude Code's responsibility. Loading user/local settings enables their hooks and other filesystem extensions. Native hooks can run commands and block calls; bypass permissions does not disable them. The runner does not add callbacks or a hook suppression layer. User hooks and native extensions may therefore add startup work to discovery even though no prompt is sent.

MCP is not simply a `settings.json` field. Global native configuration, project `.mcp.json`, settings approvals and managed policies retain their native behavior. Global configuration can load independently of `settingSources`; selecting user-only settings is not an MCP isolation boundary. The fixture verifies native connections without external services or account connectors.

Real Anthropic OAuth/keychain login and account-provided MCP connectors were not exercised: this environment uses generated local-provider authentication and never accesses an existing account's credentials. The adapter's native auth-status command, login storage and session path algorithm are unchanged. Runtime results cover the installed CLI version, not every supported CLI version or an actual third-party provider's protocol compatibility.

No database queries, writes, locks, transactions, claims or heartbeat protocol changes are added. Claude Code performs the extra native configuration reads; configured hooks/MCP may start processes or contact their configured services. No performance environment was started. The requested `quality-dimension-performance` Skill and its `review.md` were not present in the supplied Skills; this statement is a code-scope assessment.

## Upgrade

Release the patch changeset for `@nocobase/agent-runner`, then have the application serve that released runner version, either as its packed runner distribution or its exact npm pin. A framework checkout change or application image update alone does not update every installed execution machine.

Installed service runners use the existing heartbeat-driven update path when automatic updates are enabled; operators can run `nocobase-runner update` to apply the served version explicitly. Check the installed runner version on each machine after restart. Source-checkout runners must update their checkout, rebuild and restart. No settings migration or new login is required for this change; continue using native Claude settings/login storage for the OS user running the service.

An explicit `CLAUDE_CONFIG_DIR` must reach both model discovery and conversations through the existing passed/local variable mechanism. A terminal export alone does not configure a background service. If provider values are defined in both explicit process variables and native settings, reconcile the duplicates according to the verified native precedence above. Review existing user/local hooks and MCP configuration because they now participate in the same way as the native tool.
