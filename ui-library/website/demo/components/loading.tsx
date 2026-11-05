import { useState, type ReactElement } from 'react';
import { Loading, RefreshIndicator } from '#components/loading';
import { Button } from '#components/ui/button';

export function LoadingDemo(): ReactElement {
  const [pending, setPending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
      <h2 className='font-semibold'>Background refresh</h2>
      <p className='text-sm text-muted-foreground'>
        Content of the same query stays in place; a thin bar appears after 300ms
        and a note after 10 seconds.
      </p>
      <Button variant='outline' onClick={() => setRefreshing(!refreshing)}>
        {refreshing ? 'Finish refresh' : 'Refresh summary'}
      </Button>
      <div className='relative overflow-hidden rounded-lg border border-border p-4'>
        <RefreshIndicator pending={refreshing} />
        <dl
          className='grid grid-cols-[8rem_1fr] gap-3 text-sm'
          aria-busy={refreshing}
        >
          <dt className='text-muted-foreground'>Customer</dt>
          <dd>Acorn Supplies</dd>
          <dt className='text-muted-foreground'>Owner</dt>
          <dd>Alex Rivera</dd>
        </dl>
      </div>
    </section>
  );
}
