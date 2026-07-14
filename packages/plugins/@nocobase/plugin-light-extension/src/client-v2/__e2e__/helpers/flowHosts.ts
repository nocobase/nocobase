/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { APIResponse, Page } from '@playwright/test';

import { assertApiResponseOk, getErrorMessage, isRecord, readApiResponse, type RootApiSession } from './api';

export type FlowHostAcceptancePage = {
  collectionName: string;
  routePath: string;
  pageUid: string;
  pageSchemaUid: string;
  tabSchemaUid: string;
  gridUid: string;
  routeId?: string;
  containers: {
    createFormUid: string;
    actionPanelUid: string;
  };
  hosts: {
    jsBlock: {
      uid: string;
    };
    jsField: {
      uid: string;
      wrapperUid: string;
    };
    jsAction: {
      uid: string;
    };
    jsItem: {
      uid: string;
    };
  };
};

export type CreateFlowHostAcceptancePageOptions = {
  collectionName?: string;
  pageTitle?: string;
  tabTitle?: string;
  modernClientPrefix?: string;
};

type CreatedFlowPage = {
  pageUid: string;
  pageSchemaUid: string;
  tabSchemaUid: string;
  gridUid: string;
  routeId?: string;
};

let flowHostSequence = 0;

function nextFixtureSuffix(): string {
  flowHostSequence += 1;
  return `${Date.now()}_${flowHostSequence}`;
}

function requireString(record: Record<string, unknown>, key: string, context: string): string {
  const value = record[key];
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
    throw new Error(`${context} does not contain ${key}`);
  }
  return String(value);
}

function readCreatedFlowPage(value: unknown): CreatedFlowPage {
  if (!isRecord(value)) {
    throw new Error('flowSurfaces:createPage response is invalid');
  }
  return {
    pageUid: requireString(value, 'pageUid', 'flowSurfaces:createPage response'),
    pageSchemaUid: requireString(value, 'pageSchemaUid', 'flowSurfaces:createPage response'),
    tabSchemaUid: requireString(value, 'tabSchemaUid', 'flowSurfaces:createPage response'),
    gridUid: requireString(value, 'gridUid', 'flowSurfaces:createPage response'),
    routeId: typeof value.routeId === 'string' || typeof value.routeId === 'number' ? String(value.routeId) : undefined,
  };
}

function readUid(value: unknown, operation: string): string {
  if (!isRecord(value)) {
    throw new Error(`${operation} response is invalid`);
  }
  return requireString(value, 'uid', `${operation} response`);
}

function normalizeModernClientPrefix(prefix: string | undefined): string {
  const normalized = String(prefix || process.env.APP_MODERN_CLIENT_PREFIX || 'v')
    .trim()
    .replace(/^\/+|\/+$/gu, '');
  return normalized || 'v';
}

export function getModernFlowPagePath(pageSchemaUid: string, modernClientPrefix?: string): string {
  return `/${normalizeModernClientPrefix(modernClientPrefix)}/admin/${encodeURIComponent(pageSchemaUid)}`;
}

async function createAcceptanceCollection(page: Page, session: RootApiSession, collectionName: string): Promise<void> {
  const response = await page.request.post('/api/collections:mock', {
    headers: session.headers,
    data: [
      {
        name: collectionName,
        title: 'Light Extension acceptance records',
        fields: [
          {
            name: 'name',
            type: 'string',
            interface: 'input',
            uiSchema: {
              title: 'Name',
              type: 'string',
              'x-component': 'Input',
            },
          },
          {
            name: 'status',
            type: 'string',
            interface: 'select',
            uiSchema: {
              title: 'Status',
              type: 'string',
              'x-component': 'Select',
              enum: [
                { label: 'Draft', value: 'draft' },
                { label: 'Published', value: 'published' },
              ],
            },
          },
        ],
      },
    ],
  });
  await assertApiResponseOk(response, 'Create Flow host acceptance collection');
}

async function createFlowPage(
  page: Page,
  session: RootApiSession,
  options: CreateFlowHostAcceptancePageOptions,
): Promise<CreatedFlowPage> {
  const response = await page.request.post('/api/flowSurfaces:createPage', {
    headers: session.headers,
    data: {
      icon: 'FileOutlined',
      title: options.pageTitle || 'Light Extension host acceptance',
      tabTitle: options.tabTitle || 'Main',
    },
  });
  return readCreatedFlowPage(await readApiResponse<unknown>(response, 'Create modern Flow host page'));
}

