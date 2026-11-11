import { useState, type ReactElement } from 'react';
import {
  TaskProgress,
  type TaskProgressStatus,
} from '#components/task-progress';
import { Button } from '#components/ui/button';

const TOTAL = 120;

/**
 * An import from upload to result, driven explicitly: each step happens only
 * when its button is pressed, so no timer fakes progress or completion.
 */
function ImportExample(): ReactElement {
  const [status, setStatus] = useState<TaskProgressStatus | 'idle'>('idle');
  const [total, setTotal] = useState<number | null>(null);
  const [processed, setProcessed] = useState(0);
  const reset = (): void => {
    setStatus('queued');
    setTotal(null);
    setProcessed(0);
  };
  return (
    <section aria-label='Contact import' className='space-y-3'>
      <h2 className='font-semibold'>Contact import</h2>
      {status === 'idle' ? (
        <Button onClick={reset}>Import contacts.csv</Button>
      ) : (
        <TaskProgress
          status={status}
          label='Import contacts.csv'
          processed={processed}
          total={total}
          continuesInBackground
          message={
            status === 'completed'
              ? `${TOTAL} contacts imported. Find them in Contacts.`
              : status === 'failed'
                ? 'Row 61 has no email address. Fix the file and import it again; rows before it were not saved.'
                : undefined
          }
          actions={
            status === 'queued' ? (
              <Button
                variant='outline'
                onClick={() => {
                  setStatus('running');
                  setTotal(TOTAL);
                }}
              >
                Server starts processing
              </Button>
            ) : status === 'running' ? (
              <>
                <Button
                  variant='outline'
                  onClick={() => {
                    const next = Math.min(TOTAL, processed + 40);
                    setProcessed(next);
                    if (next === TOTAL) setStatus('completed');
                  }}
                >
                  Server processes 40 rows
                </Button>
                <Button variant='outline' onClick={() => setStatus('failed')}>
                  Server reports a bad row
                </Button>
              </>
            ) : status === 'failed' ? (
              <Button onClick={reset}>Import again</Button>
            ) : (
              <Button variant='outline' onClick={() => setStatus('idle')}>
                Done
              </Button>
            )
          }
        />
      )}
    </section>
  );
}

/** A job that reports only a percentage, running beside the import. */
function ExportExample(): ReactElement {
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState<TaskProgressStatus>('running');
  return (
    <section aria-label='Customer export' className='space-y-3'>
      <h2 className='font-semibold'>Customer export</h2>
      <TaskProgress
        status={status}
        label='Customer export'
        percent={percent}
        continuesInBackground
        message={
          status === 'completed'
            ? 'The file is ready below and stays available for 24 hours.'
            : undefined
        }
        actions={
          status === 'running' ? (
            <Button
              variant='outline'
              onClick={() => {
                const next = Math.min(100, percent + 25);
                setPercent(next);
                if (next === 100) setStatus('completed');
              }}
            >
              Server reports 25% more
            </Button>
          ) : (
            <Button variant='outline'>Download customers.csv</Button>
          )
        }
      />
    </section>
  );
}

export function TaskProgressDemo(): ReactElement {
  return (
    <div className='space-y-8 p-6 text-foreground'>
      <p className='text-sm text-muted-foreground'>
        Each task shows only what its server record reports. The import has no
        total until processing starts, so its bar is indeterminate; the export
        reports a percentage. They progress independently.
      </p>
      <ImportExample />
      <ExportExample />
    </div>
  );
}
