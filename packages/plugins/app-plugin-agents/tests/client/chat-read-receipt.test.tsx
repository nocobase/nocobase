// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { useEffect, useSyncExternalStore } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { sdkController } from './sdk-controller.js';
import { agentsQueryClient } from '../../client/query.js';
import { chatKeys } from '../../client/chat/keys.js';
import type { ConversationDetail } from '../../shared/conversations.js';
const disposals: (() => void)[] = [];
afterEach(() => {
  cleanup();
  disposals.splice(0).forEach((f) => f());
  agentsQueryClient().clear();
});
it('marks a new reply read when detail refresh overlaps the previous receipt', async () => {
  const f = sdkController();
  const controller = f.controller;
  disposals.push(() => controller.dispose());
  const cache = agentsQueryClient();
  const key = chatKeys.conversation('c1');
  const initial = {
    ...f.state.detail,
    execution: { status: 'idle' },
    read: false,
    lastSeq: 5,
    seenSeq: 4,
    needsYou: null,
  } as ConversationDetail;
  cache.setQueryData(key, initial);
  let releaseRead!: (d: ConversationDetail) => void;
  const gate = new Promise<ConversationDetail>((done) => {
    releaseRead = done;
  });
  const read = vi
    .spyOn(f.api, 'markRead')
    .mockImplementationOnce(() => gate)
    .mockImplementation(async () => ({
      ...f.state.detail,
      read: true,
      seenSeq: f.state.detail.lastSeq,
    }));
  let pending!: Promise<unknown>;
  const markRead = () => {
    pending = controller.markRead('c1');
  };
  const rendered: boolean[] = [];
  // Mirrors Studio ConversationView's viewed/unseen effect over the real controller cache.
  function View() {
    const conversation = useSyncExternalStore(
      (cb) => cache.getQueryCache().subscribe(cb),
      () => cache.getQueryData<ConversationDetail>(key)!,
    );
    const unseen =
      !conversation.read ||
      (conversation.needsYou != null &&
        conversation.needsYou.reason !== 'confirm' &&
        (conversation.seenSeq ?? 0) < conversation.needsYou.seq);
    rendered.push(unseen);
    useEffect(() => {
      if (unseen) markRead();
    }, [unseen]);
    return null;
  }
  render(<View />);
  await act(async () => {
    await Promise.resolve();
  });
  expect(read).toHaveBeenCalledTimes(1);
  let releaseDetail!: (d: ConversationDetail) => void;
  const detailGate = new Promise<ConversationDetail>((done) => {
    releaseDetail = done;
  });
  vi.spyOn(f.api, 'conversation').mockImplementationOnce(() => detailGate);
  const refreshing = controller.refresh('c1');
  const readFive = { ...initial, read: true, seenSeq: 5 };
  const replySix = { ...initial, read: false, seenSeq: 5, lastSeq: 6 };
  await act(async () => {
    releaseRead(readFive);
    await pending;
    releaseDetail(replySix);
    await refreshing;
    // A subsequent acknowledged detail catches up to the new reply.
    f.state.detail = replySix;
    await controller.refresh('c1');
  });
  expect(cache.getQueryData<ConversationDetail>(key)?.lastSeq).toBe(6);
  await act(async () => {
    await pending;
  });
  expect(cache.getQueryData<ConversationDetail>(key)?.seenSeq).toBe(6);
  expect(read).toHaveBeenCalledTimes(2);
  expect(rendered).toContain(false);
});

it('does not let an older receipt overwrite a newer receipt', async () => {
  const f = sdkController();
  disposals.push(() => f.controller.dispose());
  let release!: (detail: ConversationDetail) => void;
  vi.spyOn(f.api, 'markRead')
    .mockImplementationOnce(
      () =>
        new Promise((done) => {
          release = done;
        }),
    )
    .mockResolvedValueOnce({
      ...f.state.detail,
      read: true,
      lastSeq: 6,
      seenSeq: 6,
    });
  const older = f.controller.markRead('c1');
  await f.controller.markRead('c1');
  release({ ...f.state.detail, read: true, lastSeq: 5, seenSeq: 5 });
  await older;
  expect(
    agentsQueryClient().getQueryData<ConversationDetail>(
      chatKeys.conversation('c1'),
    )?.seenSeq,
  ).toBe(6);
});
