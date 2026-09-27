import { useEffect, useState, type ReactElement, type RefObject } from 'react';
import { MarkdownMessage } from '../../registry/nocobase-ai/components/chat/markdown-message.js';
import {
  Alert,
  AlertDescription,
} from '../../registry/nocobase-ai/shared/ui/alert.js';
import { Button } from '../../registry/nocobase-ai/shared/ui/button.js';
import { DialogDescription } from '../../registry/nocobase-ai/shared/ui/dialog.js';
import { useT } from '../locales/index.js';
import { useCatalogDisplay } from '../catalog-display.js';
import {
  type ManagedToolDetail,
  type ManagedToolSummary,
} from '../tools-management-service.js';
import { CatalogDetailsDrawer } from './catalog-details-drawer.js';
import { useAIEmployeeClient } from '../ai-employee-client.js';

type DetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; tool: ManagedToolDetail };

function ToolDetails({
  summary,
}: {
  summary: ManagedToolSummary;
}): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const { toolTitle, toolAbout } = useCatalogDisplay();
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void ai.getManagedToolDetails(summary.name, controller.signal).then(
      (tool) => {
        if (!controller.signal.aborted) setState({ status: 'ready', tool });
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      },
    );
    return () => controller.abort();
  }, [ai, summary.name, attempt]);

  const tool = state.status === 'ready' ? state.tool : summary;
  return (
    <div className='min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]'>
      <div className='flex min-w-0 flex-col gap-3 px-6 pb-6 pt-7 sm:px-8'>
        <h3 className='font-heading text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]'>
          {toolTitle(tool)}
        </h3>
        <p
          translate='no'
          className='break-all font-mono text-xs text-muted-foreground'
        >
          {tool.name}
        </p>
        <DialogDescription className='sr-only'>
          {t('tools.detailsDescription')}
        </DialogDescription>
      </div>
      <div className='flex min-w-0 flex-col gap-8 px-6 pb-8 sm:px-8'>
        {state.status === 'loading' ? (
          <p role='status' className='text-sm text-muted-foreground'>
            {t('tools.detailsLoading')}
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
                <MarkdownMessage variant='document'>
                  {toolAbout(state.tool)}
                </MarkdownMessage>
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
    </div>
  );
}

export function ToolDetailsDrawer({
  selected,
  onClose,
  returnFocusRef,
}: {
  selected: ManagedToolSummary | null;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}): ReactElement {
  const t = useT();
  return (
    <CatalogDetailsDrawer
      open={selected !== null}
      title={t('tools.details')}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
    >
      {selected ? <ToolDetails key={selected.name} summary={selected} /> : null}
    </CatalogDetailsDrawer>
  );
}
