/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { loadByWorker } from '../document-loader';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as XLSX from 'xlsx';

describe('Document loader worker', () => {
  const tempDirs: string[] = [];

  const createTempFile = async (filename: string, content: string | Buffer) => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-document-loader-test-'));
    tempDirs.push(tempDir);
    const filePath = path.join(tempDir, filename);
    await writeFile(filePath, content);
    return filePath;
  };

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((tempDir) => rm(tempDir, { recursive: true, force: true })));
  });

  it('loads text files by path', async () => {
    const filePath = await createTempFile('source.txt', 'hello knowledge base\nsecond line\n');

    const documents = await loadByWorker('.txt', {
      filePath,
      mimeType: 'text/plain',
    });

    expect(documents).toHaveLength(1);
    expect(documents[0].pageContent).toBe('hello knowledge base\nsecond line\n');
    expect(documents[0].metadata.source).toBe(filePath);
  });

  it('loads xlsx files by path', async () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['name', 'value'],
      ['alpha', 1],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filePath = await createTempFile('source.xlsx', buffer);

    const documents = await loadByWorker('.xlsx', {
      filePath,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    expect(documents).toHaveLength(1);
    expect(documents[0].pageContent).toBe('Sheet: Sheet1\nname\tvalue\nalpha\t1');
    expect(documents[0].metadata.source).toBe(filePath);
  });
});
