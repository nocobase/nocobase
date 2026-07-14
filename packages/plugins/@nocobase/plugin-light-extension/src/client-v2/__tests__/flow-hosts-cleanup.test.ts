/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { APIResponse, Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import { destroyFlowHostAcceptancePage, type FlowHostAcceptancePage } from '../__e2e__/helpers/flowHosts';
import type { RootApiSession } from '../__e2e__/helpers/api';

const hosts: FlowHostAcceptancePage['hosts'] = {
  jsBlock: { uid: 'host_block' },
  jsField: { uid: 'host_field', wrapperUid: 'host_field_wrapper' },
  jsAction: { uid: 'host_action' },
  jsItem: { uid: 'host_item' },
};

const session = {
  headers: { Authorization: 'Bearer test' },
} as RootApiSession;

describe('Flow host acceptance cleanup', () => {
  it('switches every host to Inline before destroying the page and collection', async () => {
    const models = new Map<string, Record<string, unknown>>([
      ['host_block', createModel('host_block', 'JSBlockModel', 'jsSettings')],
      ['host_field', createModel('host_field', 'JSFieldModel', 'jsSettings')],
      ['host_action', createModel('host_action', 'JSActionModel', 'clickSettings')],
      ['host_item', createModel('host_item', 'JSItemModel', 'jsSettings')],
    ]);
    const get = vi.fn(async (_url: string, options?: { params?: Record<string, unknown> }) =>
      response(models.get(String(options?.params?.uid))),
    );
    const post = vi.fn(async () => response('ok'));
    const page = { request: { get, post } } as unknown as Page;

    await destroyFlowHostAcceptancePage(page, session, {
      pageUid: 'page_1',
      collectionName: 'collection_1',
      hosts,
    });

    const postUrls = post.mock.calls.map(([url]) => url);
    expect(postUrls).toEqual([
      '/api/flowModels:save',
      '/api/flowModels:save',
      '/api/flowModels:save',
      '/api/flowModels:save',
      '/api/flowSurfaces:destroyPage',
      '/api/collections:destroy',
    ]);

    const savedModels = post.mock.calls.slice(0, 4).map(([, options]) => {
      const data = options?.data;
      expect(data).toBeTypeOf('object');
      return data as Record<string, unknown>;
    });
    expect(readRunJs(savedModels[0], 'jsSettings')).toEqual({ code: 'ctx.render(null);', sourceMode: 'inline' });
    expect(readRunJs(savedModels[1], 'jsSettings')).toEqual({ code: 'ctx.render(null);', sourceMode: 'inline' });
    expect(readRunJs(savedModels[2], 'clickSettings')).toEqual({ code: 'return true;', sourceMode: 'inline' });
    expect(readRunJs(savedModels[3], 'jsSettings')).toEqual({ code: 'ctx.render(null);', sourceMode: 'inline' });
    for (const [index, settingsGroupKey] of ['jsSettings', 'jsSettings', 'clickSettings', 'jsSettings'].entries()) {
      expect(readSettingsGroup(savedModels[index], settingsGroupKey)).not.toHaveProperty('sourceMode');
      expect(readSettingsGroup(savedModels[index], settingsGroupKey)).not.toHaveProperty('sourceBinding');
      expect(readSettingsGroup(savedModels[index], settingsGroupKey)).not.toHaveProperty('settings');
    }
  });

  it('collects host reset failures and preserves the page for a later cleanup retry', async () => {
    const get = vi.fn(async (_url: string, options?: { params?: Record<string, unknown> }) => {
      const uid = String(options?.params?.uid);
      return uid === 'host_block' || uid === 'host_action'
        ? response({ error: uid }, 500)
        : response(createModel(uid, uid === 'host_field' ? 'JSFieldModel' : 'JSItemModel', 'jsSettings'));
    });
    const post = vi.fn(async () => response('ok'));
    const page = { request: { get, post } } as unknown as Page;

    await expect(
      destroyFlowHostAcceptancePage(page, session, {
        pageUid: 'page_1',
        collectionName: 'collection_1',
        hosts,
      }),
    ).rejects.toThrow(/JS Block acceptance host.*JS Action acceptance host/u);

    expect(get).toHaveBeenCalledTimes(4);
    expect(post.mock.calls.map(([url]) => url)).toEqual(['/api/flowModels:save', '/api/flowModels:save']);
  });
});

function createModel(uid: string, use: string, settingsGroupKey: 'jsSettings' | 'clickSettings') {
  return {
    uid,
    use,
    stepParams: {
      [settingsGroupKey]: {
        runJs: {
          code: settingsGroupKey === 'clickSettings' ? 'return true;' : 'ctx.render(null);',
          sourceMode: 'light-extension',
          sourceBinding: { type: 'light-extension-entry', repoId: 'repo_1', entryId: 'entry_1' },
          settings: { label: 'saved' },
        },
        sourceMode: 'light-extension',
        sourceBinding: { type: 'light-extension-entry', repoId: 'repo_1', entryId: 'entry_1' },
        settings: { label: 'legacy mirror' },
      },
    },
  };
}

function readSettingsGroup(model: Record<string, unknown>, settingsGroupKey: string): Record<string, unknown> {
  const stepParams = model.stepParams;
  if (!stepParams || typeof stepParams !== 'object' || Array.isArray(stepParams)) {
    return {};
  }
  const settingsGroup = (stepParams as Record<string, unknown>)[settingsGroupKey];
  return settingsGroup && typeof settingsGroup === 'object' && !Array.isArray(settingsGroup)
    ? (settingsGroup as Record<string, unknown>)
    : {};
}

function readRunJs(model: Record<string, unknown>, settingsGroupKey: string): Record<string, unknown> {
  const runJs = readSettingsGroup(model, settingsGroupKey).runJs;
  return runJs && typeof runJs === 'object' && !Array.isArray(runJs) ? (runJs as Record<string, unknown>) : {};
}

function response(data: unknown, status = 200): APIResponse {
  return {
    ok: () => status >= 200 && status < 300,
    status: () => status,
    json: async () => ({ data }),
    text: async () => JSON.stringify({ data }),
  } as APIResponse;
}
