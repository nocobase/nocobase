import { CircleAlert } from 'lucide-react';
import { useEffect, useState, type ReactElement, type RefObject } from 'react';
import { MarkdownMessage } from '../../registry/nocobase-ai/components/chat/markdown-message.js';
import {
  Alert,
  AlertDescription,
} from '../../registry/nocobase-ai/shared/ui/alert.js';
import { Button } from '../../registry/nocobase-ai/shared/ui/button.js';
import { DialogDescription } from '../../registry/nocobase-ai/shared/ui/dialog.js';
import { CatalogDetailsDrawer } from './catalog-details-drawer.js';
import { ToolListContent } from './tool-list-content.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../registry/nocobase-ai/shared/ui/tabs.js';
import { useT } from '../locales/index.js';
import { useCatalogDisplay } from '../catalog-display.js';
import {
  type ManagedSkillDetail,
  type ManagedSkillSummary,
} from '../skills-management-service.js';
import { useAIEmployeeClient } from '../ai-employee-client.js';

type DetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; skill: ManagedSkillDetail };

function SkillDetailSkeleton(): ReactElement {
  const t = useT();
  return (
    <div role='status' className='flex flex-col gap-6 px-6 py-6 sm:px-8'>
      <span className='sr-only'>{t('skills.detailsLoading')}</span>
      <div aria-hidden='true' className='flex flex-col gap-4'>
        <div className='h-6 w-2/5 rounded-md bg-muted' />
        <div className='flex flex-col gap-3'>
          <div className='h-3 w-full rounded-md bg-muted' />
          <div className='h-3 w-full rounded-md bg-muted' />
          <div className='h-3 w-3/4 rounded-md bg-muted' />
        </div>
        <div className='mt-2 h-28 w-full rounded-lg bg-muted' />
      </div>
    </div>
  );
}

function SkillDetails({
  summary,
}: {
  summary: ManagedSkillSummary;
}): ReactElement {
  const ai = useAIEmployeeClient();
  const t = useT();
  const { skillTitle, skillDescription, toolTitle, toolAbout, compareTitles } =
    useCatalogDisplay();
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void ai.getManagedSkillDetails(summary.name, controller.signal).then(
      (skill) => {
        if (!controller.signal.aborted) setState({ status: 'ready', skill });
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      },
    );
    return () => controller.abort();
  }, [ai, summary.name, attempt]);

  const skill = state.status === 'ready' ? state.skill : summary;
  const tools = [...skill.tools].sort((left, right) =>
    compareTitles(toolTitle(left), toolTitle(right), left.name, right.name),
  );
  return (
    <div className='min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]'>
      <Tabs defaultValue='instructions' className='min-w-0 flex-col gap-0'>
        <div className='flex min-w-0 flex-col gap-3 px-6 pb-6 pt-7 sm:px-8'>
          <div className='flex min-w-0 flex-col gap-2'>
            <h3 className='font-heading text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]'>
              {skillTitle(skill)}
            </h3>
            <p
              translate='no'
              className='break-all font-mono text-xs text-muted-foreground'
            >
              {skill.name}
            </p>
          </div>
          <DialogDescription className='whitespace-pre-wrap text-sm leading-6 [overflow-wrap:anywhere]'>
            {skillDescription(skill) || t('skills.detailsDescription')}
          </DialogDescription>
        </div>
        <div className='sticky top-0 z-10 flex border-b bg-popover px-6 sm:px-8'>
          <TabsList
            activateOnFocus
            variant='line'
            aria-label={t('skills.details')}
            className='-mb-px h-11 gap-5 p-0'
          >
            <TabsTrigger
              value='instructions'
              className='h-full rounded-none border-0 border-b-2 border-transparent px-0 after:hidden data-active:border-b-primary motion-reduce:transition-none'
            >
              {t('skills.instructions')}
            </TabsTrigger>
            <TabsTrigger
              value='tools'
              className='h-full rounded-none border-0 border-b-2 border-transparent px-0 after:hidden data-active:border-b-primary motion-reduce:transition-none'
            >
              {t('skills.tools')}{' '}
              <span className='tabular-nums'>({skill.tools.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>
        {state.status === 'loading' ? (
          <SkillDetailSkeleton />
        ) : state.status === 'error' ? (
          <div className='px-6 py-6 sm:px-8'>
            <Alert variant='destructive'>
              <AlertDescription className='flex flex-col items-start gap-3'>
                <p>{t('skills.detailsError')}</p>
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
          </div>
        ) : (
          <>
            <TabsContent
              value='instructions'
              className='min-w-0 px-6 py-6 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-8'
            >
              <section
                aria-label={t('skills.content')}
                className='min-w-0 max-w-full [overflow-wrap:anywhere] [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_h4]:text-sm [&_img]:max-w-full [&_pre]:max-w-full [&_pre]:[overflow-wrap:normal] [&_table]:[overflow-wrap:normal]'
              >
                {state.skill.content.trim() ? (
                  <MarkdownMessage variant='document'>
                    {state.skill.content}
                  </MarkdownMessage>
                ) : (
                  <p className='py-4 text-sm text-muted-foreground'>
                    {t('skills.noContent')}
                  </p>
                )}
              </section>
            </TabsContent>
            <TabsContent
              value='tools'
              className='min-w-0 px-6 py-6 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-8'
            >
              <p className='mb-5 text-sm leading-6 text-muted-foreground'>
                {t('skills.toolsDescription')}
              </p>
              {state.skill.tools.length ? (
                <ul className='flex min-w-0 flex-col divide-y rounded-lg border px-4'>
                  {tools.map((tool) => (
                    <li
                      key={tool.name}
                      className='flex h-32 min-w-0 items-center overflow-hidden py-4'
                    >
                      <ToolListContent
                        name={tool.name}
                        title={toolTitle(tool)}
                        about={toolAbout(tool)}
                        status={
                          !tool.available ? (
                            <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
                              <CircleAlert
                                aria-hidden='true'
                                className='size-3.5'
                              />
                              {t('skills.toolMissing')}
                            </span>
                          ) : null
                        }
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='rounded-lg border border-dashed p-5 text-sm text-muted-foreground'>
                  {t('skills.noTools')}
                </p>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

export function SkillDetailsDrawer({
  selected,
  onClose,
  returnFocusRef,
}: {
  selected: ManagedSkillSummary | null;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}): ReactElement {
  const t = useT();
  return (
    <CatalogDetailsDrawer
      open={selected !== null}
      title={t('skills.details')}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
    >
      {selected ? (
        <SkillDetails key={selected.name} summary={selected} />
      ) : null}
    </CatalogDetailsDrawer>
  );
}
