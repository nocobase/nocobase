import { KeyRound, RotateCcw, Trash2 } from 'lucide-react';
import { useRef, useState, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  ConfirmDialog,
  type ConfirmDialogResult,
} from '../../../registry/components/confirm-dialog';

/** How the simulated request for a key ends, since the preview has no server to ask. */
type Outcome = 'succeeds' | 'fails' | 'forbidden';

interface ApiKey {
  readonly id: string;
  readonly name: string;
  readonly outcome: Outcome;
}

const initialKeys: readonly ApiKey[] = [
  { id: 'ci', name: 'CI pipeline', outcome: 'succeeds' },
  { id: 'reporting', name: 'Reporting export', outcome: 'fails' },
  { id: 'importer', name: 'Legacy importer', outcome: 'forbidden' },
];

const outcomeHints: Readonly<Record<Outcome, string>> = {
  succeeds: 'Deletes after a short wait',
  fails: 'The request fails, and so does every retry',
  forbidden: 'Refused, and a retry cannot help',
};

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

/**
 * A list whose rows open one ConfirmDialog. Each key simulates a slow request with a different end: one succeeds,
 * one rejects and shows the default message, and one reports a failure a retry cannot fix.
 */
export function ConfirmDialogDemo(): ReactElement {
  const [keys, setKeys] = useState<readonly ApiKey[]>(initialKeys);
  const [query, setQuery] = useState('');
  // The target stays set after closing, so the title does not go blank while the dialog animates closed.
  const [deletion, setDeletion] = useState<{
    readonly open: boolean;
    readonly key: ApiKey | null;
  }>({ open: false, key: null });
  // Stands in for the success toast an application would show.
  const [status, setStatus] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  async function deleteKey(key: ApiKey): Promise<ConfirmDialogResult> {
    await wait(1500);
    if (key.outcome === 'fails') {
      throw new Error('Simulated network failure');
    }
    if (key.outcome === 'forbidden') {
      return {
        error: 'You do not have permission to delete this API key.',
        retryable: false,
      };
    }
    setKeys((current) => current.filter((item) => item.id !== key.id));
    setStatus(`Deleted API key "${key.name}".`);
  }

  const visibleKeys = keys.filter((key) =>
    key.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className='min-h-svh space-y-4 bg-background p-6 text-foreground md:p-8'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='space-y-1'>
          <h1 className='text-lg font-semibold'>API keys</h1>
          <p className='text-sm text-muted-foreground'>
            Scripts and integrations sign in with these keys.
          </p>
        </div>
        <Button
          disabled={keys.length === initialKeys.length}
          onClick={() => {
            setKeys(initialKeys);
            setStatus('');
          }}
          type='button'
          variant='outline'
        >
          <RotateCcw data-icon='inline-start' />
          Restore keys
        </Button>
      </div>
      <Input
        aria-label='Filter API keys'
        className='max-w-xs'
        onChange={(event) => setQuery(event.target.value)}
        placeholder='Filter API keys…'
        ref={searchRef}
        value={query}
      />
      <ul className='divide-y rounded-lg border'>
        {visibleKeys.map((key) => (
          <li className='flex items-center gap-3 p-3' key={key.id}>
            <KeyRound
              aria-hidden='true'
              className='size-4 shrink-0 text-muted-foreground'
            />
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>{key.name}</p>
              <p className='truncate text-xs text-muted-foreground'>
                {outcomeHints[key.outcome]}
              </p>
            </div>
            <Button
              onClick={() => setDeletion({ open: true, key })}
              size='sm'
              type='button'
              variant='outline'
            >
              <Trash2 data-icon='inline-start' />
              Delete
            </Button>
          </li>
        ))}
        {visibleKeys.length === 0 && (
          <li className='p-3 text-sm text-muted-foreground'>
            No API keys match.
          </li>
        )}
      </ul>
      <p className='min-h-5 text-sm text-muted-foreground' role='status'>
        {status}
      </p>
      <ConfirmDialog
        confirmLabel='Delete'
        description='Scripts that use this key stop working at once. This cannot be undone.'
        focusAfterConfirm={searchRef}
        onConfirm={() => (deletion.key ? deleteKey(deletion.key) : undefined)}
        onOpenChange={(open) =>
          setDeletion((current) => ({ ...current, open }))
        }
        open={deletion.open}
        title={`Delete API key "${deletion.key?.name ?? ''}"?`}
      />
    </div>
  );
}