async function addBlock(
  page: Page,
  session: RootApiSession,
  data: Record<string, unknown>,
  operation: string,
): Promise<string> {
  const response = await page.request.post('/api/flowSurfaces:addBlock', {
    headers: session.headers,
    data,
  });
  return readUid(await readApiResponse<unknown>(response, operation), operation);
}

async function createJSFieldHost(
  page: Page,
  session: RootApiSession,
  createFormUid: string,
): Promise<{ uid: string; wrapperUid: string }> {
  const response = await page.request.post('/api/flowSurfaces:addField', {
    headers: session.headers,
    data: {
      target: { uid: createFormUid },
      fieldPath: 'name',
      renderer: 'js',
    },
  });
  const result = await readApiResponse<unknown>(response, 'Create JS Field acceptance host');
  if (!isRecord(result)) {
    throw new Error('Create JS Field acceptance host response is invalid');
  }
  return {
    uid: requireString(result, 'fieldUid', 'Create JS Field acceptance host response'),
    wrapperUid: requireString(result, 'wrapperUid', 'Create JS Field acceptance host response'),
  };
}

async function createJSItemHost(page: Page, session: RootApiSession, createFormUid: string): Promise<string> {
  const response = await page.request.post('/api/flowSurfaces:addField', {
    headers: session.headers,
    data: {
      target: { uid: createFormUid },
      type: 'jsItem',
      settings: {
        label: 'Acceptance JS Item',
      },
    },
  });
  return readUid(await readApiResponse<unknown>(response, 'Create JS Item acceptance host'), 'Create JS Item host');
}

async function createJSActionHost(page: Page, session: RootApiSession, actionPanelUid: string): Promise<string> {
  const response = await page.request.post('/api/flowSurfaces:addAction', {
    headers: session.headers,
    data: {
      target: { uid: actionPanelUid },
      type: 'js',
      settings: {
        title: 'Acceptance JS Action',
      },
    },
  });
  return readUid(
    await readApiResponse<unknown>(response, 'Create JS Action acceptance host'),
    'Create JS Action acceptance host',
  );
}

async function runCleanupRequest(response: APIResponse, operation: string): Promise<void> {
  if (response.ok() || response.status() === 404) {
    return;
  }
  await assertApiResponseOk(response, operation);
}

type RunJsSettingsGroupKey = 'jsSettings' | 'clickSettings';

async function switchFlowHostToInline(
  page: Page,
  session: RootApiSession,
  input: { uid: string; label: string; settingsGroupKey: RunJsSettingsGroupKey },
): Promise<void> {
  const readResponse = await page.request.get('/api/flowModels:findOne', {
    headers: session.headers,
    params: { uid: input.uid },
  });
  if (readResponse.status() === 404) {
    return;
  }
  const model = await readApiResponse<unknown>(readResponse, `Read ${input.label} before cleanup`);
  if (!isRecord(model)) {
    throw new Error(`Read ${input.label} before cleanup returned an invalid FlowModel`);
  }

  const stepParams = isRecord(model.stepParams) ? { ...model.stepParams } : {};
  const settingsGroup = isRecord(stepParams[input.settingsGroupKey]) ? { ...stepParams[input.settingsGroupKey] } : {};
  const runJs = isRecord(settingsGroup.runJs) ? { ...settingsGroup.runJs } : {};
  runJs.sourceMode = 'inline';
  delete runJs.sourceBinding;
  delete runJs.settings;
  settingsGroup.runJs = runJs;
  delete settingsGroup.sourceMode;
  delete settingsGroup.sourceBinding;
  delete settingsGroup.settings;
  stepParams[input.settingsGroupKey] = settingsGroup;

  const saveResponse = await page.request.post('/api/flowModels:save', {
    headers: session.headers,
    data: {
      ...model,
      stepParams,
    },
  });
  await runCleanupRequest(saveResponse, `Switch ${input.label} to Inline before cleanup`);
}

async function switchAcceptanceHostsToInline(
  page: Page,
  session: RootApiSession,
  hosts: FlowHostAcceptancePage['hosts'],
): Promise<void> {
  const failures: string[] = [];
  const hostInputs: Array<{ uid: string; label: string; settingsGroupKey: RunJsSettingsGroupKey }> = [
    { uid: hosts.jsBlock.uid, label: 'JS Block acceptance host', settingsGroupKey: 'jsSettings' },
    { uid: hosts.jsField.uid, label: 'JS Field acceptance host', settingsGroupKey: 'jsSettings' },
    { uid: hosts.jsAction.uid, label: 'JS Action acceptance host', settingsGroupKey: 'clickSettings' },
    { uid: hosts.jsItem.uid, label: 'JS Item acceptance host', settingsGroupKey: 'jsSettings' },
  ];

  for (const input of hostInputs) {
    try {
      await switchFlowHostToInline(page, session, input);
    } catch (error) {
      failures.push(getErrorMessage(error));
    }
  }

  if (failures.length) {
    throw new Error(`Failed to switch Flow host fixtures to Inline: ${failures.join('; ')}`);
  }
}

