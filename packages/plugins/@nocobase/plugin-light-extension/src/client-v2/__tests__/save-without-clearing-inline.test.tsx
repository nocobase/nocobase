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
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
      title: {
        type: 'string',
        default: 'Sales',
      },
    },
  },
  settingsDefaultsSnapshot: {
    title: 'Sales',
  },
  settingsSchemaHash: 'schema_hash',
  settingsDefaultsHash: 'defaults_hash',
  filesHash: 'files_hash',
  runtimeCodeHash: 'runtime_hash',
  diagnostics: [],
};

describe('JSBlockLightExtensionSourceField save behavior', () => {
  beforeEach(() => {
    mocks.request.mockReset();
    mocks.request
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            entryId: 'entry_sales',
            activePublicationId: 'pub_sales',
            publications: [publication],
          },
        },
      });
  });

  it('writes binding/settings without clearing existing inline code and version', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        code: 'ctx.render("keep inline");',
        version: 'v2',
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
      expect(form.values.sourceBinding?.publicationId).toBe('pub_sales');
    });

    expect(form.values.settings).toEqual({
      title: 'Sales',
    });
    expect(form.values.code).toBe('ctx.render("keep inline");');
    expect(form.values.version).toBe('v2');
  });

  it('renders as a binding editor without source mode controls when bound to sourceBinding', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('api', {
      value: {
        request: mocks.request,
      },
    });
    const form = createForm({
      initialValues: {
        sourceMode: 'light-extension',
        code: 'ctx.render("keep inline");',
        version: 'v2',
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
                  'x-display': 'hidden',
                },
                sourceBinding: {
                  type: 'object',
                  'x-component': 'JSBlockLightExtensionSourceField',
                },
              },
            }}
          />
        </FormProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(form.values.sourceBinding?.publicationId).toBe('pub_sales');
    });

    expect(screen.queryByText('Inline code')).toBeNull();
    expect(screen.queryByText('Light extension')).toBeNull();
    expect(screen.queryByText('Copy selected light extension code')).toBeNull();
    expect(form.values.settings).toEqual({
      title: 'Sales',
    });
    expect(form.values.code).toBe('ctx.render("keep inline");');
    expect(form.values.version).toBe('v2');
  });
});
