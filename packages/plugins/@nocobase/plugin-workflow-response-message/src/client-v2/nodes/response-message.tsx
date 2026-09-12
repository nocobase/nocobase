/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Instruction, type NodeAvailableContext } from '@nocobase/plugin-workflow/client-v2';

import { isResponseMessageInstructionAvailable } from '../availability';
import { RESPONSE_MESSAGE_INSTRUCTION_GROUP, RESPONSE_MESSAGE_INSTRUCTION_TYPE } from '../constants';
import { tExpr } from '../locale';

export default class ResponseMessageInstruction extends Instruction {
  title = tExpr('Response message');
  type = RESPONSE_MESSAGE_INSTRUCTION_TYPE;
  group = RESPONSE_MESSAGE_INSTRUCTION_GROUP;
  description = tExpr('Add response message, will be send to client when process of request ends.');
  icon = (<InfoCircleOutlined />);
  FieldsetLoader = () =>
    import('./components/response-message').then((module) => ({ default: module.ResponseMessageFieldset }));

  isAvailable({ workflow }: NodeAvailableContext) {
    return isResponseMessageInstructionAvailable(workflow);
  }
}
