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

const basePlugins = ['field-sort', 'system-settings', 'users', 'auth', 'acl', 'data-source-manager'];

describe('flow-engine RunJS source adapters', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;
  let repository: FlowModelRepository;

  beforeEach(async () => {
    await resetApp([PluginVscFileServer, 'flow-engine']);
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

    const publish = await publishSource(locator, open.body.data.ownerFingerprint, 'ctx.render("newValue");');
    expect(publish.status).toBe(200);

    const updated = await repository.findModelById('js-step-model');
    expect(getAtPath(updated, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: 'ctx.render("newValue");',
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
    const publish = await publishSource(locator, open.body.data.ownerFingerprint, 'ctx.render("newValue");');

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
    const publish = await publishSource(
      locator,
      open.body.data.ownerFingerprint,
      'ctx.render("denied");',
      restrictedAgent,
    );

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

  it('checks nested FlowModel source permission before loading the owner model', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'runjs-no-flow-models',
      },
    });
    app.acl.define({
      role: 'runjs-no-flow-models',
      actions: {},
    });
    const user = await app.db.getRepository('users').create({
      values: {
        nickname: 'RunJS no flow models',
        roles: ['runjs-no-flow-models'],
      },
    });
    const restrictedAgent = (await app.agent().login(user)).set('x-role', 'runjs-no-flow-models');

    await repository.insertModel({
      uid: 'nested-no-permission-model',
      use: 'FormModel',
      stepParams: {
        eventSettings: {
          customVariable: {
            variables: [
              {
                key: 'var_total',
                type: 'runjs',
                runjs: {
                  code: 'return 1;',
                  version: 'v2',
                },
              },
            ],
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-no-permission-model',
      containerFlowKey: 'eventSettings',
      containerStepKey: 'customVariable',
      valuePath: ['variables', 'var_total', 'runjs'],
      scene: 'eventFlow',
    };

    const existingOpen = await openSource(locator, restrictedAgent);
    expect(existingOpen.status).toBe(403);
    expect(existingOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      details: {
        resource: 'flowModels',
        action: 'findOne',
      },
    });

    const missingOwnerOpen = await openSource({ ...locator, modelUid: 'missing-flow-model' }, restrictedAgent);
    expect(missingOwnerOpen.status).toBe(403);
    expect(missingOwnerOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      details: {
        resource: 'flowModels',
        action: 'findOne',
      },
    });
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
        eventSettings: {
          customVariable: {
            variables: [
              {
                key: 'var_allowed',
                type: 'runjs',
                runjs: {
                  code: 'return allowedNested;',
                  version: 'v2',
                },
              },
            ],
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
        eventSettings: {
          customVariable: {
            variables: [
              {
                key: 'var_blocked',
                type: 'runjs',
                runjs: {
                  code: 'return blockedNested;',
                  version: 'v2',
                },
              },
            ],
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

    const allowedNestedOpen = await openSource(
      {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'allowed-flow-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'customVariable',
        valuePath: ['variables', 'var_allowed', 'runjs'],
        scene: 'eventFlow',
      },
      scopedAgent,
    );
    expect(allowedNestedOpen.status).toBe(200);

    const blockedNestedOpen = await openSource(
      {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'blocked-flow-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'customVariable',
        valuePath: ['variables', 'var_blocked', 'runjs'],
        scene: 'eventFlow',
      },
      scopedAgent,
    );
    expect(blockedNestedOpen.status).toBe(403);
    expect(blockedNestedOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
      },
    });

    const missingNestedOpen = await openSource(
      {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'missing-flow-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'customVariable',
        valuePath: ['variables', 'var_missing', 'runjs'],
        scene: 'eventFlow',
      },
      scopedAgent,
    );
    expect(missingNestedOpen.status).toBe(403);
    expect(missingNestedOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
      },
    });

    await app.db.getRepository('roles').create({
      values: {
        name: 'flow-model-flow-registry-only-reader',
      },
    });
    app.acl.define({
      role: 'flow-model-flow-registry-only-reader',
      actions: {
        'flowModels:findOne': {
          whitelist: ['flowRegistry'],
        },
      },
    });
    const fieldRestrictedUser = await app.db.getRepository('users').create({
      values: {
        nickname: 'FlowModel flow registry reader',
        roles: ['flow-model-flow-registry-only-reader'],
      },
    });
    const fieldRestrictedAgent = (await app.agent().login(fieldRestrictedUser)).set(
      'x-role',
      'flow-model-flow-registry-only-reader',
    );

    const fieldDeniedNestedOpen = await openSource(
      {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'allowed-flow-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'customVariable',
        valuePath: ['variables', 'var_allowed', 'runjs'],
        scene: 'eventFlow',
      },
      fieldRestrictedAgent,
    );
    expect(fieldDeniedNestedOpen.status).toBe(403);
    expect(fieldDeniedNestedOpen.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        resource: 'flowModels',
      },
    });

    const missingFieldDeniedNestedOpen = await openSource(
      {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'missing-flow-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'customVariable',
        valuePath: ['variables', 'var_allowed', 'runjs'],
        scene: 'eventFlow',
      },
      fieldRestrictedAgent,
    );
    expect(missingFieldDeniedNestedOpen.status).toBe(403);
    expect(missingFieldDeniedNestedOpen.body.errors[0]).toMatchObject({
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

    await publishNested(['values', 0, 'value'], 'defaultValue', 'const nextNested = "nextNested";\nreturn nextNested;');
    await publishNested(['linkage', 'params', 'value'], 'linkageRunjs', 'ctx.message.info("nextLinkage");');
    await publishNested(['eventFlow', 'params', 'code'], 'eventFlow', 'ctx.message.info("nextEvent");');
    await publishNested(
      ['assignForm', 'fieldSettings', 'assignValue', 'value'],
      'assignForm',
      'const nextAssign = "nextAssign";\nreturn nextAssign;',
    );
    await publishNested(
      ['filterForm', 'formFilterBlockModelSettings', 'defaultValues', 'value', 0, 'value'],
      'filterFormDefaultValues',
      'const nextFilter = "nextFilter";\nreturn nextFilter;',
    );

    const updated = await repository.findModelById('nested-runjs-model');
    const configure = getAtPath(updated, ['stepParams', 'rules', 'configure']);

    expect(getAtPath(configure, ['values', 0, 'value'])).toMatchObject({
      code: 'const nextNested = "nextNested";\nreturn nextNested;',
      version: 'v2',
      keep: 'nested',
    });
    expect(getAtPath(configure, ['linkage', 'params', 'value'])).toMatchObject({
      script: 'ctx.message.info("nextLinkage");',
      keep: 'script',
    });
    expect(getAtPath(configure, ['eventFlow', 'params'])).toMatchObject({
      code: 'ctx.message.info("nextEvent");',
      keep: 'event',
    });
    expect(getAtPath(configure, ['assignForm', 'fieldSettings', 'assignValue'])).toMatchObject({
      mode: 'dynamic',
      value: {
        code: 'const nextAssign = "nextAssign";\nreturn nextAssign;',
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
        code: 'const nextFilter = "nextFilter";\nreturn nextFilter;',
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

  it('reads and writes nested RunJS sources through keyed arrays', async () => {
    await repository.insertModel({
      uid: 'nested-keyed-runjs-model',
      use: 'FormModel',
      stepParams: {
        eventSettings: {
          linkageRules: {
            value: [
              {
                key: 'rule_1',
                actions: [
                  {
                    key: 'runjs_action',
                    name: 'linkageRunjs',
                    params: {
                      value: {
                        script: 'ctx.oldLinkage();',
                        keep: 'script',
                      },
                    },
                  },
                  {
                    key: 'assign_action',
                    name: 'linkageAssignField',
                    params: {
                      value: [
                        {
                          key: 'assign_rule',
                          targetPath: 'status',
                          value: {
                            code: 'return oldAssign;',
                            version: 'v2',
                            keep: 'assign',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
          customVariable: {
            variables: [
              {
                key: 'var_total',
                title: 'Total',
                type: 'runjs',
                runjs: {
                  code: 'return oldVariable;',
                  version: 'v2',
                  keep: 'variable',
                },
              },
            ],
          },
        },
      },
    });

    await publishNested(
      ['value', 'rule_1', 'actions', 'runjs_action', 'params', 'value', 'script'],
      'linkage',
      'ctx.message.info("nextLinkage");',
    );
    await publishNested(
      ['value', 'rule_1', 'actions', 'assign_action', 'params', 'value', 'assign_rule', 'value'],
      'formValue',
      'return "nextAssign";',
    );
    await publishNested(['variables', 'var_total', 'runjs'], 'eventFlow', 'return 123;');

    const updated = await repository.findModelById('nested-keyed-runjs-model');

    expect(
      getAtPath(updated, ['stepParams', 'eventSettings', 'linkageRules', 'value', 0, 'actions', 0, 'params', 'value']),
    ).toMatchObject({
      script: 'ctx.message.info("nextLinkage");',
      keep: 'script',
    });
    expect(
      getAtPath(updated, [
        'stepParams',
        'eventSettings',
        'linkageRules',
        'value',
        0,
        'actions',
        1,
        'params',
        'value',
        0,
        'value',
      ]),
    ).toMatchObject({
      code: 'return "nextAssign";',
      version: 'v2',
      keep: 'assign',
    });
    expect(
      getAtPath(updated, ['stepParams', 'eventSettings', 'customVariable', 'variables', 0, 'runjs']),
    ).toMatchObject({
      code: 'return 123;',
      version: 'v2',
      keep: 'variable',
    });

    async function publishNested(valuePath: Array<string | number>, scene: string, code: string) {
      const locator: RunJSSourceLocator = {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'nested-keyed-runjs-model',
        containerFlowKey: 'eventSettings',
        containerStepKey: scene === 'eventFlow' ? 'customVariable' : 'linkageRules',
        valuePath,
        scene,
      };
      const open = await openSource(locator);

      expect(open.status).toBe(200);
      const publish = await publishSource(locator, open.body.data.ownerFingerprint, code);
      expect(publish.status).toBe(200);
    }
  });

  it('rejects nested keyed RunJS sources when the keyed array container is missing', async () => {
    await repository.insertModel({
      uid: 'nested-missing-keyed-container-model',
      use: 'FormModel',
      stepParams: {
        eventSettings: {
          linkageRules: {},
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-missing-keyed-container-model',
      containerFlowKey: 'eventSettings',
      containerStepKey: 'linkageRules',
      valuePath: ['value', 'rule_new', 'actions', 'action_new', 'params', 'value', 'script'],
      scene: 'linkage',
    };

    const open = await openSource(locator);
    expect(open.status).toBe(404);
    expect(open.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'rule_new',
      },
    });

    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
    const publish = await publishSource(locator, 'missing-owner-fingerprint', 'ctx.message.info("draft");');

    expect(publish.status).toBe(404);
    expect(publish.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'rule_new',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);

    const updated = await repository.findModelById('nested-missing-keyed-container-model');
    expect(getAtPath(updated, ['stepParams', 'eventSettings', 'linkageRules', 'value'])).toBeUndefined();
  });

  it('rejects nested keyed RunJS sources when the target path under existing keyed rows is missing', async () => {
    await repository.insertModel({
      uid: 'nested-missing-keyed-target-model',
      use: 'FormModel',
      stepParams: {
        eventSettings: {
          linkageRules: {
            value: [
              {
                key: 'rule_1',
                actions: [
                  {
                    key: 'runjs_action',
                    name: 'linkageRunjs',
                  },
                ],
              },
            ],
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-missing-keyed-target-model',
      containerFlowKey: 'eventSettings',
      containerStepKey: 'linkageRules',
      valuePath: ['value', 'rule_1', 'actions', 'runjs_action', 'params', 'value', 'script'],
      scene: 'linkage',
    };

    const open = await openSource(locator);
    expect(open.status).toBe(404);
    expect(open.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'value.rule_1.actions.runjs_action.params.value.script',
      },
    });

    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
    const publish = await publishSource(locator, 'missing-owner-fingerprint', 'ctx.message.info("draft");');

    expect(publish.status).toBe(404);
    expect(publish.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'value.rule_1.actions.runjs_action.params.value.script',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);

    const updated = await repository.findModelById('nested-missing-keyed-target-model');
    expect(
      getAtPath(updated, ['stepParams', 'eventSettings', 'linkageRules', 'value', 0, 'actions', 0, 'params']),
    ).toBeUndefined();
  });

  it('creates RunJSValue objects when publishing missing value-surface leaves', async () => {
    await repository.insertModel({
      uid: 'nested-empty-value-surface-model',
      use: 'FormModel',
      stepParams: {
        editItemSettings: {
          initialValue: {},
        },
        fieldSettings: {
          assignValue: {},
        },
      },
    });

    const defaultLocator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-empty-value-surface-model',
      containerFlowKey: 'editItemSettings',
      containerStepKey: 'initialValue',
      valuePath: ['defaultValue'],
      scene: 'formValue',
    };
    const assignLocator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-empty-value-surface-model',
      containerFlowKey: 'fieldSettings',
      containerStepKey: 'assignValue',
      valuePath: ['value'],
      scene: 'assignForm',
    };

    const defaultOpen = await openSource(defaultLocator);
    expect(defaultOpen.status).toBe(200);
    await expect(
      publishSource(defaultLocator, defaultOpen.body.data.ownerFingerprint, 'return "default";'),
    ).resolves.toHaveProperty('status', 200);

    const assignOpen = await openSource(assignLocator);
    expect(assignOpen.status).toBe(200);
    await expect(
      publishSource(assignLocator, assignOpen.body.data.ownerFingerprint, 'return "assigned";'),
    ).resolves.toHaveProperty('status', 200);

    const updated = await repository.findModelById('nested-empty-value-surface-model');
    expect(getAtPath(updated, ['stepParams', 'editItemSettings', 'initialValue', 'defaultValue'])).toEqual({
      code: 'return "default";',
      version: 'v2',
    });
    expect(getAtPath(updated, ['stepParams', 'fieldSettings', 'assignValue', 'value'])).toEqual({
      code: 'return "assigned";',
      version: 'v2',
    });
  });

  it('rejects missing nested RunJS owners without creating value-surface paths', async () => {
    await repository.insertModel({
      uid: 'nested-missing-owner-model',
      use: 'FormModel',
      stepParams: {},
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-missing-owner-model',
      containerFlowKey: 'editItemSettings',
      containerStepKey: 'initialValue',
      valuePath: ['defaultValue'],
      scene: 'formValue',
    };

    const open = await openSource(locator);
    expect(open.status).toBe(404);
    expect(open.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'stepParams.editItemSettings.initialValue',
      },
    });

    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
    const publish = await publishSource(locator, 'missing-owner-fingerprint', 'return "created";');

    expect(publish.status).toBe(404);
    expect(publish.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'stepParams.editItemSettings.initialValue',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);

    const updated = await repository.findModelById('nested-missing-owner-model');
    expect(getAtPath(updated, ['stepParams', 'editItemSettings'])).toBeUndefined();
  });

  it('rejects missing nested RunJS intermediate paths without creating value-surface objects', async () => {
    await repository.insertModel({
      uid: 'nested-missing-intermediate-model',
      use: 'FormModel',
      stepParams: {
        editItemSettings: {
          initialValue: {},
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'nested-missing-intermediate-model',
      containerFlowKey: 'editItemSettings',
      containerStepKey: 'initialValue',
      valuePath: ['missingParent', 'value'],
      scene: 'formValue',
    };

    const open = await openSource(locator);
    expect(open.status).toBe(404);
    expect(open.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'missingParent',
      },
    });

    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
    const publish = await publishSource(locator, 'missing-owner-fingerprint', 'return "created";');

    expect(publish.status).toBe(404);
    expect(publish.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'missingParent',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);

    const updated = await repository.findModelById('nested-missing-intermediate-model');
    expect(getAtPath(updated, ['stepParams', 'editItemSettings', 'initialValue', 'missingParent'])).toBeUndefined();
  });

  it('reads and writes flowRegistry RunJS steps from defaultParams and legacy params paths', async () => {
    await repository.insertModel({
      uid: 'flow-registry-runjs-model',
      use: 'ActionModel',
      flowRegistry: {
        submitFlow: {
          steps: {
            defaultRun: {
              use: 'runjs',
              defaultParams: {
                code: 'ctx.oldDefault();',
              },
            },
            legacyRun: {
              use: 'runjs',
              params: {
                code: 'ctx.oldLegacy();',
                keep: 'legacy',
              },
            },
            bothRun: {
              use: 'runjs',
              defaultParams: {
                code: 'ctx.oldDefaultInBoth();',
                keepDefault: 'default',
              },
              params: {
                code: 'ctx.oldLegacyInBoth();',
                keepLegacy: 'legacy',
              },
            },
            customVariableRun: {
              use: 'customVariable',
              defaultParams: {
                variables: [
                  {
                    key: 'var_total',
                    title: 'Total',
                    type: 'runjs',
                    runjs: {
                      code: 'return oldTotal;',
                      version: 'v2',
                      keep: 'variable',
                    },
                  },
                ],
              },
            },
            customVariableLegacy: {
              use: 'customVariable',
              params: {
                variables: [
                  {
                    key: 'var_legacy',
                    title: 'Legacy',
                    type: 'runjs',
                    runjs: {
                      code: 'return oldLegacyVariable;',
                      version: 'v2',
                      keep: 'legacy variable',
                    },
                  },
                ],
              },
            },
            customVariableEmpty: {
              use: 'customVariable',
              defaultParams: {},
            },
          },
        },
      },
    });

    const defaultLocator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-runjs-model',
      flowKey: 'submitFlow',
      stepKey: 'defaultRun',
      sourcePath: ['defaultParams', 'code'],
    };
    const legacyLocator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-runjs-model',
      flowKey: 'submitFlow',
      stepKey: 'legacyRun',
      sourcePath: ['defaultParams', 'code'],
    };
    const bothLocator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-runjs-model',
      flowKey: 'submitFlow',
      stepKey: 'bothRun',
      sourcePath: ['defaultParams', 'code'],
    };

    const defaultOpen = await openSource(defaultLocator);
    expect(defaultOpen.body.data.legacy).toMatchObject({ code: 'ctx.oldDefault();', surfaceStyle: 'action' });
    await expect(
      publishSource(defaultLocator, defaultOpen.body.data.ownerFingerprint, 'ctx.message.info("nextDefault");'),
    ).resolves.toHaveProperty('status', 200);

    const legacyOpen = await openSource(legacyLocator);
    expect(legacyOpen.body.data.legacy).toMatchObject({ code: 'ctx.oldLegacy();', surfaceStyle: 'action' });
    await expect(
      publishSource(legacyLocator, legacyOpen.body.data.ownerFingerprint, 'ctx.message.info("nextLegacy");'),
    ).resolves.toHaveProperty('status', 200);

    const bothOpen = await openSource(bothLocator);
    expect(bothOpen.body.data.legacy).toMatchObject({ code: 'ctx.oldLegacyInBoth();', surfaceStyle: 'action' });
    await expect(
      publishSource(bothLocator, bothOpen.body.data.ownerFingerprint, 'ctx.message.info("nextBoth");'),
    ).resolves.toHaveProperty('status', 200);

    const variableLocator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'flow-registry-runjs-model',
      containerFlowKey: 'submitFlow',
      containerStepKey: 'customVariableRun',
      valuePath: ['variables', 'var_total', 'runjs'],
      scene: 'eventFlow',
    };
    const variableOpen = await openSource(variableLocator);
    expect(variableOpen.body.data.legacy).toMatchObject({ code: 'return oldTotal;', surfaceStyle: 'value' });
    const commitCountBeforeBadVariablePublish = await app.db.getRepository('vscFileCommits').count();
    const badVariablePublish = await publishSource(
      variableLocator,
      variableOpen.body.data.ownerFingerprint,
      'ctx.render(null);',
    );
    expect(badVariablePublish.status).toBe(400);
    expect(badVariablePublish.body.errors[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-value-render-forbidden',
          }),
        ]),
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeBadVariablePublish);
    await expect(
      publishSource(variableLocator, variableOpen.body.data.ownerFingerprint, 'return 456;'),
    ).resolves.toHaveProperty('status', 200);

    const legacyVariableLocator: RunJSSourceLocator = {
      ...variableLocator,
      containerStepKey: 'customVariableLegacy',
      valuePath: ['variables', 'var_legacy', 'runjs'],
    };
    const legacyVariableOpen = await openSource(legacyVariableLocator);
    expect(legacyVariableOpen.body.data.legacy).toMatchObject({
      code: 'return oldLegacyVariable;',
      surfaceStyle: 'value',
    });
    await expect(
      publishSource(legacyVariableLocator, legacyVariableOpen.body.data.ownerFingerprint, 'return 654;'),
    ).resolves.toHaveProperty('status', 200);

    const missingVariableLocator: RunJSSourceLocator = {
      ...variableLocator,
      valuePath: ['variables', 'missing_var', 'runjs'],
    };
    const missingOpen = await openSource(missingVariableLocator);
    expect(missingOpen.status).toBe(404);
    expect(missingOpen.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'missing_var',
      },
    });
    const commitCountBeforeMissingPublish = await app.db.getRepository('vscFileCommits').count();
    const missingPublish = await publishSource(missingVariableLocator, 'missing-owner-fingerprint', 'return 789;');
    expect(missingPublish.status).toBe(404);
    expect(missingPublish.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'missing_var',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeMissingPublish);

    const missingVariablesContainerLocator: RunJSSourceLocator = {
      ...variableLocator,
      containerStepKey: 'customVariableEmpty',
      valuePath: ['variables', 'var_new', 'runjs'],
    };
    const missingVariablesContainerOpen = await openSource(missingVariablesContainerLocator);
    expect(missingVariablesContainerOpen.status).toBe(404);
    expect(missingVariablesContainerOpen.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'var_new',
      },
    });
    const commitCountBeforeMissingContainerPublish = await app.db.getRepository('vscFileCommits').count();
    const missingVariablesContainerPublish = await publishSource(
      missingVariablesContainerLocator,
      'missing-owner-fingerprint',
      'return 789;',
    );
    expect(missingVariablesContainerPublish.status).toBe(404);
    expect(missingVariablesContainerPublish.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        key: 'var_new',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(
      commitCountBeforeMissingContainerPublish,
    );

    const updated = await repository.findModelById('flow-registry-runjs-model');

    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'defaultRun', 'defaultParams', 'code'])).toBe(
      'ctx.message.info("nextDefault");',
    );
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'legacyRun', 'params'])).toMatchObject({
      code: 'ctx.message.info("nextLegacy");',
      keep: 'legacy',
    });
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'legacyRun', 'defaultParams'])).toBeUndefined();
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'bothRun', 'params'])).toMatchObject({
      code: 'ctx.message.info("nextBoth");',
      keepLegacy: 'legacy',
    });
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'bothRun', 'defaultParams'])).toMatchObject({
      code: 'ctx.oldDefaultInBoth();',
      keepDefault: 'default',
    });
    expect(
      getAtPath(updated, [
        'flowRegistry',
        'submitFlow',
        'steps',
        'customVariableRun',
        'defaultParams',
        'variables',
        0,
        'runjs',
      ]),
    ).toMatchObject({
      code: 'return 456;',
      version: 'v2',
      keep: 'variable',
    });
    expect(
      getAtPath(updated, [
        'flowRegistry',
        'submitFlow',
        'steps',
        'customVariableLegacy',
        'params',
        'variables',
        0,
        'runjs',
      ]),
    ).toMatchObject({
      code: 'return 654;',
      version: 'v2',
      keep: 'legacy variable',
    });
    expect(
      getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'customVariableLegacy', 'defaultParams']),
    ).toBeUndefined();
    expect(
      (
        getAtPath(updated, [
          'flowRegistry',
          'submitFlow',
          'steps',
          'customVariableRun',
          'defaultParams',
          'variables',
        ]) as Array<{ key?: string }>
      ).some((variable) => variable.key === 'missing_var'),
    ).toBe(false);
    expect(
      getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'customVariableEmpty', 'defaultParams', 'variables']),
    ).toBeUndefined();
    expect(getAtPath(updated, ['stepParams', 'submitFlow', 'customVariableRun'])).toBeUndefined();
  });

  it('rejects flowRegistry RunJS sources for unsupported paths and non-RunJS steps', async () => {
    await repository.insertModel({
      uid: 'flow-registry-runjs-guard-model',
      use: 'ActionModel',
      flowRegistry: {
        submitFlow: {
          steps: {
            runStep: {
              use: 'runjs',
              title: 'Do not overwrite',
              defaultParams: {
                code: 'ctx.safe();',
              },
            },
            nonRunJSStep: {
              use: 'customVariable',
              defaultParams: {
                code: 'return notRunJS;',
              },
            },
          },
        },
      },
    });

    const unsupportedPathLocator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-runjs-guard-model',
      flowKey: 'submitFlow',
      stepKey: 'runStep',
      sourcePath: ['title'],
    };
    const nonRunJSStepLocator: RunJSSourceLocator = {
      ...unsupportedPathLocator,
      stepKey: 'nonRunJSStep',
      sourcePath: ['defaultParams', 'code'],
    };

    await expectBlockedLocator(unsupportedPathLocator, 'flowRegistry.submitFlow.steps.runStep.title');
    await expectBlockedLocator(nonRunJSStepLocator, 'flowRegistry.submitFlow.steps.nonRunJSStep');

    const updated = await repository.findModelById('flow-registry-runjs-guard-model');
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'runStep', 'title'])).toBe('Do not overwrite');
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'nonRunJSStep', 'defaultParams', 'code'])).toBe(
      'return notRunJS;',
    );

    async function expectBlockedLocator(locator: RunJSSourceLocator, path: string) {
      const open = await openSource(locator);
      expect(open.status).toBe(404);
      expect(open.body.errors[0]).toMatchObject({
        code: 'RUNJS_SOURCE_NOT_FOUND',
        details: {
          path,
        },
      });

      const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
      const publish = await publishSource(locator, 'missing-owner-fingerprint', 'ctx.message.info("blocked");');
      expect(publish.status).toBe(404);
      expect(publish.body.errors[0]).toMatchObject({
        code: 'RUNJS_SOURCE_NOT_FOUND',
        details: {
          path,
        },
      });
      await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);
    }
  });

  it('rejects flowRegistry RunJS sources when the owner flow or step is missing', async () => {
    await repository.insertModel({
      uid: 'flow-registry-missing-runjs-model',
      use: 'ActionModel',
      flowRegistry: {
        submitFlow: {
          steps: {},
        },
      },
    });

    const missingStepLocator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'flow-registry-missing-runjs-model',
      flowKey: 'submitFlow',
      stepKey: 'missingRun',
      sourcePath: ['defaultParams', 'code'],
    };

    const missingStepOpen = await openSource(missingStepLocator);
    expect(missingStepOpen.status).toBe(404);
    expect(missingStepOpen.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'flowRegistry.submitFlow.steps.missingRun',
      },
    });

    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
    const missingStepPublish = await publishSource(
      missingStepLocator,
      'missing-owner-fingerprint',
      'ctx.message.info("draft");',
    );
    expect(missingStepPublish.status).toBe(404);
    expect(missingStepPublish.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'flowRegistry.submitFlow.steps.missingRun',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);

    const missingFlowOpen = await openSource({
      ...missingStepLocator,
      flowKey: 'missingFlow',
    });
    expect(missingFlowOpen.status).toBe(404);
    expect(missingFlowOpen.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details: {
        path: 'flowRegistry.missingFlow.steps.missingRun',
      },
    });

    const updated = await repository.findModelById('flow-registry-missing-runjs-model');
    expect(getAtPath(updated, ['flowRegistry', 'submitFlow', 'steps', 'missingRun'])).toBeUndefined();
    expect(getAtPath(updated, ['flowRegistry', 'missingFlow'])).toBeUndefined();
  });

  it('uses value-surface authoring validation for nested reaction RunJS values', async () => {
    await repository.insertModel({
      uid: 'reaction-runjs-model',
      use: 'FormModel',
      stepParams: {
        reactionSettings: {
          fieldValues: {
            value: [
              {
                key: 'rule_1',
                code: 'return oldValue;',
              },
            ],
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'reaction-runjs-model',
      containerFlowKey: 'reactionSettings',
      containerStepKey: 'fieldValues',
      valuePath: ['value', 'rule_1', 'code'],
      scene: 'formValue',
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);
    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();

    const publish = await publishSource(locator, open.body.data.ownerFingerprint, 'ctx.render(null);');

    expect(publish.status).toBe(400);
    expect(publish.body.errors[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-value-render-forbidden',
          }),
        ]),
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);
    const updated = await repository.findModelById('reaction-runjs-model');
    expect(getAtPath(updated, ['stepParams', 'reactionSettings', 'fieldValues', 'value', 0, 'code'])).toBe(
      'return oldValue;',
    );
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
      publishSource(
        optionLocator,
        optionOpen.body.data.ownerFingerprint,
        'const rows = ctx.data.objects || [];\nreturn { dataset: { source: rows } };',
      ),
    ).resolves.toHaveProperty('status', 200);
    await expect(
      publishSource(eventsLocator, eventsOpen.body.data.ownerFingerprint, 'ctx.message.info("nextClick");'),
    ).resolves.toHaveProperty('status', 200);

    const updated = await repository.findModelById('chart-runjs-model');
    expect(getAtPath(updated, ['stepParams', 'chartSettings', 'configure', 'chart', 'option'])).toMatchObject({
      mode: 'raw',
      builder: {
        type: 'bar',
      },
      raw: 'const rows = ctx.data.objects || [];\nreturn { dataset: { source: rows } };',
    });
    expect(getAtPath(updated, ['stepParams', 'chartSettings', 'configure', 'chart', 'events', 'raw'])).toBe(
      'ctx.message.info("nextClick");',
    );
  });

  it('uses Flow Engine authoring inspection before publishing browser RunJS artifacts', async () => {
    await repository.insertModel({
      uid: 'chart-runjs-authoring-model',
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                raw: 'return { xAxis: {} };',
              },
            },
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'chart.option',
      modelUid: 'chart-runjs-authoring-model',
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);
    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();

    const publish = await publishSource(locator, open.body.data.ownerFingerprint, 'ctx.render(null);');

    expect(publish.status).toBe(400);
    expect(publish.body.errors[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-value-render-forbidden',
            details: expect.objectContaining({
              repairClass: 'value-surface-forbids-render',
            }),
          }),
        ]),
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);
    const updated = await repository.findModelById('chart-runjs-authoring-model');
    expect(getAtPath(updated, ['stepParams', 'chartSettings', 'configure', 'chart', 'option', 'raw'])).toBe(
      'return { xAxis: {} };',
    );
  });

  it('registers adapters and authoring inspection when Flow Engine loads before VSC File', async () => {
    await app.destroy();
    await resetApp(['flow-engine', PluginVscFileServer]);

    await repository.insertModel({
      uid: 'chart-runjs-reversed-order-model',
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {
            chart: {
              option: {
                mode: 'raw',
                raw: 'return { xAxis: {} };',
              },
            },
          },
        },
      },
    });

    const locator: RunJSSourceLocator = {
      kind: 'chart.option',
      modelUid: 'chart-runjs-reversed-order-model',
    };
    const open = await openSource(locator);
    expect(open.status).toBe(200);

    const publish = await publishSource(locator, open.body.data.ownerFingerprint, 'ctx.render(null);');

    expect(publish.status).toBe(400);
    expect(publish.body.errors[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'runjs-value-render-forbidden',
          }),
        ]),
      },
    });
  });

  async function resetApp(runJSPlugins: Array<string | typeof PluginVscFileServer>) {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [...basePlugins, ...runJSPlugins],
    });
    const user = await app.db.getRepository('users').findOne();
    agent = await app.agent().login(user);
    repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
  }

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
