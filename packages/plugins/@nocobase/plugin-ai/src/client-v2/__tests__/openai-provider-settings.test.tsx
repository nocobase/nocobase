/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Button, Form } from 'antd';
import type { FormInstance } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import { builtinLLMProviderOptions } from '../llm-providers';
import { LLMServiceForm } from '../pages/LLMServicesPage';

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/client-v2')>()),
  EnvVariableInput: ({ id, value, onChange }: { id?: string; value?: string; onChange?: (value: string) => void }) => (
    <input id={id} value={value ?? ''} onChange={(event) => onChange?.(event.target.value)} />
  ),
  useApp: () => ({
    pm: {
      get: () => ({
        aiManager: {
          llmProviders: { get: (name: string) => builtinLLMProviderOptions.find(([key]) => key === name)?.[1] },
        },
      }),
    },
  }),
}));

const providers = builtinLLMProviderOptions.map(([name]) => ({
  key: name,
  value: name,
  label: name,
  supportedModel: ['LLM'],
}));

describe('OpenAI Responses provider settings', () => {
  it('places stateless requests immediately below the single Base URL field and saves boolean options', async () => {
    const onFinish = vi.fn();
    render(
      <Form initialValues={{ provider: 'openai', options: { apiKey: 'test-key' } }} onFinish={onFinish}>
        <LLMServiceForm editing={false} providers={providers} />
        <Button htmlType="submit">Save</Button>
      </Form>,
    );

    const toggle = screen.getByRole('switch', { name: 'Stateless requests' });
    const baseURL = screen.getByLabelText('Base URL');
    expect(baseURL.closest('.ant-form-item')?.nextElementSibling).toBe(toggle.closest('.ant-form-item'));
    expect(
      screen.getByLabelText('API Key').compareDocumentPosition(baseURL) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(toggle).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onFinish).toHaveBeenLastCalledWith(
        expect.objectContaining({ options: expect.objectContaining({ apiKey: 'test-key', zdrEnabled: false }) }),
      ),
    );

    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onFinish).toHaveBeenLastCalledWith(
        expect.objectContaining({ options: expect.objectContaining({ apiKey: 'test-key', zdrEnabled: true }) }),
      ),
    );

    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onFinish).toHaveBeenLastCalledWith(
        expect.objectContaining({ options: expect.objectContaining({ apiKey: 'test-key', zdrEnabled: false }) }),
      ),
    );
  });

  it('loads an enabled option from an existing service', async () => {
    const onFinish = vi.fn();
    const formRef = React.createRef<FormInstance>();
    render(
      <Form ref={formRef} initialValues={{ provider: 'openai' }} onFinish={onFinish}>
        <LLMServiceForm editing providers={providers} />
        <Button htmlType="submit">Save</Button>
      </Form>,
    );

    act(() => formRef.current?.setFieldsValue({ options: { apiKey: 'saved-key', zdrEnabled: true } }));
    expect(screen.getByRole('switch', { name: 'Stateless requests' })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith(
        expect.objectContaining({ options: expect.objectContaining({ apiKey: 'saved-key', zdrEnabled: true }) }),
      ),
    );
  });

  it.each(builtinLLMProviderOptions.map(([name]) => name).filter((name) => name !== 'openai'))(
    'keeps Base URL without stateless requests for %s',
    (provider) => {
      render(
        <Form initialValues={{ provider }}>
          <LLMServiceForm editing providers={providers} />
        </Form>,
      );
      expect(screen.getByLabelText('Base URL')).toBeInTheDocument();
      expect(screen.queryByRole('switch', { name: 'Stateless requests' })).not.toBeInTheDocument();
    },
  );
});
