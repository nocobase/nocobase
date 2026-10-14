import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  AttachmentUploads,
  IssueComment,
} from '@nocobase/app-plugin-projects/client/issues';

import { CommentComposer } from '../../client/components/comment-thread.js';
import { ComposerSession } from '../../client/components/composer-session.js';
import { IssueDraftProvider } from '../../client/follow-ups/drafts.js';
import {
  useDraftField,
  useIssueDraft,
  useIssueDrafts,
} from '../../client/follow-ups/draft-state.js';

const mocks = vi.hoisted(() => ({ upload: vi.fn(), mounted: vi.fn() }));
// Keep the projects upload hook, substituting only its authorized transport/notification dependencies.
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  usePmApi: () => ({
    uploadAttachment: mocks.upload,
    removeAttachment: vi.fn(),
  }),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useToaster: () => ({ show: vi.fn() }),
  useApiClient: () => ({ request: mocks.upload }),
}));
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../../client/components/rich-text-editor.js', () => ({
  RichTextEditor: ({
    value,
    onChange,
    onSubmit,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    disabled: boolean;
  }) => (
    <textarea
      aria-label='Draft'
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) onSubmit();
      }}
    />
  ),
}));
afterEach(cleanup);

function Editor({ id }: { id: string }) {
  const draft = useIssueDraft(id);
  const [reply, setReply] = useDraftField<IssueComment | null>(
    draft,
    'replyTo',
    null,
  );
  const uploads = draft?.read<AttachmentUploads | null>('issueUploads', null);
  if (!draft || !uploads) return null;
  return (
    <>
      <button
        onClick={() =>
          setReply({ id: 'reply', authorName: 'Someone' } as IssueComment)
        }
      >
        Reply
      </button>
      <output>{reply?.id}</output>
      <CommentComposer
        session={draft}
        onAttach={uploads.add}
        attachments={
          <output>
            {uploads.uploads
              .map((upload) => `${upload.name}:${Boolean(upload.attachment)}`)
              .join(',')}
          </output>
        }
        onSubmit={async () => {
          uploads.clear();
          setReply(null);
          return 'sent';
        }}
        modes={[
          { value: 'comment', label: 'Comment' },
          { value: 'note', label: 'Note', send: 'Send note' },
        ]}
      />
    </>
  );
}
function Harness() {
  const [selected, setSelected] = useState<string | null>('A');
  const drafts = useIssueDrafts();
  return (
    <>
      <button onClick={() => setSelected('A')}>A</button>
      <button onClick={() => setSelected('B')}>B</button>
      <button onClick={() => setSelected(null)}>Leave</button>
      <output>{drafts?.hasDraft('A') ? 'Unsent A' : ''}</output>
      {selected ? <Editor key={selected} id={selected} /> : null}
    </>
  );
}

describe('session task drafts', () => {
  it('retains content, mode, reply and original in-flight upload while no issue editor is mounted', async () => {
    let finish!: (file: unknown) => void;
    mocks.upload.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <IssueDraftProvider>
        <Harness />
      </IssueDraftProvider>,
    );
    const editor = await screen.findByRole('textbox');
    fireEvent.change(editor, { target: { value: 'unsent A' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Note' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    fireEvent.change(screen.getByTestId('comment-file-input'), {
      target: { files: [new File(['abc'], 'note.txt')] },
    });
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('Unsent A')).toBeVisible();
    await act(async () =>
      finish({
        data: { id: 'attachment', filename: 'note.txt', previewable: false },
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(await screen.findByRole('textbox')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(await screen.findByRole('textbox')).toHaveValue('unsent A');
    expect(screen.getByRole('tab', { name: 'Note' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('reply')).toBeVisible();
    expect(screen.getByText('note.txt:true')).toBeVisible();
    expect(mocks.upload).toHaveBeenCalledOnce();
  });
  it('keeps a failed send draft and prevents another send after composer remount while the first is pending', async () => {
    const session = new ComposerSession();
    session.setter('content', '')('send once');
    let reject!: (error: Error) => void;
    const send = vi.fn(
      () =>
        new Promise<string>((_resolve, fail) => {
          reject = fail;
        }),
    );
    const first = render(<CommentComposer session={session} onSubmit={send} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    first.unmount();
    render(<CommentComposer session={session} onSubmit={send} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(send).toHaveBeenCalledOnce();
    await act(async () => reject(new Error('Failed')));
    expect(screen.getByRole('textbox')).toHaveValue('send once');
    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });
});
