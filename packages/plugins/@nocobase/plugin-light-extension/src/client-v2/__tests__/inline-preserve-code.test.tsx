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
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';

import type { LightExtensionRuntimeSourceBinding } from '../../shared/types';
import { JSPageLightExtensionSourceField } from '../components/JSBlockLightExtensionSourceField';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: vi.fn((key: string) => key),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

const SchemaField = createSchemaField({
  components: {
    JSPageLightExtensionSourceField,
  },
});

const entry = {
  id: 'entry_sales',
  repoId: 'repo_sales',
  target: 'client',
  kind: 'js-page',
  entryName: 'sales',
  entryPath: 'src/client/js-pages/sales/index.tsx',
  descriptorPath: 'src/client/js-pages/sales/entry.json',
  title: 'Sales',
  description: null,
  category: null,
  icon: null,
  tags: null,
  sort: null,
  runtimeAvailable: true,
  settingsSchema: null,
  settingsSchemaHash: null,
  compiledCommitId: 'commit_sales',
  runtimeArtifact: {
    code: 'ctx.render("sales");',
    version: 'v2',
    entryPath: 'src/client/js-pages/sales/index.tsx',
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

type RunJSFormValues = {
  sourceMode: string;
  code: string;
  version: string;
  sourceRef?: Record<string, unknown>;
  sourceBinding?: LightExtensionRuntimeSourceBinding;
};

function renderSourceField() {
  const engine = new FlowEngine();
  engine.context.defineProperty('api', {
    value: {
      request: mocks.request,
    },
  });
  const form = createForm<RunJSFormValues>({
    initialValues: {
      sourceMode: 'inline',
      code: 'ctx.render("inline");',
      version: 'v2',
      sourceRef: {
        type: 'vsc-file',
        path: 'legacy/js-block.tsx',
        repoId: 'inline_repo',
        commitId: 'inline_commit',
        entry: 'src/client/index.tsx',
      },
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
                'x-component': 'JSPageLightExtensionSourceField',
              },
            },
          }}
        />
      </FormProvider>
    </FlowEngineProvider>,
  );

  return form;
}

describe('JSPageLightExtensionSourceField inline preservation', () => {
  beforeEach(() => {
    mocks.request.mockImplementation((options: { url: string }) => {
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

  it('does not clear inline fallback code or legacy sourceRef when switching to light-extension mode', async () => {
    const form = renderSourceField();

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'lightExtensionEntries:listSelectable',
        }),
      );
    });
    await act(async () => {
      const codeSource = screen.getByRole('combobox', { name: 'Code source' });
      fireEvent.mouseDown(codeSource);
      fireEvent.change(codeSource, { target: { value: 'Sales' } });
      fireEvent.click(await screen.findByText('sales'));
    });

    expect(form.values.sourceMode).toBe('light-extension');
    expect(form.values.sourceBinding?.entryId).toBe('entry_sales');
    expect(form.values.code).toBe('ctx.render("inline");');
    expect(form.values.version).toBe('v2');
    expect(form.values.sourceRef).toEqual({
      type: 'vsc-file',
      path: 'legacy/js-block.tsx',
      repoId: 'inline_repo',
      commitId: 'inline_commit',
      entry: 'src/client/index.tsx',
    });
    expect(mocks.request.mock.calls.every(([options]) => options.url === 'lightExtensionEntries:listSelectable')).toBe(
      true,
    );
  });
});
