/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import {
  JsonRecord,
  findOneByFilter,
  getString,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

const TASK_ID = '02';
const COLLECTION_NAME = 'agwBusinessRequests';
const RELATION_FIELD = 'agentRun';
const RELATION_FOREIGN_KEY = 'agentRunId';
const PROMPT_TEMPLATE_KEY = 'agw.task02.business.trigger';
const DISPATCH_BINDING_KEY = 'agw.task02.business.dispatch';
const PAGE_SCHEMA_UID = 'agw-task-02-business-trigger';
const PAGE_TITLE = 'Agent Gateway Business Trigger';
const DISPATCH_ACTION_USE = 'AgentGatewayDispatchActionModel';
const DISPATCH_ACTION_STEP_PARAMS = {
  agentGatewayDispatch: {
    dispatch: {
      bindingIdentifier: DISPATCH_BINDING_KEY,
    },
  },
};
const AGENT_RUN_FIELD_SPEC = {
  field: RELATION_FIELD,
  titleField: 'runCode',
  popup: {
    title: 'Agent Gateway run',
    defaultType: 'view',
    blocks: [
      {
        key: 'agentRunDetails',
        type: 'details',
        collection: 'agRuns',
        fields: ['runCode', 'status', 'sourceType', 'requestedAt'],
      },
    ],
  },
};
const AGENT_RUN_DISPLAY_FIELD_OPTIONS: JsonRecord[] = [
  {
    name: 'runCode',
    type: 'string',
    interface: 'input',
  },
  {
    name: 'status',
    type: 'string',
    interface: 'input',
  },
  {
    name: 'sourceType',
    type: 'string',
    interface: 'input',
  },
  {
    name: 'requestedAt',
    type: 'date',
    interface: 'datetime',
  },
];

interface ScriptArgs {
  baseUrl: string;
  adminEmail: string;
  adminPassword: string;
  evidenceDir: string;
  prompt: string;
}

interface FlowPageResult {
  pageSchemaUid: string;
  status: 'created-or-updated' | 'skipped';
  dispatchActionStatus?: 'created-or-updated' | 'skipped';
  error?: string;
}

function parseArgs(argv: string[]): ScriptArgs {
  const { flags } = parseAdminFlags(argv);
  const baseUrl = getString(flags['base-url']).replace(/\/$/, '');
  const adminEmail = getString(flags['admin-email']);
  const adminPassword = getString(flags['admin-password']);
  const evidenceDir = getString(flags['evidence-dir']);
  const prompt = getString(flags.prompt);
  if (!baseUrl || !adminEmail || !adminPassword || !evidenceDir || !prompt) {
    throw new Error('--base-url, --admin-email, --admin-password, --evidence-dir, and --prompt are required');
  }
  return {
    baseUrl,
    adminEmail,
    adminPassword,
    evidenceDir,
    prompt,
  };
}

function getResponseId(record: JsonRecord | null | undefined) {
  const id = getString(record?.id);
  if (!id) {
    throw new Error(`Expected record id, got ${JSON.stringify(record)}`);
  }
  return id;
}

function buildUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path}`;
}

function getBusinessRelationFieldOptions() {
  return {
    name: RELATION_FIELD,
    title: 'Agent Run',
    type: 'belongsTo',
    interface: 'm2o',
    target: 'agRuns',
    targetKey: 'id',
    foreignKey: RELATION_FOREIGN_KEY,
  };
}

async function ensureCollectionFieldMetadata(
  baseUrl: string,
  token: string,
  collectionName: string,
  values: JsonRecord,
) {
  const fieldName = getString(values.name);
  if (!fieldName) {
    throw new Error('Collection field metadata requires a field name');
  }
  try {
    await requestJson<JsonRecord>(
      baseUrl,
      `/api/collections/${encodeURIComponent(collectionName)}/fields:update?filterByTk=${encodeURIComponent(
        fieldName,
      )}`,
      {
        method: 'POST',
        token,
        body: values,
      },
    );
    return;
  } catch {
    await requestJson<JsonRecord>(baseUrl, `/api/collections/${encodeURIComponent(collectionName)}/fields:create`, {
      method: 'POST',
      token,
      body: values,
    });
  }
}

async function ensureBusinessRelationFieldMetadata(baseUrl: string, token: string) {
  await ensureCollectionFieldMetadata(baseUrl, token, COLLECTION_NAME, getBusinessRelationFieldOptions());
}

async function ensureAgentRunDisplayFieldMetadata(baseUrl: string, token: string) {
  for (const values of AGENT_RUN_DISPLAY_FIELD_OPTIONS) {
    await ensureCollectionFieldMetadata(baseUrl, token, 'agRuns', values);
  }
}

async function ensureBusinessCollection(baseUrl: string, token: string) {
  const existing = await findOneByFilter(baseUrl, token, 'collections', {
    name: COLLECTION_NAME,
  });
  if (existing) {
    await ensureBusinessRelationFieldMetadata(baseUrl, token);
    return;
  }

  await requestJson<JsonRecord>(baseUrl, '/api/collections:create', {
    method: 'POST',
    token,
    body: {
      name: COLLECTION_NAME,
      title: 'Agent Gateway Business Requests',
      createdAt: true,
      updatedAt: true,
      fields: [
        {
          name: 'title',
          type: 'string',
          interface: 'input',
        },
        {
          name: 'requestKey',
          type: 'string',
          interface: 'input',
          unique: true,
        },
        {
          name: 'prompt',
          type: 'text',
          interface: 'textarea',
        },
        {
          name: 'status',
          type: 'string',
          interface: 'input',
        },
        {
          name: 'scenarioId',
          type: 'string',
          interface: 'input',
        },
        {
          ...getBusinessRelationFieldOptions(),
        },
      ],
    },
  });
  await ensureBusinessRelationFieldMetadata(baseUrl, token);
}

async function upsertPromptTemplate(baseUrl: string, token: string, prompt: string) {
  const values = {
    templateKey: PROMPT_TEMPLATE_KEY,
    displayName: 'Business trigger task',
    description: 'Seeded by task 02 for browser validation.',
    templateText: [
      prompt,
      '',
      'Business request:',
      'Title: {{record.title}}',
      'Prompt: {{record.prompt}}',
      'Status: {{record.status}}',
      'Scenario: {{record.scenarioId}}',
    ].join('\n'),
    status: 'active',
    defaultExecutionPayload: {
      scenario: 'agent-gateway-business-trigger',
      task: TASK_ID,
    },
    metadata: {
      task: TASK_ID,
      seededBy: 'seed-agent-business-trigger-scenario',
    },
  };
  const existing = await findOneByFilter(baseUrl, token, 'agPromptTemplates', {
    templateKey: PROMPT_TEMPLATE_KEY,
  });
  if (existing) {
    const templateId = getResponseId(existing);
    await requestJson<JsonRecord>(
      baseUrl,
      `/api/agentGatewayApi:updatePromptTemplate/${encodeURIComponent(templateId)}`,
      {
        method: 'POST',
        token,
        body: values,
      },
    );
    return templateId;
  }

  const created = await requestJson<JsonRecord>(baseUrl, '/api/agentGatewayApi:createPromptTemplate', {
    method: 'POST',
    token,
    body: values,
  });
  return getResponseId(created);
}

async function upsertDispatchBinding(baseUrl: string, token: string, promptTemplateId: string) {
  const values = {
    bindingKey: DISPATCH_BINDING_KEY,
    collectionName: COLLECTION_NAME,
    sourceCollection: COLLECTION_NAME,
    triggerType: 'record-action',
    sourceAction: 'dispatch',
    promptTemplateId,
    outputAgentRunField: RELATION_FIELD,
    enabled: true,
    status: 'active',
    fieldMappingsJson: {
      title: 'title',
      prompt: 'prompt',
      status: 'status',
      scenarioId: 'scenarioId',
    },
    metadata: {
      task: TASK_ID,
      pageSchemaUid: PAGE_SCHEMA_UID,
    },
  };
  const existing = await findOneByFilter(baseUrl, token, 'agDispatchBindings', {
    bindingKey: DISPATCH_BINDING_KEY,
  });
  if (existing) {
    const bindingId = getResponseId(existing);
    await requestJson<JsonRecord>(
      baseUrl,
      `/api/agentGatewayApi:updateDispatchBinding/${encodeURIComponent(bindingId)}`,
      {
        method: 'POST',
        token,
        body: values,
      },
    );
    return bindingId;
  }

  const created = await requestJson<JsonRecord>(baseUrl, '/api/agentGatewayApi:createDispatchBinding', {
    method: 'POST',
    token,
    body: values,
  });
  return getResponseId(created);
}

async function createBusinessRecord(baseUrl: string, token: string, scenarioId: string, prompt: string) {
  const values = {
    title: `Agent Gateway business trigger ${scenarioId}`,
    requestKey: scenarioId,
    prompt,
    status: 'ready',
    scenarioId,
    [RELATION_FOREIGN_KEY]: null,
  };
  const existing = await findOneByFilter(baseUrl, token, COLLECTION_NAME, {
    requestKey: scenarioId,
  });
  if (existing) {
    const recordId = getResponseId(existing);
    await requestJson<JsonRecord>(baseUrl, `/api/${COLLECTION_NAME}:update/${encodeURIComponent(recordId)}`, {
      method: 'POST',
      token,
      body: values,
    });
    return recordId;
  }

  const created = await requestJson<JsonRecord>(baseUrl, `/api/${COLLECTION_NAME}:create`, {
    method: 'POST',
    token,
    body: values,
  });
  return getResponseId(created);
}

function findNodeByUse(tree: unknown, use: string): JsonRecord | null {
  if (!tree || typeof tree !== 'object') {
    return null;
  }
  const record = tree as JsonRecord;
  if (record.use === use) {
    return record;
  }
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findNodeByUse(item, use);
        if (found) {
          return found;
        }
      }
      continue;
    }
    const found = findNodeByUse(value, use);
    if (found) {
      return found;
    }
  }
  return null;
}

function getSurfaceTree(surfaceResponse: JsonRecord) {
  const surface = surfaceResponse.surface && typeof surfaceResponse.surface === 'object' ? surfaceResponse.surface : {};
  return (surface as JsonRecord).tree || surfaceResponse.tree;
}

function getRecordArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is JsonRecord => item && typeof item === 'object') : [];
}

async function findExistingBusinessPageUid(baseUrl: string, token: string) {
  const existing = await findOneByFilter(baseUrl, token, 'desktopRoutes', {
    title: PAGE_TITLE,
  });
  return getString(existing?.schemaUid);
}

async function getExistingBusinessPageSurface(baseUrl: string, token: string, pageSchemaUid: string) {
  const search = new URLSearchParams();
  search.set('uid', pageSchemaUid);
  return await requestJson<JsonRecord>(baseUrl, `/api/flowSurfaces:get?${search.toString()}`, {
    token,
  });
}

function findDispatchAction(table: JsonRecord) {
  const actionsColumn = findNodeByUse(table, 'TableActionsColumnModel');
  const subModels =
    actionsColumn?.subModels && typeof actionsColumn.subModels === 'object' ? actionsColumn.subModels : {};
  return getRecordArray((subModels as JsonRecord).actions).find(
    (action) => getString(action.use) === DISPATCH_ACTION_USE,
  );
}

async function updateDispatchActionBinding(baseUrl: string, token: string, actionUid: string) {
  await requestJson<JsonRecord>(baseUrl, '/api/flowSurfaces:updateSettings', {
    method: 'POST',
    token,
    body: {
      target: {
        uid: actionUid,
      },
      stepParams: DISPATCH_ACTION_STEP_PARAMS,
    },
  });
}

async function applyDispatchActionToTable(baseUrl: string, token: string, surfaceResponse: JsonRecord) {
  const table = findNodeByUse(getSurfaceTree(surfaceResponse), 'TableBlockModel');
  if (!table) {
    throw new Error('Seeded business page does not include a table block');
  }
  const tableUid = getString(table.uid);
  if (!tableUid) {
    throw new Error('Seeded business page table does not include a table uid');
  }

  const existingDispatchActionUid = getString(findDispatchAction(table)?.uid);
  if (existingDispatchActionUid) {
    await updateDispatchActionBinding(baseUrl, token, existingDispatchActionUid);
    return;
  }

  const created = await requestJson<JsonRecord>(baseUrl, '/api/flowSurfaces:addRecordAction', {
    method: 'POST',
    token,
    body: {
      target: {
        uid: tableUid,
      },
      use: DISPATCH_ACTION_USE,
    },
  });
  const createdActionUid = getString(created.uid);
  if (!createdActionUid) {
    throw new Error(`Failed to create dispatch action: ${JSON.stringify(created)}`);
  }
  await updateDispatchActionBinding(baseUrl, token, createdActionUid);
}

function buildBusinessPageBlueprint(mode: 'create' | 'replace', pageSchemaUid?: string) {
  return {
    mode,
    ...(mode === 'replace' && pageSchemaUid
      ? {
          target: {
            pageSchemaUid,
          },
        }
      : {
          navigation: {
            item: {
              title: PAGE_TITLE,
              hideInMenu: false,
            },
          },
        }),
    page: {
      title: PAGE_TITLE,
      enableTabs: false,
    },
    defaults: {
      collections: {
        [COLLECTION_NAME]: {
          fieldGroups: [
            {
              key: 'businessRequestMain',
              title: 'Business request',
              fields: ['title', 'prompt', 'status', 'scenarioId', { field: RELATION_FIELD, titleField: 'runCode' }],
            },
          ],
        },
        agRuns: {
          fieldGroups: [
            {
              key: 'agentRunMain',
              title: 'Agent run',
              fields: ['runCode', 'status', 'sourceType', 'requestedAt'],
            },
          ],
          popups: {
            view: {
              name: 'Agent Gateway run',
              description: 'Generated by task 02 browser validation.',
            },
          },
        },
      },
    },
    tabs: [
      {
        key: 'main',
        title: 'Requests',
        blocks: [
          {
            key: 'businessRequestsTable',
            type: 'table',
            collection: COLLECTION_NAME,
            fields: ['title', 'prompt', 'status', 'scenarioId', AGENT_RUN_FIELD_SPEC],
          },
        ],
      },
    ],
  };
}

async function ensureBusinessPage(baseUrl: string, token: string): Promise<FlowPageResult> {
  const existingPageSchemaUid = await findExistingBusinessPageUid(baseUrl, token);
  if (existingPageSchemaUid) {
    try {
      const existingSurface = await getExistingBusinessPageSurface(baseUrl, token, existingPageSchemaUid);
      await applyDispatchActionToTable(baseUrl, token, existingSurface);
      return {
        pageSchemaUid: existingPageSchemaUid,
        status: 'created-or-updated',
        dispatchActionStatus: 'created-or-updated',
      };
    } catch (reuseError) {
      throw new Error(
        reuseError instanceof Error
          ? `Existing business trigger page cannot be reused; refusing to replace it automatically: ${reuseError.message}`
          : 'Existing business trigger page cannot be reused; refusing to replace it automatically.',
      );
    }
  }

  try {
    const created = await requestJson<JsonRecord>(baseUrl, '/api/flowSurfaces:applyBlueprint', {
      method: 'POST',
      token,
      body: buildBusinessPageBlueprint('create'),
    });
    const createdTarget = created.target && typeof created.target === 'object' ? (created.target as JsonRecord) : {};
    const pageSchemaUid = getString(createdTarget.pageSchemaUid) || PAGE_SCHEMA_UID;
    await applyDispatchActionToTable(baseUrl, token, created);
    return {
      pageSchemaUid,
      status: 'created-or-updated',
      dispatchActionStatus: 'created-or-updated',
    };
  } catch (createError) {
    return {
      pageSchemaUid: PAGE_SCHEMA_UID,
      status: 'skipped',
      error: createError instanceof Error ? createError.message : String(createError),
    };
  }
}

async function main() {
  const args = parseArgs(process.argv);
  await mkdir(args.evidenceDir, { recursive: true });
  const token = await signIn(args);
  const scenarioId = `agw-task-02-${Date.now()}`;

  await ensureBusinessCollection(args.baseUrl, token);
  await ensureAgentRunDisplayFieldMetadata(args.baseUrl, token);
  const promptTemplateId = await upsertPromptTemplate(args.baseUrl, token, args.prompt);
  const dispatchBindingId = await upsertDispatchBinding(args.baseUrl, token, promptTemplateId);
  const recordId = await createBusinessRecord(args.baseUrl, token, scenarioId, args.prompt);
  const page = await ensureBusinessPage(args.baseUrl, token);

  const seedOutputPath = join(args.evidenceDir, 'seed.json');
  const output = {
    task: TASK_ID,
    scenarioId,
    seedOutputPath,
    collectionName: COLLECTION_NAME,
    recordId,
    relationField: RELATION_FIELD,
    promptTemplateId,
    dispatchBindingId,
    businessPageUrl: buildUrl(args.baseUrl, `/admin/${page.pageSchemaUid}`),
    vBusinessPageUrl: buildUrl(args.baseUrl, `/v/admin/${page.pageSchemaUid}`),
    promptTemplatesUrl: buildUrl(args.baseUrl, '/admin/settings/agent-gateway/prompt-templates'),
    dispatchBindingsUrl: buildUrl(args.baseUrl, '/admin/settings/agent-gateway/dispatch-bindings'),
    runListUrl: buildUrl(args.baseUrl, '/admin/settings/agent-gateway/runs'),
    vRunListUrl: buildUrl(args.baseUrl, '/v/admin/settings/agent-gateway/runs'),
    evidenceDir: args.evidenceDir,
    page,
  };

  await writeFile(seedOutputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
