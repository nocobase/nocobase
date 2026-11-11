import { useRef, useState, type ReactElement } from 'react';
import { useSubmission } from '@nocobase/app-client';
import { PendingButton } from '#components/pending-button';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';

export function PendingButtonDemo(): ReactElement {
  const submission = useSubmission();
  const completionRef = useRef<{ finish: () => void; fail: () => void } | null>(
    null,
  );
  const [outcome, setOutcome] = useState('');
  return (
    <section className='space-y-4 p-6 text-foreground'>
      <h2 className='font-semibold'>Stable action feedback</h2>
      <p className='text-sm text-muted-foreground'>
        Save by click or Enter. The action locks immediately; feedback appears
        after 300ms. Finish or fail the operation to see recovery without losing
        your input.
      </p>
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault();
          const name = new FormData(event.currentTarget).get('name');
          setOutcome('');
          void submission
            .run(
              { name },
              () =>
                new Promise<void>((resolve, reject) => {
                  completionRef.current = {
                    finish: resolve,
                    fail: () => reject(new Error('Demonstration save failure')),
                  };
                }),
            )
            .then(
              () => setOutcome('Saved successfully.'),
              () =>
                setOutcome('Save failed. Your input is preserved; try again.'),
            );
        }}
      >
        <label className='grid gap-2 text-sm'>
          Name
          <Input name='name' defaultValue='Draft equipment' />
        </label>
        <div className='flex flex-wrap gap-3'>
          <PendingButton
            type='submit'
            busy={submission.submitting}
            pendingLabel='Saving changes…'
          >
            Save
          </PendingButton>
          <Button
            type='button'
            variant='outline'
            disabled={!submission.submitting}
            onClick={() => completionRef.current?.finish()}
          >
            Complete save
          </Button>
          <Button
            type='button'
            variant='outline'
            disabled={!submission.submitting}
            onClick={() => completionRef.current?.fail()}
          >
            Fail save
          </Button>
        </div>
      </form>
      {outcome && (
        <p role={outcome.startsWith('Save failed') ? 'alert' : 'status'}>
          {outcome}
        </p>
      )}
    </section>
  );
}
