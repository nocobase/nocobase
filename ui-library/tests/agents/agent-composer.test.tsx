import type { ChatContextChip } from '@nocobase/app-plugin-agents/client/chat';
import type { MessageAttachment } from '@nocobase/app-plugin-agents/shared/conversations';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AgentComposer,
  type AgentComposerAttachments,
} from '../../registry/agents/agent-composer';

// The component reads only the plugin's pure helpers; the preview's stand-in provides them without a server.
vi.mock(
  '@nocobase/app-plugin-agents/client/chat',
  () => import('../../website/demo/agents/agents-chat-client'),
);

const CHIPS: readonly ChatContextChip[] = [
  {
    key: 'issue:pm-12',
    kind: 'item',
    item: { kind: 'issue', id: 'pm-12', label: 'PM-12 Welcome tour' },
    pinned: false,
  },
  {
    key: 'filter',
    kind: 'filter',
    filter: { page: 'issues', params: { status: 'open' }, label: 'Open' },
  },
];

const box = (): HTMLTextAreaElement =>
  screen.getByRole('textbox', { name: 'Message to the agent' });

describe('AgentComposer', () => {
  it('sends on Enter with the context, keeps Shift+Enter for a new line, and empties once taken', () => {
    const onSend = vi.fn(() => true);
    const build = vi.fn(() => ({ route: '/issues', items: [] }));
    render(
      <AgentComposer
        onSend={onSend}
        context={{ chips: CHIPS, onRemove: () => undefined, build }}
      />,
    );
    fireEvent.change(box(), { target: { value: 'Summarize this' } });
    fireEvent.keyDown(box(), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith(
      'Summarize this',
      { route: '/issues', items: [] },
      [],
    );
    expect(box()).toHaveValue('');
  });

  it('shows the context as chips, each with its own remove button', () => {
    const onRemove = vi.fn();
    render(
      <AgentComposer
        onSend={() => true}
        context={{ chips: CHIPS, onRemove, build: () => undefined }}
      />,
    );
    const chips = screen.getByRole('list', {
      name: 'Context the next message carries',
    });
    expect(chips).toHaveTextContent('PM-12 Welcome tour');
    expect(chips).toHaveTextContent('Filter: Open');
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove context: Filter: Open' }),
    );
    expect(onRemove).toHaveBeenCalledWith('filter');
  });

  it('has an icon-only send button with an accessible name, and Stop while the agent works on an empty box', () => {
    const onStop = vi.fn();
    const { rerender } = render(
      <AgentComposer onSend={() => true} onStop={onStop} />,
    );
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();
    expect(send).not.toHaveTextContent('Send');
    rerender(<AgentComposer running onSend={() => true} onStop={onStop} />);
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onStop).toHaveBeenCalled();
    fireEvent.change(box(), { target: { value: 'One more thing' } });
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('keeps the text until a promised send is taken, and never sends while disabled', async () => {
    let resolve: (taken: boolean) => void = () => undefined;
    const onSend = vi.fn(
      () =>
        new Promise<boolean>((done) => {
          resolve = done;
        }),
    );
    const { rerender } = render(
      <AgentComposer variant='page' disabled onSend={onSend} />,
    );
    fireEvent.change(box(), { target: { value: 'Plan the release' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
    rerender(<AgentComposer variant='page' onSend={onSend} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(box()).toHaveValue('Plan the release');
    await act(async () => resolve(true));
    expect(box()).toHaveValue('');
  });

  it('fills a draft once and takes the focus, and registers a focus function', () => {
    const register = vi.fn(() => () => undefined);
    const { rerender } = render(
      <AgentComposer
        onSend={() => true}
        draft={{ nonce: 1, text: 'Summarize PM-12' }}
        registerFocus={register}
      />,
    );
    expect(box()).toHaveValue('Summarize PM-12');
    expect(box()).toHaveFocus();
    expect(register).toHaveBeenCalledOnce();
    fireEvent.change(box(), { target: { value: 'My own words' } });
    rerender(
      <AgentComposer
        onSend={() => true}
        draft={{ nonce: 2, text: 'Another draft' }}
        registerFocus={register}
      />,
    );
    expect(box()).toHaveValue('My own words');
  });

  it('says when a message is too long, in the given words', () => {
    render(
      <AgentComposer
        onSend={() => true}
        maxLength={5}
        labels={{ tooLong: 'No more than {max}.', send: 'Go' }}
      />,
    );
    fireEvent.change(box(), { target: { value: 'Too long' } });
    expect(screen.getByText('No more than 5.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
  });

  describe('attachments', () => {
    function uploaded(file: File): MessageAttachment {
      return {
        id: `id-${file.name}`,
        filename: file.name,
        ext: file.name.split('.').pop() ?? '',
        mimeType: file.type,
        size: file.size,
        contentUrl: `/files/${file.name}`,
        downloadUrl: `/files/${file.name}?download=true`,
        previewable: file.type.startsWith('image/'),
      };
    }

    /** Uploads that wait for the test to settle them, by file name. */
    function pendingUploads(): AgentComposerAttachments & {
      readonly settle: (name: string, ok?: boolean) => Promise<void>;
      readonly discarded: string[];
    } {
      const waiting = new Map<
        string,
        {
          file: File;
          resolve: (value: MessageAttachment) => void;
          reject: (error: Error) => void;
        }
      >();
      const discarded: string[] = [];
      return {
        maxSize: 10,
        maxCount: 3,
        upload: (file) =>
          new Promise((resolve, reject) => {
            waiting.set(file.name, { file, resolve, reject });
          }),
        discard: (attachment) => discarded.push(attachment.id),
        discarded,
        settle: async (name, ok = true) => {
          const entry = waiting.get(name);
          if (!entry) throw new Error(`No upload of ${name}.`);
          await act(async () => {
            if (ok) entry.resolve(uploaded(entry.file));
            else entry.reject(new Error('failed'));
          });
        },
      };
    }

    const files = () => screen.getByTestId('chat-composer-files');
    const pick = (...picked: File[]) =>
      fireEvent.change(screen.getByTestId('chat-attach-input'), {
        target: { files: picked },
      });

    it('uploads picked files, sends them with the message once they are up, and empties', async () => {
      const uploads = pendingUploads();
      const onSend = vi.fn(() => true);
      render(<AgentComposer onSend={onSend} attachments={uploads} />);
      expect(
        screen.getByRole('button', { name: 'Attach files' }),
      ).toBeVisible();
      pick(new File(['log'], 'build.log', { type: 'text/plain' }));
      expect(within(files()).getByText('build.log')).toBeVisible();
      expect(within(files()).getByText('Uploading…')).toBeVisible();
      // Files alone may be sent; it waits for them.
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      expect(onSend).not.toHaveBeenCalled();
      expect(
        screen.getByText('Sending once the files are uploaded…'),
      ).toBeVisible();
      await uploads.settle('build.log');
      await waitFor(() =>
        expect(onSend).toHaveBeenCalledWith('', undefined, [
          expect.objectContaining({ id: 'id-build.log' }),
        ]),
      );
      expect(screen.queryByTestId('chat-composer-files')).toBeNull();
      expect(uploads.discarded).toEqual([]);
    });

    it('takes a pasted screenshot and files dropped on the box, and discards one removed', async () => {
      const uploads = pendingUploads();
      render(<AgentComposer onSend={() => true} attachments={uploads} />);
      const shot = new File(['png'], 'shot.png', { type: 'image/png' });
      const pasted = fireEvent.paste(box(), {
        clipboardData: { files: [shot], getData: () => '' },
      });
      // A picture alone is not pasted into the text.
      expect(pasted).toBe(false);
      fireEvent.drop(screen.getByTestId('chat-composer'), {
        dataTransfer: {
          files: [new File(['a'], 'a.txt', { type: 'text/plain' })],
          types: ['Files'],
        },
      });
      expect(within(files()).getAllByRole('listitem')).toHaveLength(2);
      await uploads.settle('shot.png');
      fireEvent.click(screen.getByRole('button', { name: 'Remove shot.png' }));
      expect(uploads.discarded).toEqual(['id-shot.png']);
      expect(within(files()).getAllByRole('listitem')).toHaveLength(1);
    });

    it('marks a file too large or that failed, and keeps the message from being sent until it is removed', async () => {
      const uploads = pendingUploads();
      const onSend = vi.fn(() => true);
      render(<AgentComposer onSend={onSend} attachments={uploads} />);
      fireEvent.change(box(), { target: { value: 'See these' } });
      pick(
        new File(['x'.repeat(11)], 'big.bin', {
          type: 'application/octet-stream',
        }),
        new File(['b'], 'b.txt', { type: 'text/plain' }),
      );
      expect(within(files()).getByText('Larger than 10 B')).toBeVisible();
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Remove the files that could not be uploaded to send.',
      );
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
      await uploads.settle('b.txt', false);
      expect(within(files()).getByText('Could not upload')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Remove big.bin' }));
      fireEvent.click(screen.getByRole('button', { name: 'Remove b.txt' }));
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      expect(onSend).toHaveBeenCalledWith('See these', undefined, []);
    });

    it('takes at most the files a message may carry', () => {
      render(
        <AgentComposer onSend={() => true} attachments={pendingUploads()} />,
      );
      pick(
        ...['1', '2', '3', '4'].map(
          (name) => new File([name], `${name}.txt`, { type: 'text/plain' }),
        ),
      );
      expect(within(files()).getAllByRole('listitem')).toHaveLength(3);
      expect(screen.getByRole('alert')).toHaveTextContent(
        'At most 3 files per message.',
      );
      expect(
        screen.getByRole('button', { name: 'Attach files' }),
      ).toBeDisabled();
    });

    it('has no attach button without attachments', () => {
      render(<AgentComposer onSend={() => true} />);
      expect(screen.queryByRole('button', { name: 'Attach files' })).toBeNull();
    });
  });
});