async function destroyFlowPage(page: Page, session: RootApiSession, pageUid: string): Promise<void> {
  const response = await page.request.post('/api/flowSurfaces:destroyPage', {
    headers: session.headers,
    data: { uid: pageUid },
  });
  await runCleanupRequest(response, 'Destroy modern Flow host page');
}

async function destroyAcceptanceCollection(page: Page, session: RootApiSession, collectionName: string): Promise<void> {
  const response = await page.request.post('/api/collections:destroy', {
    headers: session.headers,
    params: {
      'filterByTk[]': collectionName,
      cascade: true,
    },
  });
  await runCleanupRequest(response, 'Destroy Flow host acceptance collection');
}

export async function createFlowHostAcceptancePage(
  page: Page,
  session: RootApiSession,
  options: CreateFlowHostAcceptancePageOptions = {},
): Promise<FlowHostAcceptancePage> {
  const suffix = nextFixtureSuffix();
  const collectionName = options.collectionName || `light_extension_acceptance_${suffix}`;
  let createdPage: CreatedFlowPage | undefined;
  await createAcceptanceCollection(page, session, collectionName);

  try {
    createdPage = await createFlowPage(page, session, options);
    const jsBlockUid = await addBlock(
      page,
      session,
      {
        target: { uid: createdPage.tabSchemaUid },
        type: 'jsBlock',
        settings: {
          title: 'Acceptance JS Block',
          version: 'v2',
          code: 'ctx.render(<div data-testid="inline-acceptance-js-block">Inline JS Block</div>);',
        },
      },
      'Create JS Block acceptance host',
    );
    const createFormUid = await addBlock(
      page,
      session,
      {
        target: { uid: createdPage.tabSchemaUid },
        type: 'createForm',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName,
        },
        fields: ['status'],
      },
      'Create acceptance form host container',
    );
    const jsField = await createJSFieldHost(page, session, createFormUid);
    const jsItemUid = await createJSItemHost(page, session, createFormUid);
    const actionPanelUid = await addBlock(
      page,
      session,
      {
        target: { uid: createdPage.tabSchemaUid },
        type: 'actionPanel',
      },
      'Create acceptance action panel',
    );
    const jsActionUid = await createJSActionHost(page, session, actionPanelUid);

    return {
      collectionName,
      routePath: getModernFlowPagePath(createdPage.pageSchemaUid, options.modernClientPrefix),
      pageUid: createdPage.pageUid,
      pageSchemaUid: createdPage.pageSchemaUid,
      tabSchemaUid: createdPage.tabSchemaUid,
      gridUid: createdPage.gridUid,
      routeId: createdPage.routeId,
      containers: {
        createFormUid,
        actionPanelUid,
      },
      hosts: {
        jsBlock: { uid: jsBlockUid },
        jsField,
        jsAction: { uid: jsActionUid },
        jsItem: { uid: jsItemUid },
      },
    };
  } catch (error) {
    const cleanupFailures: string[] = [];
    if (createdPage) {
      try {
        await destroyFlowPage(page, session, createdPage.pageUid);
      } catch (cleanupError) {
        cleanupFailures.push(getErrorMessage(cleanupError));
      }
    }
    try {
      await destroyAcceptanceCollection(page, session, collectionName);
    } catch (cleanupError) {
      cleanupFailures.push(getErrorMessage(cleanupError));
    }
    if (cleanupFailures.length) {
      throw new Error(
        `Flow host fixture setup failed: ${getErrorMessage(error)}; cleanup also failed: ${cleanupFailures.join('; ')}`,
      );
    }
    throw error;
  }
}

export async function destroyFlowHostAcceptancePage(
  page: Page,
  session: RootApiSession,
  fixture: Pick<FlowHostAcceptancePage, 'pageUid' | 'collectionName' | 'hosts'>,
): Promise<void> {
  await switchAcceptanceHostsToInline(page, session, fixture.hosts);

  const failures: string[] = [];
  try {
    await destroyFlowPage(page, session, fixture.pageUid);
  } catch (error) {
    failures.push(getErrorMessage(error));
  }
  try {
    await destroyAcceptanceCollection(page, session, fixture.collectionName);
  } catch (error) {
    failures.push(getErrorMessage(error));
  }
  if (failures.length) {
    throw new Error(failures.join('; '));
  }
}
