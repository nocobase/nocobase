/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createModelSettingsForm, type OptionField } from '@nocobase/plugin-ai/client-v2';

const gigachatCompletionFields: OptionField[] = [
  {
    name: 'frequencyPenalty',
    title: 'Frequency penalty',
    description: 'Frequency penalty description',
    defaultValue: 0,
    step: 0.1,
    min: -2,
    max: 2,
  },
  {
    name: 'maxCompletionTokens',
    title: 'Max completion tokens',
    description: 'Max completion tokens description',
    defaultValue: -1,
  },
  {
    name: 'presencePenalty',
    title: 'Presence penalty',
    description: 'Presence penalty description',
    defaultValue: 0,
    step: 0.1,
    min: -2,
    max: 2,
  },
  {
    name: 'temperature',
    title: 'Temperature',
    description: 'Temperature description',
    defaultValue: 0.7,
    step: 0.1,
    min: 0,
    max: 1,
  },
  {
    name: 'topP',
    title: 'Top P',
    description: 'Top P description',
    defaultValue: 1,
    step: 0.5,
    min: 0,
    max: 1,
  },
  {
    name: 'responseFormat',
    title: 'Response format',
    description: 'Response format description',
    defaultValue: 'text',
    options: [
      {
        label: 'Text',
        value: 'text',
      },
      {
        label: 'JSON',
        value: 'json_object',
      },
    ],
  },
  {
    name: 'timeout',
    title: 'Timeout (ms)',
    defaultValue: 60000,
  },
  {
    name: 'maxRetries',
    title: 'Max retries',
    defaultValue: 1,
  },
];

export const ModelSettingsForm = createModelSettingsForm(gigachatCompletionFields);
