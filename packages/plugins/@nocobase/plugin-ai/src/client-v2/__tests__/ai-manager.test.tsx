/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { AIManager } from '../manager/ai-manager';
import type { LLMProviderOptions, ToolModalProps, ToolOptions } from '../manager/ai-manager';

const ProviderSettingsForm = () => <div />;
const ModelSettingsForm = () => <div />;
const ChatSettingsForm = () => <div />;

describe('AIManager v2', () => {
  it('registers LLM providers with provider/model/message components', () => {
    const manager = new AIManager();
    const provider: LLMProviderOptions = {
      components: {
        ProviderSettingsForm,
        ModelSettingsForm,
        MessageRenderer: ({ msg }) => <span>{String(msg)}</span>,
      },
      formatModelLabel: (id) => `Model ${id}`,
    };

    manager.registerLLMProvider('openai', provider);

    expect(manager.llmProviders.get('openai')).toBe(provider);
    expect(manager.llmProviders.get('openai')?.formatModelLabel?.('gpt-4.1')).toBe('Model gpt-4.1');
  });

  it('keeps chat settings entries in insertion order', () => {
    const manager = new AIManager();

    manager.chatSettings.set('messages', {
      title: 'Messages',
      Component: ChatSettingsForm,
    });
    manager.chatSettings.set('structured-output', {
      title: 'Structured output',
      Component: ChatSettingsForm,
    });

    expect(Array.from(manager.chatSettings.keys())).toEqual(['messages', 'structured-output']);
  });

  it('resolves root and child work context registrations', () => {
    const manager = new AIManager();
    const root = {
      name: 'datasource',
      children: {},
    };
    const child = {
      name: 'collection',
    };

    manager.registerWorkContext('datasource', root);
    manager.registerWorkContext('datasource.collection', child);

    expect(manager.getWorkContext('datasource')?.name).toBe('datasource');
    expect(manager.getWorkContext('datasource.collection')?.name).toBe('collection');
    expect(manager.getWorkContext('unknown.child')).toBeNull();
  });

  it('exports v2 tool-related public types', () => {
    const tool: ToolOptions = {};
    const modalProps: ToolModalProps = { width: 720 };

    expect({ tool, modalProps }).toBeDefined();
  });
});
