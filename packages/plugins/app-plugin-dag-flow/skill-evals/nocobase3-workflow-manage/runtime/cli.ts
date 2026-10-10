import process from 'node:process';

import { WorkflowRepository } from '../../../server/repositories/workflow-repository.js';
import { WorkflowRunRepository } from '../../../server/repositories/workflow-run-repository.js';

import {
  closeRuntimeFixture,
  createRuntimeFixture,
  openRuntimeFixture,
  type RuntimeFixtureProfile,
} from './fixture-db.js';

const [command, profileArg, idArg, nodeRunIdArg] = process.argv.slice(2);
const profile = profileArg as RuntimeFixtureProfile | undefined;
const dbPath = process.env.NOCOBASE_WORKFLOW_FIXTURE_DB;

if (!command || !profile || !dbPath) {
  throw new Error(
    'Usage: fixture-cli <seed|list|workflow|run|node-runs|payload> <profile> [id] with NOCOBASE_WORKFLOW_FIXTURE_DB',
  );
}

const fixture =
  command === 'seed'
    ? await createRuntimeFixture(dbPath, profile)
    : await openRuntimeFixture(dbPath);
try {
  const runtime = {
    trigger: async () => ({
      status: 'accepted' as const,
      eventKey: 'fixture-event',
      runId: '1',
    }),
    triggerRevision: async () => ({
      status: 'accepted' as const,
      eventKey: 'fixture-event',
      runId: '1',
    }),
    discoverArtifacts: async () => [],
    ensureArtifactMaterialized: async () => undefined,
  };
  const workflows = new WorkflowRepository(fixture.database, runtime);
  const workflowRuns = new WorkflowRunRepository(fixture.database, runtime);
  if (command === 'seed') {
    console.log(
      JSON.stringify(
        { dbPath, workflowIds: fixture.workflowIds, runIds: fixture.runIds },
        null,
        2,
      ),
    );
  } else if (command === 'list') {
    console.log(JSON.stringify(await workflows.list(), null, 2));
  } else if (command === 'workflow') {
    if (!idArg) throw new Error('workflow requires an id');
    console.log(JSON.stringify(await workflows.get(idArg), null, 2));
  } else if (command === 'run') {
    if (!idArg) throw new Error('run requires an id');
    console.log(JSON.stringify(await workflowRuns.get(idArg), null, 2));
  } else if (command === 'node-runs') {
    if (!idArg) throw new Error('node-runs requires a run id');
    console.log(JSON.stringify(await workflowRuns.nodeRuns(idArg), null, 2));
  } else if (command === 'payload') {
    const [runId, nodeRunId] = [idArg, nodeRunIdArg];
    if (!runId || !nodeRunId)
      throw new Error('payload requires run id and node run id');
    console.log(
      JSON.stringify(
        await workflowRuns.nodeRunPayload(runId, nodeRunId),
        null,
        2,
      ),
    );
  } else {
    throw new Error(`Unknown fixture command: ${command}`);
  }
} finally {
  await closeRuntimeFixture(fixture);
}
