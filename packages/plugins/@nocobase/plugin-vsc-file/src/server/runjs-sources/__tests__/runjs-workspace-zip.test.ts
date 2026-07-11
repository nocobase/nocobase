/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import JSZip from 'jszip';

import { maxFileSize, maxFilesPerRepo } from '../../../shared/constants';
import { readRunJSWorkspaceZip } from '../resource';

describe('RunJS workspace ZIP limits', () => {
  it('rejects a highly compressed entry before unbounded decompression', async () => {
    const zip = new JSZip();
    zip.file('src/main.ts', 'a'.repeat(maxFileSize + 1));
    const zipBase64 = await zip.generateAsync({
      compression: 'DEFLATE',
      type: 'base64',
    });

    await expect(readRunJSWorkspaceZip(zipBase64)).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
      status: 413,
    });
  });

  it('rejects archives with too many files before reading their contents', async () => {
    const zip = new JSZip();
    for (let index = 0; index <= maxFilesPerRepo; index += 1) {
      zip.file(`src/file-${index}.ts`, '');
    }
    const zipBase64 = await zip.generateAsync({
      compression: 'DEFLATE',
      type: 'base64',
    });

    await expect(readRunJSWorkspaceZip(zipBase64)).rejects.toMatchObject({
      code: 'REPO_LIMIT_EXCEEDED',
      status: 413,
    });
  });

  it('normalizes invalid archives to the public error contract', async () => {
    await expect(readRunJSWorkspaceZip(Buffer.from('not a zip').toString('base64'))).rejects.toMatchObject({
      code: 'PATH_INVALID',
      status: 400,
    });
  });
});
