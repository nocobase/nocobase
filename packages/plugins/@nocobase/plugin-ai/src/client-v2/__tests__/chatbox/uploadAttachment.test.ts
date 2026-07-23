/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { normalizeAIFileUploadAttachment } from '../../ai-employees/chatbox/utils';

describe('normalizeAIFileUploadAttachment', () => {
  it('promotes upload response meta source to attachment source', () => {
    const source = {
      dataSourceKey: 'main',
      collectionName: 'aiFiles',
    };
    const attachment = {
      id: 1,
      filename: 'paste.png',
      meta: {
        source,
      },
    };

    expect(normalizeAIFileUploadAttachment(attachment, 'done')).toEqual({
      ...attachment,
      source,
      status: 'done',
    });
  });

  it('keeps response data when source is missing', () => {
    const attachment = {
      id: 2,
      filename: 'paste.txt',
      meta: {},
    };

    expect(normalizeAIFileUploadAttachment(attachment, 'done')).toEqual({
      ...attachment,
      status: 'done',
    });
  });
});
