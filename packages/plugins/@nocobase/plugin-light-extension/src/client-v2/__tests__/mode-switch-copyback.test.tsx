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

describe('JSBlockLightExtensionSourceField copyback', () => {
  beforeEach(() => {
    mocks.request.mockImplementation((options: { url: string }) => {
      if (options.url === '/light-extension-runtime/resolve') {
        return Promise.resolve({
          data: {
            data: {
              publicationId: 'pub_sales',
              entryId: 'entry_sales',
              runtimeCodeHash: 'runtime_hash',
              code: 'ctx.render("copied publication");',
              version: 'v2',
              settings: {},
              cache: {
                etag: 'etag',
                immutable: true,
              },
            },
          },
        });
      }

      return Promise.resolve({
        data: {
          data: [],
        },
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires confirmation and copies publication code when switching back to inline', async () => {
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
          publicationId: 'pub_sales',
          versionPolicy: 'pinned',
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

    fireEvent.click(screen.getByText('Inline code'));

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(form.values.sourceMode).toBe('inline');
      expect(form.values.code).toBe('ctx.render("copied publication");');
      expect(form.values.version).toBe('v2');
    });
  });
});
