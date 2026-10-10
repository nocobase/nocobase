import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AttachmentPanel } from '../../client/components/attachment-list';
import { RunHeader } from '../../client/components/agent-run-history';
import {
  IssueAddBar,
  IssueAddButton,
  IssueApprovalCard,
  IssueAttachments,
  IssueChecklist,
  IssueDependencies,
  IssueFileDrop,
  IssueSection,
  IssueSubtasks,
} from '../../client/extensions/nocobase-issue-detail/issue-detail';
import { PropertyColorPicker } from '../../client/extensions/nocobase-issue-detail/issue-properties';
import { MentionMembersLoadError } from '../../client/issues/detail/mention-members-load-error';

const TODO = { name: 'Todo', color: 'gray' } as const;
const DONE = { name: 'Done', color: 'green' } as const;

/** The page's way of opening the first dependency's search: a button in the add bar sets `adding`. */
function DependenciesWithAddBar() {
  const [adding, setAdding] = useState(false);
  return (
    <>
      <IssueAddBar label='Add'>
        {adding ? null : (
          <IssueAddButton onClick={() => setAdding(true)}>
            Dependency
          </IssueAddButton>
        )}
      </IssueAddBar>
      <IssueDependencies
        blockedBy={[]}
        blocks={[]}
        related={[]}
        adding={adding}
        onAddingChange={setAdding}
        onAdd={() => Promise.resolve()}
        onSearch={() => Promise.resolve([])}
      />
    </>
  );
}

