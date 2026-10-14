/**
 * The Agent page's "Project manager" card: the agents it runs with (the first choice and the fallback, each with
 * whether a runner could take its work now), whether its allocation principles are the built-in ones, and the comment
 * run limit, with "Settings" (`/agents/project-manager`, read-only for whoever may not manage agents).
 */
import { useTranslation } from '@nocobase/i18n/client';
import { ArrowRightIcon, Settings2Icon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from 'cn';

import {
  COMMENT_RUN_WINDOW_HOURS,
  type ProjectManagerChoice,
  type ProjectManagerView,
} from '../../../shared/project-manager.js';
import { useProjectManager } from './api.js';

/** The settings dialog, under the Agent page. */
export const PROJECT_MANAGER_PATH = 'project-manager';

export function ProjectManagerSection(): ReactElement {
  const { t } = useTranslation();
  const manager = useProjectManager();
  return (
    <Card data-testid='project-manager-section'>
      <CardHeader>
        <CardTitle>{t('projectManager.title')}</CardTitle>
        <CardDescription>{t('projectManager.description')}</CardDescription>
        <CardAction>
          <Button
            variant='outline'
            size='sm'
            nativeButton={false}
            render={<Link to={PROJECT_MANAGER_PATH} />}
          >
            <Settings2Icon data-icon='inline-start' />
            {t('projectManager.settings')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {manager.data ? (
          <Summary view={manager.data} />
        ) : manager.isError ? (
          <p className='text-sm text-muted-foreground'>
            {t('projectManager.loadFailed')}
          </p>
        ) : (
          <Skeleton className='h-16 w-full' />
        )}
      </CardContent>
    </Card>
  );
}

function Summary({
  view,
}: {
  readonly view: ProjectManagerView;
}): ReactElement {
  const { t } = useTranslation();
  const choice = (id: string | null): ProjectManagerChoice | null =>
    view.choices.find((item) => item.id === id) ?? null;
  const first = choice(view.firstChoiceAgentId);
  const fallback = choice(view.fallbackAgentId);
  const customized =
    view.principles !== null && view.principles !== view.builtInPrinciples;
  return (
    <dl className='grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm'>
      <Row label={t('projectManager.settingsPage.name')}>{view.name}</Row>
      <Row label={t('projectManager.runsWith')}>
        {first ? (
          <span className='inline-flex flex-wrap items-center gap-x-2 gap-y-1'>
            <AgentName agent={first} />
            {fallback ? (
              <>
                <ArrowRightIcon
                  aria-hidden='true'
                  className='size-3.5 text-muted-foreground'
                />
                <span className='text-muted-foreground'>
                  {t('projectManager.fallbackLabel')}
                </span>
                <AgentName agent={fallback} />
              </>
            ) : null}
          </span>
        ) : (
          <span className='text-muted-foreground'>
            {t('projectManager.noAgent')}
          </span>
        )}
      </Row>
      <Row label={t('projectManager.principles')}>
        {customized
          ? t('projectManager.customized')
          : t('projectManager.builtIn')}
      </Row>
      <Row label={t('projectManager.limit')}>
        {t('projectManager.limitValue', {
          count: view.commentRunLimit,
          hours: COMMENT_RUN_WINDOW_HOURS,
        })}
      </Row>
    </dl>
  );
}

function Row({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='min-w-0'>{children}</dd>
    </>
  );
}

/** An agent's name with a dot saying whether a runner could take its work now. */
export function AgentName({
  agent,
}: {
  readonly agent: ProjectManagerChoice;
}): ReactElement {
  const { t } = useTranslation();
  const state = agent.online
    ? t('projectManager.online')
    : t('projectManager.offline');
  return (
    <span className='inline-flex min-w-0 items-center gap-1.5 font-medium'>
      <span
        role='img'
        aria-label={state}
        title={state}
        className={cn(
          'inline-block size-2 shrink-0 rounded-full',
          agent.online ? 'bg-green-500' : 'bg-muted-foreground/40',
        )}
      />
      <span className='truncate'>{agent.name}</span>
    </span>
  );
}
