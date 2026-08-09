/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import type { PluginConfiguration, RunJSSourceLocator } from '@nocobase/server';
import type { RunJSSourceOpenResult } from '@nocobase/runjs-workspace/server';
import { createMockServer, type MockServer } from '@nocobase/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resolveRuntimeRunJS } from '../../../../../../core/client-v2/src/flow/components/runjs-source/resolveRuntimeRunJS';
import flowModelTreePathCollection from '../../../../plugin-flow-engine/src/server/collections/flowModelTreePath';
import flowModelsCollection from '../../../../plugin-flow-engine/src/server/collections/flowModels';
import chartBlockRawFixture from '../../../../plugin-flow-engine/src/server/__tests__/flow-surfaces-fixtures/chart-block-live.raw-persisted.json';
import jsBlockRawFixture from '../../../../plugin-flow-engine/src/server/__tests__/flow-surfaces-fixtures/js-block-live.raw-persisted.json';
import { FLOW_SURFACES_MINIMAL_TEST_PLUGINS } from '../../../../plugin-flow-engine/src/server/__tests__/flow-surfaces.test-plugins';
import FlowModelRepository from '../../../../plugin-flow-engine/src/server/repository';
import PluginUISchemaStorageServer from '../../../../plugin-flow-engine/src/server/server';
import { JS_TEMPLATE_COLLECTION_NAMES } from '../../constants';
import PluginJsTemplateServer from '../plugin';

class OriginNextFlowModelStoragePlugin extends PluginUISchemaStorageServer {
  async loadCollections() {
    await this.db.collection(flowModelsCollection);
    await this.db.collection(flowModelTreePathCollection);
  }
}

const ORIGIN_NEXT_TEST_PLUGINS = FLOW_SURFACES_MINIMAL_TEST_PLUGINS.map(
  (plugin): PluginConfiguration =>
    plugin === 'flow-engine' ? [OriginNextFlowModelStoragePlugin, { name: 'flow-engine' }] : plugin,
);

// Raw persisted model trees come from origin/next at the commit named by this suite; the Chart custom option shape
// comes from that baseline's flow-surfaces.chart-write integration fixture.
const CHART_OPTION_RAW = `
const hasBlockedWord = /fetch|process|localStorage/.test('fetch');
return {
  title: { text: hasBlockedWord ? 'Employee count' : 'Employee count' },
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [{ type: 'bar', encode: { x: 'department.title', y: 'employeeCount' } }],
};
`.trim();

const EXPECTED_JS_BLOCK_RENDER = `
  <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
    <h2 style="color: #1890ff; margin: 0 0 12px 0; font-size: 24px; font-weight: 600;">JS Block</h2>
    <p style="color: #666; margin: 0;">Replace this code with your custom JavaScript to build an interactive block.</p>
  </div>
`;

const CHART_DATA = [
  { 'department.title': 'Engineering', employeeCount: 3 },
  { 'department.title': 'Sales', employeeCount: 2 },
];

