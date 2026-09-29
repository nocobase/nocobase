import sqlite from '@nocobase/db-sqlite';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  createDatabaseManager,
  type DatabaseManager,
  type Row,
} from '@nocobase/db';
import {
  WORKFLOW_COLLECTIONS,
  workflowCollectionSchemas,
} from '../../../server/collections/index.js';
import type { WorkflowId } from '../../../server/engine/types.js';

export type RuntimeFixtureProfile =
  | 'runtime-management'
  | 'runtime-invocation'
  | 'runtime-diagnostics'
  | 'runtime-go-live';

export interface RuntimeFixture {
  dbPath: string;
  database: DatabaseManager;
  workflowIds: Record<string, WorkflowId>;
  runIds: Record<string, WorkflowId>;
}

interface WorkflowSeed {
  id: number;
  key: string;
  title: string;
  enabled: boolean;
  current: boolean;
  version: string;
  hash: string;
  parametersSchema?: object;
  parameterValues?: object;
  nodes: Array<{
    id: number;
    key: string;
    type: string;
    config?: object;
    upstreamKey?: string | null;
    downstreamKey?: string | null;
    branchKey?: string | null;
  }>;
}

const workflowSeeds: Record<string, WorkflowSeed[]> = {
  'runtime-management': [
    {
      id: 42,
      key: 'quotation-decision',
      title: 'Quotation decision',
      enabled: false,
      current: true,
      version: 'fixture-v1',
      hash: 'fixture-hash-quotation-v1',
      parametersSchema: {
        approvalLimit: { type: 'number', default: 100000 },
      },
      parameterValues: { approvalLimit: 100000 },
      nodes: [
        {
          id: 4201,
          key: 'calculateRisk',
          type: 'run',
          downstreamKey: 'needsApproval',
        },
        {
          id: 4202,
          key: 'needsApproval',
          type: 'condition',
          upstreamKey: 'calculateRisk',
          downstreamKey: 'recordDecision',
        },
        {
          id: 4203,
          key: 'recordDecision',
          type: 'run',
          upstreamKey: 'needsApproval',
        },
      ],
    },
    {
      id: 43,
      key: 'disabled-order-review',
      title: 'Disabled order review',
      enabled: false,
      current: true,
      version: 'fixture-v1',
      hash: 'fixture-hash-disabled-v1',
      nodes: [],
    },
  ],
  'runtime-invocation': [
    {
      id: 44,
      key: 'quotation-decision',
      title: 'Quotation decision',
      enabled: true,
      current: true,
      version: 'fixture-v1',
      hash: 'fixture-hash-quotation-v1',
      parametersSchema: { approvalLimit: { type: 'number', default: 100000 } },
      parameterValues: { approvalLimit: 100000 },
      nodes: [
        {
          id: 4401,
          key: 'calculateRisk',
          type: 'run',
          downstreamKey: 'needsApproval',
        },
        {
          id: 4402,
          key: 'needsApproval',
          type: 'condition',
          upstreamKey: 'calculateRisk',
          downstreamKey: 'recordDecision',
        },
        {
          id: 4403,
          key: 'recordDecision',
          type: 'run',
          upstreamKey: 'needsApproval',
        },
      ],
    },
  ],
  'runtime-diagnostics': [
    {
      id: 45,
      key: 'order-fulfillment',
      title: 'Order fulfillment',
      enabled: true,
      current: true,
      version: 'fixture-v2',
      hash: 'fixture-hash-order-v2',
      nodes: [
        {
          id: 4501,
          key: 'reserveInventory',
          type: 'run',
          downstreamKey: 'chargePayment',
        },
        {
          id: 4502,
          key: 'chargePayment',
          type: 'run',
          upstreamKey: 'reserveInventory',
          downstreamKey: 'recordOrder',
        },
        {
          id: 4503,
          key: 'recordOrder',
          type: 'run',
          upstreamKey: 'chargePayment',
        },
      ],
    },
    {
      id: 49,
      key: 'tenant-provisioning',
      title: 'Tenant provisioning',
      enabled: true,
      current: true,
      version: 'fixture-v3',
      hash: 'fixture-hash-tenant-v3',
      nodes: [
        {
          id: 4901,
          key: 'createIdentity',
          type: 'run',
          downstreamKey: 'createBilling',
        },
        {
          id: 4902,
          key: 'createBilling',
          type: 'run',
          upstreamKey: 'createIdentity',
          downstreamKey: 'createCrm',
        },
        {
          id: 4903,
          key: 'createCrm',
          type: 'run',
          upstreamKey: 'createBilling',
        },
      ],
    },
    {
      id: 50,
      key: 'quotation-decision',
      title: 'Quotation decision',
      enabled: true,
      current: true,
      version: 'fixture-v1',
      hash: 'fixture-hash-quotation-v1',
      parametersSchema: { approvalLimit: { type: 'number', default: 120000 } },
      parameterValues: { approvalLimit: 120000 },
      nodes: [
        {
          id: 5001,
          key: 'calculateRisk',
          type: 'run',
          downstreamKey: 'needsApproval',
        },
        {
          id: 5002,
          key: 'needsApproval',
          type: 'condition',
          upstreamKey: 'calculateRisk',
          config: { module: './server/check-approval' },
        },
      ],
    },
  ],
  'runtime-go-live': [
    {
      id: 46,
      key: 'order-fulfillment',
      title: 'Order fulfillment',
      enabled: true,
      current: true,
      version: 'fixture-v2',
      hash: 'fixture-hash-order-v2',
      nodes: [{ id: 4601, key: 'reserveInventory', type: 'run' }],
    },
    {
      id: 47,
      key: 'ticket-routing',
      title: 'Ticket routing',
      enabled: false,
      current: true,
      version: 'fixture-v1',
      hash: 'fixture-hash-ticket-v1',
      nodes: [{ id: 4701, key: 'classifyTicket', type: 'run' }],
    },
    {
      id: 48,
      key: 'tenant-provisioning',
      title: 'Tenant provisioning',
      enabled: true,
      current: true,
      version: 'fixture-v3',
      hash: 'fixture-hash-tenant-v3',
      nodes: [{ id: 4801, key: 'createIdentity', type: 'run' }],
    },
  ],
};

