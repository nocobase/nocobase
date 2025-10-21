/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LLMProviderOptions } from '../../../manager/ai-manager';
import { ProviderSettingsForm } from '../components/ProviderSettings';
import { ModelSettingsForm } from './ModelSettings';

export const openaiCompletionsProviderOptions: LLMProviderOptions = {
  components: {
    ProviderSettingsForm,
    ModelSettingsForm,
  },
};