describe('origin/next Inline RunJS upgrade compatibility at a9142daf3f3a28ad869f2a136df8cc7d804ff525', () => {
  let app: MockServer | undefined;
  let databaseDirectory: string | undefined;

  afterEach(async () => {
    try {
      await app?.destroy();
    } finally {
      if (databaseDirectory) {
        await rm(databaseDirectory, { recursive: true, force: true });
      }
      vi.unstubAllEnvs();
    }
  });

  it('upgrades, opens, and executes unchanged JS Block and Chart value sources without template side effects', async () => {
    vi.stubEnv('SKIP_SAME_VERSION_UPGRADE', 'false');
    const dialect = String(process.env.DB_DIALECT || 'sqlite').toLowerCase();
    databaseDirectory =
      dialect === 'sqlite' ? await mkdtemp(join(tmpdir(), 'nocobase-inline-runjs-upgrade-')) : undefined;
    const databaseOptions = databaseDirectory
      ? {
          dialect: 'sqlite' as const,
          storage: join(databaseDirectory, 'database.sqlite'),
          schema: undefined,
        }
      : undefined;

    app = await createMockServer({
      registerActions: true,
      acl: true,
      skipStart: true,
      ...(databaseOptions ? { database: databaseOptions } : {}),
      plugins: ORIGIN_NEXT_TEST_PLUGINS,
    });
    expect(app.pm.get('flow-engine')).toBeInstanceOf(OriginNextFlowModelStoragePlugin);
    expect(app.pm.has(PluginJsTemplateServer)).toBe(false);
    expect(app.db.hasCollection('vscFileRepositories')).toBe(false);
    for (const collectionName of JS_TEMPLATE_COLLECTION_NAMES) {
      expect(app.db.hasCollection(collectionName)).toBe(false);
    }

    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    const expectedJsBlock = structuredClone(jsBlockRawFixture.tree);
    const expectedChart = structuredClone(chartBlockRawFixture.tree);
    Object.assign(expectedChart.stepParams.chartSettings.configure.chart.option, {
      mode: 'custom',
      raw: CHART_OPTION_RAW,
    });
    if (expectedJsBlock.parentId !== expectedChart.parentId) {
      throw new Error('Expected the origin/next JS Block and Chart fixtures to share one BlockGridModel parent');
    }

    await repository.insertModel({
      uid: expectedJsBlock.parentId,
      use: 'BlockGridModel',
      subModels: {
        items: [expectedJsBlock, expectedChart],
      },
    });

    const beforeUpgradeJsBlock = await repository.findModelById(jsBlockRawFixture.tree.uid);
    const beforeUpgradeChart = await repository.findModelById(chartBlockRawFixture.tree.uid);
    expect(beforeUpgradeJsBlock).toMatchObject(expectedJsBlock);
    expect(beforeUpgradeChart).toMatchObject(expectedChart);
    const beforeUpgradeRows = await readPersistedFlowModelRows(app, expectedJsBlock.parentId);
    expect(beforeUpgradeRows.models).toHaveLength(3);
    expect(beforeUpgradeRows.treePaths).toHaveLength(5);
    const persistedJsBlockRow = beforeUpgradeRows.models.find((model) => model.uid === expectedJsBlock.uid);
    if (!persistedJsBlockRow) {
      throw new Error('Expected the origin/next JS Block fixture to have a persisted flowModels row');
    }
    expect(persistedJsBlockRow.options.stepParams.jsSettings.runJs).toEqual(
      jsBlockRawFixture.tree.stepParams.jsSettings.runJs,
    );
    const persistedChartRow = beforeUpgradeRows.models.find((model) => model.uid === expectedChart.uid);
    if (!persistedChartRow) {
      throw new Error('Expected the origin/next Chart fixture to have a persisted flowModels row');
    }
    expect(persistedChartRow.options.stepParams.chartSettings.configure.chart.option).toEqual({
      mode: 'custom',
      raw: CHART_OPTION_RAW,
    });

    const sharedDatabaseOptions = { ...app.db.options };
    await app.destroy();
    app = undefined;

    app = await createMockServer({
      registerActions: true,
      acl: true,
      skipInstall: true,
      skipStart: true,
      database: sharedDatabaseOptions,
      plugins: [...FLOW_SURFACES_MINIMAL_TEST_PLUGINS, PluginJsTemplateServer],
    });
    // createMockServer({ skipInstall: true }) leaves the new app unloaded, while direct upgrade needs a cache manager.
    await app.createCacheManager();

    const afterUpgrade = vi.fn();
    app.on('afterUpgrade', afterUpgrade);
    await app.upgrade();
    expect(afterUpgrade).toHaveBeenCalledTimes(1);
    await app.start();
    const upgradedRepository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    expect(app.pm.get('flow-engine')).not.toBeInstanceOf(OriginNextFlowModelStoragePlugin);
    expect(app.pm.has(PluginJsTemplateServer)).toBe(true);
    expect(app.db.hasCollection('vscFileRepositories')).toBe(true);
    for (const collectionName of JS_TEMPLATE_COLLECTION_NAMES) {
      expect(app.db.hasCollection(collectionName)).toBe(true);
    }

    const upgradedJsBlock = await upgradedRepository.findModelById(jsBlockRawFixture.tree.uid);
    const upgradedChart = await upgradedRepository.findModelById(chartBlockRawFixture.tree.uid);
    expect(upgradedJsBlock).toEqual(beforeUpgradeJsBlock);
    expect(upgradedChart).toEqual(beforeUpgradeChart);
    await expect(readPersistedFlowModelRows(app, expectedJsBlock.parentId)).resolves.toEqual(beforeUpgradeRows);

    const user = await app.db.getRepository('users').findOne();
    if (!user) {
      throw new Error('Expected the installed application to contain a user');
    }
    const agent = await app.agent().login(user);
    const jsBlockRunJs = upgradedJsBlock.stepParams.jsSettings.runJs;
    const chartOption = upgradedChart.stepParams.chartSettings.configure.chart.option;
    const jsBlockLocator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: jsBlockRawFixture.tree.uid,
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
      versionPath: ['version'],
    };
    const chartLocator: RunJSSourceLocator = {
      kind: 'chart.option',
      modelUid: chartBlockRawFixture.tree.uid,
    };

    expect(jsBlockRunJs).toEqual({
      version: 'v2',
      code: jsBlockRawFixture.tree.stepParams.jsSettings.runJs.code,
    });
    expect(jsBlockRunJs).not.toHaveProperty('sourceMode');
    expect(jsBlockRunJs).not.toHaveProperty('sourceBinding');
    expect(chartOption).toEqual({ mode: 'custom', raw: CHART_OPTION_RAW });
    await expect(countJsTemplateRecords(app)).resolves.toEqual(emptyJsTemplateRecordCounts());

    await openInlineSource(agent, jsBlockLocator, jsBlockRunJs.code, 'render');
    const resolvedJsBlock = await resolveRuntimeRunJS({ runJs: jsBlockRunJs });
    expect(resolvedJsBlock).toEqual({
      code: jsBlockRunJs.code,
      version: 'v2',
      sourceMode: 'inline',
      settings: {},
      context: undefined,
    });
    const jsBlockEngine = new FlowEngine();
    const render = vi.fn();
    const jsBlockExecution = await jsBlockEngine.context.runjs(
      resolvedJsBlock.code,
      { ctx: { render } },
      {
        version: resolvedJsBlock.version,
      },
    );
    expect(jsBlockExecution?.success).toBe(true);
    expect(jsBlockExecution?.value).toBeUndefined();
    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledWith(EXPECTED_JS_BLOCK_RENDER);

    await openInlineSource(agent, chartLocator, chartOption.raw, 'value');
    const chartEngine = new FlowEngine();
    chartEngine.context.defineProperty('data', { value: { objects: CHART_DATA } });
    const chartExecution = await chartEngine.context.runjs(chartOption.raw);
    expect(chartExecution?.success).toBe(true);
    expect(chartExecution?.value).toEqual({
      title: { text: 'Employee count' },
      dataset: { source: CHART_DATA },
      xAxis: { type: 'category' },
      yAxis: {},
      series: [{ type: 'bar', encode: { x: 'department.title', y: 'employeeCount' } }],
    });

    const afterExecutionJsBlock = await upgradedRepository.findModelById(jsBlockRawFixture.tree.uid);
    const afterExecutionChart = await upgradedRepository.findModelById(chartBlockRawFixture.tree.uid);
    expect(afterExecutionJsBlock).toEqual(beforeUpgradeJsBlock);
    expect(afterExecutionChart).toEqual(beforeUpgradeChart);
    expect(afterExecutionJsBlock.stepParams.jsSettings.runJs).not.toHaveProperty('sourceMode');
    expect(afterExecutionJsBlock.stepParams.jsSettings.runJs).not.toHaveProperty('sourceBinding');
    await expect(readPersistedFlowModelRows(app, expectedJsBlock.parentId)).resolves.toEqual(beforeUpgradeRows);
    await expect(countJsTemplateRecords(app)).resolves.toEqual(emptyJsTemplateRecordCounts());
  }, 120_000);
});

