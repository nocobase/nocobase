/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import SQLInstruction from './SQLInstruction';
import { SQL_INSTRUCTION_TYPE } from './constants';

type WorkflowPluginLike = {
  registerInstruction?: (type: typeof SQL_INSTRUCTION_TYPE, instruction: typeof SQLInstruction) => void;
};

export default class PluginWorkflowSQLClientV2 extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPluginLike | undefined;
    workflow?.registerInstruction?.(SQL_INSTRUCTION_TYPE, SQLInstruction);
  }
}

export { SQLInstruction };
