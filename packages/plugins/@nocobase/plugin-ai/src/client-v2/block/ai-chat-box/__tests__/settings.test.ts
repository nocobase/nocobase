/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlowModel, type FlowModelContext } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { dialogController } from '../../../ai-employees/stores/dialog-controller';
import { AIChatBoxBlockModel } from '../AIChatBoxBlockModel';
import { AIChatBoxCoreModel } from '../AIChatBoxCoreModel';
import { AI_CHAT_BOX_BLOCK_SETTINGS_FLOW_KEY } from '../settings';
import {
  DEFAULT_AI_CHAT_BOX_HEIGHT,
  DEFAULT_AI_CHAT_BOX_WIDTH,
  getAIChatBoxConversationScope,
  getAIChatBoxCreateScope,
  getAIChatBoxWorkContext,
  normalizeAIChatBoxHeight,
  normalizeAIChatBoxScopeForSave,
  normalizeAIChatBoxWorkContext,
} from '../utils';
import type { AIChatBoxSettings } from '../types';

type TestContextItem = {
  type: string;
  uid: string;
  title?: string;
};

type TestAIChatBoxBlockModel = AIChatBoxBlockModel & {
  setProps: ReturnType<typeof vi.fn>;
  setDecoratorProps: ReturnType<typeof vi.fn>;
};

const makeModel = (props: Partial<AIChatBoxSettings> = {}, items: FlowModel[] = []): TestAIChatBoxBlockModel => {
  const model = {
    uid: 'chat-box-1',
    props,
    mapSubModels: (_subKey: string, callback: (model: FlowModel, index: number) => unknown) =>
      items.map((item, index) => callback(item, index)),
    setProps: vi.fn((nextProps: Partial<AIChatBoxSettings>) => {
      model.props = {
        ...model.props,
        ...nextProps,
      };
    }),
    setDecoratorProps: vi.fn(),
  };
  return model as TestAIChatBoxBlockModel;
};

const makeFlowModel = (uid: string, title: string) => {
  return {
    uid,
    title,
  } as FlowModel;
};

const makeCoreModel = () => {
  const core = Object.create(AIChatBoxCoreModel.prototype) as FlowModel;
  Object.defineProperty(core, 'uid', { value: 'core-1' });
  Object.defineProperty(core, 'title', { value: 'Core' });
  return core;
};

const readLocale = (locale: 'en-US' | 'zh-CN') => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(resolve(currentDir, `../../../../locale/${locale}.json`), 'utf8');
  return JSON.parse(raw) as Record<string, string>;
};

describe('AI chat box settings helpers', () => {
  it('normalizes chat box height with a larger default than the minimum', () => {
    expect(normalizeAIChatBoxHeight(undefined)).toBe(DEFAULT_AI_CHAT_BOX_HEIGHT);
    expect(normalizeAIChatBoxHeight(360)).toBe(420);
    expect(normalizeAIChatBoxHeight(720)).toBe(720);
  });

  it('resolves query scope separately from conversation create scope', () => {
    expect(getAIChatBoxConversationScope(makeModel())).toBeUndefined();
    expect(getAIChatBoxConversationScope(makeModel({ scope: 'chat-box-1' }))).toBe('chat-box-1');
    expect(getAIChatBoxConversationScope(makeModel({ scope: '' }))).toBeUndefined();
    expect(getAIChatBoxConversationScope(makeModel({ scope: 'shared-sales' }))).toBe('shared-sales');
    expect(getAIChatBoxCreateScope(makeModel())).toBe('chat-box-1');
    expect(getAIChatBoxCreateScope(makeModel({ scope: '' }))).toBe('chat-box-1');
    expect(getAIChatBoxCreateScope(makeModel({ scope: 'shared-sales' }))).toBe('shared-sales');

    expect(normalizeAIChatBoxScopeForSave(undefined)).toBe('');
    expect(normalizeAIChatBoxScopeForSave('chat-box-1')).toBe('chat-box-1');
    expect(normalizeAIChatBoxScopeForSave('')).toBe('');
    expect(normalizeAIChatBoxScopeForSave('shared-sales')).toBe('shared-sales');
  });

  it('normalizes configured work context without duplicate items', () => {
    const workContext: TestContextItem[] = [
      { type: 'flow-model', uid: 'external-1', title: 'External' },
      { type: 'flow-model', uid: 'body-1', title: 'Manual body title' },
      { type: 'datasource', uid: 'collection-1', title: 'Collection' },
      { type: 'flow-model', uid: 'external-1', title: 'Duplicate external' },
    ];

    expect(normalizeAIChatBoxWorkContext(workContext)).toEqual([
      { type: 'flow-model', uid: 'external-1', title: 'External' },
      { type: 'flow-model', uid: 'body-1', title: 'Manual body title' },
      { type: 'datasource', uid: 'collection-1', title: 'Collection' },
    ]);
  });

  it('keeps display items out of work context', () => {
    const bodyOne = makeFlowModel('body-1', 'Body one');
    const bodyTwo = makeFlowModel('body-2', 'Body two');
    const model = makeModel(
      {
        workContext: [{ type: 'flow-model', uid: 'external-1', title: 'External' }],
      },
      [bodyOne, makeCoreModel(), bodyTwo],
    );

    expect(getAIChatBoxWorkContext(model)).toEqual([{ type: 'flow-model', uid: 'external-1', title: 'External' }]);
  });
});

