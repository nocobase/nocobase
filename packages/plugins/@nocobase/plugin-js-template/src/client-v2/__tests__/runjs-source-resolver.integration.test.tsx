/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type JsTemplateRuntimeSourceBinding } from '../../shared/types';
import { JSBlockJsTemplateSourceField, JSPageJsTemplateSourceField } from '../components/JSBlockJsTemplateSourceField';
import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { setupRunJSTestHosts } from '@nocobase/test/client-v2';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  t: vi.fn((key: string) => key),
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: mocks.t,
    }),
  };
});

setupRunJSTestHosts();

// Consolidated from runjs-source-resolver-source-mode-roundtrip.cases.tsx.
function registerSourceModeRoundTripTests() {
  // Old case -> new owner:
  // save-without-clearing-inline / keeps existing JS Block inline code... -> mounts the JS Block binding editor without mutating the snapshot.
  // save-without-clearing-inline / renders as a JS Block binding editor... -> mounts the JS Block binding editor without mutating the snapshot.
  // save-without-clearing-inline / keeps the complete JS Page inline snapshot... -> renders the binding-only editor without mutating the snapshot.
  // New owner: Inline remains authoritative when historical data still has a JS Template binding.

  const SchemaField = createSchemaField({
    components: {
      JSBlockJsTemplateSourceField,
      JSPageJsTemplateSourceField,
    },
  });

  type SourceFieldComponent = 'JSBlockJsTemplateSourceField' | 'JSPageJsTemplateSourceField';

  type RunJSFormValues = {
    sourceMode: string;
    code: string;
    version: string;
    settings: Record<string, unknown>;
    sourceRef: Record<string, unknown>;
    sourceBinding?: JsTemplateRuntimeSourceBinding;
  };

  const sourceBinding: JsTemplateRuntimeSourceBinding = {
    type: 'js-template-entry',
    projectId: 'project_sales',
    templateId: 'template_sales',
    kind: 'js-page',
  };

  const template = {
    id: 'template_sales',
    projectId: 'project_sales',
    target: 'client',
    kind: 'js-page',
    templateName: 'sales',
    entryPath: 'src/client/js-pages/sales/index.tsx',
    descriptorPath: 'src/client/js-pages/sales/entry.json',
    title: 'Sales',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    runtimeAvailable: true,
    settingsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', default: 'Sales' },
      },
    },
    settingsSchemaHash: 'settings_schema_hash',
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
    settingsDefaultsHash: 'settings_defaults_hash',
    compiledAt: '2026-07-09T00:00:00.000Z',
    healthStatus: 'ready',
    diagnostics: [],
  };

  describe('source mode round-trip', () => {
    beforeEach(() => {
      mocks.request.mockReset();
      mocks.request.mockImplementation(successfulRequest);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('preserves the inline snapshot when selecting its JS Template binding', async () => {
      const form = createRunJSForm({ sourceMode: 'inline' });
      const inlineSnapshot = cloneValues(form.values);

      renderSourceModeField(form);
      await selectCodeSource('sales');

      expect(form.values).toMatchObject({
        sourceMode: 'js-template',
        code: inlineSnapshot.code,
        version: inlineSnapshot.version,
        settings: inlineSnapshot.settings,
        sourceRef: inlineSnapshot.sourceRef,
        sourceBinding,
      });
    });

    it('renders the binding-only editor without mutating the complete inline snapshot', async () => {
      const form = createRunJSForm();
      const originalValues = cloneValues(form.values);

      renderSourceBindingField(form);

      await waitFor(() => expect(screen.getByText('Required settings are complete')).toBeTruthy());
      expect(screen.queryByText('title')).toBeNull();
      expect(screen.queryByText('Inline code')).toBeNull();
      expect(form.values).toEqual(originalValues);
    });

    it('mounts the JS Block binding editor without mutating its inline fallback snapshot', async () => {
      const blockBinding: JsTemplateRuntimeSourceBinding = {
        ...sourceBinding,
        kind: 'js-block',
      };
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'jsTemplates:listSelectable') {
          return Promise.resolve({ data: { data: [{ ...template, kind: 'js-block' }] } });
        }
        return successfulRequest(options);
      });
      const form = createRunJSForm({ sourceBinding: blockBinding });
      const originalValues = cloneValues(form.values);

      renderSourceBindingField(form, 'JSBlockJsTemplateSourceField');

      await waitFor(() => expect(screen.getByText('Required settings are complete')).toBeTruthy());
      expect(screen.queryByText('title')).toBeNull();
      expect(screen.queryByText('Inline code')).toBeNull();
      expect(form.values).toEqual(originalValues);
    });

    it('keeps Inline authoritative when historical data still has a JS Template binding', async () => {
      const form = createRunJSForm({ sourceMode: 'inline' });
      const originalValues = cloneValues(form.values);

      renderSourceModeField(form);
      await waitFor(() =>
        expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ url: 'jsTemplates:listSelectable' })),
      );

      expect(screen.getByText('Inline code')).toBeInTheDocument();
      expect(form.values).toEqual(originalValues);
      expect(mocks.request.mock.calls.every(([options]) => options.url === 'jsTemplates:listSelectable')).toBe(true);
    });

    it('keeps detach-to-inline out of the source selector so the CAS-protected editor action remains canonical', async () => {
      const form = createRunJSForm();
      const originalValues = cloneValues(form.values);

      renderSourceModeField(form);
      await waitFor(() =>
        expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ url: 'jsTemplates:listSelectable' })),
      );
      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));

      expect(screen.queryByText('Inline code')).toBeNull();
      expect(form.values).toEqual(originalValues);
      expect(mocks.request.mock.calls.every(([options]) => options.url === 'jsTemplates:listSelectable')).toBe(true);
    });
  });

  function createRunJSForm(overrides: Partial<RunJSFormValues> = {}) {
    return createForm<RunJSFormValues>({
      initialValues: {
        sourceMode: 'js-template',
        code: 'ctx.render("old inline");',
        version: 'v1',
        settings: { title: 'Revenue' },
        sourceRef: {
          type: 'vsc-file',
          repoId: 'old_inline_repo',
          commitId: 'old_inline_commit',
          entry: 'src/client/index.tsx',
        },
        sourceBinding: { ...sourceBinding },
        ...overrides,
      },
    });
  }

  function renderSourceModeField(
    form: ReturnType<typeof createRunJSForm>,
    component: SourceFieldComponent = 'JSPageJsTemplateSourceField',
  ) {
    return renderWithEngine(
      form,
      <SchemaField
        schema={{
          type: 'object',
          properties: {
            sourceMode: {
              type: 'string',
              'x-component': component,
            },
          },
        }}
      />,
    );
  }

  function renderSourceBindingField(
    form: ReturnType<typeof createRunJSForm>,
    component: SourceFieldComponent = 'JSPageJsTemplateSourceField',
  ) {
    return renderWithEngine(
      form,
      <SchemaField
        schema={{
          type: 'object',
          properties: {
            sourceMode: {
              type: 'string',
              'x-display': 'hidden',
            },
            sourceBinding: {
              type: 'object',
              'x-component': component,
            },
          },
        }}
      />,
    );
  }

  function renderWithEngine(form: ReturnType<typeof createRunJSForm>, children: React.ReactNode) {
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });

    return render(
      <FlowEngineProvider engine={engine}>
        <FormProvider form={form}>{children}</FormProvider>
      </FlowEngineProvider>,
    );
  }

  async function selectCodeSource(option: string) {
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ url: 'jsTemplates:listSelectable' })),
    );
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
      fireEvent.change(screen.getByRole('combobox', { name: 'Code source' }), { target: { value: option } });
      fireEvent.click(await screen.findByText(option));
    });
  }

  function successfulRequest(options: { url: string }) {
    if (options.url === 'jsTemplates:listSelectable') {
      return Promise.resolve({ data: { data: [template] } });
    }
    return Promise.reject(new Error(`Unexpected request: ${options.url}`));
  }

  function cloneValues(values: RunJSFormValues): RunJSFormValues {
    return JSON.parse(JSON.stringify(values));
  }
}
registerSourceModeRoundTripTests();
