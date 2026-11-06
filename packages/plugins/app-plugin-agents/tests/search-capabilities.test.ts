import { expect, it } from 'vitest';
import {
  mergeModelCapabilities,
  resolveModelCapabilities,
} from '../server/online/search/capabilities.js';

it('applies explicit model false over provider true instead of using truthy fallback', () => {
  const definition = {
    defaults: { webSearch: true },
    models: { disabled: { webSearch: false } },
  };
  expect(mergeModelCapabilities(definition, 'disabled')).toEqual({
    webSearch: false,
  });
  expect(mergeModelCapabilities(definition, 'other')).toEqual({
    webSearch: true,
  });
});

const platforms: readonly {
  provider: 'openai' | 'anthropic' | 'google' | 'alibaba';
  endpoint: string;
  models: readonly string[];
}[] = [
  {
    provider: 'alibaba',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-plus', 'qwen-turbo', 'future-qwen-chat'],
  },
  {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1',
    models: ['gpt-5.4', 'gpt-5.4-pro', 'gpt-6', 'future-openai-chat-model'],
  },
  {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    models: [
      'claude-sonnet-4-6',
      'claude-opus-5-5',
      'future-anthropic-chat-model',
    ],
  },
  {
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-3.1-flash-lite-preview',
      'future-google-chat-model',
    ],
  },
];

it.each(platforms)(
  'admits $provider chat models by platform without claiming vendor compatibility',
  ({ provider, endpoint, models }) => {
    for (const model of models) {
      for (const baseUrl of [null, endpoint, endpoint + '/']) {
        expect(resolveModelCapabilities({ provider, baseUrl }, model)).toEqual({
          webSearch: true,
        });
        for (const kind of ['embedding', 'rerank'] as const) {
          expect(
            resolveModelCapabilities({ provider, baseUrl }, model, kind),
          ).toEqual({
            webSearch: false,
          });
        }
      }
      for (const baseUrl of [
        'https://proxy.example/v1',
        endpoint + '?token=secret',
        endpoint + '#fragment',
        endpoint + '/proxy',
        endpoint.replace('https://', 'http://'),
        endpoint.replace('https://', 'https://secret@'),
        endpoint.replace('.com', '.com.evil.example'),
        'not a URL',
      ]) {
        expect(resolveModelCapabilities({ provider, baseUrl }, model)).toEqual({
          webSearch: false,
        });
      }
    }
  },
);

it('keeps platforms without a search adapter unsupported regardless of model brand', () => {
  expect(resolveModelCapabilities({ provider: 'deepseek' }, 'gpt-5.4')).toEqual(
    {
      webSearch: false,
    },
  );
  expect(
    resolveModelCapabilities(
      { provider: 'openai-compatible', baseUrl: 'https://api.openai.com/v1' },
      'gpt-5.4',
    ),
  ).toEqual({ webSearch: false });
});

it('accepts documented Alibaba regional endpoints but not lookalikes, proxies or alternate ports', () => {
  for (const host of [
    'dashscope.aliyuncs.com',
    'dashscope-intl.aliyuncs.com',
    'cn-hongkong.dashscope.aliyuncs.com',
    'workspace.cn-beijing.maas.aliyuncs.com',
    'workspace.ap-southeast-1.maas.aliyuncs.com',
    'workspace.cn-hongkong.maas.aliyuncs.com',
  ]) {
    expect(
      resolveModelCapabilities(
        { provider: 'alibaba', baseUrl: `https://${host}/compatible-mode/v1` },
        'future-qwen-chat',
      ).webSearch,
    ).toBe(true);
  }
  for (const host of [
    'evil.dashscope.aliyuncs.com',
    'dashscope.aliyuncs.com.evil.example',
    'workspace.evil.maas.aliyuncs.com',
    'a.b.cn-beijing.maas.aliyuncs.com',
    'dashscope-intl.aliyuncs.com:8443',
  ]) {
    expect(
      resolveModelCapabilities(
        { provider: 'alibaba', baseUrl: `https://${host}/compatible-mode/v1` },
        'qwen-plus',
      ).webSearch,
    ).toBe(false);
  }
});
