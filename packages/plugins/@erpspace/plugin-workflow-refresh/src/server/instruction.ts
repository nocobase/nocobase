/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginWorkflowServer, { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';
import { parseCollectionName } from '@nocobase/data-source-manager';
import { DataTypes } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { parse } from '@nocobase/utils';

export class RefreshInstruction extends Instruction {
  public plugin: PluginWorkflowServer;

  constructor(public workflow: PluginWorkflowServer) {
    super(workflow);
    this.plugin = workflow;
  }

  async run(node: FlowNodeModel, input, processor: Processor) {
    const { uri } = node.config;
    const scope = processor.getScope(node.id);
    const parsed = parse(uri)(scope) ?? {};
    // this.app.emit('ws:sendToTag', {
    //   tagKey: 'userId',
    //   tagValue: userId,
    //   message: {
    //     type: 'async-tasks:progress',
    //     payload: {
    //       taskId,
    //       progress,
    //     },
    //   },
    // });

    this.plugin.app.emit('ws:sendToCurrentApp', {
      tagKey: 'test',
      tagValue: 123,
      message: {
        type: 'refresh',
        payload: {
          uri: parsed,
        },
      },
    });

    return {
      result: true,
      status: JOB_STATUS.RESOLVED,
    };
  }
}
