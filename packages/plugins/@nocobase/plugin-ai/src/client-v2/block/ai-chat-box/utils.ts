/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';
import type { ContextItem } from '../../ai-employees/types';
import type { AIChatBoxBlockModel } from './AIChatBoxBlockModel';
import type { AIChatBoxBlockProps, AIChatBoxSettings } from './types';

export const AI_CHAT_BOX_DEFAULT_HEIGHT = 640;
export const AI_CHAT_BOX_MIN_HEIGHT = 420;
export const AI_CHAT_BOX_MAX_HEIGHT = 1600;
export const AI_CHAT_BOX_ADDED_BODY_BLOCK_HEIGHT_INCREMENT = 240;

const isContextItem = (value: unknown): value is ContextItem => {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as Partial<ContextItem>).type === 'string' &&
    typeof (value as Partial<ContextItem>).uid === 'string'
  );
};

export const getDefaultAIChatBoxSettings = (): AIChatBoxSettings => ({
  height: AI_CHAT_BOX_DEFAULT_HEIGHT,
  scope: undefined,
  systemPrompt: '',
  defaultUserMessage: '',
  selectedBlocks: [],
  allowedAIEmployees: [],
  allowedModels: [],
  senderPlaceholder: 'Enter your question',
  showMessages: true,
  showContextSelector: true,
  showUpload: true,
  showWebSearch: true,
  showEmployeeSelect: true,
  showModelSelect: true,
  showDisclaimer: true,
});

export const getAIChatBoxSettings = (props: AIChatBoxBlockProps = {}): AIChatBoxSettings => {
  const settings = {
    ...getDefaultAIChatBoxSettings(),
    ...props,
  };

  return {
    ...settings,
    selectedBlocks: Array.isArray(settings.selectedBlocks) ? settings.selectedBlocks.filter(isContextItem) : [],
    allowedAIEmployees: Array.isArray(settings.allowedAIEmployees) ? settings.allowedAIEmployees : [],
    allowedModels: Array.isArray(settings.allowedModels) ? settings.allowedModels : [],
  };
};

export const normalizeAIChatBoxHeight = (height: unknown) => {
  if (typeof height !== 'number' || !Number.isFinite(height)) {
    return AI_CHAT_BOX_DEFAULT_HEIGHT;
  }
  return Math.min(AI_CHAT_BOX_MAX_HEIGHT, Math.max(AI_CHAT_BOX_MIN_HEIGHT, height));
};

export const getExpandedAIChatBoxHeightAfterBodyBlockAdd = (height: unknown) => {
  return Math.min(
    AI_CHAT_BOX_MAX_HEIGHT,
    normalizeAIChatBoxHeight(height) + AI_CHAT_BOX_ADDED_BODY_BLOCK_HEIGHT_INCREMENT,
  );
};

export const getAIChatBoxScope = (model: AIChatBoxBlockModel) => {
  const settings = getAIChatBoxSettings(model.props);
  return settings.scope === undefined ? model.uid : settings.scope;
};

export const normalizeAIChatBoxScopeForSave = (scope: string | undefined, defaultScope: string) => {
  if (scope === undefined || scope === defaultScope) {
    return undefined;
  }
  return scope;
};

export const normalizeAIChatBoxWorkContext = (
  selectedBlocks: ContextItem[] | undefined,
  bodyBlocks: ContextItem[] | undefined,
) => {
  const items = [...(Array.isArray(selectedBlocks) ? selectedBlocks.filter(isContextItem) : []), ...(bodyBlocks || [])];
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.uid}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const getModelUse = (model: FlowModel) => {
  try {
    return model.use;
  } catch {
    return undefined;
  }
};

const isAIChatBoxCoreModel = (model: FlowModel) =>
  model.constructor.name === 'AIChatBoxCoreModel' || getModelUse(model) === 'AIChatBoxCoreModel';

export const getAIChatBoxBodyContextItems = (model: AIChatBoxBlockModel): ContextItem[] => {
  return model
    .mapSubModels('bodyBlocks', (subModel: FlowModel) => subModel)
    .filter((subModel) => !isAIChatBoxCoreModel(subModel))
    .map((subModel) => ({
      type: 'flow-model',
      uid: subModel.uid,
      title: subModel.title,
    }));
};

export const getAIChatBoxWorkContext = (model: AIChatBoxBlockModel) => {
  return normalizeAIChatBoxWorkContext(
    getAIChatBoxSettings(model.props).selectedBlocks,
    getAIChatBoxBodyContextItems(model),
  );
};

export const getAIChatBoxManualSelectedBlocks = (
  selectedBlocks: ContextItem[] | undefined,
  bodyBlocks: ContextItem[] | undefined,
) => {
  const bodyKeys = new Set((bodyBlocks || []).map((item) => `${item.type}:${item.uid}`));
  return normalizeAIChatBoxWorkContext(selectedBlocks, []).filter((item) => !bodyKeys.has(`${item.type}:${item.uid}`));
};
