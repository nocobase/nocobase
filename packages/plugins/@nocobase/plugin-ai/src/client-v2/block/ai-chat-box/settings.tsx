/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelContext } from '@nocobase/flow-engine';
import { NAMESPACE, tExpr } from '../../locale';
import type { AIEmployee } from '../../ai-employees/types';
import { WorkContext } from '../../models/ai-employees/AIEmployeeShortcutModel';
import type { LLMServiceItem } from '../../repositories/AIConfigRepository';
import type { AIChatBoxBlockModel } from './AIChatBoxBlockModel';
import {
  getAIChatBoxSettings,
  getAIChatBoxWorkContext,
  normalizeAIChatBoxWorkContext,
  normalizeAIChatBoxScopeForSave,
} from './utils';
import type { AIChatBoxBlockProps, AIChatBoxSettings } from './types';

export const AI_CHAT_BOX_BLOCK_SETTINGS_FLOW_KEY = 'aiChatBoxBlockSettings';

type AIChatBoxBlockModelConstructor = typeof import('./AIChatBoxBlockModel').AIChatBoxBlockModel;

type AIChatBoxFlowContext = FlowModelContext & {
  model: AIChatBoxBlockModel;
  aiConfigRepository?: {
    getAIEmployees: () => Promise<AIEmployee[]>;
    getLLMServices: () => Promise<LLMServiceItem[]>;
  };
};

type AIChatBoxSettingsParams = Partial<AIChatBoxSettings>;

type BooleanSettingKey =
  | 'showMessages'
  | 'showContextSelector'
  | 'showUpload'
  | 'showWebSearch'
  | 'showEmployeeSelect'
  | 'showModelSelect'
  | 'showDisclaimer';

type TitleDescriptionParams = {
  title?: string;
  description?: string;
};

const getAIEmployeeOptions = async (ctx: AIChatBoxFlowContext) => {
  const employees = (await ctx.aiConfigRepository?.getAIEmployees()) || [];
  return employees
    .filter((employee) => employee.category === 'business' && employee.deprecated !== true)
    .map((employee) => ({
      label: employee.nickname || employee.username,
      value: employee.username,
    }));
};

const getModelOptions = async (ctx: AIChatBoxFlowContext) => {
  const services = (await ctx.aiConfigRepository?.getLLMServices()) || [];
  return services.flatMap((service) =>
    service.enabledModels.map((model) => ({
      label: `${service.llmServiceTitle} / ${model.label}`,
      value: `${service.llmService}:${model.value}`,
    })),
  );
};

const getSwitchDefaultParams = (ctx: AIChatBoxFlowContext, key: BooleanSettingKey) => ({
  [key]: getAIChatBoxSettings(ctx.model.props)[key],
});

const setSwitchProps = (
  ctx: AIChatBoxFlowContext,
  key: BooleanSettingKey,
  params: Partial<Record<BooleanSettingKey, boolean>>,
) => {
  ctx.model.setProps({
    [key]: params[key] !== false,
  } as Pick<AIChatBoxBlockProps, typeof key>);
};

const createSwitchSettingStep = (key: BooleanSettingKey, title: string) => ({
  title: tExpr(title),
  uiMode: {
    type: 'switch' as const,
    key,
  },
  uiSchema: {
    [key]: {
      'x-component': 'Switch',
      'x-decorator': 'FormItem',
    },
  },
  defaultParams(ctx: AIChatBoxFlowContext) {
    return getSwitchDefaultParams(ctx, key);
  },
  handler(ctx: AIChatBoxFlowContext, params: Partial<Record<BooleanSettingKey, boolean>>) {
    setSwitchProps(ctx, key, params);
  },
});

