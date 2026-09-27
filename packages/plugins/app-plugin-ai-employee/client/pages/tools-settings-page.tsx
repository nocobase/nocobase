import { useEffect, useRef, useState, type ReactElement } from 'react';
import {
  Alert,
  AlertDescription,
} from '../../registry/nocobase-ai/shared/ui/alert.js';
import { Button } from '../../registry/nocobase-ai/shared/ui/button.js';
import { ChevronRight } from 'lucide-react';
import { ToolListContent } from '../components/tool-list-content.js';
import { Input } from '../../registry/nocobase-ai/shared/ui/input.js';
import { ToolDetailsDrawer } from '../components/tool-details-drawer.js';
import { useT } from '../locales/index.js';
import { useCatalogDisplay } from '../catalog-display.js';
import { SettingsShell } from '../settings-shell.js';
import { type ManagedToolSummary } from '../tools-management-service.js';
import { useAIEmployeeClient } from '../ai-employee-client.js';

type ToolsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; tools: ManagedToolSummary[] };

export default function ToolsSettingsPage(): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const { toolTitle, toolAbout, compareTitles, locale } = useCatalogDisplay();
  const [state, setState] = useState<ToolsState>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<ManagedToolSummary | null>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void ai.listManagedTools(controller.signal).then(
      (tools) => {
        if (!controller.signal.aborted) setState({ status: 'ready', tools });
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      },
    );
    return () => controller.abort();
  }, [ai, attempt]);

  const keyword = query.trim().toLocaleLowerCase(locale);
  const tools =
    state.status === 'ready'
      ? state.tools
          .filter((tool) =>
            [tool.name, toolTitle(tool), toolAbout(tool)].some((value) =>
              value.toLocaleLowerCase(locale).includes(keyword),
            ),
          )
          .sort((left, right) =>
            compareTitles(
              toolTitle(left),
              toolTitle(right),
              left.name,
              right.name,
            ),
          )
      : [];

  function openTool(
    tool: ManagedToolSummary,
    button: HTMLButtonElement | null,
  ): void {
    returnFocusRef.current = button;
    setSelected(tool);
  }

  return (
    <SettingsShell title='tools.title' description='tools.description'>
      <section
        aria-label={t('tools.title')}
        className='flex min-w-0 flex-col gap-4'
      >
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <Input
            type='search'
            aria-label={t('tools.search')}
            placeholder={t('tools.searchPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className='w-full max-w-md'
          />
          {state.status === 'ready' ? (
            <p aria-live='polite' className='text-sm text-muted-foreground'>
              {t('tools.count', { count: tools.length })}
            </p>
          ) : null}
        </div>
        {state.status === 'loading' ? (
          <p role='status' className='text-sm text-muted-foreground'>
            {t('tools.loading')}
          </p>
        ) : state.status === 'error' ? (
          <Alert variant='destructive'>
            <AlertDescription className='flex flex-col items-start gap-3'>
              <p>{t('tools.error')}</p>
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
        ) : !tools.length ? (
          <p
            role='status'
            className='rounded-lg border border-dashed p-5 text-sm text-muted-foreground'
          >
            {t(state.tools.length ? 'tools.noMatches' : 'tools.empty')}
          </p>
        ) : (
          <ul
            aria-label={t('tools.title')}
            className='min-w-0 divide-y overflow-hidden rounded-xl border bg-card'
          >
            {tools.map((tool) => {
              const title = toolTitle(tool);
              return (
                <li key={tool.name} className='min-w-0'>
                  <button
                    type='button'
                    aria-label={title}
                    aria-haspopup='dialog'
                    className='flex h-32 w-full min-w-0 cursor-pointer items-center gap-4 overflow-hidden px-5 py-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none'
                    onClick={(event) => openTool(tool, event.currentTarget)}
                  >
                    <ToolListContent
                      name={tool.name}
                      title={title}
                      about={toolAbout(tool)}
                    />
                    <ChevronRight
                      aria-hidden='true'
                      className='size-4 shrink-0 text-muted-foreground'
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <ToolDetailsDrawer
        selected={selected}
        onClose={() => setSelected(null)}
        returnFocusRef={returnFocusRef}
      />
    </SettingsShell>
  );
}
