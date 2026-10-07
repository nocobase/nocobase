import type { ChatContextChip } from '@nocobase/app-plugin-agents/client/chat';
import type {
  MessageAttachment,
  PageContext,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { useState, type ReactElement } from 'react';

import {
  AgentComposer,
  type AgentComposerAttachments,
  type AgentComposerContext,
} from '@/components/agent-composer';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const CHIPS: readonly ChatContextChip[] = [
  {
    key: 'issue:pm-12',
    kind: 'item',
    item: { kind: 'issue', id: 'pm-12', label: 'PM-12 Welcome tour' },
    pinned: false,
  },
  {
    key: 'issue:pm-15',
    kind: 'item',
    item: { kind: 'issue', id: 'pm-15', label: 'PM-15 Invite emails' },
    pinned: true,
  },
  {
    key: 'filter',
    kind: 'filter',
    filter: {
      page: 'issues',
      params: { status: 'open' },
      label: 'Status: Open',
    },
  },
];

function useSampleContext(): AgentComposerContext {
  const [removed, setRemoved] = useState<readonly string[]>([]);
  const chips = CHIPS.filter((chip) => !removed.includes(chip.key));
  return {
    chips,
    onRemove: (key) => setRemoved((current) => [...current, key]),
    build: (): PageContext => ({
      route: '/projects/onboarding/issues',
      items: chips.flatMap((chip) =>
        chip.kind === 'item'
          ? [{ kind: chip.item.kind, id: chip.item.id }]
          : [],
      ),
    }),
  };
}

let uploads = 0;

/** Uploads after a moment, keeping the bytes in the page; a file whose name starts with `fail` fails. */
const sampleAttachments: AgentComposerAttachments = {
  upload: (file, signal) =>
    new Promise<MessageAttachment>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (file.name.startsWith('fail')) {
          reject(new Error('The upload failed.'));
          return;
        }
        uploads += 1;
        const url = URL.createObjectURL(file);
        resolve({
          id: `upload-${uploads}`,
          filename: file.name,
          ext: file.name.split('.').pop()?.toLowerCase() ?? '',
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          contentUrl: url,
          downloadUrl: url,
          previewable: file.type.startsWith('image/'),
        });
      }, 800);
      signal.addEventListener('abort', () => clearTimeout(timer));
    }),
};

interface SentMessage {
  readonly id: number;
  readonly text: string;
  readonly files: readonly string[];
}

function Sent({
  messages,
}: {
  readonly messages: readonly SentMessage[];
}): ReactElement | null {
  if (messages.length === 0) return null;
  return (
    <ol className='flex flex-col items-end gap-2' aria-label='Sent messages'>
      {messages.map((message) => (
        <li
          key={message.id}
          className='max-w-[85%] rounded-xl bg-muted px-3 py-2 text-sm whitespace-pre-wrap'
        >
          {message.text}
          {message.files.length > 0 ? (
            <span className='block text-xs text-muted-foreground'>
              {message.files.join(', ')}
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/**
 * The composer in its two forms: the narrow box of a side panel, carrying the page context as chips (remove one with
 * its ×), and the rounded box of a full page, sending after a short wait. Both take files from the paperclip, a paste
 * or a drop, uploading each for a moment (a file whose name starts with `fail` fails). "Agent is working" turns the
 * empty box's send button into Stop.
 */
export function AgentComposerDemo(): ReactElement {
  const [running, setRunning] = useState(false);
  const [panelSent, setPanelSent] = useState<readonly SentMessage[]>([]);
  const [pageSent, setPageSent] = useState<readonly SentMessage[]>([]);
  const [sending, setSending] = useState(false);
  const context = useSampleContext();
  return (
    <div className='min-h-svh bg-background p-4 sm:p-6'>
      <div className='mx-auto flex max-w-4xl flex-col gap-6'>
        <div className='flex items-center gap-2'>
          <Switch
            id='agent-working'
            checked={running}
            onCheckedChange={setRunning}
          />
          <Label htmlFor='agent-working'>Agent is working</Label>
        </div>
        <div className='flex flex-col gap-6 md:flex-row md:items-start'>
          <section
            aria-label='Side panel'
            className='flex w-full flex-col gap-3 rounded-xl border bg-card p-3 md:w-[22rem] md:shrink-0'
          >
            <p className='text-xs font-medium text-muted-foreground'>
              Side panel
            </p>
            <Sent messages={panelSent} />
            <AgentComposer
              running={running}
              context={context}
              attachments={sampleAttachments}
              onStop={() => setRunning(false)}
              onSend={(content, _context, files) => {
                setPanelSent((current) => [
                  ...current,
                  {
                    id: current.length,
                    text: content,
                    files: files.map((file) => file.filename),
                  },
                ]);
                return true;
              }}
            />
          </section>
          <section
            aria-label='Full page'
            className='flex min-w-0 flex-1 flex-col gap-3'
          >
            <p className='text-xs font-medium text-muted-foreground'>
              Full page
            </p>
            <Sent messages={pageSent} />
            <AgentComposer
              variant='page'
              running={running}
              sending={sending}
              placeholder='Describe the work to organize…'
              attachments={sampleAttachments}
              onStop={() => setRunning(false)}
              onSend={async (content, _context, files) => {
                setSending(true);
                await new Promise((resolve) => setTimeout(resolve, 600));
                setSending(false);
                setPageSent((current) => [
                  ...current,
                  {
                    id: current.length,
                    text: content,
                    files: files.map((file) => file.filename),
                  },
                ]);
                return true;
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
