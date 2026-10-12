import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { AgentComposer } from '../../client/components/agent-composer.js';
import { ComposerSession } from '../../client/components/composer-session.js';
import type { MessageAttachment } from '@nocobase/app-plugin-agents/shared/conversations';
afterEach(cleanup);
describe('persistent composer editor', () => {
  it('cleans the originating upload table when send acceptance arrives after switching sessions', async () => {
    const a = new ComposerSession();
    const b = new ComposerSession();
    let finishUpload!: (file: MessageAttachment) => void;
    let acceptSend!: (ok: boolean) => void;
    const send = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          acceptSend = resolve;
        }),
    );
    const upload = vi.fn(
      () =>
        new Promise<MessageAttachment>((resolve) => {
          finishUpload = resolve;
        }),
    );
    const attachments = { upload };
    const view = render(
      <AgentComposer session={a} onSend={send} attachments={attachments} />,
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'A question' },
    });
    fireEvent.change(screen.getByTestId('chat-attach-input'), {
      target: { files: [new File(['a'], 'a.txt')] },
    });
    await act(async () =>
      finishUpload({
        id: 'a',
        filename: 'a.txt',
        mimeType: 'text/plain',
        size: 1,
      } as MessageAttachment),
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    view.rerender(
      <AgentComposer session={b} onSend={send} attachments={attachments} />,
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'B draft' },
    });
    fireEvent.change(screen.getByTestId('chat-attach-input'), {
      target: { files: [new File(['b'], 'b.txt')] },
    });
    await act(async () => acceptSend(true));
    expect(a.read('uploads', new Map()).size).toBe(0);
    expect(b.read('uploads', new Map()).size).toBe(1);
    expect(screen.getByRole('textbox')).toHaveValue('B draft');
    expect(screen.getByText('b.txt')).toBeVisible();
    expect(send).toHaveBeenCalledOnce();
  });
  it.each([false, true])(
    'sends once after upload and remount, including a session switch (%s)',
    async (switchSession) => {
      const a = new ComposerSession();
      const b = new ComposerSession();
      const send = vi.fn(() => true);
      let finish!: (file: MessageAttachment) => void;
      const attachments = {
        upload: vi.fn(
          () =>
            new Promise<MessageAttachment>((resolve) => {
              finish = resolve;
            }),
        ),
      };
      const first = render(
        <AgentComposer
          session={switchSession ? a : b}
          onSend={send}
          attachments={attachments}
        />,
      );
      first.rerender(
        <AgentComposer session={b} onSend={send} attachments={attachments} />,
      );
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'B question' },
      });
      fireEvent.change(screen.getByTestId('chat-attach-input'), {
        target: { files: [new File(['x'], 'note.txt')] },
      });
      first.unmount();
      render(
        <AgentComposer session={b} onSend={send} attachments={attachments} />,
      );
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      expect(send).not.toHaveBeenCalled();
      const file = {
        id: 'file',
        filename: 'note.txt',
        mimeType: 'text/plain',
        size: 1,
      } as MessageAttachment;
      await act(async () => finish(file));
      expect(attachments.upload).toHaveBeenCalledOnce();
      expect(send).toHaveBeenCalledExactlyOnceWith('B question', undefined, [
        file,
      ]);
      expect(screen.getByRole('textbox')).toHaveValue('');
    },
  );
  it('retains text, consumed external draft and IME across unmount', () => {
    const session = new ComposerSession();
    const send = vi.fn(() => true);
    const props = {
      session,
      onSend: send,
      draft: { text: 'initial', nonce: 1 },
    };
    const first = render(<AgentComposer {...props} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'edited\nline' },
    });
    fireEvent.keyDown(screen.getByRole('textbox'), {
      key: 'Enter',
      isComposing: true,
    });
    expect(send).not.toHaveBeenCalled();
    first.unmount();
    render(<AgentComposer {...props} />);
    expect(screen.getByRole('textbox')).toHaveValue('edited\nline');
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(send).toHaveBeenCalledWith('edited\nline', undefined, []);
  });
  it('uploads once offscreen, preserves previews and sends captured text without erasing new edits', async () => {
    const session = new ComposerSession();
    const send = vi.fn(() => true);
    let resolve!: (file: MessageAttachment) => void;
    const upload = vi.fn(
      () =>
        new Promise<MessageAttachment>((done) => {
          resolve = done;
        }),
    );
    const props = { session, onSend: send, attachments: { upload } };
    const first = render(<AgentComposer {...props} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'send this' },
    });
    fireEvent.change(screen.getByTestId('chat-attach-input'), {
      target: { files: [new File(['text'], 'note.txt')] },
    });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'next draft' },
    });
    first.unmount();
    resolve({
      id: 'a',
      filename: 'note.txt',
      mimeType: 'text/plain',
      size: 4,
    } as MessageAttachment);
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    render(<AgentComposer {...props} />);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox')).toHaveValue('next draft');
    expect(send.mock.calls[0]?.[0]).toBe('send this');
  });
  it('append cancels only the upload send intent and retains files', async () => {
    const session = new ComposerSession();
    const send = vi.fn(() => true);
    let resolve!: (file: MessageAttachment) => void;
    render(
      <AgentComposer
        session={session}
        onSend={send}
        attachments={{
          upload: () =>
            new Promise((done) => {
              resolve = done;
            }),
        }}
      />,
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'panel' },
    });
    fireEvent.change(screen.getByTestId('chat-attach-input'), {
      target: { files: [new File(['x'], 'note.txt')] },
    });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    session.append('top\nquestion');
    resolve({
      id: 'a',
      filename: 'note.txt',
      mimeType: 'text/plain',
      size: 1,
    } as MessageAttachment);
    await waitFor(() =>
      expect(screen.getByRole('textbox')).toHaveValue('panel\n\ntop\nquestion'),
    );
    expect(send).not.toHaveBeenCalled();
    expect(session.hasDraft()).toBe(true);
  });
});
