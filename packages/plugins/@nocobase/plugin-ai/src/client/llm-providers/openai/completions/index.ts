/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LLMProviderOptions } from '../../../manager/ai-manager';
import {
  stripModelIdPrefix,
  mergeVersionSegments,
  capitalize,
} from '../../../llm-services/component/EnabledModelsSelect';
import { ProviderSettingsForm } from '../components/ProviderSettings';
import { ModelSettingsForm } from './ModelSettings';

const formatModelLabel = (id: string): string => {
  const name = stripModelIdPrefix(id);
  const segments = mergeVersionSegments(name.split(/[-_]/));
  return segments.map((s) => (s.toLowerCase() === 'gpt' ? 'GPT' : capitalize(s))).join('-');
};

export const openaiCompletionsProviderOptions: LLMProviderOptions = {
  components: {
    ProviderSettingsForm,
    ModelSettingsForm,
  },
  formatModelLabel,
};