export async function createRuntimeFixture(
  dbPath: string,
  profile: RuntimeFixtureProfile,
): Promise<RuntimeFixture> {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  const database = createDatabaseManager({
    drivers: { sqlite },
    connections: { main: { dialect: 'sqlite', filename: dbPath } },
  });
  await database.builder().createCollections(
    workflowCollectionSchemas.map(({ name, define }) => ({
      name,
      definition: define,
    })),
  );
  const workflowIds: Record<string, WorkflowId> = {};
  const runIds: Record<string, WorkflowId> = {};
  for (const seed of workflowSeeds[profile]) {
    await insertWorkflow(database, seed);
    workflowIds[seed.key] = seed.id;
  }
  if (profile === 'runtime-diagnostics') {
    await insertRun(database, {
      id: 781,
      workflowId: 49,
      workflowKey: 'tenant-provisioning',
      eventKey: 'tenant-created:T-1',
      status: -3,
      context: { tenantId: 'T-1' },
      nodes: [
        {
          nodeId: 4901,
          nodeKey: 'createIdentity',
          status: 1,
          result: { organizationId: 'org-1' },
        },
        {
          nodeId: 4902,
          nodeKey: 'createBilling',
          status: 1,
          result: { billingId: 'billing-1' },
        },
        {
          nodeId: 4903,
          nodeKey: 'createCrm',
          status: -3,
          error: 'CRM request timed out',
          log: 'idempotencyKey=tenant:T-1:crm',
        },
      ],
    });
    await insertRun(database, {
      id: 9001,
      workflowId: 45,
      workflowKey: 'order-fulfillment',
      eventKey: 'order-created:O-9',
      status: -2,
      context: { orderId: 'O-9' },
      nodes: [
        {
          nodeId: 4501,
          nodeKey: 'reserveInventory',
          status: 1,
          result: { reservationId: 'res-9' },
        },
        {
          nodeId: 4502,
          nodeKey: 'chargePayment',
          status: -2,
          error: 'Gateway connection reset',
          log: 'attempt=1',
        },
        {
          nodeId: 4502,
          nodeKey: 'chargePayment',
          status: -2,
          error: 'Payment outcome unknown',
          log: 'attempt=2 paymentRequestId=pay-O-9',
        },
      ],
    });
    await insertRun(database, {
      id: 9002,
      workflowId: 50,
      workflowKey: 'quotation-decision',
      eventKey: 'quotation-created:Q-10',
      status: 1,
      context: { quotationId: 'Q-10', amount: 150000 },
      input: { approvalLimit: 200000 },
      nodes: [
        {
          nodeId: 5001,
          nodeKey: 'calculateRisk',
          status: 1,
          result: { score: 150000 },
        },
        { nodeId: 5002, nodeKey: 'needsApproval', status: 1, result: false },
      ],
    });
    runIds.crmTimeout = 781;
    runIds.failedRerun = 9001;
    runIds.unexpectedPath = 9002;
  }
  return { dbPath, database, workflowIds, runIds };
}

