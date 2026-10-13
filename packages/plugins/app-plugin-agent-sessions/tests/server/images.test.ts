import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { createImageStorage, IMAGES } from '../../server/images.js';
import { AgentSessionsService } from '../../server/service.js';
import { test } from '../helpers/database.js';
import { fakeFiles } from '../helpers/files.js';

const PNG = Buffer.from('a tiny png').toString('base64');
const message = [
  { type: 'text' as const, text: 'look' },
  { type: 'image' as const, mimeType: 'image/png', data: PNG },
];

describe('createImageStorage', () => {
  it('keeps a message as sent when the application stores no files', async () => {
    const storage = createImageStorage({
      uploader: () => null,
      disks: () => null,
      disk: () => 'local',
    });
    await expect(
      storage.keep({ id: 's1', userId: 'u1' }, message),
    ).resolves.toEqual(message);
  });

  it('stores each image for the session through the file plugin, and names it by its row', async () => {
    const { storage, uploads, objects } = fakeFiles();
    const kept = await storage.keep({ id: 's1', userId: 'u1' }, message);
    expect(kept).toEqual([
      message[0],
      { type: 'image', mimeType: 'image/png', file: expect.any(String) },
    ]);
    expect(uploads).toMatchObject([
      { collection: IMAGES, defaults: { sessionId: 's1', userId: 'u1' } },
    ]);
    expect(uploads[0]!.file.name).toMatch(/^image-[0-9a-f-]{36}\.png$/u);
    expect(uploads[0]!.file.type).toBe('image/png');
    expect(Buffer.from([...objects.values()][0]!).toString()).toBe(
      'a tiny png',
    );
  });
});

describe('a session’s images', () => {
  test('are kept apart from the transcript and served to its owner only', async ({
    database,
  }) => {
    const { storage } = fakeFiles(database);
    const service = new AgentSessionsService({ database, images: storage });
    const { computerId } = await service.register('u1', {
      protocol: 1,
      computerId: null,
      bridgeStartedAt: 'bridge-1',
      computer: {
        name: 'Laptop',
        platform: 'darwin',
        arch: 'arm64',
        host: 'nb-studio 1.0.0',
        home: '/home/zhou',
        roots: ['/home/zhou'],
        agents: [{ id: 'codex', name: 'Codex', version: '2.2.2' }],
      },
    });
    const session = await service.createSession(
      { userId: 'u1' },
      { computerId, agentId: 'codex', cwd: '/home/zhou', content: message },
    );

    const [prompt] = await service.listEvents('u1', session.id, {
      after: 0,
      limit: 1,
    });
    expect(prompt).toMatchObject({
      kind: 'prompt',
      content: [
        { type: 'text', text: 'look' },
        { type: 'image', mimeType: 'image/png', file: expect.any(String) },
      ],
    });
    const content = (prompt as { content: { file?: string; data?: string }[] })
      .content;
    expect(content[1]!.data).toBeUndefined();
    const file = content[1]!.file!;

    // The agent still gets the image itself.
    const { commands } = await service.poll(
      'u1',
      { computerId, wait: false },
      new AbortController().signal,
    );
    expect(commands).toMatchObject([
      { type: 'prompt', content: [{ type: 'text' }, { data: PNG }] },
    ]);

    const image = await service.image('u1', session.id, file);
    expect(image.mimeType).toBe('image/png');
    expect(Buffer.from(image.bytes).toString()).toBe('a tiny png');
    await expect(service.image('u2', session.id, file)).rejects.toMatchObject({
      key: 'sessionNotFound',
    });
    await expect(
      service.image('u1', session.id, randomUUID()),
    ).rejects.toMatchObject({ key: 'imageNotFound' });
    await expect(
      service.image('u1', session.id, '../../etc/passwd'),
    ).rejects.toMatchObject({ key: 'imageNotFound' });
  });
});
