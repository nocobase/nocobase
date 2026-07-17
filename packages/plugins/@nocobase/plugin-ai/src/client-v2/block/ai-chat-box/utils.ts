/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ContextItem } from '../../ai-employees/types';
import type { AIChatBoxBlockModel } from './AIChatBoxBlockModel';
import type { AIChatBoxBlockProps, AIChatBoxSettings } from './types';

export const DEFAULT_AI_CHAT_BOX_WIDTH = 400;
export const DEFAULT_AI_CHAT_BOX_HEIGHT = 650;
export const DEFAULT_AI_CHAT_BOX_GRID_WIDTH = 6;

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
  height: DEFAULT_AI_CHAT_BOX_HEIGHT,
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
  return typeof height === 'number' && Number.isFinite(height) ? Math.max(420, height) : DEFAULT_AI_CHAT_BOX_HEIGHT;
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

export const normalizeAIChatBoxWorkContext = (selectedBlocks: ContextItem[] | undefined) => {
  const items = Array.isArray(selectedBlocks) ? selectedBlocks.filter(isContextItem) : [];
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

export const getAIChatBoxWorkContext = (model: AIChatBoxBlockModel) => {
  return normalizeAIChatBoxWorkContext(getAIChatBoxSettings(model.props).selectedBlocks);
};