async function insertWorkflow(
  database: DatabaseManager,
  seed: WorkflowSeed,
): Promise<void> {
  await database
    .query()
    .insertInto(WORKFLOW_COLLECTIONS.workflows)
    .values({
      id: seed.id,
      key: seed.key,
      title: seed.title,
      enabled: seed.enabled,
      current: seed.current,
      version: seed.version,
      hash: seed.hash,
      inputSchema: JSON.stringify({
        type: 'object',
        additionalProperties: true,
      }),
      parametersSchema: JSON.stringify(seed.parametersSchema ?? {}),
      parameterValues: JSON.stringify(seed.parameterValues ?? {}),
      options: JSON.stringify({}),
    })
    .execute();
  if (seed.nodes.length > 0) {
    await database
      .query()
      .insertInto(WORKFLOW_COLLECTIONS.nodes)
      .values(
        seed.nodes.map((node) => ({
          id: node.id,
          workflowId: seed.id,
          key: node.key,
          title: node.key,
          type: node.type,
          config: JSON.stringify(node.config ?? {}),
          options: JSON.stringify({}),
          upstreamKey: node.upstreamKey ?? null,
          downstreamKey: node.downstreamKey ?? null,
          branchKey: node.branchKey ?? null,
        })),
      )
      .execute();
  }
}

interface RunSeed {
  id: number;
  workflowId: number;
  workflowKey: string;
  eventKey: string;
  status: number | null;
  context: object;
  input?: object;
  nodes: Array<{
    nodeId: number;
    nodeKey: string;
    status: number;
    result?: unknown;
    error?: string;
    log?: string;
  }>;
}

async function insertRun(
  database: DatabaseManager,
  seed: RunSeed,
): Promise<void> {
  await database
    .query()
    .insertInto(WORKFLOW_COLLECTIONS.runs)
    .values({
      id: seed.id,
      workflowId: seed.workflowId,
      workflowKey: seed.workflowKey,
      hash:
        workflowSeeds['runtime-diagnostics'].find(
          (item) => item.id === seed.workflowId,
        )?.hash ?? null,
      eventKey: seed.eventKey,
      input: JSON.stringify(seed.context),
      parameters: JSON.stringify(seed.input ?? {}),
      status: seed.status,
      dispatched: true,
      stack: JSON.stringify([]),
      output: JSON.stringify(null),
      createdAt: new Date().toISOString(),
      manually: false,
      reason: seed.status === -3 ? 'timeout' : null,
    })
    .execute();
  for (let index = 0; index < seed.nodes.length; index += 1) {
    const node = seed.nodes[index];
    await database
      .query()
      .insertInto(WORKFLOW_COLLECTIONS.nodeRuns)
      .values({
        workflowRunId: seed.id,
        nodeId: node.nodeId,
        nodeKey: node.nodeKey,
        status: node.status,
        meta: JSON.stringify({ attempt: index + 1 }),
        result: JSON.stringify(node.result ?? null),
        error: node.error ?? null,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        log: node.log ?? null,
      })
      .execute();
  }
}

export async function closeRuntimeFixture(
  fixture: RuntimeFixture,
): Promise<void> {
  await fixture.database.destroy();
}

export async function openRuntimeFixture(
  dbPath: string,
): Promise<RuntimeFixture> {
  const database = createDatabaseManager({
    drivers: { sqlite },
    connections: { main: { dialect: 'sqlite', filename: dbPath } },
  });
  return { dbPath, database, workflowIds: {}, runIds: {} };
}

export async function readRows(
  fixture: RuntimeFixture,
  table: string,
): Promise<Row[]> {
  return fixture.database.query().selectFrom(table).selectAll().execute<Row>();
}
