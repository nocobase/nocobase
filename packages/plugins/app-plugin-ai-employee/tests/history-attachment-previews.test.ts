import { describe, expect, it, vi } from 'vitest';

import { withAIFilePreviews } from '../server/service/file-service.js';
import { createTestAIEmployeeFixture } from './app/test-context.js';

const stored = {
  id: '388427199545344',
  filename: '客户截图.png',
  mimetype: 'image/png',
  url: null,
  preview: null,
  source: { collectionName: 'aiFiles' },
};

describe('history attachment previews', () => {
  it('gives a stored aiFiles attachment the preview address its upload returned', () => {
    const page = withAIFilePreviews(
      {
        rows: [
          { key: '1', content: { attachments: [stored] } },
          {
            key: '2',
            content: {
              subAgentConversations: [
                { messages: [{ content: { attachments: [stored] } }] },
              ],
            },
          },
        ],
      },
      '/api/aiEmployee',
    );
    const preview = '/api/aiEmployee/files/388427199545344/preview';

    expect(page.rows[0]).toMatchObject({
      content: { attachments: [{ ...stored, preview, url: preview }] },
    });
    expect(page.rows[1]).toMatchObject({
      content: {
        subAgentConversations: [
          {
            messages: [
              { content: { attachments: [{ preview, url: preview }] } },
            ],
          },
        ],
      },
    });
  });

  it('keeps an address the attachment already has, and leaves other sources alone', () => {
    const page = withAIFilePreviews(
      {
        rows: [
          {
            content: {
              attachments: [
                { ...stored, url: 'https://cdn.example.test/a.png' },
                {
                  id: 7,
                  filename: 'b.png',
                  source: { collectionName: 'attachments' },
                },
                'not a record',
              ],
            },
          },
        ],
      },
      '/api/aiEmployee',
    );

    expect(page.rows[0]).toMatchObject({
      content: {
        attachments: [
          {
            url: 'https://cdn.example.test/a.png',
            preview: '/api/aiEmployee/files/388427199545344/preview',
          },
          {
            id: 7,
            filename: 'b.png',
            source: { collectionName: 'attachments' },
          },
          'not a record',
        ],
      },
    });
  });

  it('is applied to the conversation history and the conversation center', async () => {
    const { services, managers } = await createTestAIEmployeeFixture();
    const page = { rows: [{ key: '1', content: { attachments: [stored] } }] };
    vi.spyOn(managers.aiConversationsManager, 'getMessages').mockResolvedValue(
      page as never,
    );
    vi.spyOn(
      managers.aiConversationsManager,
      'getAllMessages',
    ).mockResolvedValue(page as never);
    const preview = '/api/aiEmployee/files/388427199545344/preview';

    const own = await services.conversationService.getMessages({
      actorId: 'uploader',
      options: { sessionId: 's' },
    });
    const all = await services.conversationService.getAllMessages({
      actor: { id: 'admin', canReadAllConversations: true },
      sessionId: '00000000-0000-4000-8000-000000000000',
    });

    for (const result of [own, all]) {
      expect(result.rows[0]).toMatchObject({
        content: { attachments: [{ preview, url: preview }] },
      });
    }
  });

  it('replaces the address releases before /api/aiEmployee stored, which no longer resolves', () => {
    const legacy = '/api/ai/aiFiles:preview?id=388427199545344';
    const current = '/api/aiEmployee/files/388427199545344/preview';
    const page = withAIFilePreviews(
      {
        rows: [
          {
            content: {
              attachments: [
                { ...stored, url: legacy, preview: legacy },
                {
                  ...stored,
                  url: 'https://cdn.example.test/a.png',
                  preview: `/main${legacy}`,
                },
              ],
            },
          },
        ],
      },
      '/api/aiEmployee',
    );

    expect(page.rows[0]).toMatchObject({
      content: {
        attachments: [
          { url: current, preview: current },
          { url: 'https://cdn.example.test/a.png', preview: current },
        ],
      },
    });
  });
});
