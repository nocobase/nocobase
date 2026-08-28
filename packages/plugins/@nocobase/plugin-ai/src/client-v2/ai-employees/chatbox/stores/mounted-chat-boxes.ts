/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ClearOptions, ContextItem, TriggerTaskOptions } from '../../types';
import type { ChatBoxRuntime } from './runtime';

export type MountedChatBoxEntry = {
  uid: string;
  runtime: ChatBoxRuntime;
  triggerTask: (options: TriggerTaskOptions) => Promise<void>;
  clear: (options?: ClearOptions, sessionId?: string | undefined) => void;
  syncContextItems: (items: ContextItem[]) => void;
};

const mountedChatBoxes = new Map<string, MountedChatBoxEntry>();

export const registerMountedChatBox = (entry: MountedChatBoxEntry) => {
  mountedChatBoxes.set(entry.uid, entry);

  return () => {
    if (mountedChatBoxes.get(entry.uid) === entry) {
      mountedChatBoxes.delete(entry.uid);
    }
  };
};

export const getMountedChatBox = (uid: string) => mountedChatBoxes.get(uid);

export const clearMountedChatBoxes = () => {
  mountedChatBoxes.clear();
};
