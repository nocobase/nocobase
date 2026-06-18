/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Markdown as V2Markdown } from '../../../../client-v2/ai-employees/chatbox/components/Markdown';
import type { Message } from '../../types';

export const Markdown: React.FC<{
  message: Message['content'];
}> = React.memo(({ message }) => {
  const content = typeof message?.content === 'string' ? message.content : '';
  return <V2Markdown message={message}>{content}</V2Markdown>;
});
