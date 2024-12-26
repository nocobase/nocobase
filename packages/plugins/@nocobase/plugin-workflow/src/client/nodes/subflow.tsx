/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Instruction } from '.';
import { NAMESPACE } from '../locale';
import { JOB_STATUS } from '../constants';
import { TriggerCollectionRecordSelect } from '../components/TriggerCollectionRecordSelect';
import { Fieldset } from '../components/Fieldset';

export default class extends Instruction {
  title = `{{t("Call another workflow", { ns: "${NAMESPACE}" })}}`;
  type = 'subflow';
  group = 'control';
  description = `{{t("Run another workflow and use its output as variables.", { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    workflow: {
      type: 'number',
      title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { label: `{{t("Post added", { ns: "${NAMESPACE}" })}}`, value: 1 },
        { label: `{{t("Some other action", { ns: "${NAMESPACE}" })}}`, value: 2 },
      ],
      required: true,
    },
    context: {
      type: 'object',
      title: `{{t("Context", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Fieldset',
      properties: {
        data: {
          type: 'object',
          title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
          description: `{{t("Choose a record of the collection to trigger.", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'TriggerCollectionRecordSelect',
          default: null,
          required: true,
        },
      },
      'x-reactions': [
        {
          dependencies: ['workflow'],
          fulfill: {
            state: {
              visible: '{{workflow === 1}}',
            },
          },
        },
      ],
    },
  };
  components = {
    TriggerCollectionRecordSelect,
    Fieldset,
  };
}
