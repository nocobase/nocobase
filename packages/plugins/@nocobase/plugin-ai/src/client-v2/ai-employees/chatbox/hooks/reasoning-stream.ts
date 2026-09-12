/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Message } from '../../types';

export const applyReasoningStreamUpdate = (
  content: Message['content'],
  reasoningContent: string,
  reasoningStatus?: string,
): Message['content'] => {
  if (!reasoningContent && !reasoningStatus) {
    return content;
  }
  return {
    ...content,
    reasoning: {
      status: reasoningStatus ?? content.reasoning?.status,
      content: `${content.reasoning?.content ?? ''}${reasoningContent}`,
    },
  };
};
