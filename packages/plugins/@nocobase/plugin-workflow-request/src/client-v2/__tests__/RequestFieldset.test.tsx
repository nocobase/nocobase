/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import type { FormInstance } from 'antd';
import React, { Suspense, useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_REQUEST_METHOD } from '../constants';
import { RequestFieldset } from '../components/RequestFieldset';

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  WorkflowVariableInput: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: unknown;
    onChange?: (value: string) => void;
    placeholder?: string;
  }) => (
    <input
      aria-label={placeholder ?? 'workflow-variable-input'}
      value={typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value)}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
  WorkflowVariableJsonTextArea: ({ value }: { value?: unknown }) => (
    <textarea aria-label="workflow-variable-json-textarea" readOnly value={JSON.stringify(value ?? '')} />
  ),
  WorkflowVariableTextArea: ({ value }: { value?: unknown }) => (
    <textarea
      aria-label="workflow-variable-textarea"
      readOnly
      value={typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value)}
    />
  ),
}));

function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => {};
  const promise = new Promise<T>((_resolve) => {
    resolve = _resolve;
  });

  return { promise, resolve };
}

function renderLazyFieldset(initialValues: Record<string, unknown>) {
  let formRef: FormInstance | undefined;
  const deferred = createDeferred<{ default: typeof RequestFieldset }>();
  const LazyFieldset = React.lazy(() => deferred.promise);

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;

    useEffect(() => {
      form.setFieldsValue(initialValues);
    }, [form]);

    return (
      <Form form={form} layout="vertical">
        <Suspense fallback={<div>loading</div>}>
          <LazyFieldset />
        </Suspense>
      </Form>
    );
  }

  render(<Wrapper />);

  return {
    getForm: () => formRef,
    resolveFieldset: async () => {
      await act(async () => {
        deferred.resolve({ default: RequestFieldset });
        await deferred.promise;
      });
    },
  };
}

describe('RequestFieldset', () => {
  it('preserves an existing request body when the fieldset mounts after form values are seeded', async () => {
    const { getForm, resolveFieldset } = renderLazyFieldset({
      config: {
        contentType: 'application/json',
        data: { a: '111' },
      },
    });

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'data'])).toEqual({ a: '111' });
    });

    await resolveFieldset();

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'method'])).toBe(DEFAULT_REQUEST_METHOD);
      expect(getForm()?.getFieldValue(['config', 'data'])).toEqual({ a: '111' });
    });
  });

  it('uses the preloaded content type to initialize an empty request body after lazy mount', async () => {
    const { getForm, resolveFieldset } = renderLazyFieldset({
      config: {
        contentType: 'text/plain',
      },
    });

    await resolveFieldset();

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'method'])).toBe(DEFAULT_REQUEST_METHOD);
      expect(getForm()?.getFieldValue(['config', 'data'])).toBe('');
    });
  });

  it('renders boolean options inline and keeps timeout input compact', async () => {
    const { resolveFieldset } = renderLazyFieldset({});

    await resolveFieldset();

    const onlyDataLabel = screen.getByText('Only return response data').closest('label');
    const ignoreFailLabel = screen.getByText('Ignore failed request and continue workflow').closest('label');

    expect(onlyDataLabel?.querySelector('input[type="checkbox"]')).toBeTruthy();
    expect(ignoreFailLabel?.querySelector('input[type="checkbox"]')).toBeTruthy();
    expect(screen.getByRole('spinbutton').closest('.ant-input-number')?.getAttribute('style') ?? '').not.toContain(
      'width: 100%',
    );
  });
});
