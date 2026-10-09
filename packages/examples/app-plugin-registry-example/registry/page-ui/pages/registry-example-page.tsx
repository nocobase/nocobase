import { useState, type ReactElement } from 'react';

import { Button } from '#components/ui/button';

export default function RegistryExamplePage(): ReactElement {
  const [clicks, setClicks] = useState(0);

  return (
    <section className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10'>
      <header className='space-y-2 border-b pb-6'>
        <p className='text-sm text-muted-foreground'>Application-owned page</p>
        <h1 className='text-2xl font-semibold'>Customize this Registry page</h1>
        <p className='text-sm text-muted-foreground'>
          This page was copied into the application. Edit its layout, text, and
          behavior without changing the plugin runtime.
        </p>
      </header>

      <div className='space-y-4 rounded-xl border border-dashed p-6'>
        <p className='text-sm'>Application-owned button clicks: {clicks}</p>
        <Button onClick={() => setClicks((value) => value + 1)}>
          Customize me
        </Button>
      </div>
    </section>
  );
}
