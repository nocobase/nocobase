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

import { JSBlockLightExtensionSourceField } from '../components/JSBlockLightExtensionSourceField';

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

  it('validates selected entry settings against the current entry schema and clears errors in inline mode', async () => {
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

    await waitFor(() => {
      expect(form.query('sourceMode').take()?.selfErrors).toContain('plan: Must be one of the allowed values');
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Code source' }));
    fireEvent.click(await screen.findByText('Inline code'));
    fireEvent.click(await screen.findByText('Keep existing code'));

    await waitFor(() => {
      expect(form.values.sourceMode).toBe('inline');
      expect(form.query('sourceMode').take()?.selfErrors).toEqual([]);
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
      expect(form.query('sourceMode').take()?.selfErrors).toContain('Select a light extension entry');
    });
  });

  it('rejects obsolete publication bindings before save', async () => {
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: {
          ...createSourceBinding(),
          publicationId: 'pub_sales',
          versionPolicy: 'pinned',
        },
      },
    });

    renderSourceField(form);

    await waitFor(() => {
      expect(form.query('sourceMode').take()?.selfErrors).toContain('Select a light extension entry');
    });
  });

  it('uses current entry settings defaults for a valid saved binding', async () => {
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: createSourceBinding(),
        settings: {},
      },
    });

    renderSourceField(form);

    await waitFor(() => {
      expect(screen.getByText('plan')).toBeTruthy();
      expect(form.query('sourceMode').take()?.selfErrors || []).not.toContain('Select a light extension entry');
    });
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
}

function createSourceBinding() {
  return {
    type: 'light-extension-entry',
    repoId: 'repo_sales',
    entryId: 'entry_sales',
    kind: 'js-block',
  };
}

function createSelectableEntry() {
  return {
    id: 'entry_sales',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-block',
    entryName: 'sales',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
    metaPath: null,
    settingsPath: null,
    title: 'Sales',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
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
