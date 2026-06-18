/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LLMProviderOptions } from '../../manager/ai-manager';
import { formatModelLabel } from '../../../client-v2/llm-services/model-label';
import { ProviderSettingsForm } from '../openai/components/ProviderSettings';
import { ModelSettingsForm } from './ModelSettings';

export const deepseekProviderOptions: LLMProviderOptions = {
  components: {
    ProviderSettingsForm,
    ModelSettingsForm,
  },
  formatModelLabel,
};
