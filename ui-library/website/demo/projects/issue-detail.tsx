import { GitPullRequestIcon, Link2Icon, PaperclipIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import type {
  AttachmentFile,
  AttachmentLabels,
} from '@/components/attachment-list';
import { MarkdownView } from '@/components/markdown-view';
import {
  IssueAddBar,
  IssueAddButton,
  IssueApprovalCard,
  IssueAttachments,
  IssueChecklist,
  IssueDeleteButton,
  IssueDependencies,
  IssueDescription,
  IssueDetailLayout,
  IssueFileDrop,
  IssueFilesButton,
  IssueHeader,
  IssueRecentApprovals,
  IssueSection,
  IssueSubtasks,
  IssueSurface,
  ISSUE_SECTION_LIST,
  ISSUE_SURFACE,
} from '@/extensions/nocobase-issue-detail/issue-detail';
import { cn } from 'cn';
import {
  AgentIcon,
  PersonValue,
  PropertyCard,
  PropertyDate,
  PropertyMultiSelect,
  PropertyRow,
  PropertySelect,
} from '@/components/property-fields';
import {
  IssueDates,
  IssueFollowers,
  PropertyColorPicker,
} from '@/extensions/nocobase-issue-detail/issue-properties';

const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();
const IN_PROGRESS = { name: 'In progress', color: 'blue' } as const;
const TODO = { name: 'Todo', color: 'gray' } as const;
const DONE = { name: 'Done', color: 'green' } as const;
const PALETTE = [
  { value: 'gray', label: 'Gray', className: 'bg-muted-foreground/50' },
  { value: 'blue', label: 'Blue', className: 'bg-blue-500' },
  { value: 'green', label: 'Green', className: 'bg-emerald-500' },
  { value: 'red', label: 'Red', className: 'bg-red-500' },
];
const ISSUES = [
  { id: 'i7', identifier: 'PM-7', title: 'Design the sign-in form' },
  { id: 'i8', identifier: 'PM-8', title: 'Limit sign-in attempts' },
];
const ATTACHMENT_LABELS: AttachmentLabels = {
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

export function IssueDetailDemo(): ReactElement {
  const [title, setTitle] = useState('Sign in with an email link');
  const [description, setDescription] = useState(
    'People type their email and get a link that signs them in.',
  );
  const [status, setStatus] = useState<string | null>('progress');
  const [labels, setLabels] = useState<readonly string[]>(['l1']);
  const [due, setDue] = useState<string | null>(null);
  const [following, setFollowing] = useState(true);
  const [colors, setColors] = useState<Readonly<Record<string, string>>>({
    l1: 'blue',
  });
  const [files, setFiles] = useState<readonly AttachmentFile[]>([]);
  const [addingDependency, setAddingDependency] = useState(false);
  const later = () => new Promise<void>((resolve) => setTimeout(resolve, 300));
  const upload = (picked: readonly File[]) =>
    setFiles((current) => [
      ...current,
      ...picked.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        downloadUrl: URL.createObjectURL(file),
        image: file.type.startsWith('image/'),
        canRemove: true,
      })),
    ]);
  return (
    <IssueDetailLayout
      asideLabel='Properties'
      main={
        <>
          <IssueFileDrop
            onFiles={upload}
            className={cn(ISSUE_SURFACE, 'flex flex-col gap-6')}
          >
            <IssueHeader
              identifier='PM-12'
              title={title}
              status={IN_PROGRESS}
              trail={
                <span className='text-sm text-muted-foreground'>
                  Issues / PM-12
                </span>
              }
              parent={{ identifier: 'PM-3', title: 'Accounts', href: '#' }}
              project={{ name: 'Website', href: '#' }}
              actions={
                <IssueDeleteButton identifier='PM-12' onDelete={later} />
              }
              onRename={async (next) => {
                await later();
                setTitle(next);
              }}
            />
            <IssueDescription
              description={description}
              renderMarkdown={(content) => <MarkdownView content={content} />}
              onSave={async (next) => {
                await later();
                setDescription(next);
              }}
            />
            <IssueAddBar label='Add'>
              {files.length === 0 ? (
                <IssueFilesButton onFiles={upload}>
                  <PaperclipIcon data-icon='inline-start' />
                  Attachments
                </IssueFilesButton>
              ) : null}
              {addingDependency ? null : (
                <IssueAddButton onClick={() => setAddingDependency(true)}>
                  <Link2Icon data-icon='inline-start' />
                  Dependency
                </IssueAddButton>
              )}
            </IssueAddBar>
            <IssueApprovalCard
              from={IN_PROGRESS}
              to={DONE}
              requester='Ada Lovelace'
              requestedAt={ago(20)}
              approvers={['Grace Hopper']}
              canDecide
              canWithdraw={false}
              onDecide={later}
            />
            <IssueRecentApprovals
              approvals={[
                {
                  id: 'a1',
                  from: TODO,
                  to: IN_PROGRESS,
                  outcome: 'Approved',
                  outcomeTone: 'green',
                  decidedBy: 'Grace Hopper',
                  at: ago(300),
                },
              ]}
            />
            <IssueChecklist
              status={IN_PROGRESS}
              items={[
                {
                  key: 'tests',
                  label: 'Tests pass',
                  required: true,
                  checked: true,
                  checkedBy: 'Code Agent',
                  checkedAt: ago(5),
                },
                {
                  key: 'docs',
                  label: 'Docs updated',
                  required: false,
                  checked: false,
                },
              ]}
              complete
              onToggle={later}
            />
            <IssueSubtasks
              groups={[
                {
                  key: '1',
                  title: 'Stage 1',
                  done: 1,
                  issues: [
                    {
                      id: 'i7',
                      identifier: 'PM-7',
                      title: 'Design the sign-in form',
                      href: '#',
                      status: DONE,
                    },
                    {
                      id: 'i8',
                      identifier: 'PM-8',
                      title: 'Limit sign-in attempts',
                      href: '#',
                      status: TODO,
                      waiting: 'waiting for 1',
                      executor: { name: 'Code Agent', kind: 'agent' },
                    },
                  ],
                },
              ]}
            />
            <IssueDependencies
              blockedBy={[]}
              blocks={[]}
              related={[]}
              adding={addingDependency}
              onAddingChange={setAddingDependency}
              onAdd={later}
              onRemove={later}
              onSearch={(query) =>
                Promise.resolve(
                  ISSUES.filter((issue) =>
                    `${issue.identifier} ${issue.title}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  ),
                )
              }
            />
            <IssueAttachments
              files={files}
              onUpload={upload}
              hint='Drop files here or paste them.'
              onRemove={async (file) => {
                await later();
                setFiles((current) =>
                  current.filter((item) => item.id !== file.id),
                );
              }}
              labels={ATTACHMENT_LABELS}
            />
            <IssueSection
              icon={<GitPullRequestIcon />}
              title='Pull requests'
              count={1}
            >
              <ul className={ISSUE_SECTION_LIST}>
                <li className='flex items-center gap-2 px-3 py-2 text-sm'>
                  <span className='text-muted-foreground'>acme/web#42</span>
                  <span className='truncate font-medium'>
                    Sign in with an email link
                  </span>
                </li>
              </ul>
            </IssueSection>
          </IssueFileDrop>
          <IssueSurface aria-label='Activity'>
            <h2 className='font-heading text-sm font-semibold'>Activity</h2>
            <p className='mt-3 text-sm text-muted-foreground'>
              Comments, changes and runs, laid out with comment-thread.
            </p>
          </IssueSurface>
        </>
      }
      aside={
        <div className='flex flex-col gap-4'>
          <PropertyCard title='Properties'>
            <PropertyRow label='Status' htmlFor='status'>
              <PropertySelect
                id='status'
                options={[
                  { value: 'todo', label: 'Todo' },
                  { value: 'progress', label: 'In progress' },
                  { value: 'done', label: 'Done' },
                ]}
                value={status}
                onChange={setStatus}
              />
            </PropertyRow>
            <PropertyRow label='Executor' htmlFor='executor'>
              <PropertySelect
                id='executor'
                noneLabel='Nobody'
                options={[
                  {
                    value: 'agent:a1',
                    label: 'Code Agent',
                    icon: <AgentIcon />,
                    note: '2 running',
                  },
                  { value: 'user:u1', label: 'Ada Lovelace' },
                ]}
                value='agent:a1'
                renderValue={() => <PersonValue name='Code Agent' agent />}
                onChange={() => undefined}
              />
            </PropertyRow>
            <PropertyRow label='Labels' htmlFor='labels'>
              <PropertyMultiSelect
                id='labels'
                options={[
                  { value: 'l1', label: 'auth' },
                  { value: 'l2', label: 'frontend' },
                ].map((option) => ({
                  ...option,
                  render: (
                    <span className='inline-flex items-center gap-1.5'>
                      <span
                        aria-hidden
                        className={`size-2 rounded-full ${
                          PALETTE.find(
                            (color) =>
                              color.value === (colors[option.value] ?? 'gray'),
                          )?.className ?? ''
                        }`}
                      />
                      {option.label}
                    </span>
                  ),
                }))}
                value={labels}
                onChange={setLabels}
                onCreate={(name) => Promise.resolve(name)}
                action={
                  <PropertyColorPicker
                    items={labels.map((value) => ({
                      value,
                      name: value === 'l1' ? 'auth' : 'frontend',
                      color: colors[value] ?? 'gray',
                    }))}
                    palette={PALETTE}
                    onChange={(value, color) =>
                      setColors((current) => ({ ...current, [value]: color }))
                    }
                  />
                }
              />
            </PropertyRow>
            <PropertyRow label='Due' htmlFor='due'>
              <PropertyDate
                id='due'
                value={due}
                clearLabel='Clear the due date'
                onChange={setDue}
              />
            </PropertyRow>
          </PropertyCard>
          <IssueFollowers
            followers={[
              { id: 'u1', name: 'Ada Lovelace', reason: 'Owner' },
              { id: 'u2', name: 'Grace Hopper', reason: 'Commented' },
            ]}
            following={following}
            onToggle={async (next) => {
              await later();
              setFollowing(next);
            }}
          />
          <IssueDates createdAt={ago(3000)} updatedAt={ago(4)} />
        </div>
      }
    />
  );
}
