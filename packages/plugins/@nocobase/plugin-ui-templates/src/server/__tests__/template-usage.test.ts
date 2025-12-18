/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { vi } from 'vitest';
import FlowModelRepository from '../../../../plugin-flow-engine/src/server/repository';
import { uid } from '@nocobase/utils';

describe('block-reference templates and usages', () => {
  let app: MockServer | null;
  let flowRepo: FlowModelRepository;
  let usageRepo: any;

  const buildOptions = (templateUid?: string, useTemplateExtra: Record<string, any> = {}) => {
    return {
      use: 'ReferenceBlockModel',
      stepParams: {
        referenceSettings: {
          target: {
            targetUid: 'target-block',
          },
          ...(templateUid
            ? {
                useTemplate: {
                  templateUid,
                  templateName: `name-${templateUid}`,
                  templateDescription: `desc-${templateUid}`,
                  ...useTemplateExtra,
                },
              }
            : {}),
        },
      },
    };
  };

  const createReferenceBlock = async (uid: string, templateUid: string) => {
    return await flowRepo.create({
      values: {
        uid,
        options: buildOptions(templateUid),
      },
    });
  };

  const updateReferenceBlockOptions = (uid: string, templateUid: string) => {
    return flowRepo.update({
      filter: { uid },
      values: { options: buildOptions(templateUid) },
    });
  };

  const destroyBlock = (uid: string) => {
    return flowRepo.destroy({
      filter: { uid },
    });
  };

  const getBlockOptions = async (uid: string) => {
    const record = await flowRepo.findOne({ filter: { uid } });
    return FlowModelRepository.optionsToJson(record?.get('options'));
  };

  const countUsage = (filter: Record<string, any>) => {
    return usageRepo.count({ filter });
  };

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['flow-engine', 'block-reference'],
      registerActions: true,
      name: `app_${uid()}`,
      database: {
        schema: `schema_${uid()}`,
      },
    });
    expect(app.pm.get('block-reference')).toBeTruthy();
    flowRepo = app.db.getRepository('flowModels') as FlowModelRepository;
    usageRepo = app.db.getRepository('flowModelTemplateUsages');
    await flowRepo.create({ values: { uid: 'target-block', options: { use: 'TargetBlock' } } });
    expect(app.db.listeners('flowModels.afterSaveWithAssociations').length).toBeGreaterThan(0);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (app) {
      await app.destroy();
      app = null;
    }
  });

  it('should create usage and switch template updates usage records', async () => {
    const block = await createReferenceBlock('ref-1', 'tpl-1');
    expect(await countUsage({ templateUid: 'tpl-1', modelUid: 'ref-1' })).toBe(1);

    await updateReferenceBlockOptions(block.get('uid'), 'tpl-2');
    expect(await countUsage({ templateUid: 'tpl-1', modelUid: 'ref-1' })).toBe(0);
    expect(await countUsage({ templateUid: 'tpl-2', modelUid: 'ref-1' })).toBe(1);
  });

  it('should remove usages when reference block is destroyed', async () => {
    const block = await createReferenceBlock('ref-3', 'tpl-destroy');
    expect(await countUsage({ modelUid: 'ref-3' })).toBe(1);
    await destroyBlock(block.get('uid'));
    expect(await countUsage({ modelUid: 'ref-3' })).toBe(0);
  });

  it('should return usageCount and block deletion guard via resources', async () => {
    const agent = app.agent();
    const tplResp = await agent.resource('flowModelTemplates').create({
      values: {
        uid: 'tpl-resource',
        name: 'Template Resource',
        targetUid: 'target-block',
      },
    });
    expect(tplResp.status).toBe(200);
    const createdTpl = tplResp.body?.data || tplResp.body;
    expect(createdTpl?.usageCount).toBe(0);

    const block = await createReferenceBlock('ref-4', 'tpl-resource');
    expect(block).toBeTruthy();
    expect(await countUsage({ templateUid: 'tpl-resource', modelUid: 'ref-4' })).toBe(1);

    const getResp = await agent.resource('flowModelTemplates').get({
      filterByTk: 'tpl-resource',
    });
    expect(getResp.status).toBe(200);
    const gotTpl = getResp.body?.data || getResp.body;
    expect(gotTpl?.usageCount).toBe(1);

    const destroyResp = await agent.resource('flowModelTemplates').destroy({
      filterByTk: 'tpl-resource',
    });
    expect(destroyResp.status).not.toBe(200);
    const blockedTpl = await agent.resource('flowModelTemplates').get({
      filterByTk: 'tpl-resource',
    });
    const blockedTplData = blockedTpl.body?.data || blockedTpl.body;
    expect(blockedTplData?.uid).toBe('tpl-resource');
    expect(blockedTplData?.usageCount).toBe(1);

    await destroyBlock(block.get('uid'));
    expect(await countUsage({ templateUid: 'tpl-resource', modelUid: 'ref-4' })).toBe(0);

    const destroyResp2 = await agent.resource('flowModelTemplates').destroy({
      filterByTk: 'tpl-resource',
    });
    expect(destroyResp2.status).toBe(200);
  });

  it('should sync template name/description to reference blocks on template update', async () => {
    const agent = app.agent();
    await agent.resource('flowModelTemplates').create({
      values: {
        uid: 'tpl-sync',
        name: 'Template Old',
        description: 'Desc Old',
        targetUid: 'target-block',
      },
    });

    await createReferenceBlock('ref-sync', 'tpl-sync');

    const updateResp = await agent.resource('flowModelTemplates').update({
      filterByTk: 'tpl-sync',
      values: {
        name: 'Template New',
        description: 'Desc New',
      },
    });
    expect(updateResp.status).toBe(200);

    const options = await getBlockOptions('ref-sync');
    const useTemplate = options?.stepParams?.referenceSettings?.useTemplate;
    expect(useTemplate?.templateUid).toBe('tpl-sync');
    expect(useTemplate?.templateName).toBe('Template New');
    expect(useTemplate?.templateDescription).toBe('Desc New');
  });

  it('should persist associationName in flowModelTemplates', async () => {
    const agent = app.agent();
    const tplResp = await agent.resource('flowModelTemplates').create({
      values: {
        uid: 'tpl-assoc',
        name: 'Template Assoc',
        targetUid: 'target-block',
        dataSourceKey: 'main',
        collectionName: 'bad',
        associationName: 'users.roles',
      },
    });
    expect(tplResp.status).toBe(200);
    const createdTpl = tplResp.body?.data || tplResp.body;
    expect(createdTpl?.associationName).toBe('users.roles');

    const getResp = await agent.resource('flowModelTemplates').get({
      filterByTk: 'tpl-assoc',
    });
    expect(getResp.status).toBe(200);
    const gotTpl = getResp.body?.data || getResp.body;
    expect(gotTpl?.associationName).toBe('users.roles');
  });

  it('should create usage for ReferenceFormGridModel', async () => {
    const agent = app.agent();
    await agent.resource('flowModelTemplates').create({
      values: {
        uid: 'tpl-sub',
        name: 'Template Sub',
        targetUid: 'target-block',
      },
    });

    await flowRepo.create({
      values: {
        uid: 'block-sub',
        options: {
          use: 'FormBlockModel',
          stepParams: {},
        },
      },
    });

    await flowRepo.create({
      values: {
        uid: 'grid-sub',
        options: {
          use: 'ReferenceFormGridModel',
          parentId: 'block-sub',
          subKey: 'grid',
          subType: 'object',
          stepParams: {
            referenceSettings: {
              useTemplate: {
                templateUid: 'tpl-sub',
                templateName: 'Template Sub',
                targetUid: 'target-block',
                targetPath: 'subModels.grid',
                mode: 'reference',
              },
            },
          },
        },
      },
    });

    expect(await countUsage({ templateUid: 'tpl-sub', modelUid: 'grid-sub' })).toBe(1);

    await flowRepo.update({
      filter: { uid: 'grid-sub' },
      values: {
        options: {
          use: 'ReferenceFormGridModel',
          parentId: 'block-sub',
          subKey: 'grid',
          subType: 'object',
          stepParams: {},
        },
      },
    });

    expect(await countUsage({ modelUid: 'grid-sub' })).toBe(0);
  });

  it('should maintain usages via flowModels:save/destroy actions', async () => {
    const agent = app.agent();
    await agent.resource('flowModelTemplates').create({
      values: {
        uid: 'tpl-save',
        name: 'Template Save',
        targetUid: 'target-block',
      },
    });
    await agent.resource('flowModelTemplates').create({
      values: {
        uid: 'tpl-save-2',
        name: 'Template Save 2',
        targetUid: 'target-block',
      },
    });

    const saveResp = await agent.resource('flowModels').save({
      values: {
        uid: 'ref-save',
        ...buildOptions('tpl-save'),
      },
    });
    expect(saveResp.status).toBe(200);
    expect(await countUsage({ templateUid: 'tpl-save', modelUid: 'ref-save' })).toBe(1);

    const listResp = await agent.resource('flowModelTemplates').list();
    expect(listResp.status).toBe(200);
    const listData = listResp.body?.data ?? listResp.body;
    const rows = Array.isArray(listData) ? listData : Array.isArray(listData?.rows) ? listData.rows : [];
    const row = (rows as Array<{ uid?: string; usageCount?: number }>).find((r) => r?.uid === 'tpl-save');
    expect(row?.usageCount).toBe(1);

    const saveResp2 = await agent.resource('flowModels').save({
      values: {
        uid: 'ref-save',
        ...buildOptions('tpl-save-2'),
      },
    });
    expect(saveResp2.status).toBe(200);
    expect(await countUsage({ templateUid: 'tpl-save', modelUid: 'ref-save' })).toBe(0);
    expect(await countUsage({ templateUid: 'tpl-save-2', modelUid: 'ref-save' })).toBe(1);

    // uid 省略时后端应补齐，并能正确维护 usages
    const saveResp3 = await agent.resource('flowModels').save({
      values: {
        ...buildOptions('tpl-save'),
      },
    });
    expect(saveResp3.status).toBe(200);
    const createdUid = saveResp3.body?.data ?? saveResp3.body;
    expect(typeof createdUid).toBe('string');
    expect(await countUsage({ templateUid: 'tpl-save', modelUid: createdUid })).toBe(1);

    // openView 的 step key 不一定是 "openView"，应能扫描 popupSettings 下所有 stepParams
    const saveResp4 = await agent.resource('flowModels').save({
      values: {
        uid: 'popup-save',
        use: 'PopupActionModel',
        stepParams: {
          popupSettings: {
            openViewX: {
              popupTemplateUid: 'tpl-save',
              popupTemplateMode: 'reference',
            },
          },
        },
      },
    });
    expect(saveResp4.status).toBe(200);
    expect(await countUsage({ templateUid: 'tpl-save', modelUid: 'popup-save' })).toBe(1);

    const destroyResp = await agent.resource('flowModels').destroy({ filterByTk: 'ref-save' });
    expect(destroyResp.status).toBe(200);
    expect(await countUsage({ modelUid: 'ref-save' })).toBe(0);

    const destroyResp2 = await agent.resource('flowModels').destroy({ filterByTk: createdUid });
    expect(destroyResp2.status).toBe(200);
    expect(await countUsage({ modelUid: createdUid })).toBe(0);

    const destroyResp3 = await agent.resource('flowModels').destroy({ filterByTk: 'popup-save' });
    expect(destroyResp3.status).toBe(200);
    expect(await countUsage({ modelUid: 'popup-save' })).toBe(0);
  });
});
