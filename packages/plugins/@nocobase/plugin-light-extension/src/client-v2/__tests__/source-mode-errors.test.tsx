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
import { Modal } from 'antd';
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

const publication = {
  id: 'pub_sales',
  repoId: 'repo_sales',
  entryId: 'entry_sales',
  commitId: 'commit_sales',
  entryPath: 'src/client/js-blocks/sales/index.tsx',
  target: 'client',
  kind: 'js-block',
  surfaceStyle: 'render',
  runtimeVersion: 'v2',
  artifact: {
    version: 'v2',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
  },
  settingsSchemaSnapshot: {
    type: 'object',
    properties: {
      plan: {
        type: 'string',
        enum: ['basic'],
      },
    },
  },
  settingsDefaultsSnapshot: {
    plan: 'basic',
  },
  settingsSchemaHash: 'schema_hash',
  settingsDefaultsHash: 'defaults_hash',
  filesHash: 'files_hash',
  runtimeCodeHash: 'runtime_hash',
  diagnostics: [],
};

describe('JSBlockLightExtensionSourceField source mode errors', () => {
  beforeEach(() => {
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === 'lightExtensionEntries:listSelectable') {
        return Promise.resolve({
          data: {
            data: [
              {
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
                activePublicationId: 'pub_sales',
                activePublication: publication,
                healthStatus: 'ready',
                diagnostics: [],
              },
            ],
          },
        });
      }

      if (options.url === '/light-extension-entries/entry_sales/publications') {
        return Promise.resolve({
          data: {
            data: {
              entryId: 'entry_sales',
              activePublicationId: 'pub_sales',
              publications: [publication],
            },
          },
        });
      }

      return Promise.reject(new Error(`Unexpected request: ${options.url}`));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clears stale light-extension settings errors after switching back to inline mode', async () => {
    vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
      config.onCancel?.(() => {});
      return {
        destroy: vi.fn(),
        update: vi.fn(),
      } as ReturnType<typeof Modal.confirm>;
    });
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo_sales',
          entryId: 'entry_sales',
          kind: 'js-block',
          publicationId: 'pub_sales',
          versionPolicy: 'pinned',
        },
        settings: {
          plan: 'pro',
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
                  'x-component': 'JSBlockLightExtensionSourceField',
                },
              },
            }}
          />
        </FormProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(form.query('sourceMode').take()?.selfErrors).toContain('plan: Must be one of the allowed values');
    });

    fireEvent.click(screen.getByText('Inline code'));

    await waitFor(() => {
      expect(form.values.sourceMode).toBe('inline');
      expect(form.query('sourceMode').take()?.selfErrors).toEqual([]);
    });
  });

  it('requires a publication binding in light-extension mode', async () => {
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
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
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

    await waitFor(() => {
      expect(form.query('sourceMode').take()?.selfErrors).toContain('Select a publication');
    });
  });

  it('rejects malformed source bindings before save', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo_sales',
          entryId: 'entry_sales',
          kind: 'js-action',
          publicationId: 'pub_sales',
          versionPolicy: 'pinned',
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
                  'x-component': 'JSBlockLightExtensionSourceField',
                },
              },
            }}
          />
        </FormProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(form.query('sourceMode').take()?.selfErrors).toContain('Select a publication');
    });
    await waitFor(() => {
      expect(form.values.sourceBinding).toBeUndefined();
    });
  });

  it('clears the selected publication shell when the controlled binding is cleared', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo_sales',
          entryId: 'entry_sales',
          kind: 'js-block',
          publicationId: 'pub_sales',
          versionPolicy: 'pinned',
        },
        settings: {
          plan: 'basic',
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
                  'x-component': 'JSBlockLightExtensionSourceField',
                },
              },
            }}
          />
        </FormProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('plan')).toBeTruthy();
    });

    act(() => {
      form.setValuesIn('sourceBinding', undefined);
    });

    await waitFor(() => {
      expect(screen.queryByText('plan')).toBeNull();
      expect(form.query('sourceMode').take()?.selfErrors).toContain('Select a publication');
    });
  });

  it('does not copy invalid source bindings in inline mode', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'inline',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo_sales',
          entryId: 'entry_sales',
          kind: 'js-action',
          publicationId: 'pub_sales',
          versionPolicy: 'pinned',
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
                  'x-component': 'JSBlockLightExtensionSourceField',
                },
              },
            }}
          />
        </FormProvider>
      </FlowEngineProvider>,
    );

    expect(screen.getByText('Copy selected publication code').closest('button')).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByText('Copy selected publication code'));

    expect(mocks.request).not.toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/light-extension-runtime/resolve',
      }),
    );
  });

  it('rejects empty source binding identifiers and non-pinned policies before save', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo_sales',
          entryId: '',
          kind: 'js-block',
          publicationId: 'pub_sales',
          versionPolicy: 'active',
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
                  'x-component': 'JSBlockLightExtensionSourceField',
                },
              },
            }}
          />
        </FormProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(form.query('sourceMode').take()?.selfErrors).toContain('Select a publication');
    });
  });
});
