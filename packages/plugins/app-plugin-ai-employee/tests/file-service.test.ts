import { Readable } from 'node:stream';

import type { FileMetadata, FileStorage } from '@nocobase/ai-employee';
import { describe, expect, it } from 'vitest';

import { DomainError } from '../server/types.js';
import type { AIFileMetadataCreateContext } from '../server/repository/file-storage/ai-file-metadata-repository.js';
import type { AIFileEntity } from '../server/repository/ai-file.js';
import { AIFileService } from '../server/service/file-service.js';

const metadata: FileMetadata<AIFileEntity> = {
  id: '42',
  disk: 'local',
  key: 'ai-files/42-hello.txt',
  filename: 'hello.txt',
  extname: '.txt',
  size: 5,
  mimeType: 'text/plain',
  entity: {
    id: '42',
    disk: 'local',
    path: 'ai-files/42-hello.txt',
    filename: 'hello.txt',
    extname: '.txt',
    size: 5,
    mimetype: 'text/plain',
    createdById: 'user-1',
  },
};

const member = { id: 'user-1', roles: ['member'], isRoot: false } as const;

function metadataOf(record: FileMetadata<AIFileEntity> | null) {
  return { create: async () => metadata, findById: async () => record };
}

describe('AIFileService', () => {
  it('returns runtime preview URLs without persisting apiBasePath', async () => {
    let input: unknown;
    const fileStorage: FileStorage<AIFileEntity, AIFileMetadataCreateContext> =
      {
        disk: 'local',
        write: async (value) => {
          input = value;
          return metadata;
        },
        open: async () => null,
        openMetadata: async () => ({
          metadata,
          stream: Readable.from(['hello']),
          contentType: 'text/plain',
        }),
        deleteObject: async () => undefined,
      };
    const service = new AIFileService({
      fileStorage: fileStorage,
      fileMetadata: metadataOf(metadata),
      snowflake: { generate: () => '42' } as never,
      apiBasePath: '/runtime/api/aiEmployee',
    });

    const result = await service.create({
      actor: member,
      file: new File(['hello'], 'hello.txt', { type: 'text/plain' }),
    });

    expect(input).toMatchObject({
      id: '42',
      objectId: '42',
      filename: 'hello.txt',
      metadataContext: { createdById: 'user-1' },
    });
    expect(result).toMatchObject({
      disk: 'local',
      path: 'ai-files/42-hello.txt',
      url: '/runtime/api/aiEmployee/files/42/preview',
      preview: '/runtime/api/aiEmployee/files/42/preview',
      data: {
        url: '/runtime/api/aiEmployee/files/42/preview',
        preview: '/runtime/api/aiEmployee/files/42/preview',
      },
    });
    expect(JSON.stringify(metadata.entity)).not.toContain('/runtime/api');
  });

  it('checks ownership and returns transport-neutral preview metadata', async () => {
    const fileStorage: FileStorage<AIFileEntity, AIFileMetadataCreateContext> =
      {
        disk: 'local',
        write: async () => metadata,
        open: async () => ({
          metadata,
          stream: Readable.from([Buffer.from('hello')]),
          contentType: 'text/plain',
        }),
        openMetadata: async () => ({
          metadata,
          stream: Readable.from([Buffer.from('hello')]),
          contentType: 'text/plain',
        }),
        deleteObject: async () => undefined,
      };
    const service = new AIFileService({
      fileStorage: fileStorage,
      fileMetadata: metadataOf(metadata),
      snowflake: { generate: () => '42' } as never,
      apiBasePath: '/api/aiEmployee',
    });

    await expect(
      service.preview({
        actor: { id: 'other', roles: [], isRoot: false },
        id: '42',
      }),
    ).rejects.toMatchObject<Partial<DomainError>>({
      code: 'FORBIDDEN',
      status: 403,
    });

    const result = await service.preview({ actor: member, id: '42' });
    expect(result.contentType).toBe('text/plain');
    expect(result.filename).toBe('hello.txt');
    await expect(new Response(result.stream).text()).resolves.toBe('hello');
  });

  it("lets only AI settings access read another user's file or one with no uploader", async () => {
    const storageFor = (entity: AIFileEntity) => {
      const opened = async () => ({
        metadata: { ...metadata, entity },
        stream: Readable.from([Buffer.from('hello')]),
        contentType: 'text/plain',
      });
      return new AIFileService({
        fileStorage: {
          disk: 'local',
          write: async () => metadata,
          open: opened,
          openMetadata: opened,
          deleteObject: async () => undefined,
        } as FileStorage<AIFileEntity, AIFileMetadataCreateContext>,
        fileMetadata: metadataOf({ ...metadata, entity }),
        snowflake: { generate: () => '42' } as never,
        apiBasePath: '/api/aiEmployee',
      });
    };
    const owned = storageFor(metadata.entity);
    const ownerless = storageFor({
      ...metadata.entity,
      createdById: undefined,
    });
    const granted = async () => true;
    const refused = async () => false;
    const forbidden = { code: 'FORBIDDEN', status: 403 };

    // A root flag on the session is not a grant.
    await expect(
      owned.preview({
        actor: { id: 'other', roles: ['root'], isRoot: true },
        id: '42',
        canReadAnyFile: refused,
      }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      owned.preview({
        actor: { id: 'other', roles: [], isRoot: false },
        id: '42',
        canReadAnyFile: granted,
      }),
    ).resolves.toMatchObject({ filename: 'hello.txt' });
    await expect(
      ownerless.preview({ actor: member, id: '42', canReadAnyFile: refused }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      ownerless.preview({ actor: member, id: '42', canReadAnyFile: granted }),
    ).resolves.toMatchObject({ filename: 'hello.txt' });
  });

  it('opens no content for a preview it refuses or cannot find', async () => {
    const opened: string[] = [];
    const serviceFor = (record: FileMetadata<AIFileEntity> | null) =>
      new AIFileService({
        fileStorage: {
          disk: 'local',
          write: async () => metadata,
          open: async (id) => {
            opened.push(String(id));
            return null;
          },
          openMetadata: async (value) => {
            opened.push(String(value.id));
            return {
              metadata: value,
              stream: Readable.from([Buffer.from('hello')]),
              contentType: 'text/plain',
            };
          },
        },
        fileMetadata: metadataOf(record),
        snowflake: { generate: () => '42' } as never,
        apiBasePath: '/api/aiEmployee',
      });

    await expect(
      serviceFor(metadata).preview({
        actor: { id: 'other', roles: [], isRoot: false },
        id: '42',
        canReadAnyFile: async () => false,
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
    // A caller who may read only their own files is refused alike for a missing id, so ids cannot be probed.
    await expect(
      serviceFor(null).preview({ actor: member, id: '42' }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
      reason: 'FILE_ACCESS_DENIED',
    });
    await expect(
      serviceFor(null).preview({
        actor: member,
        id: '42',
        canReadAnyFile: async () => false,
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
    // Only a caller who may read any file learns that it does not exist.
    await expect(
      serviceFor(null).preview({
        actor: member,
        id: '42',
        canReadAnyFile: async () => true,
      }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
      reason: 'FILE_NOT_FOUND',
    });
    expect(opened).toEqual([]);

    await serviceFor(metadata).preview({ actor: member, id: '42' });
    expect(opened).toEqual(['42']);
  });
});
