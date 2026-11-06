# Retiring legacy runner discoveries

Upgrade deletes runner records with the retired `pending` status only when they have no run or known reference other than automatic creation audits. An audit is ignored exactly when `agAgentChanges.action = 'created' AND actorUserId IS NULL`, regardless of its revision or change contents. Those audits are deleted by the existing foreign-key cascade with their agent. Any other audit, run or business reference keeps the agent disabled and its history intact. Existing enabled/disabled agents and other sources are unchanged. Deployment rollback does not restore deleted agents, their cascaded audits or the retired state; restoration needs an operator’s existing database backup.

## Read-only preflight

Run the preflight separately for each installation before applying the new migration. The operator must already have authorized read-only database access and the installation’s own connection and naming configuration. Do not use an agent run token, manufacture a different identity, or run an application startup that auto-applies migrations to obtain these counts. A read-only database account provides an additional enforcement boundary.

The frozen migration exports `classifyPendingRunnerAgents({ builder, query })`. It issues SELECT and collection-existence queries only and uses no application service, transaction, lock or write. Use the installation’s already-open `DatabaseConnection` in its authorized maintenance tooling and import that function from the reviewed migration source (or its compiled `dist/database/migrations/202610310001_ag_retire_pending_runner_agents.js`). Do not call the migration’s `up` during preflight.

```ts
const result = await classifyPendingRunnerAgents({
  builder: connection.builder,
  query: connection.query,
});
console.log(
  JSON.stringify({
    candidates: result.candidates.length,
    delete: result.remove.length,
    disable: result.disable.length,
    references: result.reasons,
  }),
);
```

Return only the installation label, application/framework revision, observation time, dialect, candidate/deletion/disable counts and aggregated reference reasons. Deletion plus disable must equal candidates; reference totals may overlap because one record can have several references. Never return identifiers, variable values, tokens or personal data. Any failed query or malformed reference JSON fails preflight; do not substitute zero.

The management Studio CLI does not currently expose this full classification. Its callable `agent list` is a roster of enabled agents, so it cannot establish these counts. An authorized management operator and each customer’s administrator must return their own preflight result; reported examples are not measured deletion counts.

## Frozen reference boundary

- Runs in every status, resumable sessions, run tokens and run requests; Agent actors of run inputs and requests.
- Conversations and fallback agents, personal/team default chat choices, agent users and configuration audits other than system creation audits (`action = 'created' AND actorUserId IS NULL`). Human creation audits and all non-creation audits, including system ones, retain the agent. Ignoring a system creation audit never overrides another reference.
- Agent-scoped variables, variable audits and skill attachments; only scope identifiers are selected, never encrypted values.
- Optional Projects executors, comment authors/deleters, activity actors and structured origins/details, plan creators/executors/proposers/source data and row parameters/results.
- Optional Studio project initializations, delegations, stage guards and their structured configuration, saved settings (including manager first/fallback choices), and inbox actors/data.

Structured JSON is examined recursively for exact candidate identifiers, including object keys. Both decoded objects and serialized JSON are supported. This deliberately retains an exact identifier match conservatively. Comment prose is not parsed. Archived/deleted history and final/cancelled requests are included. Personal-computer `agentSessions.agentId` belongs to the separate ACP computer namespace and is not a runner-agent reference.

Custom customer extensions are outside this frozen source list. Before approving an upgrade, the customer administrator must identify any extra runner-agent references and retain those candidates; unresolved custom references block claiming a record is safe to delete. If extra references exist, extend and review the migration before release rather than executing an ad hoc deletion.

## Release and cost

Apply the ordinary upgrade with the old application stopped. The new migration sorts after `202610290001_ag_repair_runner_agents`, which clears stale runner markers without changing status. Classification completes before any mutation, inside the migration runner’s existing transaction. Queries and mutations use batches of at most 200 identifiers; JSON scans page by a stable key. No new table or recurring cleanup is installed.

Regular requests, polls, claims and sweepers gain no queries, writes, locks or transactions. Agent lists stop reading discovery preferences; edits stop locking those preferences. Recommended-model creation and report refresh behavior remain as before. Merge the framework first, then update the application’s framework pointer to a commit carried by its public target branch and regenerate the CLI reference.
