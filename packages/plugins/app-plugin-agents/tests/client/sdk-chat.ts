import { createUIMessageStreamResponse, type UIMessageChunk } from 'ai';
import type { AppUIMessage } from '../../client/chat.js';

export function sdkResponse(
  chunks: UIMessageChunk[] = [{ type: 'finish' }],
): Response {
  return createUIMessageStreamResponse({
    stream: new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
  });
}
export function uiMessage(
  seq: number,
  role: AppUIMessage['role'] = 'user',
  text = `Message ${seq}`,
  clientId?: string,
): AppUIMessage {
  return {
    id: `m${seq}`,
    role,
    metadata: {
      conversationId: 'c',
      createdAt: '2026-10-01T00:00:00.000Z',
      seq,
      revision: 1,
      ...(clientId ? { clientId } : {}),
    },
    parts: [{ type: 'text', text, state: 'done' }],
  };
}
