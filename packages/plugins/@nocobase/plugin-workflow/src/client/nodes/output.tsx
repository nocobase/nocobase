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
import { WorkflowVariableInput } from '../variable';

export default class extends Instruction {
  title = `{{t("Assign output variable", { ns: "${NAMESPACE}" })}}`;
  type = 'output';
  group = 'control';
  description = `{{t("Assign variables for workflow output, which could be used in other workflows as result of subflow.", { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    result: {
      type: 'object',
      title: `{{t("Value", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableInput',
      'x-component-props': {
        useTypedConstant: true,
      },
      required: true,
    },
  };
  components = {
    WorkflowVariableInput,
  };
}
