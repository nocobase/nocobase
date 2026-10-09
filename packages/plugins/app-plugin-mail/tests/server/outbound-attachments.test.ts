import { describe, expect, it, vi } from 'vitest';

import { DriveMailOutboundAttachmentStorage } from '../../server/outbound-attachments.js';
import type { MailStore } from '../../server/types.js';

describe('outbound attachment cleanup', () => {
  it('retains metadata when deleting the stored object fails', async () => {
    const attachment = {
      id: 'attachment-1',
      userId: 'user-1',
      disk: 'local',
      key: 'mail/outbound/attachment-1',
      fileName: 'report.pdf',
      contentType: 'application/pdf',
      size: 42,
      createdAt: '2026-09-01T00:00:00.000Z',
      expiresAt: '2026-09-02T00:00:00.000Z',
    };
    const deleteOutboundAttachment = vi.fn(async () => true);
    const store = {
      listExpiredOutboundAttachments: async () => [attachment],
      deleteOutboundAttachment,
    } as unknown as MailStore;
    const storage = new DriveMailOutboundAttachmentStorage(
      store,
      {
        // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- DriveManager's public API names this method `use`.
        use: () => ({
          putStream: vi.fn(),
          getStream: vi.fn(),
          delete: vi.fn(async () => {
            throw new Error('Storage unavailable');
          }),
        }),
      },
      'local',
    );

    await expect(
      storage.cleanupExpired('2026-09-03T00:00:00.000Z'),
    ).resolves.toBe(0);
    expect(deleteOutboundAttachment).not.toHaveBeenCalled();
  });

  it('continues past a full page of objects that fail deletion', async () => {
    const expiredAt = '2026-09-02T00:00:00.000Z';
    const failed = Array.from({ length: 100 }, (_, index) => ({
      id: `failed-${String(index).padStart(3, '0')}`,
      userId: 'user-1',
      disk: 'local',
      key: `mail/outbound/failed-${index}`,
      fileName: 'failed.txt',
      contentType: 'text/plain',
      size: 1,
      createdAt: '2026-09-01T00:00:00.000Z',
      expiresAt: expiredAt,
    }));
    const later = {
      ...failed[0],
      id: 'later-attachment',
      key: 'mail/outbound/later-attachment',
      expiresAt: '2026-09-02T00:00:01.000Z',
    };
    const listExpiredOutboundAttachments = vi
      .fn()
      .mockResolvedValueOnce(failed)
      .mockResolvedValueOnce([later]);
    const deleteOutboundAttachment = vi.fn(async () => true);
    const storage = new DriveMailOutboundAttachmentStorage(
      {
        listExpiredOutboundAttachments,
        deleteOutboundAttachment,
      } as unknown as MailStore,
      {
        // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- DriveManager's public API names this method `use`.
        use: () => ({
          putStream: vi.fn(),
          getStream: vi.fn(),
          delete: vi.fn(async (key: string) => {
            if (key !== later.key) throw new Error('Storage unavailable');
          }),
        }),
      },
      'local',
    );

    await expect(
      storage.cleanupExpired('2026-09-03T00:00:00.000Z'),
    ).resolves.toBe(1);
    expect(listExpiredOutboundAttachments).toHaveBeenNthCalledWith(
      2,
      '2026-09-03T00:00:00.000Z',
      100,
      { expiresAt: expiredAt, id: 'failed-099' },
    );
    expect(deleteOutboundAttachment).toHaveBeenCalledWith('later-attachment');
  });
});
