// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { agentsQueryClient } from '../../client/query.js';
import { chatKeys } from '../../client/chat/keys.js';
import type { ConversationDetail } from '../../shared/conversations.js';
import { sdkController } from './sdk-controller.js';
import { uiMessage } from './sdk-chat.js';

const fixtures: ReturnType<typeof sdkController>[] = [];
const stops: (() => void)[] = [];
afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  fixtures.splice(0).forEach((f) => f.controller.dispose());
  agentsQueryClient().clear();
});

it('reads a failure notice announced while a resume finds nothing to replay', async () => {
  const f = sdkController();
  fixtures.push(f);
  const history = [uiMessage(1), uiMessage(2, 'system'), uiMessage(3)];
  f.state.messages = history;
  f.state.detail = {
    id: 'c1',
    lastSeq: 3,
    execution: { status: 'running' },
    run: { id: 'run-1' },
  } as ConversationDetail;
  agentsQueryClient().setQueryData(chatKeys.conversation('c1'), f.state.detail);
  stops.push(f.controller.watch('c1'));
  await f.controller.loadHistory('c1');
  // The run fails while it is still being prepared: its stream has nothing to replay (204).
  const replay = Promise.withResolvers<void>();
  f.setResponse(async () => {
    await replay.promise;
    return new Response(null, { status: 204 });
  });
  f.controller.receive('c1', f.state.detail);
  await vi.waitFor(() => expect(f.stream).toHaveBeenCalledOnce());
  // Meanwhile the failure notice is saved and announced; its page is still on the way when the 204 arrives.
  const notice = uiMessage(4, 'system', 'The run could not be prepared.');
  f.state.messages = [...history, notice];
  const page = Promise.withResolvers<void>();
  const messages = f.api.messages.bind(f.api);
  vi.spyOn(f.api, 'messages').mockImplementationOnce(async (id, query) => {
    const result = await messages(id, query);
    await page.promise;
    return result;
  });
  const catchUp = f.controller.messagesChanged('c1', 4);
  replay.resolve();
  await vi.waitFor(() => expect(f.controller.chat('c1').status).toBe('ready'));
  page.resolve();
  // The conversation read that follows the end joins the same catch-up.
  await f.controller.messagesChanged('c1', 4);
  await catchUp;
  expect(f.controller.history('c1').loadedThrough).toBe(4);
  expect(f.controller.chat('c1').messages.map((message) => message.id)).toEqual(
    ['m1', 'm2', 'm3', 'm4'],
  );
});
