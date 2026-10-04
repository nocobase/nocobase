import { useTranslation as useDemoTranslation } from '@nocobase/i18n/client';
import { Bot, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '../../registry/nocobase-ai/shared/ui/button.js';
import {
  AIChatWindow,
  ChatPage,
  NocoBaseAIRootProvider,
} from '../../registry/nocobase-ai/components/index.js';
import {
  AIChatProvider,
  useAI,
} from '../../registry/nocobase-ai/providers/index.js';

export default function AIEmployeeDevPage(): ReactElement {
  const [revision, setRevision] = useState(0);

  return (
    <NocoBaseAIRootProvider key={revision}>
      <AIEmployeeDevScene onRetry={() => setRevision((value) => value + 1)} />
    </NocoBaseAIRootProvider>
  );
}

function AIEmployeeDevScene({
  onRetry,
}: {
  readonly onRetry: () => void;
}): ReactElement {
  const { t: translateDemo } = useDemoTranslation(
    '@nocobase/app-plugin-ai-employee',
  );

  const ai = useAI();

  if (ai.configurationStatus === 'loading') {
    return (
      <DevPageShell>
        <div className='flex min-h-[32rem] items-center justify-center text-sm text-muted-foreground'>
          {translateDemo('demo.loadingConfiguration', {
            defaultValue: 'Loading AI employees and enabled models…',
          })}
        </div>
      </DevPageShell>
    );
  }

  if (ai.configurationStatus === 'error' || ai.employees.length === 0) {
    return (
      <DevPageShell>
        <div className='mx-auto flex min-h-[32rem] max-w-xl flex-col items-center justify-center gap-4 text-center'>
          <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive'>
            <TriangleAlert className='h-6 w-6' aria-hidden='true' />
          </span>
          <div>
            <h2 className='text-lg font-semibold'>
              {translateDemo('demo.configurationNotReady', {
                defaultValue: 'AI employee is not ready',
              })}
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              {ai.configurationError?.message ??
                translateDemo('demo.noEmployee', {
                  defaultValue:
                    'No AI employee is available for the current user.',
                })}
            </p>
          </div>
          <Button variant='outline' onClick={onRetry}>
            <RefreshCw className='h-4 w-4' aria-hidden='true' />

            {translateDemo('Retry', { defaultValue: 'Retry' })}
          </Button>
        </div>
      </DevPageShell>
    );
  }

  const employee = ai.employees[0];
  return (
    <DevPageShell>
      <div className='grid min-h-[calc(100vh-12rem)] gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]'>
        <AIChatProvider
          id='ai-employee-dev'
          defaultEmployee={employee.username}
        >
          <ChatPage className='min-h-[38rem] overflow-hidden rounded-2xl border bg-background shadow-sm'>
            <AIChatWindow enableAttachments />
          </ChatPage>
        </AIChatProvider>
        <aside className='rounded-2xl border bg-muted/30 p-5'>
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground'>
            <Bot className='h-5 w-5' aria-hidden='true' />
          </div>
          <h2 className='mt-4 text-base font-semibold'>{employee.nickname}</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {employee.description ?? employee.position ?? employee.username}
          </p>
          <div className='mt-5 rounded-xl border bg-background p-4 text-sm'>
            <div className='flex items-center gap-2 font-medium'>
              <Sparkles className='h-4 w-4 text-primary' aria-hidden='true' />

              {translateDemo('demo.developmentInstance', {
                defaultValue: 'Development instance',
              })}
            </div>
            <p className='mt-2 text-muted-foreground'>
              {translateDemo('demo.developmentDescription', {
                defaultValue:
                  "This page uses the Registry UI against the plugin's existing authenticated",
              })}
              <code className='mx-1 rounded bg-muted px-1 py-0.5 text-xs'>
                /api/aiEmployee
              </code>

              {translateDemo('demo.developmentOnly', {
                defaultValue: 'routes. It is excluded from production builds.',
              })}
            </p>
          </div>
        </aside>
      </div>
    </DevPageShell>
  );
}

function DevPageShell({
  children,
}: {
  readonly children: ReactElement;
}): ReactElement {
  const { t: translateDemo } = useDemoTranslation(
    '@nocobase/app-plugin-ai-employee',
  );

  return (
    <main className='min-h-full bg-gradient-to-b from-muted/50 to-background p-4 sm:p-6'>
      <div className='mx-auto max-w-7xl'>
        <header className='mb-5'>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-primary'>
            {translateDemo('demo.aiEmployeeRegistry', {
              defaultValue: 'AI Employee Registry',
            })}
          </p>
          <h1 className='mt-2 text-2xl font-semibold tracking-tight'>
            {translateDemo('demo.aiEmployeePlayground', {
              defaultValue: 'AI employee playground',
            })}
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            {translateDemo('demo.playgroundDescription', {
              defaultValue:
                'Exercise the application-owned AI component library with the current plugin runtime.',
            })}
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
