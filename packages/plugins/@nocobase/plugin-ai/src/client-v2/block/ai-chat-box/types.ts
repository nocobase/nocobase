/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ActionModel } from '@nocobase/client-v2';
import type { FlowModel } from '@nocobase/flow-engine';
import type { ContextItem } from '../../ai-employees/types';

export type AIChatBoxBlockStructure = {
  subModels: {
    bodyBlocks: FlowModel[];
    actions: ActionModel[];
  };
};

export type AIChatBoxBlockProps = {
  minWidth?: number;
  height?: number;
  showMessages?: boolean;
  scope?: string;
  systemPrompt?: string;
  defaultUserMessage?: string;
  workContext?: ContextItem[];
  allowedAIEmployees?: string[];
  allowedModels?: string[];
  senderPlaceholder?: string;
  showContextSelector?: boolean;
  showUpload?: boolean;
  showWebSearch?: boolean;
  showEmployeeSelect?: boolean;
  showModelSelect?: boolean;
  showDisclaimer?: boolean;
};

export type AIChatBoxSettings = Required<
  Pick<
    AIChatBoxBlockProps,
    | 'showMessages'
    | 'minWidth'
    | 'height'
    | 'systemPrompt'
    | 'defaultUserMessage'
    | 'workContext'
    | 'allowedAIEmployees'
    | 'allowedModels'
    | 'senderPlaceholder'
    | 'showContextSelector'
    | 'showUpload'
    | 'showWebSearch'
    | 'showEmployeeSelect'
    | 'showModelSelect'
    | 'showDisclaimer'
  >
> & {
  scope?: string;
};
