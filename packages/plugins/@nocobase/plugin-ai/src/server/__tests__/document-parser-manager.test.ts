/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Document } from '@langchain/core/documents';
import { createMockPlugin, createTextStream } from './helpers/document-parser-mocks';

const loadMock = vi.fn();

vi.mock('../document-parser/document-loader', () => {
  return {
    DocumentLoader: class {
      resolveExtname(file: any) {
        return (file.extname || '').toLowerCase();
      }
      async load(file: any) {
        return loadMock(file);
      }
    },
  };
});

import { DocumentParserManager } from '../manager/document-parser-manager';

describe('DocumentParserManager', () => {
  beforeEach(() => {
    loadMock.mockReset();
  });

  it('returns unsupported result for non-supported extname', async () => {
    const { plugin } = createMockPlugin();
    const manager = new DocumentParserManager(plugin as any);

    const result = await manager.load({ id: 1, filename: 'archive.zip', extname: '.zip', meta: {} } as any);

    expect(result.supported).toBe(false);
    expect(result.documents).toEqual([]);
    expect(loadMock).not.toHaveBeenCalled();
  });

  it('parses document and stores cache meta on first load', async () => {
    loadMock.mockResolvedValue([
      new Document({ pageContent: 'first page' }),
      new Document({ pageContent: 'second page' }),
    ]);
    const update = vi.fn().mockResolvedValue({});
    const createFileRecord = vi.fn().mockResolvedValue({ id: 100, filename: 'source.1.parsed.txt' });
    const { plugin } = createMockPlugin({ update, createFileRecord });

    const manager = new DocumentParserManager(plugin as any);
    const result = await manager.load({
      id: 1,
      title: 'source',
      filename: 'source.pdf',
      extname: '.pdf',
      storageId: 1,
      meta: {},
    } as any);

    expect(result.supported).toBe(true);
    expect(result.fromCache).toBe(false);
    expect(result.text).toContain('first page');
    expect(createFileRecord).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    const updateArgs = update.mock.calls[0][0];
    expect(updateArgs.values.meta.documentParse.status).toBe('ready');
    expect(updateArgs.values.meta.documentParse.parsedFileId).toBe(100);
  });

  it('loads parsed text from cache without reparsing', async () => {
    loadMock.mockResolvedValue([new Document({ pageContent: 'should not be used' })]);
    const update = vi.fn().mockResolvedValue({});
    const findById = vi.fn().mockImplementation(async (id) => {
      if (id === 8) {
        return { id: 8, filename: 'source.parsed.txt', extname: '.txt', mimetype: 'text/plain', storageId: 1 };
      }
      return null;
    });

    const { plugin } = createMockPlugin({
      findById,
      update,
      getFileStream: async () => ({ stream: createTextStream('cached parsed text'), contentType: 'text/plain' }),
    });

    const manager = new DocumentParserManager(plugin as any);
    const result = await manager.load({
      id: 1,
      filename: 'source.pdf',
      extname: '.pdf',
      storageId: 1,
      meta: {
        documentParse: {
          status: 'ready',
          parserVersion: 'v1',
          parsedFileId: 8,
          updatedAt: new Date().toISOString(),
        },
      },
    } as any);

    expect(result.supported).toBe(true);
    expect(result.fromCache).toBe(true);
    expect(result.text).toBe('cached parsed text');
    expect(loadMock).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('marks parse meta as failed when loader throws', async () => {
    loadMock.mockRejectedValue(new Error('parse failed'));
    const update = vi.fn().mockResolvedValue({});
    const { plugin } = createMockPlugin({ update });

    const manager = new DocumentParserManager(plugin as any);

    await expect(
      manager.load({ id: 1, title: 'source', filename: 'source.pdf', extname: '.pdf', storageId: 1, meta: {} } as any),
    ).rejects.toThrow('parse failed');

    const updateArgs = update.mock.calls[0][0];
    expect(updateArgs.values.meta.documentParse.status).toBe('failed');
    expect(updateArgs.values.meta.documentParse.error).toContain('parse failed');
  });
});