describe('IssueDependencies', () => {
  it('takes no room without any, until the add bar opens the search; Cancel or Escape backs out', async () => {
    const { container } = render(<DependenciesWithAddBar />);
    expect(container.querySelector('[data-slot="issue-section"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Dependency' }));
    const search = await screen.findByRole('combobox', {
      name: 'Add a relationship',
    });
    expect(document.activeElement).toBe(search);
    expect(screen.getByRole('region', { name: 'Dependencies' })).toBeTruthy();
    fireEvent.keyDown(search, { key: 'Escape' });
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Dependencies' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Dependency' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('removes a blocker, and offers nothing to change without onAdd', async () => {
    const onRemove = vi.fn(() => Promise.resolve());
    const blocker = {
      id: 'd2',
      issueId: 'i2',
      identifier: 'PM-2',
      title: 'Login',
      href: '/issues/i2',
      status: TODO,
    };
    const { rerender } = render(
      <IssueDependencies
        blockedBy={[blocker]}
        blocks={[]}
        related={[]}
        onAdd={() => Promise.resolve()}
        onRemove={onRemove}
        onSearch={() => Promise.resolve([])}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove PM-2' }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith(blocker));
    rerender(
      <IssueDependencies
        blockedBy={[blocker]}
        blocks={[]}
        related={[]}
        onSearch={() => Promise.resolve([])}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Remove PM-2' })).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});

describe('MentionMembersLoadError', () => {
  it('explains the failed lookup and retries on request', () => {
    const onRetry = vi.fn();
    render(
      <MentionMembersLoadError
        message='Could not load project members.'
        retryLabel='Retry'
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert').textContent).toContain(
      'Could not load project members.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('IssueSection', () => {
  it('heads its content with the name, the count and the actions', () => {
    render(
      <IssueSection
        title='Sub-issues'
        count='1/3'
        actions={<button type='button'>New sub-issue</button>}
      >
        <p>content</p>
      </IssueSection>,
    );
    const section = screen.getByRole('region', { name: 'Sub-issues' });
    expect(
      screen.getByRole('heading', { level: 2, name: 'Sub-issues' }),
    ).toBeTruthy();
    expect(section.textContent).toContain('1/3');
    expect(screen.getByRole('button', { name: 'New sub-issue' })).toBeTruthy();
    expect(section.textContent).toContain('content');
  });

  it('leaves out a part with nothing to show', () => {
    const { container } = render(
      <>
        <IssueSubtasks groups={[]} />
        <IssueAttachments
          files={[]}
          labels={ATTACHMENT_LABELS}
          onUpload={() => undefined}
        />
        <IssueAddBar label='Add'>{null}</IssueAddBar>
      </>,
    );
    expect(container.innerHTML).toBe('');
  });
});

const ATTACHMENT_LABELS = {
  title: 'Attachments',
  images: 'Images',
  files: 'Files',
  pending: 'Files to send',
  upload: 'Upload',
  preview: 'Preview {name}',
  download: 'Download {name}',
  remove: 'Remove {name}',
  uploading: 'Uploading {name}…',
  removeTitle: 'Remove this file?',
  removeDescription: '“{name}” is deleted for everyone.',
  removeConfirm: 'Remove',
  cancel: 'Cancel',
  previous: 'Previous file',
  next: 'Next file',
};

describe('IssueAttachments', () => {
  it('appears while the first file uploads, and confirms a removal', async () => {
    const onRemove = vi.fn(() => Promise.resolve());
    const { rerender } = render(
      <IssueAttachments
        files={[]}
        uploading={['spec.pdf']}
        onUpload={() => undefined}
        labels={ATTACHMENT_LABELS}
      />,
    );
    expect(screen.getByText('Uploading spec.pdf…')).toBeTruthy();
    rerender(
      <IssueAttachments
        files={[
          {
            id: 'f1',
            name: 'spec.pdf',
            size: 2048,
            url: '/f1',
            downloadUrl: '/f1?download=1',
            image: false,
            canRemove: true,
          },
        ]}
        onUpload={() => undefined}
        onRemove={onRemove}
        labels={ATTACHMENT_LABELS}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove spec.pdf' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(onRemove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'f1' }),
      ),
    );
  });
});

describe('IssueFileDrop', () => {
  it('uploads files dropped or pasted anywhere on the body', () => {
    const onFiles = vi.fn();
    render(
      <IssueFileDrop onFiles={onFiles}>
        <p>Body</p>
      </IssueFileDrop>,
    );
    const file = new File(['x'], 'shot.png', { type: 'image/png' });
    const body = screen.getByText('Body');
    fireEvent.drop(body, { dataTransfer: { files: [file], types: ['Files'] } });
    expect(onFiles).toHaveBeenLastCalledWith([file]);
    fireEvent.paste(body, { clipboardData: { files: [file] } });
    expect(onFiles).toHaveBeenCalledTimes(2);
  });
});

describe('IssueChecklist', () => {
  it('checks an item, and cannot be changed without onToggle', async () => {
    const onToggle = vi.fn(() => Promise.resolve());
    const items = [
      { key: 'tests', label: 'Tests pass', required: true, checked: false },
    ];
    const { rerender } = render(
      <IssueChecklist
        status={TODO}
        items={items}
        complete={false}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Tests pass/u }));
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith('tests', true));
    rerender(<IssueChecklist status={TODO} items={items} complete={false} />);
    expect(
      screen.getByRole('checkbox', { name: /Tests pass/u }),
    ).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('IssueApprovalCard', () => {
  it('lets an approver approve with a comment, and whoever asked withdraw', async () => {
    const onDecide = vi.fn(() => Promise.resolve());
    const card = (canDecide: boolean, canWithdraw: boolean) => (
      <IssueApprovalCard
        from={TODO}
        to={DONE}
        requester='Ada'
        requestedAt='2026-10-01T10:00:00.000Z'
        approvers={['Grace']}
        canDecide={canDecide}
        canWithdraw={canWithdraw}
        onDecide={onDecide}
      />
    );
    const { rerender } = render(card(true, false));
    fireEvent.change(screen.getByRole('textbox', { name: 'Comment' }), {
      target: { value: 'Looks right' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() =>
      expect(onDecide).toHaveBeenCalledWith('approve', 'Looks right'),
    );
    rerender(card(false, true));
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    await waitFor(() =>
      expect(onDecide).toHaveBeenCalledWith('withdraw', undefined),
    );
  });
});

describe('AttachmentPanel', () => {
  it('hands any file to the consumer’s preview and confirms a removal', async () => {
    const onPreview = vi.fn();
    const onRemove = vi.fn(() => Promise.resolve());
    render(
      <AttachmentPanel
        files={[
          {
            id: 'f1',
            name: 'spec.pdf',
            size: 2048,
            url: '/f1',
            downloadUrl: '/f1?download=1',
            image: false,
            canRemove: true,
          },
        ]}
        onPreview={onPreview}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Preview spec.pdf' }));
    expect(onPreview.mock.calls[0]?.[1]).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Remove spec.pdf' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(onRemove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'f1' }),
      ),
    );
  });
});

describe('PropertyColorPicker', () => {
  it('recolours a label from its swatches', async () => {
    const onChange = vi.fn();
    render(
      <PropertyColorPicker
        items={[{ value: 'l1', name: 'auth', color: 'blue' }]}
        palette={[
          { value: 'blue', label: 'Blue', className: 'bg-blue-500' },
          { value: 'red', label: 'Red', className: 'bg-red-500' },
        ]}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Change label colors' }),
    );
    fireEvent.click(await screen.findByRole('radio', { name: 'Red' }));
    expect(onChange).toHaveBeenCalledWith('l1', 'red');
  });
});

describe('RunHeader', () => {
  it('says what started the run', () => {
    render(
      <RunHeader
        run={{
          id: 'r1',
          agentId: 'a1',
          agentName: 'Coder',
          status: 'running',
          createdAt: '2026-10-01T10:00:00.000Z',
          startedAt: null,
          finishedAt: null,
        }}
        trigger='Moved to In progress'
      />,
    );
    expect(screen.getByText('· Moved to In progress')).toBeTruthy();
  });
});
