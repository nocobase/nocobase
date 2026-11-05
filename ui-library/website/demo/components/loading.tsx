import { useState, type ReactElement } from 'react';
import { Loading } from '#components/loading';
import { Button } from '#components/ui/button';

export function LoadingDemo(): ReactElement {
  const [pending, setPending] = useState(false);
  return (
    <section className='space-y-4 p-6 text-foreground'>
      <h2 className='font-semibold'>Panel loading</h2>
      <p className='text-sm text-muted-foreground'>
        The panel keeps its space. Finish or cancel the wait with the same
        control.
      </p>
      <Button onClick={() => setPending(!pending)}>
        {pending ? 'Finish or cancel' : 'Load panel'}
      </Button>
      <Loading
        pending={pending}
        label='Loading panel'
        className='min-h-48 rounded-lg border border-border'
      />
    </section>
  );
}
