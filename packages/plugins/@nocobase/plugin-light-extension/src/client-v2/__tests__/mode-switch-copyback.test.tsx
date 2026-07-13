/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Modal } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';

import { JSBlockLightExtensionSourceField } from '../components/JSBlockLightExtensionSourceField';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: vi.fn((key: string) => key),
}));

const artifactHash = 'a'.repeat(64);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

const SchemaField = createSchemaField({
  components: {
    JSBlockLightExtensionSourceField,
  },
});

const entry = {
  id: 'entry_sales',
  repoId: 'repo_sales',
  target: 'client',
  kind: 'js-block',
  entryName: 'sales',
  entryPath: 'src/client/js-blocks/sales/index.tsx',
  descriptorPath: 'src/client/js-blocks/sales-kpi/entry.json',
  title: 'Sales',
  description: null,
  category: null,
  icon: null,
  tags: null,
  sort: null,
  settingsSchema: null,
  settingsSchemaHash: null,
  compiledCommitId: 'commit_sales',
  runtimeArtifact: {
    code: 'ctx.render("sales");',
    version: 'v2',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
  },
  runtimeVersion: 'v2',
  surfaceStyle: 'render',
  runtimeCodeHash: 'runtime_hash',
  filesHash: 'files_hash',
  settingsDefaultsHash: null,
  compiledAt: '2026-07-09T00:00:00.000Z',
  healthStatus: 'ready',
  diagnostics: [],
};

describe('JSBlockLightExtensionSourceField copyback', () => {
  beforeEach(() => {
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === '/light-extension-runtime/resolve') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'entry_sales',
              entryPath: 'src/client/js-blocks/sales/index.tsx',
              artifactHash,
              artifactUrl: `/api/light-extension-runtime/artifacts/${artifactHash}`,
              runtimeCodeHash: 'runtime_hash',
              version: 'v2',
              settings: {},
              settingsHash: 'settings_hash',
            },
          },
        });
      }

      if (options.url === `/light-extension-runtime/artifacts/${artifactHash}`) {
        return Promise.resolve({
          data: {
            artifactHash,
            runtimeCodeHash: 'runtime_hash',
            code: 'ctx.render("copied runtime");',
            sourceMap: null,
            version: 'v2',
            entryPath: 'src/client/js-blocks/sales/index.tsx',
            runtimeContract: 'light-extension.runtime-artifact.v1',
            byteSize: 64,
          },
        });
      }

      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: [entry],
          },
        });
      }

      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires confirmation and copies current runtime code when switching back to inline', async () => {
    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
      config.onOk?.(() => {});
      return {
        destroy: vi.fn(),
        update: vi.fn(),
      } as ReturnType<typeof Modal.confirm>;
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        code: 'ctx.render("old inline");',
        version: 'v1',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo_sales',
          entryId: 'entry_sales',
          kind: 'js-block',
        },
        settings: {},
      },
    });
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <FormProvider form={form}>
          <SchemaField
            schema={{
              type: 'object',
              properties: {
                sourceMode: {
                  type: 'string',
                  'x-component': 'JSBlockLightExtensionSourceField',
                },
              },
            }}
          />
        </FormProvider>
      </FlowEngineProvider>,
    );

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
    fireEvent.click(await screen.findByText('Inline code'));

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(form.values.sourceMode).toBe('inline');
      expect(form.values.code).toBe('ctx.render("copied runtime");');
      expect(form.values.version).toBe('v2');
    });
  });
});
