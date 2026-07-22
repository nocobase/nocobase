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
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';

import {
  JSBlockLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from '../components/JSBlockLightExtensionSourceField';

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
    JSBlockLightExtensionSourceField,
    JSPageLightExtensionSourceField,
  },
});

describe('JSBlockLightExtensionSourceField source mode errors', () => {
  beforeEach(() => {
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: [createSelectableEntry()],
          },
        });
      }

      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps inline source mode usable without FlowContext or an API client', async () => {
    const form = createForm({
      initialValues: {
        sourceMode: 'inline',
      },
    });

    render(
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
      </FormProvider>,
    );

    expect(await screen.findByRole('combobox', { name: 'Code source' })).toBeInTheDocument();
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it('sets a settings footer for light-extension mode when the inline editor is hidden', async () => {
    const setFooter = vi.fn();
    const close = vi.fn();
    const submit = vi.fn();
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
      },
    });

    renderSourceField(form, {
      view: {
        close,
        setFooter,
        submit,
      },
    });

    await waitFor(() => {
      expect(setFooter).toHaveBeenCalledWith(expect.anything());
    });

    const footer = setFooter.mock.calls.find(([node]) => React.isValidElement(node))?.[0];
    expect(footer).toBeTruthy();

    const footerView = render(<>{footer}</>);
    fireEvent.click(footerView.getByRole('button', { name: 'Save' }));
    fireEvent.click(footerView.getByRole('button', { name: 'Cancel' }));

    expect(submit).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    footerView.unmount();
  });

  it('does not duplicate entry settings validation in Code source and clears binding errors in inline mode', async () => {
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding(),
        settings: {
          plan: 'pro',
        },
      },
    });

    renderSourceField(form);

    await screen.findByText('Settings are available in separate menus');
    expect(screen.getByText('Settings require attention')).toBeInTheDocument();
    expect(screen.queryByText('plan')).not.toBeInTheDocument();
    expect(getSelfErrors(form.query('sourceMode').take())).toEqual([]);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
    fireEvent.click(await screen.findByText('Inline code'));
    fireEvent.click(await screen.findByText('Keep existing code'));

    await waitFor(() => {
      expect(form.values.sourceMode).toBe('inline');
      expect(getSelfErrors(form.query('sourceMode').take())).toEqual([]);
    });
  });

  it('requires a current entry binding in light-extension mode', async () => {
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: [],
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
      },
    });

    renderSourceField(form);

    await waitFor(() => {
      expect(getSelfErrors(form.query('sourceMode').take())).toContain('Select a light extension entry');
    });
  });

  it('shows only a settings status summary for a valid saved binding', async () => {
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding(),
        settings: {},
      },
    });

    renderSourceField(form);

    await waitFor(() => {
      expect(screen.getByText('Settings are available in separate menus')).toBeTruthy();
      expect(screen.getByText('Required settings are complete')).toBeTruthy();
      expect(screen.queryByText('plan')).not.toBeInTheDocument();
      expect(getSelfErrors(form.query('sourceMode').take())).not.toContain('Select a light extension entry');
    });
  });

  it('shows a read-only missing-required summary without turning it into a field error', async () => {
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: [
              {
                ...createSelectableEntry(),
                settingsSchema: {
                  type: 'object',
                  required: ['apiKey'],
                  properties: { apiKey: { type: 'string', title: 'API key' } },
                },
              },
            ],
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding(),
        settings: {},
      },
    });

    renderSourceField(form);

    expect(await screen.findByText('Required settings remaining: 1')).toBeInTheDocument();
    expect(screen.queryByText('API key')).not.toBeInTheDocument();
    expect(getSelfErrors(form.query('sourceMode').take())).toEqual([]);
  });

  it('does not copy invalid source bindings in inline mode', async () => {
    const form = createForm({
      initialValues: {
        sourceMode: 'inline',
        sourceBinding: {
          ...createSourceBinding(),
          kind: 'js-action',
        },
      },
    });

    renderSourceField(form);

    expect(screen.getByText('Copy selected light extension code').closest('button')).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByText('Copy selected light extension code'));

    expect(mocks.request).not.toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/light-extension-runtime/resolve',
      }),
    );
  });

  it('requests and displays only js-page entries for the JS Page selector', async () => {
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: [
              createSelectableEntry(),
              createSelectableEntry({ id: 'entry_page', kind: 'js-page', entryName: 'page-entry' }),
            ],
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });
    const form = createForm({ initialValues: { sourceMode: 'light-extension' } });

    renderSourceField(form, {}, 'JSPageLightExtensionSourceField');

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith({
        url: 'lightExtensionEntries:listSelectable',
        method: 'post',
        data: { kind: 'js-page' },
      });
    });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
    expect(await screen.findByText('page-entry')).toBeInTheDocument();
    expect(screen.queryByText('sales')).not.toBeInTheDocument();
  });

  it('shows translated empty and generic request error states without leaking server details', async () => {
    mocks.request.mockRejectedValue(new Error('private binding source text'));
    const form = createForm({ initialValues: { sourceMode: 'light-extension' } });

    renderSourceField(form, {}, 'JSPageLightExtensionSourceField', 'sourceBinding');

    expect(await screen.findByText('Failed to load entries')).toBeInTheDocument();
    expect(screen.queryByText('private binding source text')).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
    expect(await screen.findByText('No light extension entries')).toBeInTheDocument();
  });
});

function renderSourceField(
  form: ReturnType<typeof createForm>,
  context: {
    view?: {
      close?: () => void;
      setFooter?: (footer: React.ReactNode) => void;
      submit?: () => void | Promise<void>;
    };
  } = {},
  component = 'JSBlockLightExtensionSourceField',
  fieldName = 'sourceMode',
) {
  const engine = new FlowEngine();
  engine.context.defineProperty('api', {
    value: {
      request: mocks.request,
    },
  });
  if (context.view) {
    engine.context.defineProperty('view', {
      value: context.view,
    });
  }

  return render(
    <FlowEngineProvider engine={engine}>
      <FormProvider form={form}>
        <SchemaField
          schema={{
            type: 'object',
            properties: {
              [fieldName]: {
                type: 'string',
                'x-component': component,
              },
            },
          }}
        />
      </FormProvider>
    </FlowEngineProvider>,
  );
}

function createSourceBinding() {
  return {
    type: 'light-extension-entry',
    repoId: 'repo_sales',
    entryId: 'entry_sales',
    kind: 'js-block',
  };
}

function createSelectableEntry(options: { id?: string; kind?: 'js-block' | 'js-page'; entryName?: string } = {}) {
  const id = options.id || 'entry_sales';
  const kind = options.kind || 'js-block';
  const entryName = options.entryName || 'sales';
  return {
    id,
    repoId: 'repo_sales',
    target: 'client',
    kind,
    entryName,
    entryPath: `src/client/${kind}/${entryName}/index.tsx`,
    descriptorPath: `src/client/${kind}/${entryName}/entry.json`,
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
        plan: {
          type: 'string',
          enum: ['basic'],
          default: 'basic',
        },
      },
    },
    settingsSchemaHash: 'schema_hash',
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
    settingsDefaultsHash: 'defaults_hash',
    compiledAt: '2026-07-09T00:00:00.000Z',
    healthStatus: 'ready',
    diagnostics: [],
  };
}

function getSelfErrors(field: unknown): string[] {
  if (!field || typeof field !== 'object' || !('selfErrors' in field)) {
    return [];
  }
  const errors = (field as { selfErrors?: unknown }).selfErrors;
  return Array.isArray(errors) ? errors.filter((error): error is string => typeof error === 'string') : [];
}