describe('AI chat box settings flow', () => {
  it('creates new production blocks with the default size', () => {
    expect(AIChatBoxBlockModel.meta?.createModelOptions).toMatchObject({
      props: {
        minWidth: DEFAULT_AI_CHAT_BOX_WIDTH,
        height: DEFAULT_AI_CHAT_BOX_HEIGHT,
      },
    });
  });

  it('initializes the scope for newly added production blocks', async () => {
    const model = Object.create(AIChatBoxBlockModel.prototype) as AIChatBoxBlockModel;
    const props: AIChatBoxBlockModel['props'] = {};
    const setProps = vi.fn((nextProps: Partial<AIChatBoxSettings>) => {
      Object.assign(props, nextProps);
    });

    Object.defineProperties(model, {
      uid: { value: 'chat-box-1' },
      props: { value: props },
      setProps: { value: setProps },
    });

    await model.afterAddAsSubModel();

    expect(setProps).toHaveBeenCalledWith({ scope: 'chat-box-1' });
  });

  it('registers production settings with the common block height menu', () => {
    const settingsFlow = AIChatBoxBlockModel.globalFlowRegistry.getFlow(AI_CHAT_BOX_BLOCK_SETTINGS_FLOW_KEY);
    const cardSettingsFlow = AIChatBoxBlockModel.globalFlowRegistry.getFlow('cardSettings');

    expect(settingsFlow?.getStep('editChatBox')).toBeDefined();
    expect(settingsFlow?.getStep('showMessages')).toBeDefined();
    expect(settingsFlow?.getStep('senderPlaceholder')).toBeDefined();
    expect(settingsFlow?.getStep('showContextSelector')).toBeDefined();
    expect(settingsFlow?.getStep('showUpload')).toBeDefined();
    expect(settingsFlow?.getStep('showWebSearch')).toBeDefined();
    expect(settingsFlow?.getStep('showEmployeeSelect')).toBeDefined();
    expect(settingsFlow?.getStep('showModelSelect')).toBeDefined();
    expect(settingsFlow?.getStep('showDisclaimer')).toBeDefined();
    expect(cardSettingsFlow?.getStep('blockHeight')).toBeDefined();
  });

  it('uses the stored scope for editing and stores cleared scope without falling back to uid', async () => {
    const flow = AIChatBoxBlockModel.globalFlowRegistry.getFlow(AI_CHAT_BOX_BLOCK_SETTINGS_FLOW_KEY);
    const editStep = flow?.getStep('editChatBox')?.serialize();
    const bodyBlock = makeFlowModel('body-1', 'Body one');
    const model = makeModel(
      {
        scope: 'chat-box-1',
        workContext: [{ type: 'flow-model', uid: 'external-1', title: 'External' }],
      },
      [bodyBlock, makeCoreModel()],
    );
    const ctx = {
      model,
      aiConfigRepository: {
        getAIEmployees: vi.fn().mockResolvedValue([{ username: 'sales', nickname: 'Sales', category: 'business' }]),
        getLLMServices: vi.fn().mockResolvedValue([
          {
            llmService: 'openai',
            llmServiceTitle: 'OpenAI',
            enabledModels: [{ label: 'GPT', value: 'gpt' }],
          },
        ]),
      },
      t: (key: string) => key,
    } as unknown as FlowModelContext;

    expect(editStep?.defaultParams?.(ctx)).toMatchObject({
      scope: 'chat-box-1',
      workContext: [{ type: 'flow-model', uid: 'external-1', title: 'External' }],
    });

    const schema = await editStep?.uiSchema?.(ctx);
    expect(Object.keys(schema ?? {})).toEqual([
      'scope',
      'systemPrompt',
      'defaultUserMessage',
      'workContext',
      'allowedAIEmployees',
      'allowedModels',
    ]);
    expect(
      Object.values(schema ?? {}).every((item) => {
        return (
          typeof item === 'object' &&
          item !== null &&
          'x-decorator-props' in item &&
          !!(item as { 'x-decorator-props'?: { tooltip?: unknown } })['x-decorator-props']?.tooltip
        );
      }),
    ).toBe(true);
    expect(schema?.allowedModels?.['x-component-props']).toMatchObject({
      mode: 'multiple',
      allowClear: true,
      optionFilterProp: 'label',
      showSearch: true,
      options: [
        {
          label: 'OpenAI',
          options: [{ label: 'OpenAI / GPT', value: 'openai:gpt' }],
        },
      ],
    });
    expect(schema?.allowedModels?.['x-component-props']?.tagRender).toEqual(expect.any(Function));

    editStep?.handler?.(ctx, {
      scope: '',
      systemPrompt: 'Background',
      defaultUserMessage: 'Hello',
      workContext: [
        { type: 'flow-model', uid: 'external-1', title: 'External' },
        { type: 'flow-model', uid: 'body-1', title: 'Body one' },
      ],
      allowedAIEmployees: ['sales'],
      allowedModels: ['openai:gpt'],
    });

    expect(model.setProps).toHaveBeenCalledWith({
      scope: '',
      systemPrompt: 'Background',
      defaultUserMessage: 'Hello',
      workContext: [
        { type: 'flow-model', uid: 'external-1', title: 'External' },
        { type: 'flow-model', uid: 'body-1', title: 'Body one' },
      ],
      allowedAIEmployees: ['sales'],
      allowedModels: ['openai:gpt'],
    });
  });

  it('hides the edit chat box dialog while selecting work context', () => {
    const flow = AIChatBoxBlockModel.globalFlowRegistry.getFlow(AI_CHAT_BOX_BLOCK_SETTINGS_FLOW_KEY);
    const editStep = flow?.getStep('editChatBox')?.serialize();

    dialogController.resume();
    expect(editStep?.uiMode?.().props.styles).toMatchObject({
      mask: { zIndex: 9999 },
      wrapper: { zIndex: 9999 },
    });

    dialogController.hide();
    expect(editStep?.uiMode?.().props.styles).toMatchObject({
      mask: { zIndex: -1 },
      wrapper: { zIndex: -1 },
    });
    dialogController.resume();
  });

  it('keeps sender placeholder dialog field unlabeled and stores switch settings', () => {
    const flow = AIChatBoxBlockModel.globalFlowRegistry.getFlow(AI_CHAT_BOX_BLOCK_SETTINGS_FLOW_KEY);
    const senderPlaceholderStep = flow?.getStep('senderPlaceholder')?.serialize();
    const showMessagesStep = flow?.getStep('showMessages')?.serialize();
    const model = makeModel();
    const ctx = {
      model,
      t: (key: string) => key,
    } as unknown as FlowModelContext;

    expect(senderPlaceholderStep?.uiSchema?.senderPlaceholder.title).toBeUndefined();

    senderPlaceholderStep?.handler?.(ctx, { senderPlaceholder: 'Ask me anything' });
    expect(model.setProps).toHaveBeenCalledWith({ senderPlaceholder: 'Ask me anything' });

    showMessagesStep?.handler?.(ctx, { showMessages: false });
    expect(model.setProps).toHaveBeenCalledWith({ showMessages: false });
  });

  it('has locale keys for production settings labels', () => {
    const keys = [
      'AI chat box settings',
      'Card settings',
      'Title & description',
      'Edit chat box',
      'Scope',
      'Controls which chat boxes share conversations. The default value isolates this chat box.',
      'Background',
      'Default user message',
      'Prefill the sender input when the chat box starts a new conversation.',
      'Work context',
      'Select blocks or data sources that are sent as default work context.',
      'AI employees',
      'Restrict this chat box to selected AI employees. Leave empty to allow all business AI employees.',
      'Models',
      'Restrict this chat box to selected models. Leave empty to allow all available models.',
      'Show messages',
      'Sender placeholder',
      'Enable add context',
      'Enable upload files',
      'Enable web search',
      'Enable employee select',
      'Enable model select',
      'Show disclaimer',
    ];

    for (const locale of [readLocale('en-US'), readLocale('zh-CN')]) {
      for (const key of keys) {
        expect(locale[key]).toBeTruthy();
      }
    }
  });
});
