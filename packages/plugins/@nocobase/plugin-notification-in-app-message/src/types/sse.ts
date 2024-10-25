/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type SSEData = {
  type: 'message:created';
  data: {
    id: string;
    title: string;
    content: string;
    userId: string;
    receiveTimestamp: number;
    channelName: string;
    status: 'read' | 'unread';
  };
};