export const registerAIChatBoxBlockSettings = (ModelClass: AIChatBoxBlockModelConstructor) => {
  ModelClass.registerFlow({
    key: 'cardSettings',
    title: tExpr('Card settings'),
    steps: {
      titleDescription: {
        title: tExpr('Title & description'),
        uiSchema: {
          title: {
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            title: tExpr('Title'),
          },
          description: {
            'x-component': 'Input.TextArea',
            'x-decorator': 'FormItem',
            title: tExpr('Description'),
          },
        },
        handler(ctx: AIChatBoxFlowContext, params: TitleDescriptionParams) {
          const title = typeof params.title === 'string' ? ctx.t(params.title, { ns: NAMESPACE }) : params.title;
          const description =
            typeof params.description === 'string' ? ctx.t(params.description, { ns: NAMESPACE }) : params.description;
          ctx.model.setDecoratorProps({ title, description });
        },
      },
      linkageRules: {
        use: 'blockLinkageRules',
      },
      blockHeight: {
        use: 'blockHeight',
      },
    },
  });

  ModelClass.registerFlow({
    key: AI_CHAT_BOX_BLOCK_SETTINGS_FLOW_KEY,
    title: tExpr('AI chat box settings'),
    on: 'beforeRender',
    steps: {
      editChatBox: {
        title: tExpr('Edit chat box'),
        uiMode() {
          return {
            type: 'dialog' as const,
            props: {
              width: 720,
            },
          };
        },
        defaultParams(ctx: AIChatBoxFlowContext): AIChatBoxSettings {
          const model = ctx.model;
          const settings = getAIChatBoxSettings(model.props);
          return {
            ...settings,
            scope: settings.scope === undefined ? model.uid : settings.scope,
            selectedBlocks: getAIChatBoxWorkContext(model),
          };
        },
        uiSchema: async (ctx: AIChatBoxFlowContext) => {
          const [aiEmployeeOptions, modelOptions] = await Promise.all([
            getAIEmployeeOptions(ctx),
            getModelOptions(ctx),
          ]);

          return {
            scope: {
              type: 'string',
              title: tExpr('Scope'),
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
            systemPrompt: {
              type: 'string',
              title: tExpr('Background'),
              'x-decorator': 'FormItem',
              'x-component': 'FlowSettingsVariableTextArea',
            },
            defaultUserMessage: {
              type: 'string',
              title: tExpr('Default user message'),
              'x-decorator': 'FormItem',
              'x-component': 'FlowSettingsVariableTextArea',
            },
            selectedBlocks: {
              type: 'array',
              title: tExpr('Work context'),
              'x-decorator': 'FormItem',
              'x-component': WorkContext,
            },
            allowedAIEmployees: {
              type: 'array',
              title: tExpr('AI employees'),
              'x-decorator': 'FormItem',
              'x-component': 'Select',
              'x-component-props': {
                mode: 'multiple',
                allowClear: true,
                options: aiEmployeeOptions,
              },
            },
            allowedModels: {
              type: 'array',
              title: tExpr('Models'),
              'x-decorator': 'FormItem',
              'x-component': 'Select',
              'x-component-props': {
                mode: 'multiple',
                allowClear: true,
                options: modelOptions,
              },
            },
          };
        },
        handler(ctx: AIChatBoxFlowContext, params: AIChatBoxSettingsParams) {
          ctx.model.setProps({
            scope: normalizeAIChatBoxScopeForSave(params.scope, ctx.model.uid),
            systemPrompt: params.systemPrompt || '',
            defaultUserMessage: params.defaultUserMessage || '',
            allowedAIEmployees: Array.isArray(params.allowedAIEmployees) ? params.allowedAIEmployees : [],
            allowedModels: Array.isArray(params.allowedModels) ? params.allowedModels : [],
            selectedBlocks: normalizeAIChatBoxWorkContext(params.selectedBlocks),
          });
        },
      },
      showMessages: createSwitchSettingStep('showMessages', 'Show messages'),
      senderPlaceholder: {
        title: tExpr('Sender placeholder'),
        uiMode() {
          return {
            type: 'dialog' as const,
            props: {
              width: 520,
            },
          };
        },
        uiSchema: {
          senderPlaceholder: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
        },
        defaultParams(ctx: AIChatBoxFlowContext) {
          return {
            senderPlaceholder: getAIChatBoxSettings(ctx.model.props).senderPlaceholder,
          };
        },
        handler(ctx: AIChatBoxFlowContext, params: Pick<AIChatBoxSettings, 'senderPlaceholder'>) {
          ctx.model.setProps({
            senderPlaceholder: params.senderPlaceholder || 'Enter your question',
          });
        },
      },
      showContextSelector: createSwitchSettingStep('showContextSelector', 'Enable add context'),
      showUpload: createSwitchSettingStep('showUpload', 'Enable upload files'),
      showWebSearch: createSwitchSettingStep('showWebSearch', 'Enable web search'),
      showEmployeeSelect: createSwitchSettingStep('showEmployeeSelect', 'Enable employee select'),
      showModelSelect: createSwitchSettingStep('showModelSelect', 'Enable model select'),
      showDisclaimer: createSwitchSettingStep('showDisclaimer', 'Show disclaimer'),
    },
  });
};
