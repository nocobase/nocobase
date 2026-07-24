/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { normalizeAIFileUploadAttachment } from '../../ai-employees/chatbox/utils';
import { uploadAIFile } from '../../ai-employees/chatbox/upload';

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

describe('uploadAIFile', () => {
  it('uploads multipart data, reports progress and returns a normalized attachment', async () => {
    const source = {
      dataSourceKey: 'main',
      collectionName: 'aiFiles',
    };
    const request = vi.fn().mockImplementation(async (options) => {
      options.onUploadProgress?.({ loaded: 25, total: 100 });
      return {
        data: {
          data: {
            id: 1,
            filename: 'report.txt',
            meta: { source },
          },
        },
      };
    });
    const onProgress = vi.fn();
    const file = new File(['report'], 'report.txt', { type: 'text/plain' });

    await expect(uploadAIFile({ request }, file, { onProgress })).resolves.toEqual({
      id: 1,
      filename: 'report.txt',
      meta: { source },
      source,
      status: 'done',
    });

    expect(onProgress).toHaveBeenCalledWith(25);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'aiFiles:create',
        method: 'post',
        data: expect.any(FormData),
      }),
    );
    const requestOptions = request.mock.calls[0][0];
    expect(requestOptions.data.get('file')).toBe(file);
  });

  it('rejects an upload response without attachment data', async () => {
    const request = vi.fn().mockResolvedValue({ data: {} });

    await expect(uploadAIFile({ request }, new File([''], 'empty.txt'))).rejects.toThrow(
      'AI file upload response did not contain attachment data.',
    );
  });
});
