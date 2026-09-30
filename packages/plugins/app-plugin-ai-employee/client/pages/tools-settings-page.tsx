import { useEffect, useState, type ReactElement } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Alert, AlertDescription } from '../components/ui/alert.js';
import { Button } from '../components/ui/button.js';
import { Item } from '../components/ui/item.js';
import { ChevronRight } from 'lucide-react';
import { ToolListContent } from '../components/tool-list-content.js';
import { Input } from '../components/ui/input.js';
import { useT } from '../locales/index.js';
import { useCatalogDisplay } from '../catalog-display.js';
import { SettingsShell } from '../settings-shell.js';
import { type ManagedToolSummary } from '../tools-management-service.js';
import { useAIEmployeeClient } from '../ai-employee-client.js';
import { Empty, EmptyDescription } from '../components/ui/empty.js';

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
  const navigate = useNavigate();
  const location = useLocation();

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
    trigger: HTMLElement | null,
  ): void {
    trigger?.focus();
    void navigate({
      pathname: encodeURIComponent(tool.name),
      search: location.search,
    });
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
          <Empty role='status' className='border'>
            <EmptyDescription>
              {t(state.tools.length ? 'tools.noMatches' : 'tools.empty')}
            </EmptyDescription>
          </Empty>
        ) : (
          <ul
            aria-label={t('tools.title')}
            className='min-w-0 divide-y overflow-hidden rounded-xl border bg-card'
          >
            {tools.map((tool) => {
              const title = toolTitle(tool);
              return (
                <li key={tool.name} className='min-w-0'>
                  <Item
                    render={<button type='button' />}
                    aria-label={title}
                    aria-haspopup='dialog'
                    className='min-h-32 min-w-0 flex-nowrap gap-4 rounded-none px-5 py-4 text-left hover:bg-muted/50 focus-visible:ring-inset motion-reduce:transition-none'
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
                  </Item>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <Outlet context={state.status === 'ready' ? state.tools : []} />
    </SettingsShell>
  );
}
