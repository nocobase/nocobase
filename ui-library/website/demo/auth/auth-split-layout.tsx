import type { ReactElement } from 'react';

import { AuthSplitLayout } from '#extensions/nocobase-auth-split-layout/auth-split-layout';

import { useAuthPage } from './auth-page.js';

/** A sign-in page in the split layout: the form on the left, the application's own content on the right. */
export function AuthSplitLayoutDemo(): ReactElement {
  const { shared, form } = useAuthPage();
  return (
    <AuthSplitLayout
      {...shared}
      aside={<ExampleAside />}
      asideLabel='About NocoBase'
    >
      {form}
    </AuthSplitLayout>
  );
}

function ExampleAside(): ReactElement {
  return (
    <div className='flex h-full flex-col justify-center gap-6 p-12'>
      <p className='max-w-md font-heading text-3xl font-semibold tracking-tight'>
        Let AI build freely. NocoBase keeps it reliable.
      </p>
      <p className='max-w-md text-sm text-muted-foreground'>
        The aside holds the application&apos;s own content, such as a product
        screenshot, a few highlights or a quote.
      </p>
    </div>
  );
}
