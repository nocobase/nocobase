import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { MemoryRouter } from 'react-router';

import { TooltipProvider } from '@/components/ui/tooltip';

import { InboxButtonDemo } from './inbox-button.js';
import { InboxDemoPage } from './inbox.js';

/**
 * The frame an application gives the inbox demos, which the preview has to supply itself: a query client, a router
 * and the tooltip provider.
 */
function PreviewFrame({
  path,
  children,
}: {
  readonly path: string;
  readonly children: ReactElement;
}): ReactElement {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <TooltipProvider>{children}</TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export function InboxDemo(): ReactElement {
  return (
    <PreviewFrame path='/inbox'>
      <div className='h-svh bg-background text-foreground'>
        <InboxDemoPage />
      </div>
    </PreviewFrame>
  );
}

export function InboxButtonPreview(): ReactElement {
  return (
    <PreviewFrame path='/'>
      <InboxButtonDemo />
    </PreviewFrame>
  );
}