async function openInlineSource(
  agent: ReturnType<MockServer['agent']>,
  locator: RunJSSourceLocator,
  expectedCode: string,
  expectedSurfaceStyle: 'render' | 'value',
) {
  const openedResponse = await agent.resource('runJSSources').open({ values: { locator } });
  expect(openedResponse.status).toBe(200);
  const opened = openedResponse.body.data as RunJSSourceOpenResult;
  expect(opened.legacy).toMatchObject({
    code: expectedCode,
    version: 'v2',
    surfaceStyle: expectedSurfaceStyle,
  });
  const entryFile = opened.files.find((file) => file.path === 'src/client/index.tsx');
  if (!entryFile) {
    throw new Error(`Expected the opened ${locator.kind} workspace to contain src/client/index.tsx`);
  }
  expect(entryFile.path).toBe('src/client/index.tsx');
  expect(entryFile.content).toBe(expectedCode);
  expect(opened.source.runtimeVersion).toBe('v2');
}

async function readPersistedFlowModelRows(app: MockServer, rootUid: string) {
  const rootPaths = await app.db.getRepository('flowModelTreePath').find({
    filter: { ancestor: rootUid },
  });
  const modelUids = Array.from(new Set(rootPaths.map((treePath) => String(treePath.get('descendant'))))).sort();
  if (!modelUids.includes(rootUid)) {
    throw new Error(`Expected persisted FlowModel closure for root ${rootUid}`);
  }
  const models = await app.db.getRepository('flowModels').find({
    filter: { uid: { $in: modelUids } },
    sort: ['uid'],
  });
  const treePaths = await app.db.getRepository('flowModelTreePath').find({
    filter: { descendant: { $in: modelUids } },
    sort: ['ancestor', 'descendant', 'depth'],
  });
  return {
    models: models.map((model) => ({
      uid: model.get('uid'),
      name: model.get('name'),
      options: structuredClone(model.get('options')),
    })),
    treePaths: treePaths.map((treePath) => ({
      ancestor: treePath.get('ancestor'),
      descendant: treePath.get('descendant'),
      depth: treePath.get('depth'),
      async: treePath.get('async'),
      type: treePath.get('type'),
      sort: treePath.get('sort'),
    })),
  };
}

async function countJsTemplateRecords(app: MockServer): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const collectionName of JS_TEMPLATE_COLLECTION_NAMES) {
    counts[collectionName] = await app.db.getRepository(collectionName).count();
  }
  return counts;
}

function emptyJsTemplateRecordCounts(): Record<string, number> {
  return Object.fromEntries(JS_TEMPLATE_COLLECTION_NAMES.map((collectionName) => [collectionName, 0]));
}
