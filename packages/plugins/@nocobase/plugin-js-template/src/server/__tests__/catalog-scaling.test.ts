/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { performance } from 'node:perf_hooks';
import { MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { JS_TEMPLATE_SUPPORTED_KINDS } from '../../constants';
import PluginJsTemplateServer from '../plugin';

const TEMPLATE_COUNT = 2_000;

describe('JS Template Catalog scaling', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: [PluginJsTemplateServer] });
    await app.db.getRepository('jsTemplateProjects').create({
      values: {
        id: 'jtp_catalog_scaling',
        applicationName: app.name,
        vscRepoId: 'vscr_catalog_scaling',
        name: 'catalog-scaling',
        normalizedName: 'catalog-scaling',
        title: 'Catalog scaling',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: 'vscc_catalog_scaling',
      },
    });
    await app.db.getRepository('jsTemplates').createMany({
      records: Array.from({ length: TEMPLATE_COUNT }, (_, index) => {
        const kind = JS_TEMPLATE_SUPPORTED_KINDS[index % JS_TEMPLATE_SUPPORTED_KINDS.length];
        const templateName = `template-${String(index).padStart(4, '0')}`;
        const root = `src/client/${kind}/${templateName}`;
        return {
          id: `jtt_catalog_scale_${index}`,
          projectId: 'jtp_catalog_scaling',
          target: 'client',
          kind,
          templateName,
          title: `Scaling template ${index}`,
          description: `Synthetic Catalog row ${index}`,
          entryPath: `${root}/index.tsx`,
          descriptorPath: `${root}/entry.json`,
          healthStatus: 'ready',
          diagnostics: [],
        };
      }),
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('measures the current full Catalog payload and client-side filtering path', async () => {
    const findTemplates = vi.spyOn(app.db.getRepository('jsTemplates'), 'find');
    const serverStartedAt = performance.now();
    const response = await app.agent().post('/jsTemplates:listCatalog');
    const serverDurationMs = performance.now() - serverStartedAt;

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(TEMPLATE_COUNT);
    expect(findTemplates).toHaveBeenCalledTimes(1);

    const payloadBytes = Buffer.byteLength(JSON.stringify(response.body.data));
    const clientFilterStartedAt = performance.now();
    const filtered = response.body.data.filter(
      (entry: { kind: string; title?: string | null }) =>
        entry.kind === 'js-block' && entry.title?.toLowerCase().includes('99'),
    );
    const clientFilterDurationMs = performance.now() - clientFilterStartedAt;

    expect(filtered.length).toBeGreaterThan(0);
    process.stdout.write(
      `[catalog-scaling] ${JSON.stringify({
        templates: TEMPLATE_COUNT,
        payloadBytes,
        serverDurationMs: Number(serverDurationMs.toFixed(2)),
        clientFilterDurationMs: Number(clientFilterDurationMs.toFixed(2)),
        catalogReadyDurationMs: Number((serverDurationMs + clientFilterDurationMs).toFixed(2)),
        templateQueries: findTemplates.mock.calls.length,
        filteredRows: filtered.length,
      })}\n`,
    );
  });
});
