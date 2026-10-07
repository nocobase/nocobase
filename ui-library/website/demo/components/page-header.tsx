import { Download, Plus } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';

import { PageHeader } from '@/components/page-header';

/** Each variant in its own frame, since a page renders exactly one header. */
export function PageHeaderDemo(): ReactElement {
  return (
    <div className='min-h-svh space-y-6 bg-background p-6 text-foreground md:p-8'>
      <Variant>
        <PageHeader title='Settings' />
      </Variant>
      <Variant>
        <PageHeader
          description='Everyone who can sign in to this application, and the roles they hold.'
          title='Users'
        />
      </Variant>
      <Variant>
        <PageHeader
          actions={
            <>
              <Button type='button' variant='outline'>
                <Download data-icon='inline-start' />
                Export
              </Button>
              <Button type='button'>
                <Plus data-icon='inline-start' />
                New order
              </Button>
            </>
          }
          description='Track every order from checkout to delivery.'
          title='Orders'
        />
      </Variant>
    </div>
  );
}

function Variant({
  children,
}: {
  readonly children: ReactElement;
}): ReactElement {
  return <div className='rounded-lg border border-dashed p-4'>{children}</div>;
}
