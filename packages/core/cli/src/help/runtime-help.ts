/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Help, type Interfaces } from '@oclif/core';

export function isTopicIndexCommand(commandId: string, topics: Array<Pick<Interfaces.Topic, 'name'>>) {
  if (!commandId) {
    return false;
  }

  return topics.some((topic) => topic.name.startsWith(`${commandId}:`));
}

export default class RuntimeHelp extends Help {
  protected get sortedCommands() {
    return super.sortedCommands.filter((command) => !isTopicIndexCommand(command.id, this.config.topics));
  }

  protected get sortedTopics() {
    return super.sortedTopics.filter((topic) => !topic.hidden);
  }
}
