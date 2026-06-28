/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';
import PluginVscFileServer, { type RunJSSourceLocator } from '@nocobase/plugin-vsc-file';

import FlowModelRepository from '../repository';

describe('flow-engine RunJS source adapters', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;
  let repository: FlowModelRepository;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'system-settings',
        'users',
        'auth',
        'acl',
        'data-source-manager',
        PluginVscFileServer,
        'flow-engine',
      ],
    });
    const user = await app.db.getRepository('users').findOne();
    agent = await app.agent().login(user);
    repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('reads and writes FlowModel step jsSettings.runJs code/version without replacing sibling settings', async () => {
    await repository.insertModel({
      uid: 'js-step-model',
      title: 'JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return oldValue;',
            version: 'v2',
            keep: 'preserved',
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-step-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator);

    expect(open.status).toBe(200);
    expect(open.body.data.legacy).toMatchObject({
      code: 'return oldValue;',
      version: 'v2',
      surfaceStyle: 'render',
      language: 'typescript',
    });

    const publish = await publishSource(locator, open.body.data.ownerFingerprint, 'return newValue;');
    expect(publish.status).toBe(200);

    const updated = await repository.findModelById('js-step-model');
    expect(getAtPath(updated, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: 'return newValue;',
      version: 'v2',
      keep: 'preserved',
      sourceRef: {
        type: 'vsc-file',
        repoId: publish.body.data.repository.id,
        publishedCommitId: publish.body.data.commit.id,
        entry: 'src/main.tsx',
      },
    });
  });

  it('rejects FlowModel publish when sibling owner settings changed after open', async () => {
    await repository.insertModel({
      uid: 'js-step-stale-model',
      title: 'Stale JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return oldValue;',
            version: 'v2',
            keep: 'preserved',
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-step-stale-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    await repository.patch({
      uid: 'js-step-stale-model',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return oldValue;',
            version: 'v2',
            keep: 'changed elsewhere',
          },
        },
      },
    });

    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
    const publish = await publishSource(locator, open.body.data.ownerFingerprint, 'return newValue;');

    expect(publish.status).toBe(409);
    expect(publish.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      status: 409,
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);

    const updated = await repository.findModelById('js-step-stale-model');
    expect(getAtPath(updated, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: 'return oldValue;',
      keep: 'changed elsewhere',
    });
  });

  it('denies FlowModel publish when the current role cannot save flow models', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'runjs-reader',
      },
    });
    app.acl.define({
      role: 'runjs-reader',
      actions: {
        'flowModels:findOne': {},
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        nickname: 'RunJS reader',
        roles: ['runjs-reader'],
      },
    });
    const restrictedAgent = (await app.agent().login(user)).set('x-role', 'runjs-reader');

    await repository.insertModel({
      uid: 'js-step-readonly-model',
      title: 'Readonly JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return oldValue;',
            version: 'v2',
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'js-step-readonly-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const open = await openSource(locator, restrictedAgent);
    expect(open.status).toBe(200);

    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
    const publish = await publishSource(locator, open.body.data.ownerFingerprint, 'return denied;', restrictedAgent);

    expect(publish.status).toBe(403);
    expect(publish.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
        action: 'save',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);
  });

  it('denies FlowModel source access outside the flow model permission filter', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'flow-model-scoped-reader',
      },
    });
    app.acl.define({
      role: 'flow-model-scoped-reader',
      actions: {
        'flowModels:findOne': {
          filter: {
            uid: 'allowed-flow-model',
          },
          whitelist: ['stepParams'],
        },
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        nickname: 'FlowModel scoped reader',
        roles: ['flow-model-scoped-reader'],
      },
    });
    const scopedAgent = (await app.agent().login(user)).set('x-role', 'flow-model-scoped-reader');

    await repository.insertModel({
      uid: 'allowed-flow-model',
      title: 'Allowed JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return allowed;',
            version: 'v2',
          },
        },
      },
    });
    await repository.insertModel({
      uid: 'blocked-flow-model',
      title: 'Blocked JS block',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return blocked;',
            version: 'v2',
          },
        },
      },
    });

    const allowedOpen = await openSource(
      {
        kind: 'flowModel.step',
        modelUid: 'allowed-flow-model',
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      scopedAgent,
    );
    expect(allowedOpen.status).toBe(200);

    const blockedOpen = await openSource(
      {
        kind: 'flowModel.step',
        modelUid: 'blocked-flow-model',
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      scopedAgent,
    );

    expect(blockedOpen.status).toBe(403);
    expect(blockedOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
      },
    });
  });

  it('reads and writes nested RunJSValue, script, event flow, Assign Form, and Filter Form paths', async () => {
    await repository.insertModel({
      uid: 'nested-runjs-model',
      use: 'FormModel',
      stepParams: {
        rules: {
          configure: {
            values: [
              {
                type: 'runjs',
                value: {
                  code: 'return oldNested;',
                  version: 'v2',
                  keep: 'nested',
                },
              },
            ],
            linkage: {
              params: {
                value: {
                  script: 'ctx.oldLinkage();',
                  keep: 'script',
                },
              },
            },
            eventFlow: {
              params: {
                code: 'ctx.oldEvent();',
                keep: 'event',
              },
            },
            assignForm: {
              fieldSettings: {
                assignValue: {
                  mode: 'dynamic',
                  value: {
                    code: 'return oldAssign;',
                    version: 'v2',
                    keep: 'assign',
                  },
                },
              },
            },
            filterForm: {
              formFilterBlockModelSettings: {
                defaultValues: {
                  value: [
                    {
                      field: 'status',
                      operator: '$eq',
                      value: {
                        code: 'return oldFilter;',
                        version: 'v2',
                        keep: 'filter',
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });

    await publishNested(['values', 0, 'value'], 'defaultValue', 'return nextNested;');
    await publishNested(['linkage', 'params', 'value'], 'linkageRunjs', 'ctx.nextLinkage();');
    await publishNested(['eventFlow', 'params', 'code'], 'eventFlow', 'ctx.nextEvent();');
    await publishNested(['assignForm', 'fieldSettings', 'assignValue', 'value'], 'assignForm', 'return nextAssign;');
    await publishNested(
      ['filterForm', 'formFilterBlockModelSettings', 'defaultValues', 'value', 0, 'value'],
      'filterFormDefaultValues',
      'return nextFilter;',
    );

    const updated = await repository.findModelById('nested-runjs-model');
    const configure = getAtPath(updated, ['stepParams', 'rules', 'configure']);

    expect(getAtPath(configure, ['values', 0, 'value'])).toMatchObject({
      code: 'return nextNested;',
      version: 'v2',
      keep: 'nested',
    });
    expect(getAtPath(configure, ['linkage', 'params', 'value'])).toMatchObject({
      script: 'ctx.nextLinkage();',
      keep: 'script',
    });
    expect(getAtPath(configure, ['eventFlow', 'params'])).toMatchObject({
      code: 'ctx.nextEvent();',
      keep: 'event',
    });
    expect(getAtPath(configure, ['assignForm', 'fieldSettings', 'assignValue'])).toMatchObject({
      mode: 'dynamic',
      value: {
        code: 'return nextAssign;',
        version: 'v2',
        keep: 'assign',
      },
    });
    expect(
      getAtPath(configure, ['filterForm', 'formFilterBlockModelSettings', 'defaultValues', 'value', 0]),
    ).toMatchObject({
      field: 'status',
      operator: '$eq',
      value: {
        code: 'return nextFilter;',
        version: 'v2',
        keep: 'filter',
      },
    });

    async function publishNested(valuePath: Array<string | number>, scene: string, code: string) {
      const locator: RunJSSourceLocator = {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'nested-runjs-model',
        containerFlowKey: 'rules',
        containerStepKey: 'configure',
        valuePath,
        scene,
      };
      const open = await openSource(locator);

      expect(open.status).toBe(200);
      const publish = await publishSource(locator, open.body.data.ownerFingerprint, code);
      expect(publish.status).toBe(200);
    }
  });

  it('reads and writes chart option and events raw sources with distinct surface styles', async () => {
    await repository.insertModel({
      uid: 'chart-runjs-model',
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                builder: {
                  type: 'bar',
                },
                raw: 'return { xAxis: {} };',
              },
              events: {
                raw: 'ctx.onClick();',
              },
            },
          },
        },
      },
    });

    const optionLocator: RunJSSourceLocator = {
      kind: 'chart.option',
      modelUid: 'chart-runjs-model',
    };
    const eventsLocator: RunJSSourceLocator = {
      kind: 'chart.events',
      modelUid: 'chart-runjs-model',
    };
    const optionOpen = await openSource(optionLocator);
    const eventsOpen = await openSource(eventsLocator);

    expect(optionOpen.body.data.legacy).toMatchObject({
      code: 'return { xAxis: {} };',
      surfaceStyle: 'value',
    });
    expect(eventsOpen.body.data.legacy).toMatchObject({
      code: 'ctx.onClick();',
      surfaceStyle: 'action',
    });

    await expect(
      publishSource(optionLocator, optionOpen.body.data.ownerFingerprint, 'return { yAxis: {} };'),
    ).resolves.toHaveProperty('status', 200);
    await expect(
      publishSource(eventsLocator, eventsOpen.body.data.ownerFingerprint, 'ctx.nextClick();'),
    ).resolves.toHaveProperty('status', 200);

    const updated = await repository.findModelById('chart-runjs-model');
    expect(getAtPath(updated, ['stepParams', 'chartSettings', 'configure', 'chart', 'option'])).toMatchObject({
      mode: 'raw',
      builder: {
        type: 'bar',
      },
      raw: 'return { yAxis: {} };',
    });
    expect(getAtPath(updated, ['stepParams', 'chartSettings', 'configure', 'chart', 'events', 'raw'])).toBe(
      'ctx.nextClick();',
    );
  });

  function openSource(locator: RunJSSourceLocator, requestAgent = agent) {
    return requestAgent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
  }

  function publishSource(
    locator: RunJSSourceLocator,
    baseOwnerFingerprint: string,
    code: string,
    requestAgent = agent,
  ) {
    return requestAgent.resource('runJSSources').publish({
      values: {
        locator,
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint,
        message: 'Update RunJS source',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: code,
            language: 'typescript',
          },
        ],
      },
    });
  }
});

function getAtPath(root: unknown, path: Array<string | number>): unknown {
  let current = root;
  for (const segment of path) {
    if (Array.isArray(current) && typeof segment === 'number') {
      current = current[segment];
      continue;
    }
    if (isRecord(current) && typeof segment === 'string') {
      current = current[segment];
      continue;
    }

    return undefined;
  }

  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
