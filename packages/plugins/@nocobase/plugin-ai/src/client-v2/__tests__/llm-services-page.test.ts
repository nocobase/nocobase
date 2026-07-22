/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Form } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import {
  createLLMService,
  deleteLLMService,
  deleteLLMServices,
  LLMServiceForm,
  listLLMProviders,
  listLLMServices,
  listProviderModels,
  moveLLMService,
  normalizeEnabledModels,
  shouldAutoOpenAddNew,
  testLLMServiceFlight,
  updateLLMService,
  updateLLMServiceEnabled,
} from '../pages/LLMServicesPage';

type CapturedSelectProps = {
  popupClassName?: string;
  popupMatchSelectWidth?: boolean;
};

const capturedSelectProps = vi.hoisted(() => ({ current: undefined as CapturedSelectProps | undefined }));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const ReactModule = await import('react');

  return {
    ...actual,
    Select: (props: CapturedSelectProps) => {
      capturedSelectProps.current = props;
      return ReactModule.createElement('div', { 'data-testid': 'provider-select' });
    },
  };
});

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('LLMServicesPage request helpers', () => {
  it('constrains the provider popup to the select width', () => {
    render(
      React.createElement(
        Form,
        null,
        React.createElement(LLMServiceForm, {
          editing: false,
          providers: [
            {
              key: 'openai-completions',
              value: 'openai-completions',
              label: 'OpenAI (completions)',
              supportedModel: ['LLM', 'EMBEDDING'],
            },
          ],
        }),
      ),
    );

    expect(capturedSelectProps.current?.popupMatchSelectWidth).toBe(true);
    expect(capturedSelectProps.current?.popupClassName).toBeTruthy();
  });

  it('detects the v1-compatible auto-open add-new route state', () => {
    expect(shouldAutoOpenAddNew({ autoOpenAddNew: true })).toBe(true);
    expect(shouldAutoOpenAddNew({ autoOpenAddNew: false })).toBe(false);
    expect(shouldAutoOpenAddNew(null)).toBe(false);
  });

  it('normalizes legacy enabledModels values', () => {
    expect(normalizeEnabledModels(undefined)).toEqual({ mode: 'recommended', models: [] });
    expect(normalizeEnabledModels(['gpt-4o'])).toEqual({
      mode: 'custom',
      models: [{ label: 'gpt-4o', value: 'gpt-4o' }],
    });
    expect(normalizeEnabledModels({ mode: 'provider', models: [{ label: 'GPT-4o', value: 'gpt-4o' }] })).toEqual({
      mode: 'provider',
      models: [{ label: 'GPT-4o', value: 'gpt-4o' }],
    });
  });

  it('lists LLM services from llmServices.list', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ name: 'v_openai' }, { title: 'invalid' }],
        count: 1,
      },
    });
    const apiClient = {
      resource: () => ({ list }),
    };

    await expect(listLLMServices(apiClient)).resolves.toEqual({
      data: [{ name: 'v_openai' }],
      total: 1,
    });
    expect(list).toHaveBeenCalledWith(
      {
        sort: ['sort'],
      },
      undefined,
    );
  });

  it('moves LLM services by name and the sortable sort field', async () => {
    const move = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ move }),
    };

    await moveLLMService(apiClient, 'v_openai', 'v_kimi');

    expect(move).toHaveBeenCalledWith(
      {
        sourceId: 'v_openai',
        targetId: 'v_kimi',
        sortField: 'sort',
      },
      undefined,
    );
  });

  it('creates an LLM service through llmServices.create', async () => {
    const create = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ create }),
    };

    await createLLMService(apiClient, {
      name: 'v_openai',
      title: 'OpenAI',
      provider: 'openai',
      options: {
        apiKey: 'secret',
        baseURL: '',
      },
      enabledModels: {
        mode: 'custom',
        models: [{ value: ' gpt-4o ', label: ' GPT 4o ' }],
      },
    });

    expect(create).toHaveBeenCalledWith(
      {
        values: {
          name: 'v_openai',
          title: 'OpenAI',
          provider: 'openai',
          options: {
            apiKey: 'secret',
          },
          enabledModels: {
            mode: 'custom',
            models: [{ value: 'gpt-4o', label: 'GPT 4o' }],
          },
        },
      },
      undefined,
    );
  });

  it('updates an LLM service by name', async () => {
    const update = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ update }),
    };

    await updateLLMService(apiClient, {
      name: 'v_openai',
      title: 'OpenAI',
      provider: 'openai',
      options: {
        apiKey: 'secret',
        baseURL: ' https://api.example.com/v1/ ',
      },
    });

    expect(update).toHaveBeenCalledWith(
      {
        values: {
          name: 'v_openai',
          title: 'OpenAI',
          provider: 'openai',
          options: {
            apiKey: 'secret',
            baseURL: 'https://api.example.com/v1/',
          },
        },
        filterByTk: 'v_openai',
      },
      undefined,
    );
  });

  it('deletes one or more LLM services by name', async () => {
    const destroy = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ destroy }),
    };

    await deleteLLMService(apiClient, 'v_openai');
    await deleteLLMServices(apiClient, ['v_openai', 'v_kimi']);

    expect(destroy).toHaveBeenNthCalledWith(1, { filterByTk: 'v_openai' }, undefined);
    expect(destroy).toHaveBeenNthCalledWith(2, { filterByTk: ['v_openai', 'v_kimi'] }, undefined);
  });

  it('updates enabled state by name', async () => {
    const update = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ update }),
    };

    await updateLLMServiceEnabled(apiClient, 'v_openai', false);

    expect(update).toHaveBeenCalledWith(
      {
        values: { enabled: false },
        filterByTk: 'v_openai',
      },
      undefined,
    );
  });

  it('loads provider options and compiles titles', async () => {
    const listLLMProvidersAction = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            name: 'openai',
            title: '{{t("OpenAI")}}',
            supportedModel: ['LLM'],
          },
        ],
      },
    });
    const apiClient = {
      resource: () => ({ listLLMProviders: listLLMProvidersAction }),
    };

    await expect(listLLMProviders(apiClient, (value) => `compiled:${value}`)).resolves.toEqual([
      {
        key: 'openai',
        value: 'openai',
        label: 'compiled:{{t("OpenAI")}}',
        supportedModel: ['LLM'],
      },
    ]);
  });

  it('loads provider models with skipNotify', async () => {
    const listProviderModelsAction = vi.fn().mockResolvedValue({
      data: {
        data: [{ id: 'gpt-4o' }, { id: 'gpt-4o' }, { name: 'invalid' }],
      },
    });
    const apiClient = {
      resource: () => ({ listProviderModels: listProviderModelsAction }),
    };

    await expect(
      listProviderModels(apiClient, {
        provider: 'openai',
        options: { apiKey: '{{ $env.OPENAI_API_KEY }}', baseURL: '   ' },
        model: 'gpt',
      }),
    ).resolves.toEqual(['gpt-4o']);
    expect(listProviderModelsAction).toHaveBeenCalledWith(
      {
        values: {
          provider: 'openai',
          options: { apiKey: '{{ $env.OPENAI_API_KEY }}' },
          model: 'gpt',
        },
      },
      { skipNotify: true },
    );
  });

  it('runs LLM test flight through ai.testFlight', async () => {
    const testFlight = vi.fn().mockResolvedValue({
      data: {
        data: {
          code: 0,
          message: 'ok',
        },
      },
    });
    const apiClient = {
      resource: () => ({ testFlight }),
    };

    await expect(
      testLLMServiceFlight(apiClient, {
        provider: 'openai',
        options: { apiKey: 'secret', baseURL: ' https://api.example.com/v1/ ' },
        model: 'gpt-4o',
      }),
    ).resolves.toEqual({ code: 0, message: 'ok' });
    expect(testFlight).toHaveBeenCalledWith(
      {
        values: {
          provider: 'openai',
          options: { apiKey: 'secret', baseURL: 'https://api.example.com/v1/' },
          model: 'gpt-4o',
        },
      },
      undefined,
    );
  });
});
