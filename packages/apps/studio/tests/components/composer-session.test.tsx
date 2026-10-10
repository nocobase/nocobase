import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
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
