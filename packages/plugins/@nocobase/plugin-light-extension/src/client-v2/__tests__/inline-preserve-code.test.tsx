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

function renderSourceField() {
  const engine = new FlowEngine();
  engine.context.defineProperty('api', {
    value: {
      request: mocks.request,
    },
  });
  const form = createForm({
    initialValues: {
      sourceMode: 'inline',
      code: 'ctx.render("inline");',
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

  return form;
}

describe('JSBlockLightExtensionSourceField inline preservation', () => {
  beforeEach(() => {
    mocks.request.mockResolvedValue({
      data: {
        data: [],
      },
    });
  });

  it('does not clear inline code when switching to light-extension mode', async () => {
    const form = renderSourceField();

    await act(async () => {
      fireEvent.click(screen.getByText('Light extension'));
    });

    expect(form.values.sourceMode).toBe('light-extension');
    expect(form.values.code).toBe('ctx.render("inline");');
    expect(form.values.version).toBe('v2');
    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalled();
    });
  });
});
