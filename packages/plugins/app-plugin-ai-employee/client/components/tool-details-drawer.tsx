import { useEffect, useState, type ReactElement } from 'react';
import { useAIEmployeeClient } from '../ai-employee-client.js';
import { useCatalogDisplay } from '../catalog-display.js';
import { useT } from '../locales/index.js';
import type {
  ManagedToolDetail,
  ManagedToolSummary,
} from '../tools-management-service.js';
import { MarkdownMessage } from './markdown-message.js';
import { RouteDrawer } from './route-drawer.js';
import { Alert, AlertDescription } from './ui/alert.js';
import { Button } from './ui/button.js';

type DetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ready'; tool: ManagedToolDetail };

export interface ToolDetailsDrawerProps {
  readonly toolName: string;
  readonly summary?: ManagedToolSummary;
}

/** Mount at the :toolName child route; a catalog summary is optional. */
export function ToolDetailsDrawer({
  toolName,
  summary,
}: ToolDetailsDrawerProps): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const { toolTitle, toolAbout } = useCatalogDisplay();
  const [state, setState] = useState<DetailState>({
    status: toolName ? 'loading' : 'not-found',
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!toolName) return;
    const controller = new AbortController();
    void ai.getManagedToolDetails(toolName, controller.signal).then(
      (tool) => {
        if (!controller.signal.aborted) setState({ status: 'ready', tool });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            status:
              typeof error === 'object' &&
              error !== null &&
              'status' in error &&
              error.status === 404
                ? 'not-found'
                : 'error',
          });
        }
      },
    );
    return () => controller.abort();
  }, [ai, toolName, attempt]);

  const tool = state.status === 'ready' ? state.tool : summary;
  return (
    <RouteDrawer
      title={t('tools.details')}
      description={t('tools.detailsDescription')}
      className='sm:max-w-2xl motion-reduce:animate-none motion-reduce:transition-none'
    >
      <div className='flex min-w-0 flex-col gap-3 pb-6 pt-3'>
        <h3 className='font-heading text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]'>
          {tool ? toolTitle(tool) : toolName}
        </h3>
        <p
          translate='no'
          className='break-all font-mono text-xs text-muted-foreground'
        >
          {toolName}
        </p>
      </div>
      <div className='flex min-w-0 flex-col gap-8 pb-4'>
        {state.status === 'loading' ? (
          <p role='status' className='text-sm text-muted-foreground'>
            {t('tools.detailsLoading')}
          </p>
        ) : state.status === 'not-found' ? (
          <p role='status' className='text-sm text-muted-foreground'>
            {t('tools.detailsNotFound')}
          </p>
        ) : state.status === 'error' ? (
          <Alert variant='destructive'>
            <AlertDescription className='flex flex-col items-start gap-3'>
              <p>{t('tools.detailsError')}</p>
              <Button
                variant='outline'
                onClick={() => {
                  setState({ status: 'loading' });
                  setAttempt((value) => value + 1);
                }}
              >
                {t('Retry')}
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <section
              aria-label={t('tools.about')}
              className='min-w-0 max-w-full [overflow-wrap:anywhere] [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_img]:max-w-full [&_pre]:max-w-full [&_pre]:[overflow-wrap:normal] [&_table]:[overflow-wrap:normal]'
            >
              <h4 className='mb-3 font-heading text-sm font-semibold'>
                {t('tools.about')}
              </h4>
              {toolAbout(state.tool).trim() ? (
                <MarkdownMessage>{toolAbout(state.tool)}</MarkdownMessage>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {t('tools.noAbout')}
                </p>
              )}
            </section>
            <section
              aria-label={t('tools.descriptionLabel')}
              className='flex min-w-0 flex-col gap-3'
            >
              <h4 className='font-heading text-sm font-semibold'>
                {t('tools.descriptionLabel')}
              </h4>
              <p className='whitespace-pre-wrap text-sm leading-6 [overflow-wrap:anywhere]'>
                {state.tool.description.trim() || '—'}
              </p>
            </section>
            <section
              aria-label={t('tools.inputSchema')}
              className='flex min-w-0 flex-col gap-3'
            >
              <h4 className='font-heading text-sm font-semibold'>
                {t('tools.inputSchema')}
              </h4>
              {state.tool.inputSchema === null ? (
                <p className='text-sm text-muted-foreground'>
                  {t('tools.noSchema')}
                </p>
              ) : (
                <pre
                  tabIndex={0}
                  aria-label={t('tools.inputSchema')}
                  className='max-w-full overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                >
                  <code translate='no' className='font-mono'>
                    {JSON.stringify(state.tool.inputSchema, null, 2)}
                  </code>
                </pre>
              )}
            </section>
          </>
        )}
      </div>
    </RouteDrawer>
  );
}
