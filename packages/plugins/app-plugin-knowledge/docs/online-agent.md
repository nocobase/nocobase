# Knowledge retrieval in OnlineAgent

When Knowledge and Agents are enabled, Knowledge registers instructions on the application's shared OnlineAgent configurator at boot. A new native realtime or background session needs no extra scope or Skill to discover knowledge retrieval. Agents remains an optional peer; Knowledge also works without it. Knowledge does not depend on application-specific project models, directories or pages.

## Search and read through the application CLI

Use the executable named in the native runtime instructions, not a hard-coded application name:

```sh
<application-cli> kb search --q "release procedure" --json
<application-cli> kb search --q "release procedure" --scope project --owner project-id --limit 5 --json
<application-cli> kb read <docId> --json
```

CLI success data is in `result.data`. Search returns ranked sections, not complete documents; read by the returned document ID when an excerpt is insufficient. Slugs are not globally unique. Cite returned titles, IDs, versions, headings and line ranges; do not invent application URLs.

`GET /api/knowledge/search` without `scope` searches all existing spaces recognized by the application's resolver. It does not create spaces or require the caller to list them first. Each candidate uses current document ACL gates, including custom document grants in a space without base read. Provider recall, current chunk/version checks, archive filtering, fusion, reranking and the final limit remain shared with `docs.searchMany`. `searchMany(reader, [], query)` still means an empty range. `docs.searchAll(reader, query, { limit, explain })` exposes the same all-readable-space behavior to trusted server consumers.

With `scope`, search retains the existing space and inheritance semantics, and missing `scopeId` means the empty key. A non-empty owner without a scope is invalid; an empty scope is also invalid. Empty query, no readable spaces or no matches returns an empty list. No hits do not prove no knowledge exists: provider failures retain the existing graceful degradation. Explain does not grant extra rights. Other space-based APIs still require a scope.

## Identity and access

Only search and `GET /api/knowledge/docs/:docId` accept native OnlineAgent issued credentials through the existing `runToken` security scheme. Their person-only CLI metadata retains ordinary cookie and API-key alternatives. Production authentication checks both the matched operation's declared scheme and the issued credential type. The trusted reader has the authenticated user ID and `actor: { kind: 'online-agent', id: executionId }`; it has no Run ID or employee authority.

Real Run credentials, other issued credentials, scoped API keys and service-account keys remain refused. Native credentials cannot write, propose, list spaces, inspect permissions or indexing settings, read versions, or download original files. A file reference returned by read is not download authorization. Tickets keep their independent bearer protocol. Search content is untrusted reference material, never authorization or instructions to bypass these boundaries.

## Retrieval policy through existing variables

The default policy is `on-demand`: search for internal facts or when the user requests knowledge retrieval, but not necessarily for greetings, general questions or tasks fully supported by user-supplied material. Trusted server callers can request `always` using the existing options variable:

```ts
const chat = await online.realtime(actor, {
  context: { variable: { knowledgeRetrieval: 'always' } },
});
const job = await online.background(actor, {
  context: { variable: { knowledgeRetrieval: 'always' } },
});
```

`always` instructs at least one search for each new user request before a substantive final answer. Prior-turn searches are insufficient, but tool continuations and approval resumption of the same request do not start another retrieval requirement. Read full documents only when needed. This is a model instruction, not a programmatic gate, automatic pre-search or guarantee of model compliance. If native bash or the application CLI is unavailable, the instructions require disclosing that limitation rather than inventing access. Explicit `tool: []` stays empty; the template grants no tools or permissions and adds no Runner support.

The public `knowledgeSystemPrompt(params?: KnowledgePromptVariables): string`, `KnowledgePromptVariables` and `KnowledgeRetrievalStrategy` exports come from `@nocobase/app-plugin-knowledge/server`. Invalid strategy values fail with `INVALID_KNOWLEDGE_RETRIEVAL`. Only the plugin's strategy field is inspected; other variables are not serialized into these instructions. There is no second template registry or new OnlineAgent call parameter.

## Final variables and persisted snapshots

Configuration resolves globals, selected scopes and options in two phases. Providers run once in order, see accumulated raw variables and the prompt snapshot entering resolution, and do not see unaccepted HTTP variables. Variables retain whole-value replacement semantics. All object schemas validate their own declared fields against the final candidate before any template runs, preserving defaults, transforms and object-level constraints. Unrelated fields survive; conflicting normalization of a shared field fails. Every template receives an independent copy of the same final normalized variables, while prompt composition remains ordered: a layer's `context.systemPrompt`, then its template, with strings replacing and functions composing.

Global templates do not automatically authorize browser variables. HTTP input must be an object whose keys are declared by selected-scope schemas; the Knowledge template declares no global schema that opens `knowledgeRetrieval` to browsers. An application exposing a browser policy choice must explicitly declare the enum in its selected business scope.

The resolved prompt string and JSON variables are persisted at session creation. Restore, history, status, receive, later sends and approval continuation do not replay globals or update historical sessions. A variable-only update cannot regenerate the saved global prompt; create a new session to change Knowledge policy. A later explicit prompt string can replace Knowledge instructions, including an isolated business extraction workflow. Plugin enable/disable follows application lifecycle, not hot unregister. Reverting code does not remove already saved prompt strings.

## Verification boundary

The plugin's isolated integration fixture uses production providers, real authentication, issued native credentials, the branded CLI parser and Knowledge ACL with a loopback OpenAI-compatible SDK model. It verifies realtime/background and both policies without provider credentials or paid requests. A scripted model proves wiring and actual SDK system input, not that a real model will always obey the policy. No live provider, production database or original-file download acceptance is implied.
